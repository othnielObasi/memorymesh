# Code Comments and Maintainability

The repository uses comments and docstrings selectively, where they clarify infrastructure boundaries and non-obvious runtime behaviour.

## Commenting approach

- Runtime lifecycle functions include docstrings because they define the product contract.
- SDK methods are intentionally simple and named after platform operations.
- Example agent code is commented to show how developers should build on MemoryMesh.
- UI code is kept mostly self-describing through component names and data models.

## Important commented areas

- `services/api/app/api.py`
  - run event lifecycle
  - idempotency handling
  - checkpoint persistence
  - recovery and task modification endpoints

- `services/api/app/services/agent_runner.py`
  - governed tool execution
  - pagination/adaptive retrieval behaviour

- `packages/sdk-python/memorymesh/client.py`
  - developer-facing client methods

- `examples/ticket-investigation-agent/agent.py`
  - reference agent integration flow

