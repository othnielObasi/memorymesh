import asyncio
from pathlib import Path
from types import SimpleNamespace

from app.services.real_coding_agent import MemoryMeshCodingAgentService
from app.models.schemas import new_id


class FakeStore:
    def __init__(self):
        self.docs = []

    async def insert_one(self, collection, doc):
        if "_id" not in doc and "id" not in doc:
            doc["_id"] = new_id("fake")
        self.docs.append((collection, doc))
        return doc.get("_id") or doc.get("id")


class FakeMemoryResult:
    def __init__(self, operation, dataset, session_id, content, results=None):
        self.operation_id = new_id(f"fake_{operation}")
        self.operation = operation
        self.provider = "Fake Cognee"
        self.dataset = dataset
        self.session_id = session_id
        self.status = "ok"
        self.content = content
        self.results = results or []
        self.fallback_used = False
        self.error = None


class FakeCognee:
    configured = True

    async def remember(self, *, text, dataset, session_id=None, metadata=None):
        return FakeMemoryResult("remember", dataset, session_id, text)

    async def recall(self, *, query, dataset, session_id=None, top_k=5, metadata=None):
        return FakeMemoryResult("recall", dataset, session_id, query, ["restore task contract", "patch central dashboard guard", "rerun tests"])

    async def improve(self, *, feedback, dataset, session_id=None, metadata=None):
        return FakeMemoryResult("improve", dataset, session_id, feedback)


def test_real_coding_agent_patches_repo_and_passes_tests(tmp_path):
    service = MemoryMeshCodingAgentService(FakeStore(), FakeCognee(), SimpleNamespace())
    result = asyncio.run(
        service.run(
            task="Fix dashboard RBAC so only admins can access the dashboard.",
            repository_name="pytest-sample-dashboard",
            reset_workspace=True,
            simulate_context_loss=True,
            run_tests=True,
        )
    )

    assert result["agent_type"] == "real_local_coding_agent"
    assert result["tests_before"]["exit_code"] != 0
    assert result["tests_after"]["exit_code"] == 0
    assert result["tests_passed"] is True
    assert "app/dashboard.py" in result["files_changed"]
    patched_file = Path(result["workspace_path"]) / "app" / "dashboard.py"
    assert 'user.get("role") == "admin"' in patched_file.read_text()
