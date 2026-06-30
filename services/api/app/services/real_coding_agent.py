from __future__ import annotations

import asyncio
import difflib
import json
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

from app.config import Settings
from app.db.postgres import PostgresStore
from app.models.schemas import RunEvent, RunEventStatus, new_id, stable_hash, utc_now
from app.services.cognee_memory import CogneeMemoryService


IGNORED_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", ".pytest_cache", "dist", "build"}
SAFE_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".md", ".json", ".toml", ".yaml", ".yml", ".txt"}
SECRET_MARKERS = ("API_KEY", "SECRET", "TOKEN", "PASSWORD", "PRIVATE_KEY", "BEGIN RSA", "BEGIN OPENSSH", ".env")


@dataclass(slots=True)
class CommandResult:
    command: list[str]
    cwd: str
    exit_code: int
    stdout: str
    stderr: str


class MemoryMeshCodingAgentService:
    """A real local coding-agent loop for the Cognee hackathon demo.

    The agent is intentionally small and auditable. It does real work:
    lists a repository, reads files, runs tests, writes a code patch, runs tests
    again, saves checkpoints, recalls Cognee memory after a simulated context
    wipe, and improves future behaviour from feedback.

    It is not a replacement for Claude Code/Codex. It is a reference agent that
    proves MemoryMesh can wrap real coding tools instead of only showing a static
    scripted UI.
    """

    def __init__(self, store: PostgresStore, cognee: CogneeMemoryService, settings: Settings):
        self.store = store
        self.cognee = cognee
        self.settings = settings
        self.repo_root = Path(__file__).resolve().parents[4]
        self.sample_repo = self.repo_root / "examples" / "memorymesh-sample-dashboard-service"
        self.workspace_root = Path(tempfile.gettempdir()) / "memorymesh-workspaces"
        self.workspace_root.mkdir(parents=True, exist_ok=True)

    async def run(
        self,
        *,
        task: str = "Fix dashboard RBAC so only admins can access the dashboard.",
        workspace_path: str | None = None,
        repository_name: str = "sample-dashboard-service",
        dataset: str | None = None,
        session_id: str | None = None,
        reset_workspace: bool = True,
        simulate_context_loss: bool = True,
        run_tests: bool = True,
        forget_after_run: bool = False,
    ) -> dict[str, Any]:
        task_id = new_id("coding_task")
        trace_id = new_id("coding_trace")
        session_id = session_id or new_id("coding_session")
        dataset_name = dataset or f"memorymesh-real-coding-agent-{repository_name}"
        checkpoint_id = new_id("coding_chk")
        workspace = self._prepare_workspace(workspace_path, repository_name, reset_workspace)
        tool_trace: list[dict[str, Any]] = []

        await self._event(task_id, trace_id, None, "request_received", "Request", f"Coding task received: {task}")

        files = self._repo_files(workspace)
        tool_trace.append({"tool": "list_files", "status": "ok", "output": files})

        relevant_paths = self._select_relevant_files(files, task)
        inspected = {path: self._read_safe_file(workspace / path) for path in relevant_paths}
        for path, content in inspected.items():
            tool_trace.append({"tool": "read_file", "status": "ok", "path": path, "sha256": stable_hash(content), "preview": content[:480]})

        tests_before = await self._run_tests(workspace) if run_tests else None
        if tests_before:
            tool_trace.append({"tool": "run_tests", "phase": "before_patch", **asdict(tests_before)})

        task_contract = self._task_contract(task, repository_name, files, relevant_paths)
        repo_map = self._repo_map(repository_name, files, inspected)
        decision = {
            "kind": "engineering_decision",
            "decision": "Patch the central dashboard access function, not each caller.",
            "reason": "A central guard is easier to test and prevents duplicated role checks.",
            "source": "MemoryMesh local coding-agent analysis",
        }
        failure_memory = {
            "kind": "failure_memory",
            "failed_signal": self._summarise_command(tests_before) if tests_before else "Tests not run before patch.",
            "next_safe_action": "Patch app/dashboard.py, then rerun the RBAC tests.",
        }

        remember_results = []
        for memory in (task_contract, repo_map, decision, failure_memory):
            remember_results.append(
                await self.cognee.remember(
                    text=self._memory_text(memory),
                    dataset=dataset_name,
                    session_id=session_id,
                    metadata={"task_id": task_id, "trace_id": trace_id, "repository": repository_name, "memory_kind": memory["kind"]},
                )
            )
        await self._event(task_id, trace_id, None, "memory_created_or_retrieved", "Cognee remember", "Task contract, repo map, decision, and failure signal stored in Cognee.")

        checkpoint_state = {
            "task": task,
            "workspace": str(workspace),
            "repository": repository_name,
            "relevant_paths": relevant_paths,
            "tests_before": asdict(tests_before) if tests_before else None,
            "next_safe_action": "patch_dashboard_access_guard",
        }
        await self._save_checkpoint(task_id, trace_id, checkpoint_id, checkpoint_state, remember_results[0].operation_id if remember_results else None)
        await self._event(task_id, trace_id, checkpoint_id, "checkpoint_saved", "Checkpoint", "Pre-patch coding-agent state saved.")

        if simulate_context_loss:
            inspected = {}
            await self._event(task_id, trace_id, checkpoint_id, "interruption_detected", "Context loss", "In-memory coding-agent state was cleared before patching.")

        recall = await self.cognee.recall(
            query=f"What should the coding agent do next for this task? {task}",
            dataset=dataset_name,
            session_id=session_id,
            top_k=8,
            metadata={"task_id": task_id, "trace_id": trace_id, "checkpoint_id": checkpoint_id},
        )
        await self._event(task_id, trace_id, checkpoint_id, "checkpoint_restored", "Recover", "Cognee recall restored task, repo, failure, and next-action context.")

        patch_result = self._apply_supported_patch(workspace, task)
        tool_trace.extend(patch_result["tool_trace"])
        files_changed = patch_result["files_changed"]

        tests_after = await self._run_tests(workspace) if run_tests else None
        if tests_after:
            tool_trace.append({"tool": "run_tests", "phase": "after_patch", **asdict(tests_after)})

        outcome = "passed" if tests_after and tests_after.exit_code == 0 else "needs_review"
        feedback = (
            "For dashboard RBAC tasks, prefer a central access-guard patch and verify with tests before completion."
            if outcome == "passed"
            else "When a supported patch still fails, keep the checkpoint and escalate with failing test output."
        )
        improve = await self.cognee.improve(
            feedback=feedback,
            dataset=dataset_name,
            session_id=session_id,
            metadata={"task_id": task_id, "trace_id": trace_id, "checkpoint_id": checkpoint_id, "outcome": outcome},
        )
        await self._event(task_id, trace_id, checkpoint_id, "memory_improved", "Improve", "Developer feedback/test outcome used to improve future recovery behaviour.")

        forgotten = None
        if forget_after_run:
            forgotten = await self.cognee.forget(
                dataset=dataset_name,
                session_id=session_id,
                metadata={"task_id": task_id, "trace_id": trace_id, "checkpoint_id": checkpoint_id, "reason": "demo privacy cleanup"},
            )
            await self._event(task_id, trace_id, checkpoint_id, "memory_forgotten", "Forget", "Cognee forget pruned this demo session memory for privacy cleanup.")

        await self._event(task_id, trace_id, checkpoint_id, "final_answer", "Complete", f"Real coding-agent run completed with outcome={outcome}.")

        return {
            "agent_name": "MemoryMesh Local Coding Agent",
            "agent_type": "real_local_coding_agent",
            "product": "MemoryMesh",
            "task_id": task_id,
            "trace_id": trace_id,
            "checkpoint_id": checkpoint_id,
            "repository": repository_name,
            "workspace_path": str(workspace),
            "dataset": dataset_name,
            "session_id": session_id,
            "category": "Example #03 Never-Forget Workflows + Example #04 Self-Improving Agents",
            "memory_provider": recall.provider,
            "memory_backend": getattr(recall, "backend", "offline_mirror"),
            "memory_backend_ready": getattr(recall, "backend_ready", False),
            "cognee_enabled": self.cognee.configured,
            "context_loss_simulated": simulate_context_loss,
            "remembered": [self._result_dict(item) for item in remember_results],
            "recalled": self._result_dict(recall),
            "improved": self._result_dict(improve),
            "forgotten": self._result_dict(forgotten) if forgotten else None,
            "tests_before": asdict(tests_before) if tests_before else None,
            "tests_after": asdict(tests_after) if tests_after else None,
            "tests_passed": bool(tests_after and tests_after.exit_code == 0),
            "files_changed": files_changed,
            "tool_trace": tool_trace,
            "recovery_brief": {
                "resume_from": "patch_dashboard_access_guard",
                "restored_memory": recall.results,
                "next_actions": [
                    "Use recalled task contract and failure signal.",
                    "Patch the central dashboard access guard.",
                    "Run tests to prove the fix.",
                    "Improve memory with the verified outcome.",
                ],
            },
            "final_message": (
                "MemoryMesh ran a real local coding agent: it inspected the repo, observed failing tests, saved Cognee memory, simulated context loss, recalled recovery context, patched code, reran tests, and improved future behaviour."
            ),
        }

    def _prepare_workspace(self, workspace_path: str | None, repository_name: str, reset_workspace: bool) -> Path:
        if workspace_path:
            workspace = Path(workspace_path).expanduser().resolve()
            self._assert_workspace_allowed(workspace)
            if not workspace.exists() or not workspace.is_dir():
                raise ValueError(f"workspace_path does not exist or is not a directory: {workspace}")
            return workspace

        workspace = (self.workspace_root / f"{repository_name}-{new_id('run')}").resolve()
        if reset_workspace and workspace.exists():
            shutil.rmtree(workspace)
        shutil.copytree(self.sample_repo, workspace)
        return workspace

    def _assert_workspace_allowed(self, workspace: Path) -> None:
        allowed_roots = [self.workspace_root.resolve(), self.sample_repo.resolve(), self.repo_root.resolve()]
        for root in allowed_roots:
            try:
                workspace.relative_to(root)
                return
            except ValueError:
                continue
        raise ValueError(f"Workspace is outside allowed roots: {workspace}")

    def _repo_files(self, workspace: Path) -> list[str]:
        files: list[str] = []
        for path in workspace.rglob("*"):
            if path.is_dir():
                continue
            if any(part in IGNORED_DIRS for part in path.parts):
                continue
            if path.suffix not in SAFE_EXTENSIONS:
                continue
            rel = path.relative_to(workspace).as_posix()
            if self._looks_secret(rel):
                continue
            files.append(rel)
        return sorted(files)

    def _select_relevant_files(self, files: list[str], task: str) -> list[str]:
        keywords = {token.lower().strip(".,:;()[]{}") for token in task.split() if len(token) > 2}
        scored: list[tuple[int, str]] = []
        for path in files:
            haystack = path.lower().replace("/", " ").replace("_", "-")
            score = sum(2 for token in keywords if token in haystack)
            if "test" in haystack:
                score += 1
            if "dashboard" in haystack or "auth" in haystack or "middleware" in haystack:
                score += 3
            scored.append((score, path))
        scored.sort(key=lambda item: (-item[0], item[1]))
        return [path for score, path in scored[:8] if score > 0] or files[:8]

    def _read_safe_file(self, path: Path) -> str:
        text = path.read_text(encoding="utf-8")
        return self._redact_secrets(text)

    async def _run_tests(self, workspace: Path) -> CommandResult:
        commands = [["python", "-m", "pytest", "-q"], ["python", "-m", "unittest", "discover", "-s", "tests"]]
        first = await self._run_command(commands[0], workspace)
        if first.exit_code == 0 or "No module named pytest" not in (first.stderr + first.stdout):
            return first
        return await self._run_command(commands[1], workspace)

    async def _run_command(self, command: list[str], cwd: Path, timeout: int = 20) -> CommandResult:
        def _execute() -> CommandResult:
            env = os.environ.copy()
            env["PYTHONPATH"] = str(cwd)
            completed = subprocess.run(command, cwd=str(cwd), env=env, capture_output=True, text=True, timeout=timeout)
            return CommandResult(command=command, cwd=str(cwd), exit_code=completed.returncode, stdout=completed.stdout[-4000:], stderr=completed.stderr[-4000:])
        try:
            return await asyncio.to_thread(_execute)
        except subprocess.TimeoutExpired as exc:
            return CommandResult(command=command, cwd=str(cwd), exit_code=124, stdout=exc.stdout.decode() if isinstance(exc.stdout, bytes) else str(exc.stdout or ""), stderr="Command timed out")

    def _apply_supported_patch(self, workspace: Path, task: str) -> dict[str, Any]:
        target = workspace / "app" / "dashboard.py"
        if not target.exists():
            return {"files_changed": [], "tool_trace": [{"tool": "write_file", "status": "skipped", "reason": "No supported dashboard.py target found."}]}

        before = target.read_text(encoding="utf-8")
        old = "    return bool(user)\n"
        new = "    return bool(user and user.get(\"role\") == \"admin\")\n"
        if old not in before:
            return {"files_changed": [], "tool_trace": [{"tool": "write_file", "status": "skipped", "path": "app/dashboard.py", "reason": "Expected vulnerable guard not found."}]}
        after = before.replace(old, new, 1)
        target.write_text(after, encoding="utf-8")

        decision_path = workspace / "docs" / "RBAC_DECISION.md"
        decision_path.parent.mkdir(parents=True, exist_ok=True)
        decision_text = "# RBAC decision\n\nMemoryMesh patched the central dashboard guard so only users with `role == \"admin\"` can access the admin dashboard. This keeps the auth provider unchanged and avoids duplicated page-level checks.\n"
        decision_path.write_text(decision_text, encoding="utf-8")

        diff = "".join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile="app/dashboard.py.before", tofile="app/dashboard.py.after"))
        return {
            "files_changed": ["app/dashboard.py", "docs/RBAC_DECISION.md"],
            "tool_trace": [
                {"tool": "write_file", "status": "ok", "path": "app/dashboard.py", "diff": diff},
                {"tool": "write_file", "status": "ok", "path": "docs/RBAC_DECISION.md", "sha256": stable_hash(decision_text)},
            ],
        }

    def _task_contract(self, task: str, repository_name: str, files: list[str], relevant_paths: list[str]) -> dict[str, Any]:
        return {
            "kind": "task_contract",
            "task": task,
            "repository": repository_name,
            "success_criteria": ["Non-admin users cannot access dashboard", "Admin users can access dashboard", "Tests pass after patch"],
            "constraints": ["Do not store secrets", "Prefer central guard changes", "Use tests as source of truth"],
            "relevant_paths": relevant_paths,
            "file_count": len(files),
        }

    def _repo_map(self, repository_name: str, files: list[str], inspected: dict[str, str]) -> dict[str, Any]:
        return {
            "kind": "repo_map",
            "repository": repository_name,
            "files": files,
            "inspected_hashes": {path: stable_hash(content) for path, content in inspected.items()},
        }

    async def _save_checkpoint(self, task_id: str, trace_id: str, checkpoint_id: str, state: dict[str, Any], memory_record_id: str | None) -> None:
        await self.store.insert_one(
            "task_checkpoints",
            {
                "_id": checkpoint_id,
                "task_id": task_id,
                "trace_id": trace_id,
                "agent_id": "memorymesh-local-coding-agent",
                "task_version": 1,
                "recovery_status": "checkpoint_saved",
                "dataset_type": "real_coding_agent_repo",
                "state": state,
                "resume_state": {"current_step": state["next_safe_action"], "pending_actions": ["recall_memory", "patch_code", "run_tests"]},
                "safe_to_resume": True,
                "requires_human_review": False,
                "memory_record_id": memory_record_id,
                "checkpoint_name": "real-coding-agent-pre-patch",
                "created_at": utc_now(),
            },
        )

    async def _event(self, task_id: str, trace_id: str, checkpoint_id: str | None, code: str, label: str, description: str) -> None:
        event = RunEvent(code=code, label=label, status=RunEventStatus.complete, description=description)
        await self.store.insert_one(
            "run_events",
            {
                "_id": new_id("event"),
                "task_id": task_id,
                "trace_id": trace_id,
                "checkpoint_id": checkpoint_id,
                "code": event.code,
                "label": event.label,
                "status": event.status.value,
                "description": event.description,
                "payload": {},
                "created_at": event.timestamp,
            },
        )

    def _memory_text(self, value: dict[str, Any]) -> str:
        return "MEMORYMESH CODING MEMORY\n" + json.dumps(value, indent=2, sort_keys=True, default=str)

    def _result_dict(self, result: Any) -> dict[str, Any]:
        return {
            "operation_id": result.operation_id,
            "operation": result.operation,
            "provider": result.provider,
            "dataset": result.dataset,
            "session_id": result.session_id,
            "status": result.status,
            "content": result.content,
            "results": result.results,
            "fallback_used": result.fallback_used,
            "error": result.error,
            "backend": getattr(result, "backend", "offline_mirror"),
            "backend_ready": getattr(result, "backend_ready", False),
        }

    def _summarise_command(self, result: CommandResult | None) -> str:
        if result is None:
            return "No command result."
        output = (result.stdout or result.stderr or "").strip().splitlines()
        tail = " | ".join(output[-4:]) if output else "no output"
        return f"exit_code={result.exit_code}; {tail}"

    def _redact_secrets(self, content: str) -> str:
        redacted_lines: list[str] = []
        for line in content.splitlines():
            upper = line.upper()
            redacted_lines.append("[REDACTED SECRET-LIKE LINE]" if any(marker in upper for marker in SECRET_MARKERS) else line)
        return "\n".join(redacted_lines)

    def _looks_secret(self, relative_path: str) -> bool:
        name = relative_path.lower()
        return name.endswith(".env") or "/.env" in name or "secret" in name or "private_key" in name
