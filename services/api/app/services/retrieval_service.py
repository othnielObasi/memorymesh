from __future__ import annotations

from typing import List
from app.db.postgres import DESCENDING

from app.config import Settings
from app.db.postgres import PostgresStore
from app.models.schemas import LessonStatus, RetrievalEvent, RetrievedRule, new_id
from app.services.context_builder import ContextBuilder
from app.services.embedding_service import EmbeddingService, cosine_similarity


class RetrievalService:
    def __init__(self, store: PostgresStore, embeddings: EmbeddingService, settings: Settings):
        self.store = store
        self.embeddings = embeddings
        self.settings = settings
        self.context_builder = ContextBuilder()

    async def retrieve(self, task_description: str, agent_id: str, top_k: int = 3, task_id: str | None = None) -> tuple[List[RetrievedRule], str]:
        query_embedding = await self.embeddings.embed(task_description)
        rules = await self._local_search(task_description, query_embedding, top_k)
        context_prefix = self.context_builder.build(rules)
        if task_id:
            event = RetrievalEvent(_id=new_id('retrieval'), task_id=task_id, agent_id=agent_id, query=task_description, retrieved_rules=rules, context_prefix=context_prefix)
            await self.store.insert_one('retrieval_events', event.model_dump(by_alias=True))
        return rules, context_prefix

    async def _local_search(self, task_description: str, query_embedding: List[float], top_k: int) -> List[RetrievedRule]:
        docs = await self.store.find_many('playbook_rules', {'status': LessonStatus.approved.value}, limit=100, sort=[('created_at', DESCENDING)])
        terms = set(task_description.lower().replace('_', ' ').replace('-', ' ').split())
        ranked = []
        for doc in docs:
            vector_score = cosine_similarity(query_embedding, doc.get('embedding', []))
            rule_terms = set(doc.get('rule_text', '').lower().replace('_', ' ').replace('-', ' ').split())
            keyword_score = len(terms & rule_terms) / max(1, len(terms | rule_terms))
            category_boost = 0.25 if any(x in task_description.lower() for x in ['ticket', 'records', 'api', 'analyse', 'analyze']) and doc.get('category') == 'pagination' else 0
            score = min(1.0, 0.6 * vector_score + 0.3 * keyword_score + category_boost)
            ranked.append((score, doc))
        ranked.sort(key=lambda item: item[0], reverse=True)
        return [RetrievedRule(rule_id=doc['_id'], score=round(float(score), 4), rule_text=doc['rule_text'], category=doc.get('category', 'tool_use')) for score, doc in ranked[:top_k] if score > 0.01]
