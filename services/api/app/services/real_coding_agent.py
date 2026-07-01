from __future__ import annotations

import asyncio
import difflib
import json
import os
import re
import shutil
import subprocess
import tempfile
import urllib.request
import zipfile
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
        github_url: str | None = None,
        repository_name: str = "sample-dashboard-service",
        dataset: str | None = None,
        session_id: str | None = None,
        reset_workspace: bool = True,
        simulate_context_loss: bool = True,
        run_tests: bool = True,
        forget_after_run: bool = False,
        write_in_place: bool = False,
    ) -> dict[str, Any]:
        task_id = new_id("coding_task")
        trace_id = new_id("coding_trace")
        session_id = session_id or new_id("coding_session")
        dataset_name = dataset or f"memorymesh-real-coding-agent-{repository_name}"
        checkpoint_id = new_id("coding_chk")
        workspace = self._prepare_workspace(workspace_path, repository_name, reset_workspace, github_url=github_url, write_in_place=write_in_place)
        tool_trace: list[dict[str, Any]] = []

        await self._event(task_id, trace_id, None, "request_received", "Request", f"Coding task received: {task}")

        files = self._repo_files(workspace)
        tool_trace.append({"tool": "list_files", "status": "ok", "output": files})
        project_profile = self._project_profile(workspace, files)
        tool_trace.append({"tool": "profile_project", "status": "ok", "output": project_profile})

        relevant_paths = self._select_relevant_files(files, task)
        inspected = {path: self._read_safe_file(workspace / path) for path in relevant_paths}
        for path, content in inspected.items():
            tool_trace.append({"tool": "read_file", "status": "ok", "path": path, "sha256": stable_hash(content), "preview": content[:480]})

        tests_before = await self._run_tests(workspace) if run_tests else None
        if tests_before:
            tool_trace.append({"tool": "run_tests", "phase": "before_patch", **asdict(tests_before)})

        task_contract = self._task_contract(task, repository_name, files, relevant_paths, project_profile)
        repo_map = self._repo_map(repository_name, files, inspected)
        patch_plan = self._patch_plan(workspace, task)
        decision = self._engineering_decision(task, patch_plan, project_profile)
        failure_memory = {
            "kind": "test_signal",
            "failed_signal": self._summarise_command(tests_before) if tests_before else "Tests not run before patch.",
            "next_safe_action": patch_plan["next_action"],
        }
        handoff = self._agent_handoff(
            task=task,
            repository_name=repository_name,
            project_profile=project_profile,
            relevant_paths=relevant_paths,
            tests_before=tests_before,
            patch_plan=patch_plan,
        )

        remember_results = []
        for memory in (task_contract, repo_map, decision, failure_memory, handoff):
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
            "project_profile": project_profile,
            "next_safe_action": patch_plan["resume_from"],
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

        tests_after = await self._run_tests(workspace) if run_tests and patch_result["patched"] else tests_before
        if tests_after:
            tool_trace.append({"tool": "run_tests", "phase": "after_patch", **asdict(tests_after)})

        outcome = self._run_outcome(task=task, patch_result=patch_result, tests_after=tests_after)
        feedback = (
            "For dashboard RBAC tasks, prefer a central access-guard patch and verify with tests before completion."
            if outcome == "passed"
            else "When no safe automatic patch is available, create a precise Codex/Cursor handoff with project profile, relevant files, test signal, and next action."
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
            "outcome": outcome,
            "project_profile": project_profile,
            "agent_handoff": handoff,
            "files_changed": files_changed,
            "tool_trace": tool_trace,
            "recovery_brief": {
                "resume_from": patch_plan["resume_from"],
                "restored_memory": recall.results,
                "next_actions": handoff["next_actions"],
            },
            "final_message": self._final_message(outcome, project_profile, patch_result),
        }

    def _prepare_workspace(
        self,
        workspace_path: str | None,
        repository_name: str,
        reset_workspace: bool,
        *,
        github_url: str | None = None,
        write_in_place: bool = False,
    ) -> Path:
        if github_url:
            return self._clone_github_repo(github_url, repository_name, reset_workspace)

        if workspace_path:
            workspace = Path(workspace_path).expanduser().resolve()
            self._assert_workspace_allowed(workspace)
            if not workspace.exists() or not workspace.is_dir():
                raise ValueError(f"workspace_path does not exist or is not a directory: {workspace}")
            if write_in_place:
                return workspace
            slug = re.sub(r"[^A-Za-z0-9_.-]+", "-", repository_name or workspace.name)
            copy_path = (self.workspace_root / f"{slug}-{new_id('copy')}").resolve()
            if reset_workspace and copy_path.exists():
                shutil.rmtree(copy_path)
            shutil.copytree(
                workspace,
                copy_path,
                ignore=shutil.ignore_patterns(*IGNORED_DIRS),
            )
            return copy_path

        workspace = (self.workspace_root / f"{repository_name}-{new_id('run')}").resolve()
        if reset_workspace and workspace.exists():
            shutil.rmtree(workspace)
        shutil.copytree(self.sample_repo, workspace)
        return workspace

    def _clone_github_repo(self, github_url: str, repository_name: str, reset_workspace: bool) -> Path:
        url = github_url.strip()
        match = re.match(r"^https://github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)(?:\.git)?/?$", url)
        if not match:
            raise ValueError("github_url must be an HTTPS GitHub repository URL")
        slug = re.sub(r"[^A-Za-z0-9_.-]+", "-", repository_name or url.rstrip("/").split("/")[-1].removesuffix(".git"))
        workspace = (self.workspace_root / f"{slug}-{new_id('repo')}").resolve()
        if reset_workspace and workspace.exists():
            shutil.rmtree(workspace)
        try:
            completed = subprocess.run(
                ["git", "clone", "--depth", "1", url, str(workspace)],
                capture_output=True,
                text=True,
                timeout=60,
            )
        except FileNotFoundError:
            return self._download_github_archive(match.group(1), match.group(2), workspace)
        if completed.returncode != 0:
            try:
                return self._download_github_archive(match.group(1), match.group(2), workspace)
            except Exception as archive_error:
                raise ValueError(f"git clone failed: {(completed.stderr or completed.stdout)[-500:]}; archive fallback failed: {archive_error}") from archive_error
        return workspace

    def _download_github_archive(self, owner: str, repo: str, workspace: Path) -> Path:
        archive_url = f"https://github.com/{owner}/{repo}/archive/HEAD.zip"
        workspace.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="memorymesh-github-") as tmp:
            tmp_path = Path(tmp)
            archive_path = tmp_path / "repo.zip"
            request = urllib.request.Request(
                archive_url,
                headers={"User-Agent": "MemoryMesh/2.1"},
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                content_length = int(response.headers.get("Content-Length") or 0)
                if content_length > 50 * 1024 * 1024:
                    raise ValueError("GitHub archive is too large for the serverless runtime.")
                archive_path.write_bytes(response.read())
            extract_dir = tmp_path / "extract"
            with zipfile.ZipFile(archive_path) as archive:
                archive.extractall(extract_dir)
            roots = [path for path in extract_dir.iterdir() if path.is_dir()]
            if not roots:
                raise ValueError("GitHub archive did not contain a repository directory.")
            if workspace.exists():
                shutil.rmtree(workspace)
            shutil.copytree(
                roots[0],
                workspace,
                ignore=shutil.ignore_patterns(*IGNORED_DIRS),
            )
        return workspace

    def _assert_workspace_allowed(self, workspace: Path) -> None:
        if getattr(self.settings, "memorymesh_allow_any_local_project", False):
            return
        configured_roots = []
        raw_roots = str(getattr(self.settings, "memorymesh_local_project_roots", "") or "")
        for raw in raw_roots.split(os.pathsep):
            if raw.strip():
                configured_roots.append(Path(raw.strip()).expanduser().resolve())
        allowed_roots = [self.workspace_root.resolve(), self.sample_repo.resolve(), self.repo_root.resolve(), *configured_roots]
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

    def _project_profile(self, workspace: Path, files: list[str]) -> dict[str, Any]:
        manifests = [path for path in files if Path(path).name in {"package.json", "pyproject.toml", "requirements.txt", "Cargo.toml", "go.mod", "pom.xml"}]
        docs = [path for path in files if Path(path).name.lower().startswith("readme") or path.lower().startswith("docs/")]
        tests = [path for path in files if "test" in path.lower() or path.lower().startswith("tests/")]
        source = [path for path in files if path not in docs and path not in tests and path not in manifests]
        extensions: dict[str, int] = {}
        for path in files:
            suffix = Path(path).suffix or "[no extension]"
            extensions[suffix] = extensions.get(suffix, 0) + 1
        likely_stack = []
        if any(path.endswith("package.json") for path in manifests):
            likely_stack.append("node")
        if any(path.endswith("pyproject.toml") or path.endswith("requirements.txt") for path in manifests):
            likely_stack.append("python")
        if any(path.endswith("go.mod") for path in manifests):
            likely_stack.append("go")
        if any(path.endswith("Cargo.toml") for path in manifests):
            likely_stack.append("rust")
        if any(path.endswith("pom.xml") for path in manifests):
            likely_stack.append("java")
        return {
            "workspace": str(workspace),
            "file_count": len(files),
            "source_count": len(source),
            "test_count": len(tests),
            "doc_count": len(docs),
            "manifests": manifests[:12],
            "docs": docs[:12],
            "tests": tests[:12],
            "extensions": dict(sorted(extensions.items(), key=lambda item: (-item[1], item[0]))[:12]),
            "likely_stack": likely_stack or ["unknown"],
            "entry_candidates": self._entry_candidates(files),
        }

    def _entry_candidates(self, files: list[str]) -> list[str]:
        preferred_names = {"main.py", "app.py", "index.ts", "index.tsx", "index.js", "server.ts", "server.js", "__init__.py"}
        entries = [path for path in files if Path(path).name in preferred_names]
        return entries[:10]

    def _patch_plan(self, workspace: Path, task: str) -> dict[str, str]:
        dashboard = workspace / "app" / "dashboard.py"
        task_lower = task.lower()
        if dashboard.exists() and ("dashboard" in task_lower or "rbac" in task_lower or "admin" in task_lower):
            return {
                "mode": "safe_patch",
                "resume_from": "patch_dashboard_access_guard",
                "next_action": "Patch app/dashboard.py, then rerun the RBAC tests.",
            }
        return {
            "mode": "handoff",
            "resume_from": "handoff_to_connected_agent",
            "next_action": "Open this receipt in Codex/Cursor, inspect the relevant files, make the task-specific change, then save the outcome back to MemoryMesh.",
        }

    def _engineering_decision(self, task: str, patch_plan: dict[str, str], project_profile: dict[str, Any]) -> dict[str, Any]:
        if patch_plan["mode"] == "safe_patch":
            return {
                "kind": "engineering_decision",
                "decision": "Patch the central dashboard access function, not each caller.",
                "reason": "A central guard is easier to test and prevents duplicated role checks.",
                "source": "MemoryMesh local coding-agent analysis",
            }
        return {
            "kind": "engineering_decision",
            "decision": "Do not guess a code patch for an unknown repository shape.",
            "reason": "MemoryMesh should preserve project context and produce a high-quality handoff for Codex/Cursor when no safe automatic patch pattern is available.",
            "task": task,
            "project_stack": project_profile.get("likely_stack", []),
            "source": "MemoryMesh local coding-agent analysis",
        }

    def _agent_handoff(
        self,
        *,
        task: str,
        repository_name: str,
        project_profile: dict[str, Any],
        relevant_paths: list[str],
        tests_before: CommandResult | None,
        patch_plan: dict[str, str],
    ) -> dict[str, Any]:
        test_signal = self._summarise_command(tests_before) if tests_before else "Tests were not run."
        return {
            "kind": "agent_handoff",
            "repository": repository_name,
            "task": task,
            "for_tools": ["Codex", "Cursor", "Claude Code", "custom agent"],
            "project_profile": {
                "likely_stack": project_profile.get("likely_stack", []),
                "file_count": project_profile.get("file_count"),
                "test_count": project_profile.get("test_count"),
                "manifests": project_profile.get("manifests", []),
                "entry_candidates": project_profile.get("entry_candidates", []),
            },
            "relevant_paths": relevant_paths,
            "test_signal": test_signal,
            "next_actions": [
                "Load this MemoryMesh receipt before editing.",
                "Inspect the listed relevant paths first.",
                patch_plan["next_action"],
                "Run the detected tests or project-specific verification.",
                "Call MemoryMesh remember/improve with the final decision and proof.",
            ],
            "memorymesh_api": {
                "remember": "POST /api/memory/remember",
                "recall": "POST /api/memory/recall",
                "improve": "POST /api/memory/improve",
                "receipt": "POST /api/agents/run",
            },
        }

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
            return {"patched": False, "files_changed": [], "tool_trace": [{"tool": "write_file", "status": "skipped", "reason": "No supported dashboard.py target found. Created handoff instead."}]}

        before = target.read_text(encoding="utf-8")
        old = "    return bool(user)\n"
        new = "    return bool(user and user.get(\"role\") == \"admin\")\n"
        if old not in before:
            return {"patched": False, "files_changed": [], "tool_trace": [{"tool": "write_file", "status": "skipped", "path": "app/dashboard.py", "reason": "Expected vulnerable guard not found. Created handoff instead."}]}
        after = before.replace(old, new, 1)
        target.write_text(after, encoding="utf-8")

        decision_path = workspace / "docs" / "RBAC_DECISION.md"
        decision_path.parent.mkdir(parents=True, exist_ok=True)
        decision_text = "# RBAC decision\n\nMemoryMesh patched the central dashboard guard so only users with `role == \"admin\"` can access the admin dashboard. This keeps the auth provider unchanged and avoids duplicated page-level checks.\n"
        decision_path.write_text(decision_text, encoding="utf-8")

        diff = "".join(difflib.unified_diff(before.splitlines(True), after.splitlines(True), fromfile="app/dashboard.py.before", tofile="app/dashboard.py.after"))
        return {
            "patched": True,
            "files_changed": ["app/dashboard.py", "docs/RBAC_DECISION.md"],
            "tool_trace": [
                {"tool": "write_file", "status": "ok", "path": "app/dashboard.py", "diff": diff},
                {"tool": "write_file", "status": "ok", "path": "docs/RBAC_DECISION.md", "sha256": stable_hash(decision_text)},
            ],
        }

    def _run_outcome(self, *, task: str, patch_result: dict[str, Any], tests_after: CommandResult | None) -> str:
        if patch_result.get("patched"):
            return "passed" if tests_after and tests_after.exit_code == 0 else "needs_review"
        profile_words = {"inspect", "profile", "receipt", "connect", "index", "map", "summarize", "summarise"}
        if any(word in task.lower() for word in profile_words):
            return "profiled"
        return "handoff_ready"

    def _final_message(self, outcome: str, project_profile: dict[str, Any], patch_result: dict[str, Any]) -> str:
        if outcome == "passed":
            return "MemoryMesh patched the connected project copy, reran tests, saved Cognee memory, and produced a recoverable engineering receipt."
        if outcome == "profiled":
            return f"MemoryMesh profiled the connected project ({project_profile.get('file_count', 0)} files), saved local Cognee memory, and prepared a Codex/Cursor handoff receipt."
        if outcome == "handoff_ready":
            return f"MemoryMesh inspected the connected project ({project_profile.get('file_count', 0)} files), avoided an unsafe guessed patch, and prepared a Codex/Cursor handoff receipt."
        return "MemoryMesh inspected the connected project, saved local Cognee memory, and marked the run for review."

    def _task_contract(self, task: str, repository_name: str, files: list[str], relevant_paths: list[str], project_profile: dict[str, Any]) -> dict[str, Any]:
        return {
            "kind": "task_contract",
            "task": task,
            "repository": repository_name,
            "success_criteria": ["Connected project is inspected", "Relevant files and test signal are captured", "A safe patch or Codex/Cursor handoff is produced"],
            "constraints": ["Do not store secrets", "Prefer central guard changes when a safe patch is known", "Use tests as source of truth", "Do not guess unsafe patches"],
            "relevant_paths": relevant_paths,
            "file_count": len(files),
            "project_profile": project_profile,
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
