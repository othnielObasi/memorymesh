# MemoryMesh Python SDK

MemoryMesh gives AI agents durable working memory, inspectable run receipts, checkpoints, and recovery state. The Python SDK is dependency-free by default and works in agent workers, notebooks, internal automation, or backend services.

## Install

```bash
pip install memorymesh-sdk
```

## Quick Start

```python
import os

from memorymesh import MemoryMeshClient

client = MemoryMeshClient(
    base_url="https://api-two-blue-75.vercel.app",
    api_key=os.environ.get("MEMORYMESH_API_KEY"),
    default_memory_backend="cognee_cloud",
)

receipt = client.run_agent(
    agent_id="research",
    task="Compare durable memory options for coding agents.",
)

print(receipt["final_output"])
print(receipt["memory_operations"])
```

## Memory

```python
client.remember(
    text="The build agent should preserve project constraints before editing.",
    dataset="agent-lessons",
)

matches = client.recall(
    query="What should the build agent remember before editing?",
    dataset="agent-lessons",
    top_k=3,
)
```

## Auth

The SDK defaults to the production MemoryMesh API header, `X-MemoryMesh-API-Key`.

```python
client = MemoryMeshClient(
    base_url="https://your-memorymesh-api.example.com",
    api_key=os.environ["MEMORYMESH_API_KEY"],
)
```

For gateways that expect bearer auth:

```python
client = MemoryMeshClient(
    base_url="https://your-memorymesh-api.example.com",
    api_key=os.environ["MEMORYMESH_API_KEY"],
    api_key_header="Authorization",
)
```

## Tool Tracing

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
        validation=lambda args, kwargs, result: {"records": len(result)},
        checkpoint_after=True,
    ),
)
def fetch_tickets(status: str):
    return [{"id": "ticket_1", "status": status}]

fetch_tickets("open")
```

## Error Handling

```python
from memorymesh import MemoryMeshError

try:
    client.memory_status("cognee_cloud", probe=True)
except MemoryMeshError as error:
    print(error.status, error.detail or error.body)
```
