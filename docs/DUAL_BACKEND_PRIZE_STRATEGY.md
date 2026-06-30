# Dual-backend prize strategy

MemoryMesh should not be presented as two separate projects. It is one product with two first-class Cognee deployment paths.

```text
MemoryMesh agent workflow
        ↓
Memory backend router
        ↓
 ┌────────────────────┬────────────────────┐
 │ local_cognee       │ cognee_cloud       │
 │ Open-source Cognee │ Cognee Cloud       │
 └────────────────────┴────────────────────┘
```

## Why this is strong

For **Best Use of Open Source**, MemoryMesh proves a cloneable/self-hosted agent memory layer.

For **Best Use of Cognee Cloud**, MemoryMesh proves the same product can run with managed persistent memory.

The judge sees one real workflow:

1. Agent inspects a repo.
2. Tests fail.
3. MemoryMesh stores work memory through Cognee.
4. Context is wiped.
5. MemoryMesh recalls recovery context.
6. Agent patches code.
7. Tests pass.
8. MemoryMesh improves future recovery.
9. MemoryMesh can forget session memory.

Then the backend switch shows the same lifecycle on open-source Cognee and Cognee Cloud.

## Demo command

```bash
python scripts/run_hackathon_demo.py --dual
```

## UI proof

The coding-agent UI includes a backend selector:

- Open-source Cognee
- Cognee Cloud
- Offline mirror

The offline mirror is intentionally labelled as fallback only.
