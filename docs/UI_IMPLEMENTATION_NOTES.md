# UI Implementation Notes

## Correction applied

The MemoryMesh demo UI was changed from an internal-sounding proof console into a user-facing agent workspace.

The visible experience now follows this product flow:

```text
Choose an agent → choose where memory lives → run a session → recover context → review the outcome → forget the session if needed
```

## What changed in the app

- Replaced “Live Agent Recovery Console” with “Agent work memory.”
- Replaced “backend selector” language with “where memory lives” / “memory location.”
- Replaced “proof run” language with “session.”
- Replaced “demo agent bench” language with “Agents.”
- Replaced “template” and “live wired” labels with “next” and “available.”
- Replaced “test evidence” and “patch diff” with “outcome evidence” and “change details.”
- Kept Cognee lifecycle terms in the Memory Activity panel because they are useful proof, but moved them out of the main product headline.
- Added a task textarea so the screen feels like a real user workspace instead of a fixed internal demo.

## Static-to-live readiness

The static preview is still allowed to run without the API, but it must say “preview mode” and keep outcome areas empty until a session is run. When the API is connected, the same UI calls:

- `GET /api/memory/status`
- `POST /api/coding-agent/run`
- `POST /api/demo/dual-backend-proof`
- `POST /api/memory/forget`

## Product feeling

The desired feeling is calm, serious, and usable:

> This is where a user runs agents whose work should survive context loss.

Not:

> This is an internal backend proof checklist.

## Consolidated workspace update

The latest UI implementation now includes the full product direction discussed in the conversation:

- a clear **Run an agent** path for built-in assistants;
- a clear **Connect your agent** path for Cursor, Codex, Claude Code, OpenClaw, and custom agents;
- MCP/API/SDK connection language that is user-facing rather than implementation-only;
- a project-source selector for the Build Assistant session;
- local/cloud/demo memory locations phrased as where the agent remembers work;
- Build Assistant kept as the real runnable proof case;
- Research, Support, and Ops assistants retained as future user-facing lanes;
- no fake completed evidence before the user runs a session.

The workspace should feel like a product that people can use, not a backend guide. Details are consolidated in `docs/WORKSPACE_AND_UI_BLUEPRINT.md`.
