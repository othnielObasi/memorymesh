# Open-source Cognee mode

This is the **Best Use of Open Source** prize path.

MemoryMesh uses open-source Cognee locally/self-hosted. The recommended local
deployment runs Cognee as a private HTTP service and points MemoryMesh at it with
`COGNEE_LOCAL_SERVICE_URL`. This avoids bundling Cognee into the main API
serverless runtime and keeps memory infrastructure independently scalable.

## Configure

```bash
cp .env.oss.example .env
```

Important settings:

```env
MEMORYMESH_MEMORY_BACKEND=local_cognee
COGNEE_ENABLED=true
COGNEE_LOCAL_SERVICE_URL=http://cognee-local:8000
COGNEE_LOCAL_API_KEY=
COGNEE_DEFAULT_DATASET=memorymesh-agent-work-memory
COGNEE_ALLOW_OFFLINE_FALLBACK=true
```

Use the right URL for where the API is running:

- Docker Compose API -> bundled `cognee-local` service: `http://cognee-local:8000`
- Host machine -> Docker Cognee service for manual checks: `http://127.0.0.1:8001`
- Docker Compose API -> Cognee on host machine: `http://host.docker.internal:8001`
- API running directly on your machine -> Cognee on the same machine: `http://127.0.0.1:8001`

Set any LLM/embedding provider keys your local Cognee setup requires. In Docker,
the override passes `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_CHAT_MODEL`,
`EMBEDDING_PROVIDER`, and optional `COGNEE_LOCAL_API_KEY` into `cognee-local`.

## Run

```bash
docker compose -f docker-compose.yml -f docker-compose.cognee-local.yml up --build
```

Then:

```bash
curl http://127.0.0.1:8001/health
curl "http://127.0.0.1:8000/api/memory/status?backend=local_cognee&probe=true"
./scripts/demo_open_source_cognee.sh
```

## What judges should see

- Backend label: `Open-source Cognee`
- Backend mode: `local_cognee`
- Local status: `service_url_configured=true`
- Lifecycle trace: `remember -> recall -> improve -> forget`
- Real agent evidence: tests fail, context is wiped, memory is recalled, code is patched, tests pass
- Offline fallback clearly marked only if Cognee is not installed/configured
