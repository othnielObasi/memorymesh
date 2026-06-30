from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Iterable, List, Optional

import httpx

from app.config import Settings


@dataclass
class GatewayAttempt:
    model: str
    role: str
    status: str
    latency_ms: int
    error: Optional[str] = None


@dataclass
class GatewayResult:
    content: str
    provider: str
    model: str
    used_fallback: bool
    attempts: List[GatewayAttempt]


class TrueFoundryGatewayService:
    """OpenAI-compatible adapter for optional gateway AI Gateway.

    This optional adapter supports OpenAI-compatible model gateway usage. It keeps
    MemoryMesh independent from any single model by routing all planning/reporting
    prompts through the gateway, while preserving deterministic local fallbacks for
    offline development and tests.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def enabled(self) -> bool:
        return bool(self.settings.truefoundry_base_url and self.settings.truefoundry_api_key)

    @property
    def configured_models(self) -> dict[str, str]:
        return {
            "cheap": self.settings.truefoundry_cheap_model,
            "primary": self.settings.truefoundry_model,
            "fallback": self.settings.truefoundry_fallback_model,
            "strong": self.settings.truefoundry_strong_model,
            "embedding": self.settings.truefoundry_embedding_model,
        }

    def model_chain(self, prefer_strong: bool = False, cheap_first: bool = False) -> list[tuple[str, str]]:
        if cheap_first:
            candidates = [
                ("cheap", self.settings.truefoundry_cheap_model),
                ("primary", self.settings.truefoundry_model),
                ("fallback", self.settings.truefoundry_fallback_model),
            ]
        elif prefer_strong:
            candidates = [
                ("strong", self.settings.truefoundry_strong_model),
                ("primary", self.settings.truefoundry_model),
                ("fallback", self.settings.truefoundry_fallback_model),
                ("cheap", self.settings.truefoundry_cheap_model),
            ]
        else:
            candidates = [
                ("primary", self.settings.truefoundry_model),
                ("fallback", self.settings.truefoundry_fallback_model),
                ("cheap", self.settings.truefoundry_cheap_model),
            ]
        seen: set[str] = set()
        chain: list[tuple[str, str]] = []
        for role, model in candidates:
            if model and model not in seen:
                chain.append((role, model))
                seen.add(model)
        return chain

    async def chat(
        self,
        *,
        system: str,
        user: str,
        prefer_strong: bool = False,
        cheap_first: bool = False,
        max_tokens: int = 700,
        temperature: float = 0.2,
        force_fail_primary: bool = False,
    ) -> GatewayResult:
        fallback = self._local_response(user=user, prefer_strong=prefer_strong)
        if not self.enabled:
            return GatewayResult(
                content=fallback,
                provider="local-fallback",
                model="deterministic-local",
                used_fallback=True,
                attempts=[GatewayAttempt(model="deterministic-local", role="local", status="success", latency_ms=0)],
            )

        attempts: list[GatewayAttempt] = []
        chain = self.model_chain(prefer_strong=prefer_strong, cheap_first=cheap_first)
        for index, (role, model) in enumerate(chain):
            started = time.perf_counter()
            if force_fail_primary and index == 0:
                latency_ms = int((time.perf_counter() - started) * 1000)
                attempts.append(GatewayAttempt(model=model, role=role, status="simulated_failure", latency_ms=latency_ms, error="Intentional primary model failure for resilience demo."))
                continue
            try:
                content = await self._chat_once(model=model, system=system, user=user, max_tokens=max_tokens, temperature=temperature)
                latency_ms = int((time.perf_counter() - started) * 1000)
                attempts.append(GatewayAttempt(model=model, role=role, status="success", latency_ms=latency_ms))
                return GatewayResult(
                    content=content,
                    provider="Optional model gateway",
                    model=model,
                    used_fallback=len([a for a in attempts if a.status != "success"]) > 0 or role not in {"primary", "strong"},
                    attempts=attempts,
                )
            except Exception as exc:  # noqa: BLE001 - error is stored in the recovery trace.
                latency_ms = int((time.perf_counter() - started) * 1000)
                attempts.append(GatewayAttempt(model=model, role=role, status="failed", latency_ms=latency_ms, error=str(exc)[:500]))

        return GatewayResult(
            content=fallback,
            provider="local-fallback-after-gateway-errors",
            model="deterministic-local",
            used_fallback=True,
            attempts=attempts + [GatewayAttempt(model="deterministic-local", role="local", status="success", latency_ms=0)],
        )

    async def embed(self, text: str) -> list[float] | None:
        if not self.enabled or not self.settings.truefoundry_embedding_model:
            return None
        base_url = self.settings.truefoundry_base_url.rstrip("/")
        url = f"{base_url}/embeddings"
        headers = {
            "Authorization": f"Bearer {self.settings.truefoundry_api_key}",
            "Content-Type": "application/json",
        }
        payload = {"model": self.settings.truefoundry_embedding_model, "input": text}
        async with httpx.AsyncClient(timeout=self.settings.truefoundry_timeout_seconds) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        return data["data"][0]["embedding"]

    async def _chat_once(self, *, model: str, system: str, user: str, max_tokens: int, temperature: float) -> str:
        base_url = self.settings.truefoundry_base_url.rstrip("/")
        url = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.truefoundry_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=self.settings.truefoundry_timeout_seconds) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        return data["choices"][0]["message"]["content"]

    def _local_response(self, *, user: str, prefer_strong: bool = False) -> str:
        if "final recovery report" in user.lower() or prefer_strong:
            return (
                "Recovery report: the run was restored from the last safe checkpoint, "
                "failed model/tool attempts were preserved in the timeline, fallback routing was used, "
                "and the final answer was produced only after validation signals confirmed the workflow could continue safely."
            )
        return (
            "1. Confirm the task goal and completion condition.\n"
            "2. Plan the tool sequence before execution.\n"
            "3. Save a durable PostgreSQL checkpoint after each safe boundary.\n"
            "4. Route model calls through the configured optional model gateway.\n"
            "5. Restore from checkpoint after failure and produce an auditable recovery report."
        )

    def attempts_as_dicts(self, attempts: Iterable[GatewayAttempt]) -> list[dict[str, Any]]:
        return [attempt.__dict__ for attempt in attempts]
