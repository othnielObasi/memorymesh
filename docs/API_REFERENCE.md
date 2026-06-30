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

