from __future__ import annotations

import time
from typing import Any

import httpx

from app.config import Settings
from app.services.truefoundry_gateway import GatewayAttempt, GatewayResult


class OpenAICompatibleGatewayService:
    """OpenAI-compatible gateway for OpenAI and AIMLAPI.

    AIMLAPI exposes an OpenAI-compatible API surface, so MemoryMesh can treat
    OpenAI and AIMLAPI as ordered model routes while keeping the runtime
    provider-agnostic. The deterministic local gateway remains the final
    fallback when no live LLM key is configured.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def enabled(self) -> bool:
        return bool(self.settings.openai_api_key or self.settings.aimlapi_api_key)

    @property
    def configured_models(self) -> dict[str, str]:
        return {
            "primary_provider": self.settings.llm_primary_provider,
            "fallback_provider": self.settings.llm_fallback_provider,
            "openai": self.settings.openai_chat_model,
            "aimlapi": self.settings.aimlapi_model,
            "embedding": self.settings.openai_embedding_model,
        }

    def route_chain(self) -> list[tuple[str, str, str, str | None, str]]:
        providers = [self.settings.llm_primary_provider, self.settings.llm_fallback_provider]
        chain: list[tuple[str, str, str, str | None, str]] = []
        seen: set[str] = set()
        for role, provider in zip(("primary", "fallback"), providers):
            provider_key = (provider or "").strip().lower()
            if not provider_key or provider_key in seen:
                continue
            seen.add(provider_key)
            if provider_key == "openai":
                chain.append((role, "openai", self.settings.openai_base_url, self.settings.openai_api_key, self.settings.openai_chat_model))
            elif provider_key == "aimlapi":
                chain.append((role, "aimlapi", self.settings.aimlapi_base_url, self.settings.aimlapi_api_key, self.settings.aimlapi_model))
        return chain

    async def chat(
        self,
        *,
        system: str,
        user: str,
        max_tokens: int = 700,
        temperature: float = 0.2,
        **_: Any,
    ) -> GatewayResult:
        attempts: list[GatewayAttempt] = []
        for role, provider, base_url, api_key, model in self.route_chain():
            started = time.perf_counter()
            if not api_key:
                attempts.append(GatewayAttempt(model=model, role=role, status="not_configured", latency_ms=0, error=f"{provider} API key is not configured"))
                continue
            try:
                content = await self._chat_once(base_url=base_url, api_key=api_key, model=model, system=system, user=user, max_tokens=max_tokens, temperature=temperature)
                latency_ms = int((time.perf_counter() - started) * 1000)
                attempts.append(GatewayAttempt(model=model, role=role, status="success", latency_ms=latency_ms))
                return GatewayResult(
                    content=content,
                    provider=provider,
                    model=model,
                    used_fallback=role != "primary",
                    attempts=attempts,
                )
            except Exception as exc:  # noqa: BLE001 - attempt details are part of the audit trace.
                latency_ms = int((time.perf_counter() - started) * 1000)
                attempts.append(GatewayAttempt(model=model, role=role, status="failed", latency_ms=latency_ms, error=str(exc)[:500]))

        return GatewayResult(
            content=(
                "MemoryMesh local fallback response: no configured OpenAI-compatible provider completed the request. "
                "Set OPENAI_API_KEY and/or AIMLAPI_API_KEY to enable live LLM routing."
            ),
            provider="local-fallback-after-openai-compatible-errors",
            model="deterministic-local",
            used_fallback=True,
            attempts=attempts + [GatewayAttempt(model="deterministic-local", role="local", status="success", latency_ms=0)],
        )

    async def embed(self, text: str) -> list[float] | None:
        if not self.settings.openai_api_key:
            return None
        base_url = self.settings.openai_base_url.rstrip("/")
        url = f"{base_url}/embeddings"
        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {"model": self.settings.openai_embedding_model, "input": text}
        async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        return data["data"][0]["embedding"]

    async def _chat_once(self, *, base_url: str, api_key: str, model: str, system: str, user: str, max_tokens: int, temperature: float) -> str:
        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
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
        async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        return data["choices"][0]["message"]["content"]
