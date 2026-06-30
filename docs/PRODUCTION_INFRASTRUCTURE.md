# Production Infrastructure Notes

MemoryMesh is structured as a production-infrastructure prototype. It is designed to become a durable control plane for long-running agents.

---

## Production Responsibilities

MemoryMesh should own:

- run event storage
- checkpoint persistence
- task version history
- tool trace recording
- recovery status
- execution memory approval
- audit evidence
- SDK/API contracts

MemoryMesh should not own:

- the agent's domain-specific business logic
- the model provider decision
- customer-specific tool implementations
- raw secret storage inside checkpoints

---

## PostgreSQL

PostgreSQL is the durable context engine.

Recommended production collections:

```text
agent_runs
run_events
task_checkpoints
task_versions
execution_traces
tool_traces
retrieval_events
reflection_insights
playbook_rules
idempotency_keys
```

Recommended production additions:

- tenant/workspace ID on every record
- auth-aware indexes
- TTL policies for transient traces
- redaction policies for tool inputs
- encrypted connection string through AWS Secrets Manager

---

## API Runtime

Recommended hosting:

```text
AWS ECS Fargate or EC2
```

Operational requirements:

- `/health` liveness probe
- `/ready` readiness probe
- structured logs
- correlation/request IDs
- idempotency key support
- PostgreSQL connection timeout
- non-root Docker runtime

---

## Frontend Hosting

Recommended hosting:

```text
AWS Amplify or S3 + CloudFront
```

Separate apps:

- `apps/console`: infrastructure console
- `apps/coding-agent-demo`: reference agent UI

Both should point to the same API base URL.

---

## Security Notes

Before production use:

- add authentication and authorization
- protect all run/event/checkpoint endpoints
- add workspace-level isolation
- avoid storing raw PII in checkpoints
- implement retention controls
- sign or hash critical evidence receipts

