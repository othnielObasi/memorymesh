# Connected Agents: MCP, API, and SDK

MemoryMesh should work with agents people already use. It is not intended to replace Cursor, Codex, Claude Code, OpenClaw, or internal AI systems.

## Supported connection model

```text
Existing agent
-> MemoryMesh MCP/API/SDK
-> MemoryMesh session layer
-> Cognee memory
```

## External tools represented in the workspace

| Tool | Suggested connection | Why it matters |
|---|---|---|
| Cursor | MCP tools | Persist repo/task decisions and recovery summaries across IDE sessions. |
| Codex | API/MCP wrapper | Preserve coding task context across agent runs. |
| Claude Code | Cognee hook plugin or MemoryMesh API | Give local coding sessions durable project memory. |
| OpenClaw | Cognee OpenClaw plugin or MemoryMesh API | Add recovery memory to long-running workflows. |
| OpenCode | Cognee OpenCode plugin or MemoryMesh MCP/API | Preserve tool outputs and recalled context across compaction. |
| Custom agent | SDK/API | Integrate MemoryMesh into internal support, research, ops, and enterprise agents. |

## User-facing tools

The UI should expose these as **Connect your agent**, not as developer-only integration docs.

A user chooses:

```text
Agent to connect: Cursor / Codex / Claude Code / OpenClaw / OpenCode / Custom
Connection method: MCP server / REST API / SDK
Memory location: Private local memory / Managed cloud memory / Demo memory
```

## MCP tools

The `@memorymsh/mcp-server` package exposes these tools:

```text
memorymesh_status
memorymesh_start_session
memorymesh_remember
memorymesh_recall
memorymesh_improve
memorymesh_forget
memorymesh_run_agent
memorymesh_session_summary
```

## API equivalents

The current API already provides the memory lifecycle and runnable demo primitives:

```text
GET  /api/memory/status
POST /api/memory/remember
POST /api/memory/recall
POST /api/memory/improve
POST /api/memory/forget
POST /api/coding-agent/run
POST /api/demo/dual-backend-proof
```

## Product rule

Connected agents should feel like a user feature:

> Keep using the AI tool you already use. MemoryMesh gives it durable work memory through Cognee.

Do not present this as only an internal integration guide.
