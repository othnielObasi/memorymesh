import asyncio
from types import SimpleNamespace

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
