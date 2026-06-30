# Cognee Cloud mode

This is the **Best Use of Cognee Cloud** prize path.

MemoryMesh calls `cognee.serve()` and then uses the same lifecycle methods against Cognee Cloud.

## Configure

```bash
cp .env.cloud.example .env
```

Required settings:

```env
MEMORYMESH_MEMORY_BACKEND=cognee_cloud
COGNEE_ENABLED=true
COGNEE_SERVICE_URL=https://your-tenant.cognee.ai
COGNEE_API_KEY=your-cognee-cloud-api-key
COGNEE_DEFAULT_DATASET=memorymesh-agent-work-memory
```

## Run

```bash
docker compose up --build
```

Then:

```bash
./scripts/demo_cognee_cloud.sh
```

## What judges should see

- Backend label: `Cognee Cloud`
- Backend mode: `cognee_cloud`
- Cloud status: service URL and API key configured
- Same agent workflow as open-source mode
- Same lifecycle trace: `remember → recall → improve → forget`
- No product/UI change between local and cloud modes
