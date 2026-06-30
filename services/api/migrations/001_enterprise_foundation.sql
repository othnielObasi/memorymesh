-- MemoryMesh enterprise foundation migration.
-- The runtime uses a JSONB logical collection table for portability while
-- keeping tenant-aware indexes for enterprise separation and search.

CREATE TABLE IF NOT EXISTS memorymesh_records (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, id)
);

CREATE INDEX IF NOT EXISTS idx_ca_records_collection_created ON memorymesh_records (collection, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ca_records_data_gin ON memorymesh_records USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_ca_records_org ON memorymesh_records (collection, (data->>'organisation_id'));
CREATE INDEX IF NOT EXISTS idx_ca_records_workspace ON memorymesh_records (collection, (data->>'workspace_id'));
CREATE INDEX IF NOT EXISTS idx_ca_records_project ON memorymesh_records (collection, (data->>'project_id'));
CREATE INDEX IF NOT EXISTS idx_ca_records_environment ON memorymesh_records (collection, (data->>'environment_id'));
CREATE INDEX IF NOT EXISTS idx_ca_records_task_id ON memorymesh_records (collection, (data->>'task_id'));
CREATE INDEX IF NOT EXISTS idx_ca_records_trace_id ON memorymesh_records (collection, (data->>'trace_id'));
CREATE INDEX IF NOT EXISTS idx_ca_records_checkpoint_id ON memorymesh_records (collection, (data->>'checkpoint_id'));
CREATE INDEX IF NOT EXISTS idx_ca_records_status ON memorymesh_records (collection, (data->>'status'));
CREATE INDEX IF NOT EXISTS idx_ca_records_idempotency ON memorymesh_records (collection, (data->>'idempotency_key'));
CREATE UNIQUE INDEX IF NOT EXISTS uq_ca_api_key_hash ON memorymesh_records ((data->>'key_hash')) WHERE collection = 'api_keys' AND data ? 'key_hash';
CREATE UNIQUE INDEX IF NOT EXISTS uq_ca_action_idempotency ON memorymesh_records ((data->>'workspace_id'), (data->>'idempotency_key')) WHERE collection = 'action_executions' AND data ? 'idempotency_key';
CREATE UNIQUE INDEX IF NOT EXISTS uq_ca_idempotency_keys ON memorymesh_records ((data->>'workspace_id'), (data->>'key')) WHERE collection = 'idempotency_keys' AND data ? 'key';
