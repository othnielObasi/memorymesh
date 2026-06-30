# MemoryMesh PostgreSQL Migration

MemoryMesh now uses PostgreSQL as the durable execution store for the durable execution store.

## Why PostgreSQL

PostgreSQL is easier to run in local Docker, can be moved to AWS RDS for production, and supports JSONB so MemoryMesh can keep flexible execution records without locking the product into a document database.

## Runtime store

The backend uses `services/api/app/db/postgres.py`.

Logical collections such as `agent_runs`, `run_events`, `task_checkpoints`, `execution_traces`, `tool_traces`, `playbook_rules`, and `idempotency_keys` are persisted in one table:

```sql
memorymesh_records(collection, id, data jsonb, created_at, updated_at)
```

Indexes are created automatically on startup for collection, created time, task ID, trace ID, checkpoint ID, status, and idempotency keys.

## Local setup

```bash
docker compose up --build
```

The default local database is:

```env
DATABASE_URL=postgresql://memorymesh:memorymesh@localhost:5432/memorymesh_dev
```

## Production setup

Use a managed PostgreSQL database such as AWS RDS PostgreSQL or Aurora PostgreSQL:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/memorymesh
```

Keep SSL enabled on managed production databases.

## Removed dependencies

The API no longer depends on `motor` or `pymongo`. The new database dependency is:

```txt
asyncpg==0.30.0
```

## Validation

Contract tests were run with:

```bash
PYTHONPATH=services/api pytest -q services/api/tests/test_contracts.py
```

Result: 9 passed.
