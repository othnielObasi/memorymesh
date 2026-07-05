# MemoryMesh Repository Architecture

MemoryMesh is organised as a clean monorepo so infrastructure and example agents can evolve independently.

## Core infrastructure

- `services/api`: FastAPI service exposing run, event, checkpoint, recovery, memory, and system-status endpoints.
- `packages/sdk-python`: Python client for agent developers.
- `packages/sdk-typescript`: TypeScript client for web/Node agent developers.
- `apps/console`: infrastructure console for operators and judges.

## Example agent

- `examples/ticket-investigation-agent`: reference domain agent showing how to call the SDK/API.
- `apps/coding-agent-demo`: ChatGPT-style UI for the example agent.

## Separation principle

The agent consumes MemoryMesh through SDK/API contracts. It should not depend on private internals of the core runtime service.

## Technical flow

Clients (workspace UI, SDK, MCP, or external agents) call the MemoryMesh API. A backend router selects the memory backend per request, and every operation is recorded in PostgreSQL.

```mermaid
flowchart LR
  UI["Workspace UI (:5173)"] --> API
  SDK["SDK (Python/TS)"] --> API
  MCP["MCP Server"] --> API
  EXT["External agents"] --> API
  API["MemoryMesh API (:8000)"] --> ROUTER{"backend?"}
  ROUTER -->|"offline_mirror"| MIR["Deterministic mirror<br/>no LLM / no Cognee"]
  ROUTER -->|"local_cognee"| LOCAL["cognee-local (:8001)<br/>open-source Cognee + OpenAI LLM"]
  ROUTER -->|"cognee_cloud"| CLOUD["Cognee Cloud API<br/>managed LLM + graph"]
  API --> PG[("PostgreSQL<br/>users, runs, checkpoints, memory events")]
  MIR --> PG
```

### Memory lifecycle

```mermaid
sequenceDiagram
  participant A as Agent / Client
  participant M as MemoryMesh API
  participant C as Cognee local or cloud
  participant P as PostgreSQL
  A->>M: remember(text, dataset, backend)
  M->>C: store + cognify
  M->>P: persist event
  A->>M: recall(query, dataset, backend)
  M->>C: graph-completion search
  C-->>M: results + LLM synthesis
  M-->>A: result (backend, provider, fallback_used)
```

### Backends at a glance

| Mode | Path | LLM | Data location |
|---|---|---|---|
| `offline_mirror` | API → PostgreSQL | none | your DB |
| `local_cognee` | API → `cognee-local` (:8001) → open-source Cognee | your OpenAI key | your infrastructure |
| `cognee_cloud` | API → Cognee Cloud HTTPS API | Cognee-managed | Cognee Cloud (+ event log in your DB) |

Per-mode diagrams are in the [README](../README.md#architecture--memory-mode-flows), [`COGNEE_CLOUD_MODE.md`](COGNEE_CLOUD_MODE.md), and [`OPEN_SOURCE_COGNEE_MODE.md`](OPEN_SOURCE_COGNEE_MODE.md).
