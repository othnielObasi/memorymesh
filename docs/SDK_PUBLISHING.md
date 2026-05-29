# Publishable SDK Plan

MemoryMesh ships two first-class SDKs:

- TypeScript: `@memorymsh/sdk`
- Python distribution: `memorymesh-sdk` with Python import package `memorymesh`

Both SDKs expose the same product loop:

1. Connect to the MemoryMesh API.
2. Run a production agent and receive an inspectable receipt.
3. Store and recall durable memory through local/self-hosted Cognee or Cognee Cloud.
4. Record tool traces, checkpoints, idempotent actions, and recovery state.
5. Handle API failures with structured SDK errors.

## Release Readiness

Before publishing either SDK:

```bash
npm --workspace @memorymesh/sdk run build
python -m compileall packages/sdk-python/memorymesh
```

Recommended package checks:

```bash
npm --workspace @memorymesh/sdk pack --dry-run
cd packages/sdk-python
python -m build
twine check dist/*
```

## TypeScript API

```ts
import { MemoryMeshClient } from "@memorymsh/sdk";

const client = new MemoryMeshClient({
  baseUrl: process.env.MEMORYMESH_API_URL!,
  apiKey: process.env.MEMORYMESH_API_KEY,
  defaultMemoryBackend: "cognee_cloud",
});

const receipt = await client.runAgent({
  agentId: "build",
  task: "Inspect the repository and create a safe implementation plan.",
  githubUrl: "https://github.com/example/app",
});
```

## Python API

```python
import os

from memorymesh import MemoryMeshClient

client = MemoryMeshClient(
    base_url=os.environ["MEMORYMESH_API_URL"],
    api_key=os.environ.get("MEMORYMESH_API_KEY"),
    default_memory_backend="cognee_cloud",
)

receipt = client.run_agent(
    agent_id="support",
    task="Investigate high-priority unresolved tickets.",
)
```

## Auth Compatibility

The SDKs default to `X-MemoryMesh-API-Key`, which matches the enterprise API. They also support `Authorization: Bearer` for gateway deployments:

```ts
new MemoryMeshClient({ baseUrl, apiKey, apiKeyHeader: "Authorization" });
```

```python
MemoryMeshClient(base_url, api_key=api_key, api_key_header="Authorization")
```

## Versioning

Use semantic versioning:

- Patch: docs, metadata, bug fixes with no API change.
- Minor: new endpoints, new optional fields, new adapters.
- Major: constructor changes, removed endpoints, changed receipt shape.

The initial release should stay at `0.x` until the public API settles.
