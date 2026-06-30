from __future__ import annotations
from app.db.postgres import DESCENDING
from app.db.postgres import PostgresStore
from app.models.schemas import ExecutionTrace, FailureType, LessonStatus, ReflectionInsight, new_id


class ReflectionService:
    def __init__(self, store: PostgresStore):
        self.store = store

    async def reflect(self, trace: ExecutionTrace) -> ReflectionInsight:
        insight, rule, confidence = self._derive(trace)
        reflection = ReflectionInsight(_id=new_id('reflection'), source_trace_id=trace.id, task_id=trace.task_id, agent_id=trace.agent_id, insight=insight, candidate_rule=rule, failure_type=trace.failure_type, confidence=confidence, status=LessonStatus.pending_curation)
        await self.store.insert_one('reflection_insights', reflection.model_dump(by_alias=True))
        return reflection

    def _derive(self, trace: ExecutionTrace) -> tuple[str, str, float]:
        if trace.failure_type == FailureType.pagination_missed:
            return ('The agent produced an incomplete result because it did not continue fetching pages when next_page_token was present.', 'For paginated APIs, continue fetching until next_page_token is null before producing a final answer.', 0.92)
        if trace.failure_type == FailureType.auth_missing:
            return ('The agent attempted a write operation before authentication was confirmed.', 'Authenticate before performing write operations.', 0.88)
        if trace.failure_type == FailureType.schema_invalid:
            return ('The agent passed malformed data to a downstream tool.', 'Validate schema before passing output to downstream tools.', 0.87)
        if trace.failure_type == FailureType.pii_blocked:
            return ('The agent attempted an external action containing sensitive personal data.', 'Scan and redact PII before using external communication tools.', 0.9)
        return ('The trace completed successfully and produced a reusable best-practice pattern.', 'Check task requirements, tool outputs, and validation status before producing a final answer.', 0.74)

    async def get(self, reflection_id: str) -> ReflectionInsight | None:
        doc = await self.store.find_one('reflection_insights', reflection_id)
        return ReflectionInsight.model_validate(doc) if doc else None

    async def list(self, limit: int = 25) -> list[ReflectionInsight]:
        docs = await self.store.find_many('reflection_insights', limit=limit, sort=[('created_at', DESCENDING)])
        return [ReflectionInsight.model_validate(doc) for doc in docs]
