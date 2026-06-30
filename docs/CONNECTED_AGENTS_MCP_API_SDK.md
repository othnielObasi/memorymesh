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
| Claude Code | MCP server | Give local coding sessions durable project memory. |
| OpenClaw | Skill/API | Add recovery memory to long-running workflows. |
| Custom agent | SDK/API | Integrate MemoryMesh into internal support, research, ops, and enterprise agents. |

## User-facing tools

The UI should expose these as **Connect your agent**, not as developer-only integration docs.

A user chooses:

```text
Agent to connect: Cursor / Codex / Claude Code / OpenClaw / Custom
Connection method: MCP server / REST API / SDK
Memory location: Private local memory / Managed cloud memory / Demo memory
```

## Proposed MCP tools

These are the tools MemoryMesh should expose from an MCP server layer:

```text
memorymesh_start_session
memorymesh_remember
memorymesh_recall
memorymesh_checkpoint
memorymesh_recover
memorymesh_improve
memorymesh_forget
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
