import asyncio

from app.config import Settings
from app.services.model_gateway import ModelGatewayRegistry


def test_openai_compatible_gateway_is_available_when_openai_or_aimlapi_key_exists():
    settings = Settings(
        OPENAI_API_KEY="sk-test",
        AIMLAPI_API_KEY="aiml-test",
        DEFAULT_MODEL_GATEWAY="openai",
    )

    registry = ModelGatewayRegistry(settings)
    gateway = registry.get()
    descriptor = next(item for item in registry.descriptors() if item.name == "openai_compatible")

    assert gateway is registry.openai_compatible
    assert descriptor.enabled is True
    assert descriptor.models["primary_provider"] == "openai"
    assert descriptor.models["fallback_provider"] == "aimlapi"


def test_openai_compatible_gateway_returns_local_fallback_without_provider_keys():
    async def run():
        settings = Settings(
            OPENAI_API_KEY="",
            AIMLAPI_API_KEY="",
            DEFAULT_MODEL_GATEWAY="openai",
        )
        gateway = ModelGatewayRegistry(settings).openai_compatible
        return await gateway.chat(system="test", user="summarise the run")

    result = asyncio.run(run())

    assert result.used_fallback is True
    assert result.model == "deterministic-local"
    assert result.attempts[-1].role == "local"
