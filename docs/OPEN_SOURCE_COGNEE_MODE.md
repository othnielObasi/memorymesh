# Open-source Cognee mode

This is the **Best Use of Open Source** prize path.

MemoryMesh uses open-source Cognee locally/self-hosted. Production local deployments should run Cognee as a private HTTP service and point MemoryMesh at it with `COGNEE_LOCAL_SERVICE_URL`. For developer-only installs, MemoryMesh can still try the in-process `cognee` Python SDK when compatible dependencies are installed.

## Configure

```bash
cp .env.oss.example .env
```

Important settings:

```env
MEMORYMESH_MEMORY_BACKEND=local_cognee
COGNEE_ENABLED=true
COGNEE_LOCAL_SERVICE_URL=http://host.docker.internal:8001
COGNEE_LOCAL_API_KEY=
COGNEE_DEFAULT_DATASET=memorymesh-agent-work-memory
COGNEE_ALLOW_OFFLINE_FALLBACK=true
```

Use the right URL for where the API is running:

- Docker Compose API -> Cognee on host machine: `http://host.docker.internal:8001`
- API running directly on your machine -> Cognee on the same machine: `http://127.0.0.1:8001`
- API and Cognee on the same Docker network: `http://cognee:8000`

Set any LLM/embedding provider keys your local Cognee setup requires. If `COGNEE_LOCAL_SERVICE_URL` is blank, install `services/api/requirements.local-cognee.txt` and confirm the in-process SDK imports successfully before claiming local Cognee is live.

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
- Local status: `service_url_configured=true` for production local service mode, or a clean SDK probe for developer mode
- Lifecycle trace: `remember -> recall -> improve -> forget`
- Real agent evidence: tests fail, context is wiped, memory is recalled, code is patched, tests pass
- Offline fallback clearly marked only if Cognee is not installed/configured
