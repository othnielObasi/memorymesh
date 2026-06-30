from __future__ import annotations

import asyncio
from typing import Any

from app.config import Settings
from app.services.production_agents import ProductionAgentRuntime


class MemoryStore:
    def __init__(self):
        self.docs: dict[str, list[dict[str, Any]]] = {}

    async def insert_one(self, collection: str, doc: dict[str, Any]) -> str:
        self.docs.setdefault(collection, []).append(dict(doc))
        return str(doc.get("_id") or len(self.docs[collection]))

    async def find_many(self, collection: str, query: dict[str, Any] | None = None, limit: int = 100, sort=None):
        query = query or {}
        rows = list(self.docs.get(collection, []))
        for key, value in query.items():
            rows = [row for row in rows if row.get(key) == value]
        return rows[:limit]


def settings() -> Settings:
    return Settings(
        MEMORYMESH_MEMORY_BACKEND="offline_mirror",
        DEFAULT_MODEL_GATEWAY="openai_compatible",
        OPENAI_API_KEY=None,
        AIMLAPI_API_KEY=None,
    )


def test_research_agent_returns_source_backed_receipt():
    async def run():
        runtime = ProductionAgentRuntime(MemoryStore(), settings())
        return await runtime.run(agent_id="research", task="Compare durable memory approaches", memory_backend="offline_mirror")

    receipt = asyncio.run(run())

    assert receipt["agent_id"] == "research"
    assert receipt["status"] == "complete"
    assert receipt["evidence"]
    assert receipt["memory_operations"]
    assert receipt["model_trace"]["provider"]
    assert "source" in receipt["outcome"]["receipt"].lower()


def test_support_agent_returns_ticket_tool_traces_and_recovery():
    async def run():
        runtime = ProductionAgentRuntime(MemoryStore(), settings())
        return await runtime.run(agent_id="support", task="Investigate billing-delay support tickets", memory_backend="offline_mirror")

    receipt = asyncio.run(run())

    assert receipt["agent_id"] == "support"
    assert receipt["tool_traces"]
    assert receipt["recovery"]["records_seen"] == 6
    assert receipt["recovery"]["pages_fetched"] == 3
    assert any(trace["tool"] == "fetch_tickets" for trace in receipt["tool_traces"])


def test_build_agent_returns_tested_code_receipt():
    async def run():
        runtime = ProductionAgentRuntime(MemoryStore(), settings())
        return await runtime.run(
            agent_id="build",
            task="Add user authentication with email and password",
            memory_backend="offline_mirror",
        )

    receipt = asyncio.run(run())

    assert receipt["agent_id"] == "build"
    assert receipt["status"] == "complete"
    assert receipt["evidence"]
    assert receipt["raw"]["tests_passed"] is True
    assert any(trace["tool"] == "run_tests" for trace in receipt["tool_traces"])
