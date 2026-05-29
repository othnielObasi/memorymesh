# Cognee-Powered Never-Forget Strategy

MemoryMesh is not a Cognee competitor. MemoryMesh is a Cognee-powered product layer that makes persistent agent memory usable, visible, and recoverable for real work.

## One-Line Positioning

> MemoryMesh turns Cognee memory into recoverable agent work sessions.

Cognee provides the memory layer. MemoryMesh provides the user-facing workflow around that memory: run or connect an agent, choose where memory lives, preserve work context, recover after context loss, improve memory from outcomes, and forget stale or sensitive data.

## Hackathon Alignment

The hackathon mission is to build AI that does not forget. MemoryMesh addresses that directly through Cognee's lifecycle:

| Cognee operation | MemoryMesh product behavior |
|---|---|
| `remember()` | Store task contracts, source trails, project facts, tool traces, support-ticket state, decisions, failures, and checkpoints. |
| `recall()` | Restore a recovery brief so an agent can continue after context loss without repeating work. |
| `improve()` / `memify` | Save verified lessons from tests, resolved tickets, user feedback, or completed research. |
| `forget()` | Remove stale, sensitive, contradicted, or session-scoped memory with an explicit user action. |

Primary hackathon category:

- Example #03: Never-Forget Workflows

Secondary categories:

- Example #04: Self-Improving Agents
- Example #05: Support & Customer Memory
- Example #02: Research & Knowledge Copilots

## Product Thesis

Most memory demos show an assistant remembering the user. MemoryMesh shows an agent remembering the work.

Without persistent memory:

- the agent loses the task brief;
- the agent repeats discovery;
- decisions and failed attempts disappear;
- tool traces and checkpoints are not reusable;
- the user has to explain everything again.

With MemoryMesh and Cognee:

- the agent stores the work as it happens;
- the next session recalls a recovery brief;
- the user can inspect what was remembered;
- verified outcomes improve future runs;
- stale or sensitive memory can be forgotten.

## Production Demo Flow

The production proof should be one clear flow:

```text
Choose agent
Choose memory location
Run task
Remember task, evidence, decisions, and checkpoint
Simulate or survive context loss
Recall recovery brief
Continue work
Improve memory from outcome
Show receipt and Context Map
Allow explicit forget
```

The same flow must run against:

- `local_cognee` for the open-source/self-hosted Cognee track;
- `cognee_cloud` for the Cognee Cloud track;
- `offline_mirror` only for clearly labelled demo or fallback mode.

## UI Language

Use user-facing language first:

| Avoid as primary copy | Prefer |
|---|---|
| Knowledge graph dashboard | Context Map |
| Backend selector | Memory location |
| Proof console | Run receipt |
| Graph nodes | Remembered work |
| Raw traces | Memory activity |
| Cognee replacement | Built on Cognee |

Technical terms may appear in inspector/details panels, but the main UI should explain value in work terms.

## Context Map

The graph should be shown as a Context Map: a readable map of work memory, not a raw database visual.

It should show:

- task;
- agent;
- memory location;
- evidence or source trail;
- decisions;
- checkpoint or recovery state;
- outcome;
- improved lesson;
- stale memory removed by forget.

## Acceptance Criteria

- The product copy clearly says MemoryMesh is built on Cognee.
- The UI makes local Cognee and Cognee Cloud visible as memory locations.
- A run shows memory activity for remember, recall, improve, and forget.
- A run produces a human-readable receipt.
- The Context Map explains what the agent remembered and why it matters.
- Fallback mode is labelled honestly and never presented as live Cognee.
- The same workflow works with local/self-hosted Cognee and Cognee Cloud.
- The docs explain why MemoryMesh supports Cognee adoption instead of replacing it.

