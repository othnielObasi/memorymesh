from __future__ import annotations

import inspect
import json
from dataclasses import dataclass
from typing import Any, Literal

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
                return "cognee_cloud" if (self.settings.cognee_service_url and self.settings.cognee_api_key) else "local_cognee"
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
            notes.append("Uses the open-source Cognee SDK locally/self-hosted. No Cognee Cloud key is required.")
            if probe:
                ready = await self._get_client() is not None
            else:
                ready = self._client is not None or self.settings.cognee_enabled or self.backend_override == "local_cognee"
        elif self.backend == "cognee_cloud":
            notes.append("Uses cognee.serve() so remember/recall/improve/forget route to Cognee Cloud.")
            if not (self.settings.cognee_service_url and self.settings.cognee_api_key):
                notes.append("COGNEE_SERVICE_URL and COGNEE_API_KEY are required for live Cloud mode.")
            if probe:
                ready = await self._get_client() is not None
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
            service_url_configured=bool(self.settings.cognee_service_url),
            api_key_configured=bool(self.settings.cognee_api_key),
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
                await self._call_with_supported_kwargs(
                    client.remember,
                    text,
                    dataset_name=dataset,
                    datasetName=dataset,
                    dataset=dataset,
                    session_id=session_id,
                    metadata=metadata,
                )
        except Exception as exc:  # pragma: no cover - depends on external Cognee runtime
            if not self.fallback_allowed:
                raise
            fallback_used = True
            status = "stored_with_offline_mirror"
            error = str(exc)

        await self._persist_event(operation_id=operation_id, operation="remember", dataset=dataset, session_id=session_id, text=text, metadata=metadata, results=results, status=status, fallback_used=fallback_used, error=error)
        return self._result(operation_id, "remember", dataset, session_id, status, text, results, fallback_used, error, client is not None)

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
                raw = await self._call_with_supported_kwargs(
                    client.recall,
                    query,
                    dataset_name=dataset,
                    datasetName=dataset,
                    dataset=dataset,
                    session_id=session_id,
                    top_k=top_k,
                )
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
        return self._result(operation_id, "recall", dataset, session_id, status, content, results, fallback_used, error, client is not None)

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
                await self._call_with_supported_kwargs(
                    improve_fn,
                    feedback,
                    dataset_name=dataset,
                    datasetName=dataset,
                    dataset=dataset,
                    session_id=session_id,
                    feedback=feedback,
                    metadata=metadata,
                )
        except Exception as exc:  # pragma: no cover - depends on external Cognee runtime
            if not self.fallback_allowed:
                raise
            fallback_used = True
            status = "improved_with_offline_mirror"
            error = str(exc)

        await self._persist_event(operation_id=operation_id, operation="improve", dataset=dataset, session_id=session_id, text=feedback, metadata=metadata, results=results, status=status, fallback_used=fallback_used, error=error)
        return self._result(operation_id, "improve", dataset, session_id, status, feedback, results, fallback_used, error, client is not None)

    async def forget(self, *, dataset: str, session_id: str | None = None, everything: bool = False, metadata: dict[str, Any] | None = None) -> CogneeOperationResult:
        operation_id = new_id("cognee_forget")
        metadata = metadata or {}
        fallback_used, error, status = False, None, "forgotten"
        client = None
        try:
            client = await self._get_client()
            if client is None:
                fallback_used = True
                status = "forgotten_from_offline_mirror" if self.backend == "offline_mirror" else "forgotten_with_offline_mirror"
            else:
                await self._call_with_supported_kwargs(
                    client.forget,
                    dataset=dataset,
                    dataset_name=dataset,
                    datasetName=dataset,
                    session_id=session_id,
                    everything=everything,
                )
        except Exception as exc:  # pragma: no cover - depends on external Cognee runtime
            if not self.fallback_allowed:
                raise
            fallback_used = True
            status = "forgotten_with_offline_mirror"
            error = str(exc)

        await self._mark_local_memory_forgotten(dataset=dataset, session_id=session_id, everything=everything)
        await self._persist_event(operation_id=operation_id, operation="forget", dataset=dataset, session_id=session_id, text="forget everything" if everything else f"forget dataset={dataset}", metadata=metadata, results=[], status=status, fallback_used=fallback_used, error=error)
        return self._result(operation_id, "forget", dataset, session_id, status, "Memory deleted or pruned.", [], fallback_used, error, client is not None)

    async def _get_client(self) -> Any | None:
        if self.backend == "offline_mirror":
            return None
        if self._client is not None:
            return self._client
        if self.backend == "cognee_cloud" and not (self.settings.cognee_service_url and self.settings.cognee_api_key):
            self._import_error = "Cognee Cloud mode requires COGNEE_SERVICE_URL and COGNEE_API_KEY."
            return None
        try:
            import cognee  # type: ignore
        except Exception as exc:  # pragma: no cover - optional dependency
            self._import_error = str(exc)
            return None

        if self.backend == "cognee_cloud":
            serve = getattr(cognee, "serve", None)
            if serve is None:
                self._import_error = "Installed Cognee package does not expose cognee.serve()."
                return None
            client = await self._call_with_supported_kwargs(serve, url=self.settings.cognee_service_url, api_key=self.settings.cognee_api_key)
            self._client = client or cognee
            self._connected = True
            return self._client

        self._client = cognee
        return self._client

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
