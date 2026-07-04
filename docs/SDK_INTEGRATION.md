# SDK Integration

MemoryMesh ships SDKs and an MCP server so teams can add durable work memory to agents they already use. The SDKs are not just HTTP wrappers. They expose the product loop:

```text
connect -> run/trace -> remember -> recall -> checkpoint -> recover -> receipt
```

Published packages:

| Package | Registry | Use when |
| --- | --- | --- |
| `@memorymsh/sdk` | npm | Node.js apps, browser UIs, TypeScript workers, custom agent runtimes. |
| `memorymesh-sdk` | PyPI | Python workers, notebooks, backend jobs, LangGraph/CrewAI/OpenAI Agents-style integrations. |
| `@memorymsh/mcp-server` | npm | MCP-capable clients that should recall and save MemoryMesh context without custom code. |

## Memory Backends

Every integration should make the memory backend explicit.

| Backend | Meaning |
| --- | --- |
| `local_cognee` | Self-hosted/local Cognee service. Use for private developer or enterprise deployments. |
| `cognee_cloud` | Managed Cognee Cloud. Use when teams want zero memory infrastructure. |
| `offline_mirror` | PostgreSQL-backed fallback for demos/tests and Cognee downtime. |

## Auth Model

The SDKs support both MemoryMesh API-key deployments and signed user-session deployments.

| Credential style | Header |
| --- | --- |
| API key | `X-MemoryMesh-API-Key` |
| Signed session / bearer token | `Authorization: Bearer <token>` |

TypeScript:

```ts
const client = new MemoryMeshClient({
  baseUrl: process.env.MEMORYMESH_API_URL!,
  apiKey: process.env.MEMORYMESH_SESSION_TOKEN,
  apiKeyHeader: "Authorization",
});
```

Python:

```python
client = MemoryMeshClient(
    base_url=os.environ["MEMORYMESH_API_URL"],
    api_key=os.environ["MEMORYMESH_SESSION_TOKEN"],
    api_key_header="Authorization",
)
```

## TypeScript Quick Start

```ts
import { MemoryMeshClient } from "@memorymsh/sdk";

const client = new MemoryMeshClient({
  baseUrl: process.env.MEMORYMESH_API_URL ?? "https://api-two-blue-75.vercel.app",
  apiKey: process.env.MEMORYMESH_API_KEY,
  defaultMemoryBackend: "cognee_cloud",
});

const receipt = await client.runAgent({
  agentId: "research",
  task: "Compare durable memory options for coding agents.",
  backend: "cognee_cloud",
});

console.log(receipt.run_id);
console.log(receipt.final_output);
console.log(receipt.receipt_ref);
```

## Python Quick Start

```python
import os

from memorymesh import MemoryMeshClient

client = MemoryMeshClient(
    base_url=os.environ.get("MEMORYMESH_API_URL", "https://api-two-blue-75.vercel.app"),
    api_key=os.environ.get("MEMORYMESH_API_KEY"),
    default_memory_backend="cognee_cloud",
)

receipt = client.run_agent(
    agent_id="support",
    task="Investigate high-priority unresolved tickets.",
    backend="cognee_cloud",
)

print(receipt["run_id"])
print(receipt["final_output"])
print(receipt["receipt_ref"])
```

## Memory Lifecycle

Use the same dataset, session id, and backend across `remember`, `recall`, `improve`, and `forget`.

```ts
await client.remember({
  text: "The build agent must preserve test contracts before editing auth code.",
  dataset: "engineering-lessons",
  sessionId: "auth-work-001",
});

const memory = await client.recall({
  query: "What should the build agent remember before editing auth code?",
  dataset: "engineering-lessons",
  sessionId: "auth-work-001",
  topK: 3,
});

await client.improveMemory({
  feedback: "Future auth tasks should verify tenant isolation and idempotency tests first.",
  dataset: "engineering-lessons",
  sessionId: "auth-work-001",
});
```

## Tool Traces and Checkpoints

Tool traces answer: what did the agent do, with what input, what output, and what validation?

Checkpoints answer: where can the agent safely resume after interruption?

```python
run = client.start_run(agent_id="claims-agent", task="Investigate claim documents")

client.record_tool_trace(
    run["task_id"],
    tool="fetch_documents",
    input={"query": "claim evidence"},
    output={"records": 120},
    observed_signals={"complete": True},
    validation={"passed": True},
)

checkpoint = client.save_checkpoint(
    run["task_id"],
    checkpoint_name="retrieval-complete",
    state={"records_seen": 120},
    resume_state={"current_step": "summarise", "validated_records": 120},
)
```

## Framework Adapters

Implemented adapters:

- Python LangGraph adapter: `MemoryMeshLangGraphAdapter`
- Python CrewAI adapter: `MemoryMeshCrewAIAdapter`
- Python OpenAI Agents SDK-style middleware: `MemoryMeshOpenAIAgentsMiddleware`
- Python generic tool wrapper: `trace_tool`
- npm LangGraph adapter: `MemoryMeshLangGraphAdapter`
- npm CrewAI adapter: `MemoryMeshCrewAIAdapter`
- npm OpenAI Agents SDK-style middleware: `MemoryMeshOpenAIAgentsMiddleware`
- npm generic tool wrapper: `wrapTool`

Use adapters when a framework owns the agent lifecycle. Use `trace_tool` or `wrapTool` when you want the smallest custom integration.

## MCP Server

For MCP-capable clients:

```json
{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "https://api-two-blue-75.vercel.app/api",
        "MM_MEMORY_BACKEND": "cognee_cloud",
        "MM_PROJECT": "current-repo"
      }
    }
  }
}
```

The MCP server exposes status, session creation, remember, recall, improve, forget, run-agent, and session-summary tools.

## Adoption Checklist

1. Start with `memory_status(..., probe=True)` or `memoryStatus(..., true)`.
2. Choose the memory backend intentionally.
3. Use one dataset per product/project/domain.
4. Use session ids for task-scoped memory.
5. Wrap important tools so traces and checkpoints are recorded.
6. Use idempotency keys for write/external actions.
7. Return or store the run receipt for audit and handoff.
8. Forget temporary or sensitive sessions when the job is complete.
