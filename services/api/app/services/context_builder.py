from __future__ import annotations

from typing import List
from app.models.schemas import RetrievedRule


class ContextBuilder:
    def build(self, rules: List[RetrievedRule]) -> str:
        if not rules:
            return ''
        bullets = '\n'.join(f'- {rule.rule_text}' for rule in rules[:3])
        return f'Relevant operating lessons:\n{bullets}\n\nApply these lessons when relevant to the task. Do not bypass governance checks.'
