# MemoryMesh Python SDK

MemoryMesh gives AI agents durable work memory: the decisions they made, the tools they used, the evidence they found, the checkpoints they can resume from, and the final receipt a human can inspect.

Use this SDK when a Python worker, notebook, backend service, or agent framework needs to talk to a MemoryMesh API deployment.

## What You Can Build

- Run a built-in MemoryMesh agent and receive an inspectable receipt.
- Store and recall Cognee-backed memory across sessions.
- Record tool traces, validations, checkpoints, and recovery state.
- Wrap custom Python tools so every important action is auditable.
- Support three memory modes: local Cognee, Cognee Cloud, and offline mirror/demo mode.

## Install

```bash
pip install memorymesh-sdk
```

The SDK is dependency-free by default. It uses Python's standard HTTP libraries and works with Python 3.10+.

## Choose a Memory Mode

| Mode | Backend value | Best for |
| --- | --- | --- |
| Local/self-hosted Cognee | `local_cognee` | Private developer machines, self-hosted teams, regulated environments. |
| Cognee Cloud | `cognee_cloud` | Managed memory with minimal infrastructure work. |
| Demo/offline mirror | `offline_mirror` | Demos, tests, and fallback when Cognee is unavailable. |

## Connect to MemoryMesh

```python
import os

from memorymesh import MemoryMeshClient

client = MemoryMeshClient(
    base_url=os.environ.get("MEMORYMESH_API_URL", "http://149.28.238.73:8000"),
    api_key=os.environ.get("MEMORYMESH_API_KEY"),
    default_memory_backend="cognee_cloud",
)
```

For a signed user session or a gateway that expects bearer auth:

```python
client = MemoryMeshClient(
    base_url="https://your-memorymesh-api.example.com",
    api_key=os.environ["MEMORYMESH_SESSION_TOKEN"],
    api_key_header="Authorization",
)
```

For an API-key deployment, keep the default `X-MemoryMesh-API-Key` header:

```python
client = MemoryMeshClient(
    base_url="https://your-memorymesh-api.example.com",
    api_key=os.environ["MEMORYMESH_API_KEY"],
)
```

## Verify the Runtime

```python
print(client.health())
print(client.memory_status("cognee_cloud", probe=True))
```

If Cognee Cloud is configured, `memory_status` should report `ready: true`. If fallback is enabled, `offline_mirror` remains available for demos and tests.

## Run an Agent and Inspect the Receipt

```python
receipt = client.run_agent(
    agent_id="research",
    task="Compare durable memory options for coding agents.",
    backend="cognee_cloud",
)

print(receipt["run_id"])
print(receipt["status"])
print(receipt["final_output"])
print(receipt["receipt_ref"])

for source in receipt.get("evidence", []):
    print(source)

for op in receipt.get("memory_operations", []):
    print(op.get("operation"), op.get("backend"), op.get("status"))
```

Agent ids currently used by the reference runtime:

| Agent | Purpose |
| --- | --- |
| `build` | Code/project work with checkpoints, test traces, and handoff receipts. |
| `research` | Source-backed investigation with memory and reusable findings. |
| `support` | Ticket/support investigation with tool traces and recovery state. |

The response is both a flat receipt and, on newer APIs, includes `receipt` and `receipt_ref` for clients that prefer an explicit receipt envelope.

## Remember, Recall, Improve, Forget

```python
session_id = "pricing-research-2026-07"

client.remember(
    text="The research agent found that pricing pages changed after the July launch.",
    dataset="gtm-intelligence",
    session_id=session_id,
    metadata={"source": "pricing_monitor", "confidence": 0.86},
)

matches = client.recall(
    query="What changed on pricing pages?",
    dataset="gtm-intelligence",
    session_id=session_id,
    top_k=3,
)

client.improve_memory(
    feedback="Future GTM research should compare pricing claims against saved baseline evidence.",
    dataset="gtm-intelligence",
    session_id=session_id,
)

# Use carefully in production.
client.forget_memory(dataset="gtm-intelligence", session_id=session_id)
```

## Tool Tracing and Checkpoints

Wrap any Python function used by an agent. MemoryMesh records the input, output, validation signals, and an optional checkpoint.

```python
from memorymesh import MemoryMeshClient, ToolWrapperConfig, trace_tool

client = MemoryMeshClient("http://localhost:8000")

run = client.start_run(
    agent_id="support-agent",
    task="Investigate payment failures.",
)

@trace_tool(
    client,
    run["task_id"],
    ToolWrapperConfig(
        tool_name="fetch_tickets",
        tool_type="read",
        checkpoint_after=True,
        validation=lambda args, kwargs, result: {"records": len(result)},
        observed_signals=lambda args, kwargs, result: {"has_high_priority": any(t["priority"] == "high" for t in result)},
    ),
)
def fetch_tickets(status: str):
    return [{"id": "ticket_1", "status": status, "priority": "high"}]

tickets = fetch_tickets("open")
```

For external actions such as sending email, filing a ticket, or changing infrastructure, pass a stable `idempotency_key` so the server can prevent duplicate side effects.

## Recover a Run

```python
checkpoint = client.save_checkpoint(
    task_id=run["task_id"],
    checkpoint_name="after_ticket_fetch",
    state={"ticket_count": len(tickets)},
    resume_state={"current_step": "summarise_tickets"},
)

restored = client.restore_checkpoint(checkpoint["checkpoint_id"])
print(restored)
```

## Framework Adapters

The package also exports adapters for common agent runtimes:

```python
from memorymesh import (
    MemoryMeshCrewAIAdapter,
    MemoryMeshLangGraphAdapter,
    MemoryMeshCheckpointer,
    MemoryMeshOpenAIAgentsMiddleware,
)
```

Use the framework adapters when you already have an agent runtime. Use `trace_tool` when you want the smallest dependency-free integration.

## Error Handling

```python
from memorymesh import MemoryMeshError

try:
    client.memory_status("cognee_cloud", probe=True)
except MemoryMeshError as error:
    print("status:", error.status)
    print("detail:", error.detail or error.body)
```

## Production Checklist

- Set `MEMORYMESH_API_URL` to your deployed API.
- Use `Authorization` for signed user sessions or `X-MemoryMesh-API-Key` for API-key deployments.
- Pick the memory backend intentionally: `local_cognee`, `cognee_cloud`, or `offline_mirror`.
- Store evidence and source URLs in metadata so receipts are auditable.
- Use checkpoints before long or risky tool sequences.
- Use idempotency keys for write/external actions.
- Call `forget_memory` for temporary, sensitive, or stale sessions.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `401` | Use the correct header: `Authorization` for session tokens, `X-MemoryMesh-API-Key` for API keys. |
| Cognee status not ready | Check `COGNEE_SERVICE_URL`, `COGNEE_API_KEY`, and whether fallback is enabled. |
| Empty recall results | Use the same `dataset`, `session_id`, and backend used by `remember`. |
| Duplicate external action | Add a stable idempotency key to action/tool execution. |
| Receipt is missing expected evidence | Ensure tools are wrapped or evidence is passed into memory metadata. |

## Links

- Repository: https://github.com/othnielObasi/memorymesh
- Documentation: https://github.com/othnielObasi/memorymesh/tree/main/docs
- Live API used in examples: http://149.28.238.73:8000
