# API Reference

Base path: `/api`

## Health and Readiness

### `GET /health`
Returns basic process health.

### `GET /ready`
Returns readiness information for deployment probes.

### `GET /api/system/status`
Returns service, PostgreSQL, collections, AWS metadata, and hackathon theme status.

### `GET /api/partners/status`
Returns Fireworks AI and ElevenLabs configuration status.

---

## Memory Lifecycle (Cognee)

These endpoints run the Cognee memory lifecycle (`remember`, `recall`, `improve`, `forget`). Every request may include an optional `backend` field that selects **where memory lives**:

| `backend` | Meaning | Requires |
|---|---|---|
| `cognee_cloud` | Managed **Cognee Cloud** | `COGNEE_SERVICE_URL` + `COGNEE_API_KEY` (and an LLM key such as `OPENAI_API_KEY`) |
| `local_cognee` | Self-hosted **open-source Cognee** | a running Cognee service at `COGNEE_LOCAL_SERVICE_URL` + an LLM key |
| `offline_mirror` | Keyless deterministic demo/fallback | nothing |
| `auto` (default) | Cloud if cloud creds present, else local if enabled, else offline mirror | — |

If `backend` is omitted, the server default (`MEMORYMESH_MEMORY_BACKEND`) is used. Every response includes `backend`, `provider`, `backend_ready`, `fallback_used`, and `status`, so a client can see exactly which backend served the request and whether it fell back.

### `GET /api/memory/status?backend={backend}&probe={bool}`
Reports readiness of a backend. With `probe=true` it actively checks the backend.

```json
{ "backend": "cognee_cloud", "provider": "Cognee Cloud", "ready": true,
  "mode": "cloud", "service_url_configured": true, "api_key_configured": true,
  "fallback_allowed": false, "import_error": null }
```

### `GET /api/memory/events?backend={backend}&dataset={dataset}&session_id={id}&limit={n}`
Lists persisted memory lifecycle events (audit trail), newest first.

### `POST /api/memory/remember`
Store work memory (task contract, decision, source trail, failure, checkpoint).

```json
{ "backend": "cognee_cloud", "dataset": "repo-memory", "session_id": "auth-refactor",
  "text": "We chose argon2 over bcrypt for password hashing.", "metadata": {} }
```

### `POST /api/memory/recall`
Retrieve relevant memory before planning/acting. Accepts `query`, optional `top_k` (default 5).

```json
{ "backend": "local_cognee", "dataset": "repo-memory", "session_id": "auth-refactor",
  "query": "what hashing algorithm did we choose?", "top_k": 5 }
```

### `POST /api/memory/improve`
Store a verified lesson from feedback/test outcome. Accepts `feedback`.

### `POST /api/memory/forget`
Prune or delete memory. Accepts `dataset`, optional `session_id`, and `everything` (bool).

### Response shape (remember / recall / improve / forget)

```json
{ "operation_id": "cognee_recall_…", "operation": "recall", "provider": "Cognee Cloud",
  "backend": "cognee_cloud", "backend_ready": true, "fallback_used": false,
  "status": "recalled", "dataset": "repo-memory", "session_id": "auth-refactor",
  "content": "…", "results": [ … ], "error": null }
```

### Examples: choose Cloud or Local

```bash
# Cloud (managed Cognee Cloud)
curl -X POST "$API/api/memory/remember" -H 'Content-Type: application/json' \
  -d '{"backend":"cognee_cloud","dataset":"repo-memory","text":"Dashboard RBAC guard lives in the central middleware."}'

curl -X POST "$API/api/memory/recall" -H 'Content-Type: application/json' \
  -d '{"backend":"cognee_cloud","dataset":"repo-memory","query":"where does the RBAC guard live?"}'

# Local (self-hosted open-source Cognee)
curl -X POST "$API/api/memory/remember" -H 'Content-Type: application/json' \
  -d '{"backend":"local_cognee","dataset":"repo-memory","text":"Checkout calls the payment gateway with an idempotency key."}'

curl -X POST "$API/api/memory/recall" -H 'Content-Type: application/json' \
  -d '{"backend":"local_cognee","dataset":"repo-memory","query":"how does checkout call the payment gateway?"}'
```

> Cognee processes (`cognify`) stored text before it is searchable, so a `recall` immediately after `remember` may return partial results until processing completes.

### `POST /api/coding-agent/run`
Runs the real local coding-agent loop (accepts an optional `backend` field like the memory endpoints).

---

## Task Runtime

### `POST /api/tasks/run`
Starts or continues a MemoryMesh-managed agent run.

Request fields include:

```json
{
  "task_description": "Investigate unresolved support tickets",
  "agent_id": "ticket-investigation-agent",
  "dataset_type": "support_tickets",
  "task_version": 1,
  "parent_checkpoint_id": null,
  "simulate_restart": false,
  "task_modification": null,
  "idempotency_key": "optional-stable-key"
}
```

Response includes:

```json
{
  "task_id": "task_xxx",
  "trace_id": "trace_xxx",
  "checkpoint_id": "chk_xxx",
  "task_version": 1,
  "recovery_status": "checkpoint_saved",
  "memory_record_id": "rule_xxx",
  "run_events": []
}
```

### `POST /api/tasks/recover`
Restores a run from a checkpoint and starts a resumed run.

### `POST /api/tasks/{task_id}/modify`
Creates a new task version after the user changes the task scope.

---

## Run Events

### `GET /api/runs/{task_id}/events`
Lists durable run events for a task.

### `POST /api/runs/{task_id}/events`
Records a developer-supplied run event.

---

## Tool Traces

### `POST /api/runs/{task_id}/tool-traces`
Records a tool call, input, output, and validation result.

---

## Checkpoints

### `POST /api/runs/{task_id}/checkpoints`
Saves a checkpoint for the task.

### `GET /api/checkpoints/{checkpoint_id}`
Reads a checkpoint by ID.

### `POST /api/checkpoints/{checkpoint_id}/restore`
Marks a checkpoint as restored and returns checkpoint state.

---

## Execution Memory

### `POST /api/runs/{task_id}/memory/approve`
Approves a reusable execution rule for future runs.

---

## Partner APIs

### `POST /api/ai/plan`
Uses Fireworks AI, when configured, to generate a task plan or operational summary.

### `POST /api/voice/run-summary`
Uses ElevenLabs, when configured, to synthesize a spoken run summary.


---

## Production Runtime Endpoints Added

### Stream run events

```http
GET /api/runs/{task_id}/stream
```

Server-Sent Events stream of runtime events for a running or completed task.

### Execute idempotent action

```http
POST /api/runs/{task_id}/actions/execute
```

Executes or records an action-taking tool through an idempotency key. Repeated requests with the same key return the previously recorded result instead of duplicating work.

### Strict tool trace

```http
POST /api/runs/{task_id}/tool-traces
```

Stores a strict tool trace with input hash, output hash, observed signals, validation result, and Runtime Governor decision.

### Restore checkpoint

```http
POST /api/checkpoints/{checkpoint_id}/restore
```

Returns a resumable state object for an agent framework or custom runner.

The response includes:

- `resume_from`
- `agent_state`
- `safe_to_resume`
- `requires_human_review`
- `task_version`
- `memory_record_id`

