from __future__ import annotations

import base64
from typing import Optional

import httpx

from app.config import Settings


class ElevenLabsService:
    """Voice summary adapter for multimodal run feedback.

    If ELEVENLABS_API_KEY is absent, the endpoint returns an enabled=false
    response instead of failing, which keeps local development deterministic.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def enabled(self) -> bool:
        return bool(self.settings.elevenlabs_api_key)

    async def synthesize(self, text: str, voice_id: Optional[str] = None) -> tuple[Optional[str], str]:
        selected_voice = voice_id or self.settings.elevenlabs_voice_id
        if not self.enabled:
            return None, "ElevenLabs is not configured. Set ELEVENLABS_API_KEY to enable voice summaries."

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{selected_voice}"
        payload = {
            "text": text,
            "model_id": self.settings.elevenlabs_model_id,
            "voice_settings": {"stability": 0.45, "similarity_boost": 0.75},
        }
        headers = {"xi-api-key": self.settings.elevenlabs_api_key, "Accept": "audio/mpeg"}
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
        return base64.b64encode(response.content).decode("ascii"), "Voice summary generated."
