# Open-source Cognee mode

This is the **Best Use of Open Source** prize path.

MemoryMesh uses the open-source `cognee` Python package locally/self-hosted. The same MemoryMesh lifecycle endpoints call Cognee `remember`, `recall`, `improve`, and `forget`.

## Configure

```bash
cp .env.oss.example .env
```

Important settings:

```env
MEMORYMESH_MEMORY_BACKEND=local_cognee
COGNEE_ENABLED=true
COGNEE_DEFAULT_DATASET=memorymesh-agent-work-memory
COGNEE_ALLOW_OFFLINE_FALLBACK=true
```

Set any LLM/embedding provider keys your local Cognee setup requires.

## Run

```bash
docker compose -f docker-compose.yml -f docker-compose.cognee-local.yml up --build
```

Then:

```bash
./scripts/demo_open_source_cognee.sh
```

## What judges should see

- Backend label: `Open-source Cognee`
- Backend mode: `local_cognee`
- Lifecycle trace: `remember → recall → improve → forget`
- Real agent evidence: tests fail, context is wiped, memory is recalled, code is patched, tests pass
- Offline fallback clearly marked only if Cognee is not installed/configured
