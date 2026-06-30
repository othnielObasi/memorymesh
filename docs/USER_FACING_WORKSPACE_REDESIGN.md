# User-Facing Workspace Redesign

MemoryMesh is not an internal implementation guide and not a backend dashboard. The UI is designed as a simple workspace where a user can run or connect an AI agent whose work should survive context loss.

## Product feeling

The first impression should be:

> I can start an agent session here, choose where the agent remembers the work, and recover the session if context is lost.

The UI should feel calm, modern, sleek, and functional. It should avoid heavy card grids, prize-track wording, proof-console language, and backend-first labels.

## Primary user journey

1. Choose whether to run a built-in agent or connect an existing agent.
2. Choose an agent.
3. Enter the task.
4. Choose the project/source.
5. Choose where memory lives: Local Memory, Cloud Memory, or Demo Memory.
6. Start the session.
7. Watch the session progress.
8. Review memory activity, recovery summary, and outcome.
9. Teach or forget the session memory.

## UI structure

The workspace uses one clear screen:

- Header: product name, Run / Connect switch, memory status.
- Hero: one-line product purpose.
- Workspace grid:
  - Agent rail on the left.
  - Session setup in the center.
  - Memory location on the right.
- Session progress strip.
- Results grid:
  - Memory activity.
  - Recovery summary.
  - Outcome.

## Built-in and connected agents

MemoryMesh supports two usage modes:

- Run an agent: use a built-in assistant directly in the workspace.
- Connect your agent: keep using Cursor, Codex, Claude Code, OpenClaw, or a custom agent through MCP, REST API, or SDK.

The Build Assistant is the live hackathon proof case. Research, Support, and Ops are shown as future lanes without pretending they are currently active.

## Memory locations

User-facing labels are used instead of backend terms:

- Local Memory: open-source/self-hosted Cognee.
- Cloud Memory: Cognee Cloud.
- Demo Memory: preview-only fallback.

The UI says “Where should this agent remember?” rather than “backend selector.”

## Static preview and live app boundary

The static preview is interactive for design review. If the MemoryMesh API is not reachable, clicking Start shows clearly marked preview data. When the API is running, the same screen populates with real agent output and Cognee memory operations.

