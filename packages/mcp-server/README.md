# MemoryMesh MCP Server

Connect MCP-capable tools such as Cursor-compatible clients, custom agent shells, and local developer assistants to MemoryMesh durable work memory.

The MCP server is a thin bridge. It does not store memory itself. It calls your MemoryMesh API, which then stores and retrieves memory through local Cognee, Cognee Cloud, or the offline mirror fallback.

## Install

Most MCP clients run this package with `npx`:

```bash
npx -y @memorymsh/mcp-server
```

Requirements:

- Node.js 18+
- A running MemoryMesh API
- Optional API key or session token if your API requires auth

## Quick Config

For a local self-hosted MemoryMesh API:

```json
{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "http://127.0.0.1:8000/api",
        "MM_AGENT_ID": "cursor-primary",
        "MM_PROJECT": "current-repo",
        "MM_MEMORY_BACKEND": "local_cognee"
      }
    }
  }
}
```

For a deployed MemoryMesh API using an API key:

```json
{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "https://api-two-blue-75.vercel.app/api",
        "MM_API_KEY": "your-api-key",
        "MM_API_KEY_HEADER": "X-MemoryMesh-API-Key",
        "MM_AGENT_ID": "cursor-primary",
        "MM_PROJECT": "current-repo",
        "MM_MEMORY_BACKEND": "cognee_cloud"
      }
    }
  }
}
```

For a signed user session or bearer-token gateway:

```json
{
  "env": {
    "MM_API_URL": "https://your-memorymesh-api.example.com/api",
    "MM_API_KEY": "your-session-token",
    "MM_API_KEY_HEADER": "Authorization",
    "MM_MEMORY_BACKEND": "cognee_cloud"
  }
}
```

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `MM_API_URL` or `MEMORYMESH_API_URL` | `http://127.0.0.1:8000/api` | Base API path. Include `/api`. |
| `MM_API_KEY` or `MEMORYMESH_API_KEY` | unset | Optional API key or session token. |
| `MM_API_KEY_HEADER` | `X-MemoryMesh-API-Key` | Use `Authorization` for bearer tokens. |
| `MM_AGENT_ID` | `connected-agent` | Stable agent identity written into metadata. |
| `MM_PROJECT` or `MM_DATASET` | `current-project` | Default dataset/project memory namespace. |
| `MM_MEMORY_BACKEND` | `local_cognee` | `local_cognee`, `cognee_cloud`, or `offline_mirror`. |

## Tools

| Tool | Use it when | Key arguments |
| --- | --- | --- |
| `memorymesh_status` | You need to check API and memory backend readiness. | `backend`, `probe` |
| `memorymesh_start_session` | A new agent session begins and needs a stable session id. | `task`, `dataset`, `agent_id` |
| `memorymesh_remember` | The agent discovered a decision, source trail, failure, constraint, or recovery note. | `text`, `dataset`, `session_id`, `backend`, `metadata` |
| `memorymesh_recall` | The agent needs relevant memory before planning or acting. | `query`, `dataset`, `session_id`, `top_k`, `backend` |
| `memorymesh_improve` | Human or run feedback should improve future behavior. | `feedback`, `dataset`, `session_id`, `backend`, `metadata` |
| `memorymesh_forget` | Memory is stale, temporary, sensitive, or should be cleared after a session. | `dataset`, `session_id`, `everything`, `backend` |
| `memorymesh_run_agent` | You want to run a MemoryMesh reference agent and get a receipt. | `task`, `agent_id`, `repository_name`, `workspace_path`, `github_url`, `backend` |
| `memorymesh_session_summary` | A client needs compact recovery context for a project/session. | `dataset`, `session_id`, `query`, `backend` |

## Suggested Agent Workflow

1. Call `memorymesh_status` at startup.
2. Call `memorymesh_start_session` for the task.
3. Call `memorymesh_recall` before planning.
4. Work normally in the coding/research/support tool.
5. Call `memorymesh_remember` after important discoveries, failed attempts, constraints, source trails, or decisions.
6. Call `memorymesh_improve` when a human gives feedback.
7. Call `memorymesh_session_summary` before handing off to another agent.
8. Call `memorymesh_forget` for temporary or sensitive sessions.

## Example Prompts for MCP Clients

After connecting the server, ask your agent:

```text
Before editing, recall MemoryMesh project context for this repository. After each important decision, remember it with source files and reasons. Before final answer, produce a MemoryMesh session summary.
```

For research:

```text
Use MemoryMesh recall before searching. Save every source trail, caveat, and final recommendation to the current project memory.
```

For support or operations:

```text
Record tool traces and checkpoints after each external lookup. Use MemoryMesh improve after the final incident summary.
```

## Memory Modes

| Mode | Backend value | Best for |
| --- | --- | --- |
| Local/self-hosted Cognee | `local_cognee` | Private developer machines, self-hosted teams, regulated environments. |
| Cognee Cloud | `cognee_cloud` | Managed memory with minimal infrastructure work. |
| Demo/offline mirror | `offline_mirror` | Demos, tests, and fallback when Cognee is unavailable. |

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| MCP server starts but tools fail | Confirm `MM_API_URL` includes `/api` and the MemoryMesh API is reachable. |
| `401` | Use `MM_API_KEY_HEADER=Authorization` for bearer/session tokens, or `X-MemoryMesh-API-Key` for API keys. |
| Empty recall results | Use the same `MM_PROJECT`, `dataset`, `session_id`, and backend used by `memorymesh_remember`. |
| Cognee unavailable | Try `MM_MEMORY_BACKEND=offline_mirror` to verify the API path, then fix Cognee config. |
| Client cannot find the package | Run `npm view @memorymsh/mcp-server version` to confirm npm access. |

## Links

- Repository: https://github.com/othnielObasi/memorymesh
- Documentation: https://github.com/othnielObasi/memorymesh/tree/main/docs
- TypeScript SDK: https://www.npmjs.com/package/@memorymsh/sdk
- Python SDK: https://pypi.org/project/memorymesh-sdk/
