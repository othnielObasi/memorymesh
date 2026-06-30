# MemoryMesh real coding-agent demo

The demo is intentionally small, but it is real. It uses the local filesystem and test runner rather than a scripted chat-only flow.

## Demo flow

1. Create a fresh workspace from `examples/memorymesh-sample-dashboard-service`.
2. Inspect repository files.
3. Read relevant app and test files.
4. Run tests and observe the RBAC failure.
5. Store task contract, repo map, decision, and failure signal in Cognee.
6. Save a durable checkpoint.
7. Simulate context loss.
8. Recall memory from Cognee.
9. Patch `app/dashboard.py`.
10. Write `docs/RBAC_DECISION.md`.
11. Rerun tests.
12. Improve memory using the outcome.

## Endpoint

```http
POST /api/coding-agent/run
```

Payload:

```json
{
  "task": "Fix dashboard RBAC so only admins can access the dashboard.",
  "repository_name": "sample-dashboard-service",
  "reset_workspace": true,
  "simulate_context_loss": true,
  "run_tests": true
}
```

The endpoint returns a full evidence object with `tool_trace`, `tests_before`, `tests_after`, `files_changed`, Cognee `remembered`, `recalled`, and `improved` operations.
