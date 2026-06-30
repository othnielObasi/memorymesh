from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from app.config import Settings
from app.services.openai_compatible_gateway import OpenAICompatibleGatewayService
from app.services.truefoundry_gateway import TrueFoundryGatewayService, GatewayResult
from app.services.google_gateway import GoogleGeminiGatewayService


@dataclass
class ModelGatewayDescriptor:
    name: str
    provider: str
    enabled: bool
    models: dict[str, str]
    capabilities: list[str]


class ModelGateway(Protocol):
    @property
    def enabled(self) -> bool: ...
    @property
    def configured_models(self) -> dict[str, str]: ...
    async def chat(self, **kwargs: Any) -> GatewayResult: ...
    async def embed(self, text: str) -> list[float] | None: ...


class DeterministicLocalGateway:
    @property
    def enabled(self) -> bool:
        return True

    @property
    def configured_models(self) -> dict[str, str]:
        return {"primary": "local-deterministic", "fallback": "local-deterministic"}

    async def chat(self, **kwargs: Any) -> GatewayResult:
        user = kwargs.get("user", "")
        return GatewayResult(
            content=(
                "MemoryMesh local gateway response: the agent plan was generated deterministically for offline development. "
                "Configure TRUEFOUNDRY_BASE_URL and TRUEFOUNDRY_API_KEY or another provider adapter for live model calls.\n\n"
                f"Task context: {user[:500]}"
            ),
            provider="local-deterministic-gateway",
            model="local-deterministic",
            used_fallback=False,
            attempts=[],
        )

    async def embed(self, text: str) -> list[float] | None:
        return None


class ModelGatewayRegistry:
    """Provider-agnostic gateway registry.

    The provider adapter is optional for production deployments; the
    MemoryMesh runtime calls this registry so enterprise deployments can add
    managed model-direct, Azure OpenAI, OpenAI-compatible, Anthropic, or self-hosted
    adapters without changing the run/recovery model.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self.truefoundry = TrueFoundryGatewayService(settings)
        self.openai_compatible = OpenAICompatibleGatewayService(settings)
        self.google = GoogleGeminiGatewayService(settings)
        self.local = DeterministicLocalGateway()

    def get(self, preferred: str | None = None) -> ModelGateway:
        provider = (preferred or self.settings.default_model_gateway).lower()
        if provider in {"openai", "aimlapi", "openai_compatible", "openai-compatible"} and self.openai_compatible.enabled:
            return self.openai_compatible
        if provider == "truefoundry" and self.truefoundry.enabled:
            return self.truefoundry
        if provider in {"google", "gemini", "vertex"} and self.google.enabled:
            return self.google
        return self.local

    def descriptors(self) -> list[ModelGatewayDescriptor]:
        return [
            ModelGatewayDescriptor(
                name="openai_compatible",
                provider="OpenAI + AIMLAPI compatible gateway",
                enabled=self.openai_compatible.enabled,
                models=self.openai_compatible.configured_models,
                capabilities=["chat", "fallback", "embedding", "openai_compatible"],
            ),
            ModelGatewayDescriptor(
                name="truefoundry",
                provider="Optional model gateway",
                enabled=self.truefoundry.enabled,
                models=self.truefoundry.configured_models,
                capabilities=["chat", "fallback", "embedding", "gateway_observability"],
            ),
            ModelGatewayDescriptor(
                name="google",
                provider="Google Gemini / Vertex AI reference gateway",
                enabled=self.google.enabled,
                models=self.google.configured_models,
                capabilities=["chat", "fallback", "embedding", "adk_reference", "agent_engine_reference"],
            ),
            ModelGatewayDescriptor(
                name="local",
                provider="Deterministic local development gateway",
                enabled=True,
                models=self.local.configured_models,
                capabilities=["chat", "offline_tests"],
            ),
        ]
