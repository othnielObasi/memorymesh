# MemoryMesh Enterprise Adoption Architecture

MemoryMesh is no longer positioned as only a hackathon demo. The hackathon integration remains a reference path, but the platform is now structured as enterprise runtime continuity infrastructure for production AI agents.

## Enterprise capability layers

```text
Enterprise agent apps
  ↓
MemoryMesh SDKs / REST API / webhooks
  ↓
MemoryMesh Runtime API
  ↓
Continuity Engine
  ├── Run Manager
  ├── Checkpoint Manager
  ├── Recovery Engine
  ├── Task Versioning
  ├── Idempotency Engine
  ├── Tool Evidence Logger
  ├── Model Attempt Logger
  ├── Execution Memory
  └── Audit Generator
  ↓
Gateway adapters
  ├── Model gateways: Cognee memory, local agents, OpenAI-compatible, Azure, Anthropic, self-hosted
  └── Tool gateways: MCP servers, internal APIs, enterprise SaaS tools
  ↓
PostgreSQL runtime store
```

## Implemented enterprise foundation

- Multi-tenancy: `organisation_id`, `workspace_id`, `project_id`, `environment_id`, `actor_id`.
- API-key authentication: keys are shown once and stored as HMAC-SHA256 hashes.
- RBAC/scopes: owner, admin, developer, operator, auditor, viewer.
- Provider-agnostic model gateway registry: Cognee memory and deterministic local fallback are implemented; additional model/tool adapters can be added behind the same interface.
- Tool registry: tool schemas, permission scopes, gateway metadata, retry/timeout policy, validation policy.
- Background job foundation: database-backed jobs for recovery scans, retries, and worker orchestration.
- Audit logs: tenant-scoped administrative and runtime action logs.
- PostgreSQL JSONB store: durable runtime state with tenant-aware indexes.

## New enterprise endpoints

```text
GET  /api/enterprise/context
POST /api/enterprise/bootstrap
POST /api/enterprise/organisations
POST /api/enterprise/workspaces
GET  /api/enterprise/workspaces
POST /api/enterprise/projects
GET  /api/enterprise/projects
POST /api/enterprise/api-keys
GET  /api/enterprise/api-keys
GET  /api/enterprise/gateways
POST /api/enterprise/gateways
POST /api/enterprise/tools
GET  /api/enterprise/tools
POST /api/enterprise/jobs
GET  /api/enterprise/jobs
GET  /api/enterprise/audit-logs
GET  /api/enterprise/readiness
```

## Auth model

Set `AUTH_REQUIRED=true` in production. Use `/api/enterprise/bootstrap` once to create the first organisation, workspace, project, and owner API key.

Clients can authenticate using either:

```http
X-MemoryMesh-API-Key: ca_...
```

or:

```http
Authorization: Bearer ca_...
```

## Scope model

Common scopes:

```text
runs:read
runs:write
checkpoints:read
checkpoints:write
memory:read
memory:approve
tools:read
tools:execute
gateways:read
gateways:write
audit:read
admin:manage
```

## Enterprise deployment note

The current worker is a database-backed foundation. For high-volume production deployments, replace or extend it with SQS, Temporal, Celery, BullMQ, Kubernetes Jobs, or another enterprise queue while preserving the same `background_jobs` contract.
