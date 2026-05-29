# Cognee vs MemoryMesh

Cognee and MemoryMesh should be described as complementary, not competing.

MemoryMesh should always be presented as built with Cognee, not as an alternative memory engine.

## Cognee

Cognee is the memory infrastructure. It provides hybrid graph-vector memory and lifecycle operations such as remember, recall, improve, and forget.

## MemoryMesh

MemoryMesh is the user-facing workspace and connection layer built on Cognee. It turns persistent memory into recoverable agent work sessions with receipts, Context Maps, memory activity, and explicit controls for local, cloud, and demo memory.

## Difference in one line

> Cognee gives agents memory. MemoryMesh turns that memory into work sessions people can run, recover, improve, inspect, and forget.

## Why people would not just use Cognee directly

Developers can build directly on Cognee. MemoryMesh exists for teams that want the product/workflow layer already packaged:

- choose or connect an agent;
- start a work session;
- choose local or cloud memory;
- save task/evidence/decision/failure memory;
- recover after context loss;
- show human-readable recovery summaries;
- show a Context Map of remembered work;
- review outcome evidence;
- teach or forget memory.

## How MemoryMesh supports Cognee

MemoryMesh is a product layer that makes Cognee easier to understand, demo, and adopt:

- it gives non-infrastructure users a workspace for Cognee-backed memory;
- it shows local Cognee and Cognee Cloud as practical memory locations;
- it exposes the Cognee lifecycle through user-facing session receipts;
- it brings existing agents into the Cognee memory model through MCP, API, and SDK paths;
- it keeps Cognee visible as the memory engine instead of hiding or replacing it.

## Hackathon positioning

MemoryMesh is strongest as a Cognee-powered **Never-Forget Workflow** product:

```text
choose agent -> choose memory location -> run work -> remember -> lose context -> recall -> continue -> improve -> receipt -> optional forget
```

This makes Cognee's memory lifecycle concrete for coding, research, support, and operations agents.

## Product positioning

MemoryMesh should never be framed as replacing Cognee. Use:

> MemoryMesh is a Cognee-powered workspace and connection layer for AI agents that need durable work memory.
