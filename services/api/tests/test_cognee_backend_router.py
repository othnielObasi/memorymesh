import asyncio
from types import SimpleNamespace

from app.api import cognee_memory_events
from app.services.cognee_memory import CogneeMemoryService


class FakeStore:
    def __init__(self):
        self.docs = []

    async def insert_one(self, collection, doc):
        self.docs.append((collection, doc))
        return doc.get("_id")

    async def find_many(self, collection, query=None, limit=50, sort=None):
        query = query or {}
        values = [doc for col, doc in self.docs if col == collection]
        for key, value in query.items():
            values = [doc for doc in values if doc.get(key) == value]
        return list(reversed(values))[:limit]


def settings(**kwargs):
    defaults = dict(
        memorymesh_memory_backend="auto",
        cognee_enabled=False,
        cognee_service_url=None,
        cognee_api_key=None,
        environment="development",
        cognee_default_dataset="memorymesh-agent-work-memory",
        cognee_allow_offline_fallback=True,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def test_backend_router_exposes_explicit_modes():
    store = FakeStore()
    assert CogneeMemoryService(store, settings(), "offline_mirror").backend == "offline_mirror"
    assert CogneeMemoryService(store, settings(), "local_cognee").provider == "Open-source Cognee"
    assert CogneeMemoryService(store, settings(cognee_service_url="https://cloud", cognee_api_key="key"), "cognee_cloud").provider == "Cognee Cloud"


def test_auto_backend_prefers_cloud_in_production_when_api_key_exists_but_url_is_pending():
    store = FakeStore()
    svc = CogneeMemoryService(
        store,
        settings(cognee_enabled=True, cognee_api_key="key", cognee_service_url=None, environment="production"),
    )

    assert svc.backend == "cognee_cloud"


def test_offline_mirror_lifecycle_recall_and_forget():
    async def run():
        store = FakeStore()
        svc = CogneeMemoryService(store, settings(memorymesh_memory_backend="offline_mirror"))
        remembered = await svc.remember(text="Task contract: fix RBAC", dataset="demo", session_id="s1")
        recalled = await svc.recall(query="RBAC", dataset="demo", session_id="s1")
        forgotten = await svc.forget(dataset="demo", session_id="s1")
        recalled_after_forget = await svc.recall(query="RBAC", dataset="demo", session_id="s1")
        return remembered, recalled, forgotten, recalled_after_forget

    remembered, recalled, forgotten, recalled_after_forget = asyncio.run(run())
    assert remembered.backend == "offline_mirror"
    assert "fix RBAC" in recalled.content
    assert forgotten.operation == "forget"
    assert recalled_after_forget.results == []


def test_memory_events_endpoint_returns_sanitised_recent_events():
    async def run():
        store = FakeStore()
        svc = CogneeMemoryService(store, settings(memorymesh_memory_backend="offline_mirror"))
        await svc.remember(
            text="Task contract: investigate support billing delay with private context",
            dataset="local-console",
            session_id="s1",
            metadata={"agent_id": "support"},
        )
        return await cognee_memory_events(
            backend="offline_mirror",
            dataset="local-console",
            session_id="s1",
            svc={"store": store},
        )

    response = asyncio.run(run())

    assert response["count"] == 1
    event = response["events"][0]
    assert event["operation"] == "remember"
    assert event["backend"] == "offline_mirror"
    assert event["text_hash"]
    assert "billing delay" in event["text_preview"]
    assert event["metadata"]["agent_id"] == "support"
