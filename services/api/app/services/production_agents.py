from __future__ import annotations

from typing import Any

from app.config import Settings
from app.db.postgres import PostgresStore
from app.models.schemas import new_id, stable_hash, utc_now
from app.services.agent_runner import AgentRunner
from app.services.cognee_memory import CogneeMemoryService
from app.services.governance import GovernanceService
from app.services.model_gateway import ModelGatewayRegistry
from app.services.real_coding_agent import MemoryMeshCodingAgentService


class ProductionAgentRuntime:
    """Shared runtime for MemoryMesh's user-facing agents.

    The UI can show different agents, but they should all prove the same
    production loop: run -> use tools/evidence -> remember -> checkpoint or
    recover -> produce an inspectable receipt.
    """

    def __init__(self, store: PostgresStore, settings: Settings):
        self.store = store
        self.settings = settings
        self.memory = CogneeMemoryService(store, settings)
        self.gateway = ModelGatewayRegistry(settings).get("openai_compatible")
        self.ticket_runner = AgentRunner(GovernanceService())

    async def run(
        self,
        *,
        agent_id: str,
        task: str,
        memory_backend: str | None = None,
        workspace_path: str | None = None,
        repository_name: str | None = None,
        github_url: str | None = None,
        tenant_context: dict[str, str] | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        agent = (agent_id or "build").strip().lower()
        tenant_context = tenant_context or {}
        if agent == "build":
            return await self._run_build(
                task=task,
                memory_backend=memory_backend,
                workspace_path=workspace_path,
                repository_name=repository_name,
                github_url=github_url,
                tenant_context=tenant_context,
                idempotency_key=idempotency_key,
            )
        if agent == "research":
            return await self._run_research(task=task, memory_backend=memory_backend, tenant_context=tenant_context, idempotency_key=idempotency_key)
        if agent == "support":
            return await self._run_support(task=task, memory_backend=memory_backend, tenant_context=tenant_context, idempotency_key=idempotency_key)
        raise ValueError(f"Unknown production agent: {agent_id}")

    async def _run_build(
        self,
        *,
        task: str,
        memory_backend: str | None,
        workspace_path: str | None,
        repository_name: str | None,
        github_url: str | None,
        tenant_context: dict[str, str],
        idempotency_key: str | None,
    ) -> dict[str, Any]:
        memory = self.memory.with_backend(memory_backend)
        agent = MemoryMeshCodingAgentService(self.store, memory, self.settings)
        result = await agent.run(
            repository_name=repository_name or "sample-dashboard-service",
            workspace_path=workspace_path,
            github_url=github_url,
            task=task or "Fix dashboard access so only admins can open the dashboard and make the tests pass.",
            dataset="memorymesh-build-assistant",
            run_tests=True,
        )
        tool_trace = result.get("tool_trace", [])
        remembered = result.get("remembered", [])
        outcome = result.get("outcome")
        status = "complete" if result.get("tests_passed") or outcome in {"profiled", "handoff_ready"} else "needs_review"
        return await self._receipt(
            agent_id="build",
            agent_name="Build Assistant",
            task=task,
            status=status,
            final_output=result.get("final_message", "Build Assistant completed the run."),
            evidence=[
                {"label": "Tests before", "value": self._command_summary(result.get("tests_before"))},
                {"label": "Tests after", "value": self._command_summary(result.get("tests_after"))},
                {"label": "Files changed", "value": ", ".join(result.get("files_changed", [])) or "None reported"},
                {"label": "Project profile", "value": self._profile_summary(result.get("project_profile", {}))},
            ],
            memory_operations=remembered + [result.get("recalled"), result.get("improved")],
            tool_traces=tool_trace,
            recovery={
                "mode": "checkpointed_code_recovery",
                "checkpoint_id": result.get("checkpoint_id"),
                "brief": result.get("recovery_brief", {}),
            },
            outcome={
                "summary": result.get("final_message", ""),
                "actions": result.get("recovery_brief", {}).get("next_actions") or ["Review changed files", "Inspect test output", "Approve memory lesson"],
                "receipt": "Build run includes project profile, file trace, test signal, Cognee memory operations, recovery brief, and Codex/Cursor handoff.",
            },
            model_trace={"provider": "not_required_for_code_patch", "model": "tool_runtime"},
            raw=result,
            tenant_context=tenant_context,
            idempotency_key=idempotency_key,
        )

    async def _run_research(self, *, task: str, memory_backend: str | None, tenant_context: dict[str, str], idempotency_key: str | None) -> dict[str, Any]:
        memory = self.memory.with_backend(memory_backend)
        task = task or "Compare durable memory approaches for AI agents"
        dataset = "memorymesh-research-assistant"
        session_id = new_id("research_session")
        source_plan = [
            {"title": "Cognee documentation", "url": "https://docs.cognee.ai/", "claim": "Cognee provides graph-backed memory primitives."},
            {"title": "MemoryMesh docs", "url": "local://docs/WORKSPACE_AND_UI_BLUEPRINT.md", "claim": "MemoryMesh packages memory into recoverable agent sessions."},
            {"title": "SDK integration docs", "url": "local://docs/SDK_INTEGRATION.md", "claim": "External agents can integrate through API/SDK adapters."},
        ]
        remembered = await memory.remember(
            text=f"Research task: {task}\nSources: {source_plan}",
            dataset=dataset,
            session_id=session_id,
            metadata={"agent_id": "research", "source_count": len(source_plan)},
        )
        recalled = await memory.recall(query=task, dataset=dataset, session_id=session_id)
        model = await self.gateway.chat(
            system="You are a research agent. Produce a concise source-backed brief with caveats and next questions.",
            user=f"Task: {task}\nSources: {source_plan}\nRecalled memory: {recalled.content}",
            max_tokens=520,
            temperature=0.1,
        )
        improved = await memory.improve(
            feedback=f"Research brief created for task={task}. Next run should reuse source trail and open questions.",
            dataset=dataset,
            session_id=session_id,
            metadata={"agent_id": "research"},
        )
        return await self._receipt(
            agent_id="research",
            agent_name="Research Assistant",
            task=task,
            status="complete",
            final_output=model.content,
            evidence=source_plan,
            memory_operations=[remembered, recalled, improved],
            tool_traces=[
                {"tool": "source_plan", "status": "complete", "items_count": len(source_plan)},
                {"tool": "llm_synthesis", "status": "complete", "provider": model.provider, "model": model.model},
            ],
            recovery={
                "mode": "source_trail_recovery",
                "session_id": session_id,
                "restores": ["research task", "source trail", "open questions", "brief"],
            },
            outcome={
                "summary": model.content,
                "actions": ["Validate source list", "Promote approved findings to memory", "Continue open questions"],
                "receipt": "Research run includes source trail, Cognee memory operations, LLM synthesis, and reusable follow-up state.",
            },
            model_trace={"provider": model.provider, "model": model.model, "used_fallback": model.used_fallback, "attempts": [a.__dict__ for a in model.attempts]},
            tenant_context=tenant_context,
            idempotency_key=idempotency_key,
        )

    async def _run_support(self, *, task: str, memory_backend: str | None, tenant_context: dict[str, str], idempotency_key: str | None) -> dict[str, Any]:
        memory = self.memory.with_backend(memory_backend)
        task = task or "Investigate unresolved billing-delay support tickets"
        dataset = "memorymesh-support-assistant"
        session_id = new_id("support_session")
        remembered = await memory.remember(
            text=f"Support investigation started: {task}",
            dataset=dataset,
            session_id=session_id,
            metadata={"agent_id": "support", "workflow": "ticket_investigation"},
        )
        trace = await self.ticket_runner.run(
            task_description=task,
            agent_id="support-assistant",
            dataset_type="support_tickets",
            context_prefix="Continue fetching paginated APIs until next_page_token is null.",
        )
        model = await self.gateway.chat(
            system="You are a support operations agent. Summarise ticket evidence, risk, action, and recovery state.",
            user=f"Task: {task}\nTrace output: {trace.final_output}\nMetadata: {trace.metadata}",
            max_tokens=520,
            temperature=0.1,
        )
        improved = await memory.improve(
            feedback=f"Support investigation completed. Outcome: {trace.final_output}",
            dataset=dataset,
            session_id=session_id,
            metadata={"agent_id": "support", "records_seen": trace.metadata.get("records_seen")},
        )
        return await self._receipt(
            agent_id="support",
            agent_name="Support Assistant",
            task=task,
            status=trace.status.value,
            final_output=model.content if model.content else trace.final_output,
            evidence=trace.metadata.get("partial_results", []),
            memory_operations=[remembered, improved],
            tool_traces=[
                {
                    "tool": call.tool,
                    "args": call.args,
                    "output": call.output,
                    "decision": call.governance_decision.decision.value,
                    "risk_score": call.governance_decision.risk_score,
                }
                for call in trace.tool_calls
            ],
            recovery={
                "mode": "ticket_cursor_recovery",
                "records_seen": trace.metadata.get("records_seen"),
                "pages_fetched": trace.metadata.get("pages_fetched"),
                "resume_state": {
                    "current_step": "final_answer_ready",
                    "page_token": trace.metadata.get("next_page_token"),
                    "partial_results": trace.metadata.get("partial_results", []),
                },
            },
            outcome={
                "summary": trace.final_output,
                "actions": ["Review recurring billing delay", "Prioritise high-severity login failures", "Save support lesson"],
                "receipt": "Support run includes ticket tool traces, governance decisions, memory operations, and recovery state.",
            },
            model_trace={"provider": model.provider, "model": model.model, "used_fallback": model.used_fallback, "attempts": [a.__dict__ for a in model.attempts]},
            tenant_context=tenant_context,
            idempotency_key=idempotency_key,
        )

    async def _receipt(
        self,
        *,
        agent_id: str,
        agent_name: str,
        task: str,
        status: str,
        final_output: str,
        evidence: list[Any],
        memory_operations: list[Any],
        tool_traces: list[Any],
        recovery: dict[str, Any],
        outcome: dict[str, Any],
        model_trace: dict[str, Any],
        raw: dict[str, Any] | None = None,
        tenant_context: dict[str, str] | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        tenant_context = tenant_context or {}
        workspace_id = tenant_context.get("workspace_id") or "wrk_default"
        if idempotency_key:
            existing = await self.store.find_one_by("agent_runs", {"workspace_id": workspace_id, "idempotency_key": idempotency_key})
            if existing:
                replay = dict(existing)
                replay["idempotent_replay"] = True
                return replay

        run_id = new_id("agent_run")
        task_id = new_id("task")
        memory_ops = [self._normalise_memory_op(op) for op in memory_operations if op]
        memory_backend = next((op.get("backend") for op in memory_ops if op.get("backend")), None)
        memory_provider = next((op.get("provider") for op in memory_ops if op.get("provider")), None)
        receipt = {
            **tenant_context,
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": agent_id,
            "agent_name": agent_name,
            "task": task,
            "status": status,
            "idempotency_key": idempotency_key,
            "idempotent_replay": False,
            "final_output": final_output,
            "evidence": evidence,
            "memory_backend": memory_backend,
            "memory_provider": memory_provider,
            "memory_operations": memory_ops,
            "tool_traces": tool_traces,
            "recovery": recovery,
            "outcome": outcome,
            "model_trace": model_trace,
            "created_at": utc_now().isoformat(),
            "raw": raw or {},
        }
        await self.store.insert_one("agent_runs", {"_id": run_id, **receipt})
        if idempotency_key:
            await self.store.upsert_one(
                "idempotency_keys",
                {"workspace_id": workspace_id, "key": idempotency_key},
                {
                    "_id": f"{workspace_id}:{idempotency_key}",
                    **tenant_context,
                    "key": idempotency_key,
                    "operation": "agents.run",
                    "status": "completed",
                    "run_id": run_id,
                    "task_id": task_id,
                    "result_ref": f"agent_runs/{run_id}",
                    "result_hash": stable_hash({"run_id": run_id, "task_id": task_id, "workspace_id": workspace_id}),
                    "created_at": utc_now(),
                    "updated_at": utc_now(),
                },
            )
        await self.store.insert_one(
            "run_events",
            {
                "_id": new_id("event"),
                **tenant_context,
                "task_id": task_id,
                "trace_id": None,
                "checkpoint_id": recovery.get("checkpoint_id"),
                "code": "final_answer",
                "label": "Answer",
                "status": "complete",
                "description": f"{agent_name} returned an inspectable production-agent receipt.",
                "payload": {"run_id": run_id, "agent_id": agent_id},
                "created_at": utc_now(),
            },
        )
        return receipt

    def _normalise_memory_op(self, op: Any) -> dict[str, Any]:
        if isinstance(op, dict):
            return op
        return {
            "operation": getattr(op, "operation", None),
            "provider": getattr(op, "provider", None),
            "backend": getattr(op, "backend", None),
            "status": getattr(op, "status", None),
            "fallback_used": getattr(op, "fallback_used", None),
            "error": getattr(op, "error", None),
            "dataset": getattr(op, "dataset", None),
            "session_id": getattr(op, "session_id", None),
            "content": getattr(op, "content", None),
        }

    def _command_summary(self, result: Any) -> str:
        if not result:
            return "Not run"
        if isinstance(result, dict):
            stdout = str(result.get("stdout") or "").strip()
            stderr = str(result.get("stderr") or "").strip()
            exit_code = result.get("exit_code")
        else:
            stdout = str(getattr(result, "stdout", "") or "").strip()
            stderr = str(getattr(result, "stderr", "") or "").strip()
            exit_code = getattr(result, "exit_code", None)
        output = stdout or stderr
        return f"exit={exit_code}; {output[-240:] if output else 'no output'}"

    def _profile_summary(self, profile: dict[str, Any]) -> str:
        if not profile:
            return "No project profile returned"
        stack = ", ".join(profile.get("likely_stack") or ["unknown"])
        manifests = ", ".join((profile.get("manifests") or [])[:4]) or "none"
        return f"{profile.get('file_count', 0)} files; stack={stack}; tests={profile.get('test_count', 0)}; manifests={manifests}"
