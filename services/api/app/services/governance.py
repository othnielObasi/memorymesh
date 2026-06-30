from __future__ import annotations

import re
from typing import Any, Dict, Iterable

from app.models.schemas import Decision, GovernanceDecision, ToolType

PII_PATTERNS: Iterable[re.Pattern[str]] = [
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    re.compile(r"\b\d{4}-\d{4}-\d{4}-\d{4}\b"),
    re.compile(r"[\w\.-]+@[\w\.-]+\.\w+"),
]


class GovernanceService:
    """Configurable local policy gate for tool execution.

    The service intentionally remains framework-agnostic. Agents call it before a
    tool executes; MemoryMesh then persists the decision alongside the tool trace.
    """

    WRITE_PREFIXES = ("write_", "update_", "delete_", "approve_", "create_", "send_")

    def evaluate_tool_call(self, tool_name: str, args: Dict[str, Any], task_context: Dict[str, Any]) -> GovernanceDecision:
        tool_type = self._tool_type(tool_name, task_context)
        body = str(args)

        if any(pattern.search(body) for pattern in PII_PATTERNS) and tool_type != ToolType.read:
            return GovernanceDecision(
                decision=Decision.blocked,
                risk_score=92,
                reason="Sensitive data detected in an action-taking tool call.",
                policy_flags=["pii_detected", "action_blocked"],
                tool_type=tool_type,
                requires_human_review=True,
            )

        if tool_type == ToolType.read:
            return GovernanceDecision(
                decision=Decision.allowed,
                risk_score=12,
                reason="Read-only retrieval is within task scope.",
                policy_flags=["read_only"],
                tool_type=tool_type,
                requires_human_review=False,
            )

        if tool_type in {ToolType.write, ToolType.external_action}:
            if not task_context.get("idempotency_key"):
                return GovernanceDecision(
                    decision=Decision.needs_approval,
                    risk_score=72,
                    reason="Action-taking tools require an idempotency key and human/policy approval.",
                    policy_flags=["approval_required", "idempotency_required"],
                    tool_type=tool_type,
                    requires_human_review=True,
                )
            return GovernanceDecision(
                decision=Decision.needs_approval,
                risk_score=65,
                reason="Action-taking tool requires approval before execution.",
                policy_flags=["approval_required"],
                tool_type=tool_type,
                requires_human_review=True,
            )

        return GovernanceDecision(
            decision=Decision.needs_approval,
            risk_score=70,
            reason="Unknown tool requires review.",
            policy_flags=["unknown_tool"],
            tool_type=tool_type,
            requires_human_review=True,
        )

    def _tool_type(self, tool_name: str, task_context: Dict[str, Any]) -> ToolType:
        if "tool_type" in task_context:
            try:
                return ToolType(task_context["tool_type"])
            except ValueError:
                return ToolType.unknown
        if tool_name.startswith(("fetch_", "search_", "read_", "list_", "get_")):
            return ToolType.read
        if tool_name.startswith(self.WRITE_PREFIXES):
            return ToolType.write if not tool_name.startswith(("send_", "approve_")) else ToolType.external_action
        return ToolType.unknown
