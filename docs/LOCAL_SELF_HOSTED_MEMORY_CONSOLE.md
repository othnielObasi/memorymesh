# Local/Self-Hosted Memory Console

MemoryMesh local mode is a developer-first UI and API layer on top of open-source Cognee. It is not meant to duplicate a generic Cognee admin UI. Its job is to make Cognee-backed work memory understandable, inspectable, recoverable, and safe for people running agents against real projects.

## Product Role

```text
Cognee local runtime = memory engine
MemoryMesh local console = product layer for agent work memory
```

Cognee stores and retrieves memory. MemoryMesh explains what that memory means inside an agent session:

- what the agent remembered;
- what was recalled and why;
- what changed after feedback;
- what can be recovered after context loss;
- what can be forgotten or exported.

## Users

The local console is primarily for:

- developers using Codex, Cursor, Claude Code, OpenClaw, or internal agents;
- teams working with private source code or sensitive operational data;
- companies that need data residency or self-hosted AI infrastructure;
- judges/evaluators who need a concrete proof that MemoryMesh works without Cognee Cloud.

## Modes

| UI Mode | Backend | Purpose | Current Expected Behavior |
|---|---|---|---|
| Private local memory | `local_cognee` | Open-source/self-hosted Cognee on user infrastructure. | Calls local Cognee SDK when available; records MemoryMesh audit events. |
| Cloud memory | `cognee_cloud` | Managed Cognee Cloud. | Requires `COGNEE_SERVICE_URL` and `COGNEE_API_KEY`; otherwise marked not ready. |
| Demo memory | `offline_mirror` | Temporary preview/fallback. | Stores lifecycle events in MemoryMesh storage only. |

## Local Console UX

The local/self-hosted console is a separate UI from the public/cloud product shell.

```text
Development URL: http://127.0.0.1:5174/?mode=local
Standalone mode: open the built bundle with ?mode=local
```

It does not show Product, Agents, Pricing, or Docs navigation. The local console exposes more runtime detail than the cloud UI because developers need confidence that private memory is actually being written and recalled through local Cognee.

### 1. Runtime Status

Show:

- selected backend: `local_cognee`;
- Cognee provider: open-source Cognee;
- readiness probe result;
- Cognee import error, if any;
- fallback state: whether MemoryMesh is using offline mirror fallback;
- storage/runtime notes from the backend;
- API health for memory lifecycle operations.

User-facing states:

| State | Meaning | UI Copy |
|---|---|---|
| Connected | Local Cognee import/probe passed. | “Local Cognee is available.” |
| Fallback | Cognee failed but fallback is allowed. | “Using MemoryMesh offline mirror. Local Cognee needs attention.” |
| Not Ready | Cognee failed and fallback is disabled. | “Local Cognee is not ready.” |

### 2. Memory Activity

Show recent memory operations from MemoryMesh receipts:

- `remember`;
- `recall`;
- `improve`;
- `forget`.

Each operation should show:

- operation status;
- backend used;
- fallback used or not;
- dataset;
- session id;
- timestamp;
- short text preview;
- error/import message if present.

This gives the developer evidence that the agent is actually using memory, not only showing scripted UI.

### 3. Recall Inspector

Allow the user to test recall manually:

```text
query -> /api/memory/recall -> recalled items + status + fallback_used
```

The result should explain:

- which dataset was searched;
- how many memories returned;
- whether local Cognee or fallback served the result;
- what text was recovered.

### 4. Memory Graph View

The first implementation can use a readable “work graph” rather than a raw database graph:

```text
Project
  -> Agent session
    -> Task
      -> Remembered decision
      -> Tool trace
      -> Checkpoint
      -> Outcome
```

Later, if Cognee exposes richer graph APIs for the local runtime, MemoryMesh can replace the summarized graph with live Cognee graph data.

### 5. Privacy Controls

Expose safe controls:

- forget a session;
- forget a dataset;
- show retention policy;
- show export path or future export button;
- clearly state whether data stayed local.

The UI must avoid destructive one-click deletion. Forget actions require confirmation.

### 6. Recovery Lab

The strongest local proof is:

```text
Run agent -> save memory -> simulate context loss -> recall recovery brief -> continue work
```

The console should provide a “Test recovery” action that runs the known Build/Research/Support flow using `local_cognee` and shows the receipt.

## API Surface

Existing endpoints:

```text
GET  /api/memory/status?backend=local_cognee&probe=true
POST /api/memory/remember
POST /api/memory/recall
POST /api/memory/improve
POST /api/memory/forget
POST /api/agents/run
```

Needed for the console:

```text
GET /api/memory/events?backend=local_cognee&dataset=...&session_id=...&limit=...
```

The events endpoint should return recent `cognee_memory_events` records with enough metadata for inspection, while keeping raw secrets out of the response.

## Implementation Plan

### Phase 1: Status-Aware Local Console

- Add `/api/memory/events`. Done.
- Add a dedicated local console route through `?mode=local`. Done.
- Add frontend API calls for memory status, events, recall, and recovery test. Done.
- Show local Cognee readiness from live backend status. Done.
- Show recent memory operations. Done.
- Keep public/cloud navigation out of local mode. Done.

### Phase 2: Developer Tools

- Add manual recall inspector.
- Add session/dataset forget controls with confirmation.
- Add “test recovery” action using `/api/agents/run` with `memory_backend=local_cognee`.

### Phase 3: Graph and Export

- Add readable work graph from memory events and agent receipts.
- Add export memory/session receipt.
- Add retention policy configuration.

## Acceptance Criteria

- Local mode never claims Cognee is connected unless `GET /api/memory/status?backend=local_cognee&probe=true` passes.
- Cloud mode clearly says “needs setup” until `COGNEE_SERVICE_URL` and `COGNEE_API_KEY` are configured.
- Demo mode is always labelled temporary/fallback.
- The UI shows whether fallback was used.
- A developer can see recent memory operations after running an agent.
- A developer can manually test recall.
- A developer can run the local recovery test against `memory_backend=local_cognee`.
- Local mode does not render the public/cloud product pages.
- Forget actions are explicit and confirmable.

## Strategic Value

Local/self-hosted MemoryMesh is useful because it gives developers a private work-memory workstation for agents. Cognee powers the memory engine; MemoryMesh makes the memory inspectable and actionable.

The differentiator is not “local storage.” The differentiator is trust:

```text
Can I see what the agent remembered?
Can I recover the work?
Can I correct stale memory?
Can I delete it?
Can I use this with my existing agent tools?
```

That is the product layer MemoryMesh adds on top of Cognee.
