from __future__ import annotations

import hashlib
import math
from typing import List

import numpy as np

from app.config import Settings


class EmbeddingService:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def embed(self, text: str) -> List[float]:
        if self.settings.embedding_provider.lower() == 'truefoundry':
            from app.services.truefoundry_gateway import TrueFoundryGatewayService
            vector = await TrueFoundryGatewayService(self.settings).embed(text)
            if vector:
                return vector
        if self.settings.embedding_provider.lower() == 'openai' and self.settings.openai_api_key:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.settings.openai_api_key)
            result = await client.embeddings.create(model=self.settings.openai_embedding_model, input=text)
            return result.data[0].embedding
        return self._hash_embed(text, self.settings.embedding_dimensions)

    def _hash_embed(self, text: str, dimensions: int) -> List[float]:
        vec = np.zeros(dimensions, dtype=float)
        tokens = [t.lower() for t in text.replace('_', ' ').replace('-', ' ').split() if t.strip()]
        for token in tokens:
            digest = hashlib.sha256(token.encode('utf-8')).digest()
            idx = int.from_bytes(digest[:4], 'big') % dimensions
            sign = 1 if digest[4] % 2 == 0 else -1
            vec[idx] += sign * (1.0 + math.log1p(len(token)))
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.round(6).tolist()


def cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    va = np.array(a, dtype=float)
    vb = np.array(b, dtype=float)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)
