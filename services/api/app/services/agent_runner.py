from __future__ import annotations

from typing import List, Optional

from app.models.schemas import Decision, ExecutionTrace, FailureType, ResumeState, ToolCall, TraceStatus, new_id
from app.services.governance import GovernanceService
from app.tools.ticket_tools import fetch_tickets, summarise_items


class AgentRunner:
    """Reference agent runner used by the example app.

    Production users are expected to integrate their own agents through the SDK or
    framework adapters. This runner proves how MemoryMesh consumes resumable state.
    """

    def __init__(self, governance: GovernanceService):
        self.governance = governance

    async def run(
        self,
        task_description: str,
        agent_id: str,
        dataset_type: str,
        context_prefix: str,
        resume_state: ResumeState | None = None,
        task_id: str | None = None,
    ) -> ExecutionTrace:
        task_id = task_id or new_id("task")
        all_items: List[dict] = list(resume_state.partial_results) if resume_state else []
        tool_calls: List[ToolCall] = []
        should_paginate = self._context_requires_pagination(context_prefix)
        page_token: Optional[str] = resume_state.page_token if resume_state else None
        pages_fetched = 0
        missed_pagination = False

        while True:
            args = {"dataset_type": dataset_type, "page_token": page_token}
            decision = self.governance.evaluate_tool_call(
                "fetch_tickets",
                args,
                {"agent_id": agent_id, "task_id": task_id, "tool_type": "read"},
            )
            if decision.decision != Decision.allowed:
                tool_calls.append(ToolCall(tool="fetch_tickets", args=args, governance_decision=decision, output=None, error=decision.reason))
                return ExecutionTrace(
                    _id=new_id("trace"),
                    task_id=task_id,
                    agent_id=agent_id,
                    task_description=task_description,
                    context_prefix=context_prefix,
                    status=TraceStatus.blocked,
                    failure_type=FailureType.unknown_tool,
                    tool_calls=tool_calls,
                    final_output="Task blocked by governance layer.",
                    metadata={"pages_fetched": pages_fetched, "dataset_type": dataset_type},
                )

            output = fetch_tickets(dataset_type=dataset_type, page_token=page_token)
            pages_fetched += 1
            all_items.extend(output["items"])
            next_token = output.get("next_page_token")
            tool_calls.append(
                ToolCall(
                    tool="fetch_tickets",
                    args=args,
                    governance_decision=decision,
                    output={"items_count": len(output["items"]), "next_page_token": next_token},
                )
            )

            if next_token and not should_paginate:
                missed_pagination = True
                break
            if not next_token:
                break
            page_token = next_token

        summary = summarise_items(all_items)
        metadata = {
            "pages_fetched": pages_fetched,
            "dataset_type": dataset_type,
            "records_seen": len(all_items),
            "next_page_token_present": bool(page_token and missed_pagination),
            "resume_state_used": resume_state is not None,
            "next_page_token": page_token if missed_pagination else None,
            "partial_results": all_items,
        }
        if missed_pagination:
            return ExecutionTrace(
                _id=new_id("trace"),
                task_id=task_id,
                agent_id=agent_id,
                task_description=task_description,
                context_prefix=context_prefix,
                status=TraceStatus.failed,
                failure_type=FailureType.pagination_missed,
                tool_calls=tool_calls,
                final_output=f"Incomplete summary from current page state: {summary}",
                metadata=metadata,
            )

        return ExecutionTrace(
            _id=new_id("trace"),
            task_id=task_id,
            agent_id=agent_id,
            task_description=task_description,
            context_prefix=context_prefix,
            status=TraceStatus.recovered if resume_state else TraceStatus.success,
            failure_type=FailureType.none,
            tool_calls=tool_calls,
            final_output=f"Complete summary across {pages_fetched} new pages and {len(all_items)} total records: {summary}",
            metadata={**metadata, "next_page_token_present": False, "next_page_token": None},
        )

    def _context_requires_pagination(self, context_prefix: str) -> bool:
        lower = context_prefix.lower()
        return "paginated apis" in lower or "next_page_token is null" in lower or "continue fetching" in lower
