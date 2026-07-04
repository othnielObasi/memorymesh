# MemoryMesh User-Facing UI Experience

## Product intent

MemoryMesh is a user-facing workspace for people who rely on long-running AI agents. It should not read like an internal implementation guide, infrastructure console, or hackathon judge checklist.

The user-facing intent is simple:

> Choose an agent, choose where its memory lives, run a work session, recover after context loss, and review the outcome.

The interface must make the product feel usable before it feels technical.

## Opening feeling

When the UI opens, it should project:

> Calm confidence. The workspace is ready, no result has been faked, and the user can start a recoverable agent session.

It should feel like:

- a professional agent workspace
- a product that helps users continue work
- a calm recovery surface for interrupted AI work
- a trustworthy system that waits for evidence before showing outcomes

It should not feel like:

- an internal control plane
- an implementation guide
- a backend debug panel
- a judge-only proof console
- a static success story
- an agentless dashboard

## Primary screen language

Use user-facing labels:

| Internal wording to avoid | User-facing replacement |
|---|---|
| Backend selector | Where memory lives / memory location |
| API status | Service connected / preview mode |
| Proof run | Session / recovery session |
| Dual-backend proof | Compare local and cloud memory |
| Demo agent bench | Agents |
| Template | Next |
| Live wired | Available |
| Cognee lifecycle trace | Memory activity |
| Recovery proof | Recovery summary |
| Patch diff | Change details |
| Test evidence | Outcome evidence |
| Offline mirror fallback | Demo memory / preview memory |

Technical labels such as `remember`, `recall`, `improve`, and `forget` may appear inside the Memory Activity panel because they are part of the product proof, but they should not dominate the page.

## User flow

1. User opens MemoryMesh.
2. User sees available agents.
3. User selects an agent.
4. User chooses the memory location: private local memory, managed cloud memory, or demo memory.
5. User enters or accepts a task.
6. User starts the session.
7. MemoryMesh shows the agent journey.
8. The UI shows the recovery summary, memory activity, and outcome evidence.
9. User may forget this session.
10. User may compare local and cloud memory.

## Current live scope

Build Assistant, Research Assistant, and Support Assistant are currently runnable built-in agents. Build is the objective code/test proof case, Research preserves source-backed findings, and Support preserves ticket-investigation traces and checkpoints. Ops remains a future lane.

## UI acceptance criteria

- The first view must not show completed results before a run.
- The first view must show agents clearly.
- The main CTA must sound like a user action, not a developer test.
- The page must avoid internal terms such as backend, proof console, judge, prize track, wire later, and template in visible UI copy.
- Memory location choices must be understandable to non-infrastructure users.
- The UI can reveal technical evidence after the session runs.
- The final result must feel like a user product, not a README rendered as an app.
