# MemoryMesh MCP Server

Connect MCP-capable agents to MemoryMesh durable work memory.

```json
{
  "mcpServers": {
    "memorymesh": {
      "command": "npx",
      "args": ["-y", "@memorymsh/mcp-server"],
      "env": {
        "MM_API_URL": "http://127.0.0.1:8000/api",
        "MM_API_KEY": "optional-api-key",
        "MM_AGENT_ID": "cursor-primary",
        "MM_PROJECT": "current-repo",
        "MM_MEMORY_BACKEND": "local_cognee"
      }
    }
  }
}
```

## Tools

- `memorymesh_status`
- `memorymesh_start_session`
- `memorymesh_remember`
- `memorymesh_recall`
- `memorymesh_improve`
- `memorymesh_forget`
- `memorymesh_run_agent`
- `memorymesh_session_summary`

The server is a thin MCP wrapper over the MemoryMesh REST API. Memory storage is still handled by MemoryMesh and Cognee.
