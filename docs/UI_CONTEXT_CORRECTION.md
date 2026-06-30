# UI Context Correction

The UI had drifted in two ways:

1. It became too static and appeared to claim completed results before a run.
2. After correction, it became too internal and sounded like an implementation/proof console.

The corrected direction is a user-facing MemoryMesh workspace.

## Correct product intent

MemoryMesh is where users run AI agents whose work should survive context loss.

The screen should answer user questions:

- Which agent do I want to run?
- What task should it work on?
- Where should its memory live?
- What happened during the session?
- What was restored after context loss?
- Was the outcome verified?
- Can I forget this session?

## Agent visibility

Agents must remain visible. The product should not look like an empty infrastructure dashboard.

Current UI lanes:

- Build Assistant — runnable demo assistant.
- Research Assistant — next user-facing lane.
- Support Assistant — next user-facing lane.

## Language correction

The UI now avoids visible internal wording such as backend selector, proof console, judge action, template, prize path, and live-wired.

It uses product language such as agent, session, memory location, recovery summary, memory activity, outcome evidence, and change details.

## Second correction: not only built-in agents

The UI must not imply MemoryMesh only runs its own agents. MemoryMesh also needs a connected-agent path because many users already work in Cursor, Codex, Claude Code, OpenClaw, or internal AI systems.

The corrected product shape is:

```text
Run an agent       -> built-in MemoryMesh assistants
Connect your agent -> external AI tools using MCP/API/SDK
```

The Build Assistant remains the live proof case, but connected-agent support must be visible in the workspace so MemoryMesh is understood as a session/memory layer that can wrap existing AI systems.
