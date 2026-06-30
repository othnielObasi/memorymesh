from __future__ import annotations

from typing import Any

from app.db.postgres import PostgresStore
from app.models.schemas import RunEvent, RunEventStatus, new_id, stable_hash, utc_now
from app.services.cognee_memory import CogneeMemoryService


class CodingAgentRecoveryDemoService:
    """Deterministic demo that proves MemoryMesh + Cognee for coding agents.

    The goal is to show the hackathon story clearly: a coding agent starts a
    feature, MemoryMesh stores its mission and engineering state in Cognee, the
    context is wiped, then MemoryMesh recalls the correct recovery brief and
    improves future behaviour from feedback.
    """

    def __init__(self, store: PostgresStore, cognee: CogneeMemoryService):
        self.store = store
        self.cognee = cognee

    async def run(self, *, repository_name: str = "sample-next-auth-app") -> dict[str, Any]:
        task_id = new_id("coding_task")
        trace_id = new_id("coding_trace")
        checkpoint_id = new_id("coding_chk")
        session_id = new_id("coding_session")
        dataset = f"memorymesh-coding-agent-{repository_name}"

        task_contract = {
            "kind": "task_contract",
            "task_id": task_id,
            "repository": repository_name,
            "goal": "Add role-based access control to the dashboard without changing the auth provider.",
            "success_criteria": [
                "Dashboard route rejects non-admin users",
                "Existing sign-in flow remains unchanged",
                "Admin access test passes",
                "README documents the RBAC decision",
            ],
            "constraints": [
                "Prefer middleware guard over duplicated page-level guards",
                "Do not store secrets or .env values in memory",
                "Run tests before declaring completion",
            ],
        }
        repo_map = {
            "kind": "repo_map",
            "files": {
                "middleware.ts": "central route guard candidate",
                "app/dashboard/page.tsx": "protected dashboard UI",
                "lib/auth.ts": "existing auth provider and session helpers",
                "tests/admin-access.spec.ts": "failing regression test to fix after context restore",
            },
        }
        decision = {
            "kind": "decision",
            "decision": "Use middleware-based RBAC instead of page-level checks.",
            "reason": "It preserves the existing auth provider and avoids duplicating access logic across pages.",
            "rejected_approach": "Editing dashboard/page.tsx directly for every role check.",
        }
        failure_memory = {
            "kind": "failure_memory",
            "failed_attempt": "A page-level guard broke the admin redirect test.",
            "next_safe_action": "Patch middleware.ts redirect logic and rerun tests/admin-access.spec.ts.",
        }

        await self._event(task_id, trace_id, None, "request_received", "Request", "Developer asked coding agent to implement RBAC.")
        remember_results = []
        for payload in [task_contract, repo_map, decision, failure_memory]:
            remember_results.append(
                await self.cognee.remember(
                    text=self._memory_text(payload),
                    dataset=dataset,
                    session_id=session_id,
                    metadata={"task_id": task_id, "trace_id": trace_id, "memory_kind": payload["kind"], "repository": repository_name},
                )
            )
        await self._event(task_id, trace_id, None, "memory_created_or_retrieved", "Cognee remember", "Task contract, repo map, decision, and failure memory stored in Cognee.")

        checkpoint_state = {
            "task_contract": task_contract,
            "repo_map": repo_map,
            "decision": decision,
            "failure_memory": failure_memory,
            "last_safe_step": "middleware_patch_pending",
            "context_loss_simulated": True,
        }
        await self.store.insert_one(
            "task_checkpoints",
            {
                "_id": checkpoint_id,
                "task_id": task_id,
                "trace_id": trace_id,
                "agent_id": "memorymesh-coding-agent",
                "task_version": 1,
                "recovery_status": "checkpoint_saved",
                "dataset_type": "coding_agent_repo",
                "state": checkpoint_state,
                "resume_state": {
                    "current_step": "patch_middleware_redirect_logic",
                    "page_token": None,
                    "partial_results": [],
                    "validated_records": 4,
                    "pending_actions": [
                        {"type": "edit", "target": "middleware.ts"},
                        {"type": "test", "target": "tests/admin-access.spec.ts"},
                    ],
                    "observed_signals": {"last_failed_test": "admin redirect regression"},
                },
                "safe_to_resume": True,
                "requires_human_review": False,
                "memory_record_id": remember_results[0].operation_id if remember_results else None,
                "checkpoint_name": "rbac-before-context-loss",
                "created_at": utc_now(),
            },
        )
        await self._event(task_id, trace_id, checkpoint_id, "checkpoint_saved", "Checkpoint", "Last safe coding-agent state saved before simulated context loss.")
        await self._event(task_id, trace_id, checkpoint_id, "interruption_detected", "Context loss", "Coding-agent session was wiped.")

        recall = await self.cognee.recall(
            query="What should the coding agent do next for RBAC dashboard middleware after context loss?",
            dataset=dataset,
            session_id=session_id,
            top_k=6,
            metadata={"task_id": task_id, "trace_id": trace_id, "checkpoint_id": checkpoint_id},
        )
        recovery_brief = {
            "task_id": task_id,
            "trace_id": trace_id,
            "checkpoint_id": checkpoint_id,
            "repository": repository_name,
            "resume_from": "patch_middleware_redirect_logic",
            "restored_memory": recall.results,
            "next_actions": [
                "Open middleware.ts and update the admin redirect branch.",
                "Keep lib/auth.ts provider contract unchanged.",
                "Rerun tests/admin-access.spec.ts.",
                "Update README with the middleware-based RBAC decision.",
            ],
        }
        await self.store.insert_one(
            "recovery_records",
            {
                "_id": new_id("recovery"),
                "task_id": task_id,
                "trace_id": trace_id,
                "checkpoint_id": checkpoint_id,
                "provider": recall.provider,
                "recovery_brief": recovery_brief,
                "created_at": utc_now(),
            },
        )
        await self._event(task_id, trace_id, checkpoint_id, "checkpoint_restored", "Recover", "MemoryMesh recalled Cognee memory and restored the coding-agent recovery brief.")

        feedback = "Future RBAC tasks should prefer middleware-only guards unless the task explicitly asks for page-level access checks."
        improve = await self.cognee.improve(
            feedback=feedback,
            dataset=dataset,
            session_id=session_id,
            metadata={"task_id": task_id, "trace_id": trace_id, "checkpoint_id": checkpoint_id, "source": "developer_feedback"},
        )
        await self._event(task_id, trace_id, checkpoint_id, "memory_improved", "Improve", "Developer feedback improved future recovery behaviour.")
        await self._event(task_id, trace_id, checkpoint_id, "final_answer", "Continue", "Agent resumed from the correct checkpoint with Cognee-backed context.")

        return {
            "task_id": task_id,
            "trace_id": trace_id,
            "checkpoint_id": checkpoint_id,
            "repository": repository_name,
            "dataset": dataset,
            "session_id": session_id,
            "category": "Example #03 Never-Forget Workflows + Example #04 Self-Improving Agents",
            "memory_provider": recall.provider,
            "cognee_enabled": self.cognee.configured,
            "context_loss_simulated": True,
            "remembered": [self._result_dict(item) for item in remember_results],
            "recalled": self._result_dict(recall),
            "improved": self._result_dict(improve),
            "recovery_brief": recovery_brief,
            "final_message": "MemoryMesh recovered the coding agent's task contract, repo map, decision history, failed attempt, and next safe action from Cognee memory.",
        }

    async def ingest_codebase(self, *, repository_name: str, files: dict[str, str], dataset: str | None = None) -> dict[str, Any]:
        dataset_name = dataset or f"memorymesh-codebase-{repository_name}"
        operations = []
        for path, content in files.items():
            safe_content = self._redact_secrets(content)
            operations.append(
                await self.cognee.remember(
                    text=f"CODE FILE: {repository_name}/{path}\n{safe_content}",
                    dataset=dataset_name,
                    metadata={"repository": repository_name, "path": path, "memory_kind": "code_file"},
                )
            )
        await self.store.insert_one(
            "codebase_context",
            {
                "_id": new_id("codebase"),
                "repository": repository_name,
                "dataset": dataset_name,
                "file_count": len(files),
                "file_hashes": {path: stable_hash(self._redact_secrets(content)) for path, content in files.items()},
                "created_at": utc_now(),
            },
        )
        return {
            "repository": repository_name,
            "dataset": dataset_name,
            "file_count": len(files),
            "memory_provider": self.cognee.provider,
            "operations": [self._result_dict(item) for item in operations],
        }

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
        return "MEMORYMESH CODING MEMORY\n" + "\n".join(f"{key}: {val}" for key, val in value.items())

    def _result_dict(self, result: Any) -> dict[str, Any]:
        return {
            "operation_id": result.operation_id,
            "operation": result.operation,
            "provider": result.provider,
            "dataset": result.dataset,
            "session_id": result.session_id,
            "status": result.status,
            "results": result.results,
            "fallback_used": result.fallback_used,
            "error": result.error,
        }

    def _redact_secrets(self, content: str) -> str:
        redacted_lines = []
        secret_markers = ("API_KEY", "SECRET", "TOKEN", "PASSWORD", "PRIVATE_KEY", ".env")
        for line in content.splitlines():
            upper = line.upper()
            if any(marker in upper for marker in secret_markers):
                redacted_lines.append("[REDACTED SECRET-LIKE LINE]")
            else:
                redacted_lines.append(line)
        return "\n".join(redacted_lines)
