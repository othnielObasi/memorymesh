from __future__ import annotations

import inspect
import os
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field


def _patch_starlette_for_cognee() -> None:
    import starlette.status as starlette_status

    if not hasattr(starlette_status, "HTTP_422_UNPROCESSABLE_CONTENT") and hasattr(
        starlette_status, "HTTP_422_UNPROCESSABLE_ENTITY"
    ):
        starlette_status.HTTP_422_UNPROCESSABLE_CONTENT = starlette_status.HTTP_422_UNPROCESSABLE_ENTITY


def _ensure_runtime_dirs() -> None:
    for key in (
        "DATA_ROOT_DIRECTORY",
        "SYSTEM_ROOT_DIRECTORY",
        "CACHE_ROOT_DIRECTORY",
        "COGNEE_LOGS_DIR",
    ):
        value = os.getenv(key)
        if value:
            Path(value).mkdir(parents=True, exist_ok=True)


_patch_starlette_for_cognee()
_ensure_runtime_dirs()
import cognee  # type: ignore  # noqa: E402


app = FastAPI(title="MemoryMesh Local Cognee Service", version="0.1.0")


class RecallRequest(BaseModel):
    searchType: str | None = None
    datasets: list[str] = Field(default_factory=list)
    query: str
    topK: int = 5
    onlyContext: bool = False
    verbose: bool = False
    sessionId: str | None = None


class ImproveRequest(BaseModel):
    datasetName: str
    sessionIds: list[str] = Field(default_factory=list)
    runInBackground: bool = False
    buildGlobalContextIndex: bool = False
    nodeName: list[str] | None = None


class ForgetRequest(BaseModel):
    dataset: str | None = None
    sessionId: str | None = None
    everything: bool = False


def _configured_api_key() -> str | None:
    return os.getenv("COGNEE_LOCAL_API_KEY") or None


async def _require_api_key(x_api_key: str | None = Header(default=None, alias="X-Api-Key")) -> None:
    expected = _configured_api_key()
    if expected and x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid local Cognee API key")


async def _maybe_await(value: Any) -> Any:
    if inspect.isawaitable(value):
        return await value
    return value


def _clean(value: Any) -> Any:
    try:
        return jsonable_encoder(_safe_value(value))
    except Exception as exc:
        return {"status": "accepted", "raw_type": type(value).__name__, "serialization_error": str(exc)}


def _safe_value(value: Any, *, depth: int = 0) -> Any:
    if depth > 6:
        return repr(value)
    if value is None or isinstance(value, str | int | float | bool):
        return value
    if inspect.isawaitable(value):
        return {"awaitable": type(value).__name__}
    if is_dataclass(value):
        return _safe_value(asdict(value), depth=depth + 1)
    if isinstance(value, dict):
        return {str(key): _safe_value(item, depth=depth + 1) for key, item in value.items()}
    if isinstance(value, list | tuple | set):
        return [_safe_value(item, depth=depth + 1) for item in value]
    if hasattr(value, "model_dump"):
        return _safe_value(value.model_dump(), depth=depth + 1)
    if hasattr(value, "__dict__"):
        return _safe_value(vars(value), depth=depth + 1)
    return repr(value)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "provider": "open-source-cognee",
        "service": "memorymesh-cognee-local",
    }


@app.get("/api/v1/datasets/")
async def datasets(_: None = Depends(_require_api_key)) -> dict[str, Any]:
    # MemoryMesh uses this endpoint as a lightweight auth/probe check.
    return {"datasets": [], "service": "memorymesh-cognee-local"}


@app.post("/api/v1/remember")
async def remember(
    datasetName: str = Form(default="memorymesh-agent-work-memory"),
    run_in_background: str = Form(default="false"),
    session_id: str | None = Form(default=None),
    data: UploadFile = File(...),
    _: None = Depends(_require_api_key),
) -> Any:
    raw = await data.read()
    text = raw.decode("utf-8", errors="replace")
    result = await _maybe_await(
        cognee.remember(
            text,
            dataset_name=datasetName,
            session_id=session_id,
            run_in_background=run_in_background.lower() == "true",
        )
    )
    return _clean(result)


@app.post("/api/v1/recall")
async def recall(payload: RecallRequest, _: None = Depends(_require_api_key)) -> Any:
    result = await _maybe_await(
        cognee.recall(
            payload.query,
            datasets=payload.datasets,
            top_k=payload.topK,
            only_context=payload.onlyContext,
            session_id=payload.sessionId,
            verbose=payload.verbose,
        )
    )
    return _clean(result)


@app.post("/api/v1/improve")
async def improve(payload: ImproveRequest, _: None = Depends(_require_api_key)) -> Any:
    result = await _maybe_await(
        cognee.improve(
            dataset=payload.datasetName,
            session_ids=payload.sessionIds,
            run_in_background=payload.runInBackground,
            build_global_context_index=payload.buildGlobalContextIndex,
            node_name=payload.nodeName,
        )
    )
    return _clean(result)


@app.post("/api/v1/forget")
async def forget(payload: ForgetRequest, _: None = Depends(_require_api_key)) -> Any:
    result = await _maybe_await(
        cognee.forget(
            dataset=payload.dataset,
            everything=payload.everything,
        )
    )
    return _clean(result)
