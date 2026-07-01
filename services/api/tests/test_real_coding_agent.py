import asyncio
import shutil
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


def test_workspace_path_is_copied_before_agent_writes(tmp_path):
    source = tmp_path / "source"
    shutil.copytree(Path("examples/memorymesh-sample-dashboard-service"), source)
    original_dashboard = source / "app" / "dashboard.py"
    before = original_dashboard.read_text()

    service = MemoryMeshCodingAgentService(
        FakeStore(),
        FakeCognee(),
        SimpleNamespace(memorymesh_allow_any_local_project=True, memorymesh_local_project_roots=""),
    )
    result = asyncio.run(
        service.run(
            task="Fix dashboard RBAC so only admins can access the dashboard.",
            workspace_path=str(source),
            repository_name="copied-local-project",
            reset_workspace=True,
            simulate_context_loss=True,
            run_tests=True,
        )
    )

    assert Path(result["workspace_path"]) != source
    assert original_dashboard.read_text() == before
    patched_file = Path(result["workspace_path"]) / "app" / "dashboard.py"
    assert 'user.get("role") == "admin"' in patched_file.read_text()


def test_arbitrary_repo_creates_profile_and_agent_handoff(tmp_path):
    source = tmp_path / "library"
    package = source / "src" / "sample"
    package.mkdir(parents=True)
    (source / "README.md").write_text("# Sample library\n")
    (source / "pyproject.toml").write_text("[project]\nname = \"sample-library\"\n")
    (package / "__init__.py").write_text("__version__ = '0.1.0'\n")
    (package / "core.py").write_text("def hello():\n    return 'hello'\n")

    service = MemoryMeshCodingAgentService(
        FakeStore(),
        FakeCognee(),
        SimpleNamespace(memorymesh_allow_any_local_project=True, memorymesh_local_project_roots=""),
    )
    result = asyncio.run(
        service.run(
            task="Inspect this repo and create a handoff receipt for Codex",
            workspace_path=str(source),
            repository_name="sample-library",
            reset_workspace=True,
            simulate_context_loss=True,
            run_tests=False,
        )
    )

    assert result["outcome"] == "profiled"
    assert result["project_profile"]["file_count"] == 4
    assert "python" in result["project_profile"]["likely_stack"]
    assert result["agent_handoff"]["for_tools"][:2] == ["Codex", "Cursor"]
    assert result["files_changed"] == []
    assert "Codex/Cursor handoff" in result["final_message"]
