from __future__ import annotations

import inspect
import json
import os
from dataclasses import dataclass
from typing import Any, Literal

import httpx

from app.config import Settings
from app.db.postgres import DESCENDING, PostgresStore
from app.models.schemas import new_id, stable_hash, utc_now

MemoryBackend = Literal["local_cognee", "cognee_cloud", "offline_mirror"]
VALID_BACKENDS = {"local_cognee", "cognee_cloud", "offline_mirror"}


@dataclass(slots=True)
class CogneeOperationResult:
    operation_id: str
    operation: str
    provider: str
    dataset: str
    session_id: str | None
    status: str
    content: str
    results: list[Any]
    fallback_used: bool
    error: str | None = None
    backend: str = "offline_mirror"
    backend_ready: bool = False


@dataclass(slots=True)
class CogneeBackendStatus:
    backend: str
    provider: str
    ready: bool
    mode: str
    service_url_configured: bool
    api_key_configured: bool
    fallback_allowed: bool
    import_error: str | None
    notes: list[str]


class CogneeRestClient:
    """Small Cognee Cloud HTTP client used when the optional SDK is unavailable."""

    def __init__(self, *, base_url: str, api_key: str | None = None, timeout: float = 45.0):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    @property
    def headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["X-Api-Key"] = self.api_key
        return headers

    async def health(self) -> Any:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(f"{self.base_url}/health", headers=self.headers)
            response.raise_for_status()
            return self._json_or_text(response)

    async def auth_probe(self) -> Any:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(f"{self.base_url}/api/v1/datasets/", headers=self.headers)
            response.raise_for_status()
            return self._json_or_text(response)

    async def remember(self, text: str, *, dataset_name: str, session_id: str | None = None) -> Any:
        data = {
            "datasetName": dataset_name,
            "run_in_background": "false",
        }
        if session_id:
            data["session_id"] = session_id
        files = {"data": ("memorymesh-memory.txt", text.encode("utf-8"), "text/plain")}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/remember",
                headers=self.headers,
                data=data,
                files=files,
            )
            response.raise_for_status()
            return self._json_or_text(response)

    async def recall(self, query: str, *, datasets: list[str] | None = None, session_id: str | None = None, top_k: int = 5) -> Any:
        payload: dict[str, Any] = {
            "searchType": "GRAPH_COMPLETION",
            "datasets": datasets or [],
            "query": query,
            "topK": top_k,
            "onlyContext": False,
            "verbose": False,
        }
        if session_id:
            payload["sessionId"] = session_id
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/recall",
                headers={**self.headers, "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            return self._json_or_text(response)

    async def improve(self, *, dataset: str, session_ids: list[str] | None = None) -> Any:
        payload = {
            "extractionTasks": [],
            "enrichmentTasks": [],
            "data": "",
            "datasetName": dataset,
            "nodeName": [],
            "runInBackground": False,
            "buildGlobalContextIndex": False,
            "sessionIds": session_ids or [],
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/improve",
                headers={**self.headers, "Content-Type": "application/json"},
                json=payload,
            )
            if response.status_code == 404:
                fallback_text = (
                    "MemoryMesh improvement note: Cognee Cloud tenant does not expose /api/v1/improve yet. "
                    f"Persist this improvement in graph memory for dataset={dataset}."
                )
                remembered = await self.remember(
                    fallback_text,
                    dataset_name=dataset,
                    session_id=session_ids[0] if session_ids else None,
                )
                return {
                    "memorymesh_operation": "remember_as_improvement",
                    "reason": "remote_improve_endpoint_not_available",
                    "native_operation": "remember",
                    "result": remembered,
                }
            response.raise_for_status()
            return self._json_or_text(response)

    async def forget(self, *, dataset: str, session_id: str | None = None, everything: bool = False) -> Any:
        payload: dict[str, Any] = {
            "everything": everything,
        }
        if not everything:
            payload["dataset"] = dataset
        if session_id:
            payload["sessionId"] = session_id
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/forget",
                headers={**self.headers, "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            return self._json_or_text(response)

    def _json_or_text(self, response: httpx.Response) -> Any:
        try:
            return response.json()
        except ValueError:
            return response.text


class CogneeMemoryService:
    """Dual-mode memory adapter for the Cognee hackathon build.

    MemoryMesh deliberately supports two first-class prize paths:

    * ``local_cognee`` uses the open-source Cognee Python SDK locally/self-hosted.
    * ``cognee_cloud`` calls ``cognee.serve()`` so the same lifecycle methods route
      to Cognee Cloud.

    ``offline_mirror`` is a transparent fallback for demos/tests where Cognee or
    Cloud credentials are unavailable. Responses always expose ``backend`` and
    ``fallback_used`` so judges can see which path powered the memory lifecycle.
    """

    def __init__(self, store: PostgresStore, settings: Settings, backend_override: str | None = None):
        self.store = store
        self.settings = settings
        self.backend_override = backend_override
        self._client: Any | None = None
        self._connected = False
        self._import_error: str | None = None

    @property
    def backend(self) -> MemoryBackend:
        raw = (self.backend_override or getattr(self.settings, "memorymesh_memory_backend", "auto") or "auto").strip().lower()
        aliases = {
            "oss": "local_cognee",
            "open_source": "local_cognee",
            "open-source": "local_cognee",
            "local": "local_cognee",
            "cloud": "cognee_cloud",
            "mirror": "offline_mirror",
            "offline": "offline_mirror",
        }
        raw = aliases.get(raw, raw)
        if raw == "auto":
            if self.settings.cognee_enabled:
                if self.settings.cognee_service_url and self.settings.cognee_api_key:
                    return "cognee_cloud"
                environment = getattr(self.settings, "environment", "")
                if self.settings.cognee_api_key and (os.getenv("VERCEL") or str(environment).lower() in {"production", "preview"}):
                    return "cognee_cloud"
                return "local_cognee"
            return "offline_mirror"
        if raw not in VALID_BACKENDS:
            return "offline_mirror"
        return raw  # type: ignore[return-value]

    @property
    def provider(self) -> str:
        if self.backend == "local_cognee":
            return "Open-source Cognee"
        if self.backend == "cognee_cloud":
            return "Cognee Cloud"
        return "Cognee-compatible offline mirror"

    @property
    def configured(self) -> bool:
        return self.backend in {"local_cognee", "cognee_cloud"}

    @property
    def fallback_allowed(self) -> bool:
        return bool(getattr(self.settings, "cognee_allow_offline_fallback", True))

    def with_backend(self, backend: str | None) -> "CogneeMemoryService":
        return CogneeMemoryService(self.store, self.settings, backend_override=backend)

    async def status(self, *, probe: bool = False) -> CogneeBackendStatus:
        ready = self.backend == "offline_mirror"
        notes: list[str] = []
        if self.backend == "local_cognee":
            notes.append("Uses open-source/self-hosted Cognee. Production deployments should set COGNEE_LOCAL_SERVICE_URL to a private Cognee service.")
            if not self.settings.cognee_local_service_url:
                notes.append("No COGNEE_LOCAL_SERVICE_URL configured; MemoryMesh will try the in-process Cognee SDK if installed and dependency-compatible.")
            if probe:
                client = await self._get_client()
                ready = client is not None
                auth_probe = getattr(client, "auth_probe", None)
                if auth_probe is not None:
                    try:
                        await auth_probe()
                    except Exception as exc:
                        ready = False
                        self._import_error = str(exc)
            else:
                ready = self._client is not None or bool(self.settings.cognee_local_service_url)
        elif self.backend == "cognee_cloud":
            notes.append("Uses Cognee Cloud through the SDK when available, otherwise the Cognee HTTP API.")
            if not (self.settings.cognee_service_url and self.settings.cognee_api_key):
                notes.append("COGNEE_SERVICE_URL and COGNEE_API_KEY are required for live Cloud mode.")
            if probe:
                client = await self._get_client()
                ready = client is not None
                auth_probe = getattr(client, "auth_probe", None)
                if auth_probe is not None:
                    try:
                        await auth_probe()
                    except Exception as exc:  # pragma: no cover - depends on external Cognee Cloud auth.
                        ready = False
                        self._import_error = str(exc)
            else:
                ready = bool(self.settings.cognee_service_url and self.settings.cognee_api_key)
        else:
            notes.append("Offline mirror stores lifecycle events in PostgreSQL only. Use for tests or no-key local preview, not the prize-path demo.")
            ready = True
        return CogneeBackendStatus(
            backend=self.backend,
            provider=self.provider,
            ready=ready,
            mode="cloud" if self.backend == "cognee_cloud" else ("open_source" if self.backend == "local_cognee" else "fallback"),
            service_url_configured=bool(self._service_url_for_backend()),
            api_key_configured=bool(self._api_key_for_backend()),
            fallback_allowed=self.fallback_allowed,
            import_error=self._import_error,
            notes=notes,
        )

    async def remember(self, *, text: str, dataset: str, session_id: str | None = None, metadata: dict[str, Any] | None = None) -> CogneeOperationResult:
        operation_id = new_id("cognee_remember")
        metadata = metadata or {}
        fallback_used, error, status = False, None, "stored"
        results: list[Any] = []
        client = None
        try:
            client = await self._get_client()
            if client is None:
                fallback_used = True
                status = "stored_in_offline_mirror" if self.backend == "offline_mirror" else "stored_with_offline_mirror"
            else:
                raw = await self._call_with_supported_kwargs(
                    client.remember,
                    text,
                    dataset_name=dataset,
                    session_id=session_id,
                )
                results = self._normalise_results(raw)
        except Exception as exc:  # pragma: no cover - depends on external Cognee runtime
            if not self.fallback_allowed:
                raise
            fallback_used = True
            status = "stored_with_offline_mirror"
            error = str(exc)

        await self._persist_event(operation_id=operation_id, operation="remember", dataset=dataset, session_id=session_id, text=text, metadata=metadata, results=results, status=status, fallback_used=fallback_used, error=error)
        return self._result(operation_id, "remember", dataset, session_id, status, text, results, fallback_used, error, client is not None and not fallback_used)

    async def recall(self, *, query: str, dataset: str, session_id: str | None = None, top_k: int = 5, metadata: dict[str, Any] | None = None) -> CogneeOperationResult:
        operation_id = new_id("cognee_recall")
        metadata = metadata or {}
        fallback_used, error, status = False, None, "recalled"
        results: list[Any] = []
        client = None
        try:
            client = await self._get_client()
            if client is None:
                fallback_used = True
                status = "recalled_from_offline_mirror" if self.backend == "offline_mirror" else "recalled_with_offline_mirror"
                results = await self._local_recall(query=query, dataset=dataset, session_id=session_id, top_k=top_k)
            else:
                recall_kwargs = {"datasets": [dataset], "session_id": session_id, "top_k": top_k}
                raw = await self._call_with_supported_kwargs(client.recall, query, **recall_kwargs)
                results = self._normalise_results(raw)
        except Exception as exc:  # pragma: no cover - depends on external Cognee runtime
            if not self.fallback_allowed:
                raise
            fallback_used = True
            status = "recalled_with_offline_mirror"
            error = str(exc)
            results = await self._local_recall(query=query, dataset=dataset, session_id=session_id, top_k=top_k)

        content = "\n".join(str(item) for item in results) if results else "No memory found."
        await self._persist_event(operation_id=operation_id, operation="recall", dataset=dataset, session_id=session_id, text=query, metadata=metadata, results=results, status=status, fallback_used=fallback_used, error=error)
        return self._result(operation_id, "recall", dataset, session_id, status, content, results, fallback_used, error, client is not None and not fallback_used)

    async def improve(self, *, feedback: str, dataset: str, session_id: str | None = None, metadata: dict[str, Any] | None = None) -> CogneeOperationResult:
        operation_id = new_id("cognee_improve")
        metadata = metadata or {}
        fallback_used, error, status = False, None, "improved"
        results: list[Any] = []
        client = None
        try:
            client = await self._get_client()
            if client is None:
                fallback_used = True
                status = "improved_in_offline_mirror" if self.backend == "offline_mirror" else "improved_with_offline_mirror"
            else:
                improve_fn = getattr(client, "improve", None)
                if improve_fn is None:
                    raise RuntimeError("Configured Cognee client does not expose improve().")
                raw = await self._call_with_supported_kwargs(
                    improve_fn,
                    dataset=dataset,
                    session_ids=[session_id] if session_id else None,
                )
                results = self._normalise_results(raw)
                if isinstance(raw, dict) and raw.get("memorymesh_operation") == "remember_as_improvement":
                    status = "improvement_note_stored"
        except Exception as exc:  # pragma: no cover - depends on external Cognee runtime
            if not self.fallback_allowed:
                raise
            fallback_used = True
            status = "improved_with_offline_mirror"
            error = str(exc)

        await self._persist_event(operation_id=operation_id, operation="improve", dataset=dataset, session_id=session_id, text=feedback, metadata=metadata, results=results, status=status, fallback_used=fallback_used, error=error)
        return self._result(operation_id, "improve", dataset, session_id, status, feedback, results, fallback_used, error, client is not None and not fallback_used)

    async def forget(self, *, dataset: str, session_id: str | None = None, everything: bool = False, metadata: dict[str, Any] | None = None) -> CogneeOperationResult:
        operation_id = new_id("cognee_forget")
        metadata = metadata or {}
        fallback_used, error, status = False, None, "forgotten"
        results: list[Any] = []
        client = None
        try:
            client = await self._get_client()
            if client is None:
                fallback_used = True
                status = "forgotten_from_offline_mirror" if self.backend == "offline_mirror" else "forgotten_with_offline_mirror"
            else:
                raw = await self._call_with_supported_kwargs(
                    client.forget,
                    dataset=dataset,
                    dataset_name=dataset,
                    datasetName=dataset,
                    session_id=session_id,
                    everything=everything,
                )
                results = self._normalise_results(raw)
        except Exception as exc:  # pragma: no cover - depends on external Cognee runtime
            if not self.fallback_allowed:
                raise
            fallback_used = True
            status = "forgotten_with_offline_mirror"
            error = str(exc)

        await self._mark_local_memory_forgotten(dataset=dataset, session_id=session_id, everything=everything)
        await self._persist_event(operation_id=operation_id, operation="forget", dataset=dataset, session_id=session_id, text="forget everything" if everything else f"forget dataset={dataset}", metadata=metadata, results=results, status=status, fallback_used=fallback_used, error=error)
        return self._result(operation_id, "forget", dataset, session_id, status, "Memory deleted or pruned.", results, fallback_used, error, client is not None and not fallback_used)

    async def _get_client(self) -> Any | None:
        if self.backend == "offline_mirror":
            return None
        if self._client is not None:
            return self._client
        if self.backend == "local_cognee" and self.settings.cognee_local_service_url:
            self._client = CogneeRestClient(
                base_url=str(self.settings.cognee_local_service_url),
                api_key=self.settings.cognee_local_api_key,
                timeout=float(getattr(self.settings, "llm_timeout_seconds", 45)),
            )
            self._connected = True
            self._import_error = None
            return self._client
        if self.backend == "cognee_cloud" and not (self.settings.cognee_service_url and self.settings.cognee_api_key):
            self._import_error = "Cognee Cloud mode requires COGNEE_SERVICE_URL and COGNEE_API_KEY."
            return None
        if self.backend == "cognee_cloud":
            self._client = CogneeRestClient(
                base_url=str(self.settings.cognee_service_url),
                api_key=str(self.settings.cognee_api_key),
                timeout=float(getattr(self.settings, "llm_timeout_seconds", 45)),
            )
            self._connected = True
            self._import_error = None
            return self._client
        try:
            self._patch_cognee_runtime_compatibility()
            import cognee  # type: ignore
        except Exception as exc:  # pragma: no cover - optional dependency
            self._import_error = self._local_cognee_error_message(exc)
            return None

        self._client = cognee
        return self._client

    def _api_key_for_backend(self) -> str | None:
        if self.backend == "local_cognee":
            return self.settings.cognee_local_api_key
        if self.backend == "cognee_cloud":
            return self.settings.cognee_api_key
        return None

    def _service_url_for_backend(self) -> str | None:
        if self.backend == "local_cognee":
            return self.settings.cognee_local_service_url
        if self.backend == "cognee_cloud":
            return self.settings.cognee_service_url
        return None

    def _patch_cognee_runtime_compatibility(self) -> None:
        try:
            import starlette.status as starlette_status
        except Exception:
            return
        if not hasattr(starlette_status, "HTTP_422_UNPROCESSABLE_CONTENT") and hasattr(starlette_status, "HTTP_422_UNPROCESSABLE_ENTITY"):
            starlette_status.HTTP_422_UNPROCESSABLE_CONTENT = starlette_status.HTTP_422_UNPROCESSABLE_ENTITY

    def _local_cognee_error_message(self, exc: Exception) -> str:
        message = str(exc)
        if "openai.types.responses" in message:
            return (
                f"{message}. Local in-process Cognee requires openai>=2.20 via requirements.local-cognee.txt, "
                "or configure COGNEE_LOCAL_SERVICE_URL to a self-hosted Cognee service."
            )
        if "HTTP_422_UNPROCESSABLE_CONTENT" in message:
            return (
                f"{message}. Local in-process Cognee requires Starlette/FastAPI versions compatible with Cognee, "
                "or configure COGNEE_LOCAL_SERVICE_URL to a self-hosted Cognee service."
            )
        return message

    async def _call_with_supported_kwargs(self, fn: Any, *args: Any, **kwargs: Any) -> Any:
        cleaned = {key: value for key, value in kwargs.items() if value is not None}
        try:
            signature = inspect.signature(fn)
            accepts_var_kwargs = any(p.kind == inspect.Parameter.VAR_KEYWORD for p in signature.parameters.values())
            if not accepts_var_kwargs:
                cleaned = {key: value for key, value in cleaned.items() if key in signature.parameters}
        except (TypeError, ValueError):
            pass
        value = fn(*args, **cleaned)
        if inspect.isawaitable(value):
            return await value
        return value

    def _result(self, operation_id: str, operation: str, dataset: str, session_id: str | None, status: str, content: str, results: list[Any], fallback_used: bool, error: str | None, backend_ready: bool) -> CogneeOperationResult:
        return CogneeOperationResult(operation_id, operation, self.provider, dataset, session_id, status, content, self._jsonable(results), fallback_used, error or self._import_error, self.backend, backend_ready)

    async def _persist_event(self, *, operation_id: str, operation: str, dataset: str, session_id: str | None, text: str, metadata: dict[str, Any], results: list[Any], status: str, fallback_used: bool, error: str | None) -> None:
        await self.store.insert_one(
            "cognee_memory_events",
            {
                "_id": operation_id,
                "operation": operation,
                "provider": self.provider,
                "backend": self.backend,
                "dataset": dataset,
                "session_id": session_id,
                "text": text,
                "text_hash": stable_hash(text),
                "metadata": metadata,
                "results": self._jsonable(results),
                "status": status,
                "fallback_used": fallback_used,
                "error": error or self._import_error,
                "created_at": utc_now(),
            },
        )

    async def _mark_local_memory_forgotten(self, *, dataset: str, session_id: str | None, everything: bool) -> None:
        docs = await self.store.find_many("cognee_memory_events", {} if everything else {"dataset": dataset}, limit=1000)
        for doc in docs:
            if doc.get("operation") not in {"remember", "improve"}:
                continue
            if session_id and doc.get("session_id") not in {None, session_id}:
                continue
            doc["status"] = "forgotten"
            doc["forgotten_at"] = utc_now()
            await self.store.insert_one("cognee_memory_events", doc)

    async def _local_recall(self, *, query: str, dataset: str, session_id: str | None, top_k: int) -> list[str]:
        docs = await self.store.find_many("cognee_memory_events", {"dataset": dataset}, limit=200, sort=[("created_at", DESCENDING)])
        tokens = {token.lower().strip(".,:;()[]{}") for token in query.split() if len(token) > 2}
        scored: list[tuple[int, str]] = []
        for doc in docs:
            if doc.get("operation") not in {"remember", "improve"}:
                continue
            if doc.get("status") == "forgotten":
                continue
            if session_id and doc.get("session_id") not in {None, session_id}:
                continue
            text = str(doc.get("text", ""))
            haystack = f"{text} {json.dumps(doc.get('metadata', {}), default=str)}".lower()
            score = sum(1 for token in tokens if token in haystack)
            if score or not tokens:
                scored.append((score, text))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [text for _, text in scored[:top_k]]

    def _normalise_results(self, raw: Any) -> list[Any]:
        if raw is None:
            return []
        if isinstance(raw, list):
            return raw
        if isinstance(raw, tuple):
            return list(raw)
        return [raw]

    def _jsonable(self, value: Any) -> Any:
        try:
            json.dumps(value, default=str)
            return value
        except TypeError:
            return json.loads(json.dumps(value, default=str))
