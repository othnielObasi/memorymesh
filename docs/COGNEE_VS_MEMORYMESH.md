# Cognee vs MemoryMesh

Cognee and MemoryMesh should be described as complementary, not competing.

## Cognee

Cognee is the memory infrastructure. It provides graph/vector memory and lifecycle operations such as remember, recall, improve, and forget.

## MemoryMesh

MemoryMesh is the user-facing workspace and connection layer built on Cognee. It turns persistent memory into recoverable agent work sessions.

## Difference in one line

> Cognee gives agents memory. MemoryMesh turns that memory into usable work sessions people can run, recover, improve, and forget.

## Why people would not just use Cognee directly

Developers can build directly on Cognee. MemoryMesh exists for teams that want the product/workflow layer already packaged:

- choose or connect an agent;
- start a work session;
- choose local or cloud memory;
- save task/evidence/decision/failure memory;
- recover after context loss;
- show human-readable recovery summaries;
- review outcome evidence;
- teach or forget memory.

## How MemoryMesh supports Cognee

MemoryMesh is a product layer that makes Cognee easier to understand, demo, and adopt:

- it gives non-infrastructure users a workspace for Cognee-backed memory;
- it shows local Cognee and Cognee Cloud as practical memory locations;
- it exposes the Cognee lifecycle through user-facing session receipts;
- it brings existing agents into the Cognee memory model through MCP, API, and SDK paths;
- it keeps Cognee visible as the memory engine instead of hiding or replacing it.

## Product positioning

MemoryMesh should never be framed as replacing Cognee. Use:

> MemoryMesh is a Cognee-powered workspace and connection layer for AI agents that need durable work memory.
