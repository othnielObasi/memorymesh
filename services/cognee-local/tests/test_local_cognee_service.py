from fastapi.testclient import TestClient

from cognee_local_service import main as service_module
from cognee_local_service.main import app


def test_health_endpoint():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["provider"] == "open-source-cognee"


def test_dataset_probe_without_api_key_when_not_configured(monkeypatch):
    monkeypatch.delenv("COGNEE_LOCAL_API_KEY", raising=False)
    monkeypatch.delenv("COGNEE_API_KEY", raising=False)
    client = TestClient(app)

    response = client.get("/api/v1/datasets/")

    assert response.status_code == 200
    assert response.json()["service"] == "memorymesh-cognee-local"


def test_dataset_probe_rejects_wrong_api_key(monkeypatch):
    monkeypatch.setenv("COGNEE_LOCAL_API_KEY", "expected-local-key")
    client = TestClient(app)

    response = client.get("/api/v1/datasets/", headers={"X-Api-Key": "wrong"})

    assert response.status_code == 401


def test_dataset_probe_accepts_configured_api_key(monkeypatch):
    monkeypatch.setenv("COGNEE_LOCAL_API_KEY", "expected-local-key")
    client = TestClient(app)

    response = client.get("/api/v1/datasets/", headers={"X-Api-Key": "expected-local-key"})

    assert response.status_code == 200


def test_remember_forwards_memory_payload(monkeypatch):
    monkeypatch.delenv("COGNEE_LOCAL_API_KEY", raising=False)
    monkeypatch.delenv("COGNEE_API_KEY", raising=False)
    calls = {}

    def fake_remember(text, **kwargs):
        calls["text"] = text
        calls["kwargs"] = kwargs
        return {"stored": True}

    monkeypatch.setattr(service_module.cognee, "remember", fake_remember)
    client = TestClient(app)

    response = client.post(
        "/api/v1/remember",
        data={
            "datasetName": "workspace-memory",
            "session_id": "run-123",
            "run_in_background": "true",
        },
        files={"data": ("memory.txt", b"Important project fact", "text/plain")},
    )

    assert response.status_code == 200
    assert response.json() == {"stored": True}
    assert calls == {
        "text": "Important project fact",
        "kwargs": {
            "dataset_name": "workspace-memory",
            "session_id": "run-123",
            "run_in_background": True,
        },
    }


def test_recall_forwards_query_payload(monkeypatch):
    monkeypatch.delenv("COGNEE_LOCAL_API_KEY", raising=False)
    monkeypatch.delenv("COGNEE_API_KEY", raising=False)
    calls = {}

    def fake_recall(query, **kwargs):
        calls["query"] = query
        calls["kwargs"] = kwargs
        return [{"text": "Remembered context"}]

    monkeypatch.setattr(service_module.cognee, "recall", fake_recall)
    client = TestClient(app)

    response = client.post(
        "/api/v1/recall",
        json={
            "query": "What should the agent remember?",
            "datasets": ["workspace-memory"],
            "topK": 3,
            "onlyContext": True,
            "sessionId": "run-123",
            "verbose": True,
        },
    )

    assert response.status_code == 200
    assert response.json() == [{"text": "Remembered context"}]
    assert calls == {
        "query": "What should the agent remember?",
        "kwargs": {
            "datasets": ["workspace-memory"],
            "top_k": 3,
            "only_context": True,
            "session_id": "run-123",
            "verbose": True,
        },
    }
