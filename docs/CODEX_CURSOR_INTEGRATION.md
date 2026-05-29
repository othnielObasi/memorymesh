# Codex and Cursor Integration

MemoryMesh is not intended to replace Codex, Cursor, Claude Code, or other coding agents. It gives those tools durable project memory and an auditable work receipt.

## Role split

| Tool | Job |
| --- | --- |
| Codex / Cursor | Edit code, inspect files, run commands, refactor, debug. |
| MemoryMesh | Recall project memory before work, store decisions during work, record tests/tool signals, and produce a recovery receipt after work. |
| Cognee | Backing memory engine for local/self-hosted or cloud memory. |

## Local developer flow

1. Start MemoryMesh API with local Cognee.
2. Connect a repo through local folder, GitHub URL, zip upload, or the sample project.
3. Run the coding workflow to create a project profile and handoff receipt.
4. Open the connected project in Codex or Cursor.
5. Give the agent the MemoryMesh handoff: relevant files, test signal, next actions, and memory API calls.
6. After the agent edits code, save the decision, test output, and final proof back to MemoryMesh.

## Cursor

Cursor should use MemoryMesh through MCP when available:

```json
{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymesh/mcp-server"],
      "env": {
        "MM_API_URL": "http://127.0.0.1:8000/api",
        "MM_API_KEY": "mm_local_or_cloud_key",
        "MM_AGENT_ID": "cursor-primary",
        "MM_MEMORY_BACKEND": "local_cognee",
        "MM_PROJECT": "current-repo"
      }
    }
  }
}
```

Expected tools:

- `memorymesh_recall`
- `memorymesh_remember`
- `memorymesh_improve`
- `memorymesh_forget`
- `memorymesh_run_receipt`

## Codex

Codex can use the API path through an `AGENTS.md` instruction file in the project:

```md
# MemoryMesh instructions

Before editing code, recall project memory from:
POST http://127.0.0.1:8000/api/memory/recall

After important decisions, save memory to:
POST http://127.0.0.1:8000/api/memory/remember

At the end of the run, save test output and final proof to:
POST http://127.0.0.1:8000/api/memory/improve
```

The MemoryMesh coding workflow also returns an `agent_handoff` object that can be copied into Codex prompts or project instructions.

## Why this is useful

Without MemoryMesh, every agent run depends on the current prompt and whatever context fits in the tool window.

With MemoryMesh:

- project decisions survive between sessions;
- test failures and fixes become reusable signals;
- different tools can share the same memory;
- interrupted work can resume from a receipt;
- local/self-hosted teams can keep memory private through local Cognee.

