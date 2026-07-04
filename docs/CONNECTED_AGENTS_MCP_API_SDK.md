# Connected Agents: MCP, API, and SDK

MemoryMesh is designed to work with agents people already use. It is not a replacement for Cursor, Codex, Claude Code, OpenClaw, OpenCode, or internal AI systems. It gives those systems durable memory, recovery state, and receipts through Cognee.

```text
Existing agent
-> MemoryMesh MCP/API/SDK
-> MemoryMesh session and receipt layer
-> local Cognee / Cognee Cloud / offline mirror
```

## Connection Options

| Tool | Best connection | Why it matters |
| --- | --- | --- |
| Cursor-style MCP clients | `@memorymsh/mcp-server` | Recall repo memory before edits and save decisions after edits. |
| Codex wrappers | SDK or MCP | Preserve task context, tool traces, and handoff receipts across runs. |
| Claude Code | Cognee hook plugin or MemoryMesh API/MCP | Add durable local project memory to coding sessions. |
| OpenClaw | Cognee OpenClaw plugin or MemoryMesh API | Add recovery memory to long-running workflows. |
| OpenCode | Cognee OpenCode plugin or MemoryMesh MCP/API | Preserve recalled context and tool outputs across compaction. |
| Custom agent | Python/TypeScript SDK | Integrate support, research, ops, and enterprise agents. |

## User-Facing Choice

The product should expose this as **Connect your agent**:

```text
Agent: Cursor / Codex / Claude Code / OpenClaw / OpenCode / Custom
Connection: MCP server / SDK / REST API
Memory: Private local Cognee / Managed Cognee Cloud / Demo memory
```

## MCP Server

Install:

```bash
npm install -g @memorymsh/mcp-server
```

Or run with `npx` from an MCP client:

```json
{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "https://api-two-blue-75.vercel.app/api",
        "MM_MEMORY_BACKEND": "cognee_cloud",
        "MM_PROJECT": "current-repo",
        "MM_AGENT_ID": "cursor-primary"
      }
    }
  }
}
```

Tools:

| Tool | Purpose |
| --- | --- |
| `memorymesh_status` | Check API and memory backend readiness. |
| `memorymesh_start_session` | Create a task/session identity. |
| `memorymesh_remember` | Save decisions, source trails, failures, constraints, or recovery notes. |
| `memorymesh_recall` | Retrieve relevant memory before planning or acting. |
| `memorymesh_improve` | Turn feedback into future behavior. |
| `memorymesh_forget` | Remove temporary, stale, or sensitive memory. |
| `memorymesh_run_agent` | Run a MemoryMesh reference agent and return a receipt. |
| `memorymesh_session_summary` | Produce compact recovery context for handoff. |

## API Equivalents

```text
GET  /api/memory/status
POST /api/memory/remember
POST /api/memory/recall
POST /api/memory/improve
POST /api/memory/forget
POST /api/agents/run
POST /api/coding-agent/run
POST /api/demo/dual-backend-proof
```

## SDK Equivalents

TypeScript:

```ts
import { MemoryMeshClient } from "@memorymsh/sdk";

const client = new MemoryMeshClient({
  baseUrl: process.env.MEMORYMESH_API_URL!,
  apiKey: process.env.MEMORYMESH_API_KEY,
  defaultMemoryBackend: "cognee_cloud",
});

await client.remember({ text: "Decision to preserve tenant isolation tests.", dataset: "repo-memory" });
const memory = await client.recall({ query: "What auth constraints matter?", dataset: "repo-memory" });
```

Python:

```python
from memorymesh import MemoryMeshClient

client = MemoryMeshClient(
    base_url="https://api-two-blue-75.vercel.app",
    default_memory_backend="cognee_cloud",
)

client.remember(text="Support agent saw recurring billing-delay tickets.", dataset="support-memory")
memory = client.recall(query="What billing issues have recurred?", dataset="support-memory")
```

## Product Rule

Connected agents should feel like a user feature:

> Keep using the AI tool you already use. MemoryMesh gives it durable work memory through Cognee.

Do not present this as only an internal integration guide. The UI should make clear what memory was recalled, what was remembered, what changed, and where the receipt is.
