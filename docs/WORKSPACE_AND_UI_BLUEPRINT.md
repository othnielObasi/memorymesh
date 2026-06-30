# MemoryMesh Workspace and UI Blueprint

MemoryMesh is a user-facing workspace and connection layer for AI agents whose work needs durable memory. Cognee powers the memory underneath; MemoryMesh packages that memory into sessions that users can run, recover, improve, and forget.

## Product definition

**MemoryMesh lets people run or connect AI agents that remember the work.**

It should not be positioned as a Cognee replacement. Cognee is the infrastructure. MemoryMesh is the product experience built on that infrastructure.

```text
Cognee = memory infrastructure
MemoryMesh = agent session/workspace experience built on Cognee
Existing agents = the systems that do the work
```

## The problem it solves

AI agents can start work, but they do not reliably continue work after context loss. They forget the original task, decisions, evidence, tool results, failed attempts, and next safe action.

MemoryMesh solves this by turning agent work into a recoverable session:

```text
start work -> remember what matters -> lose context -> recover the session -> continue safely -> improve or forget memory
```

## Primary user flow

When a user opens MemoryMesh, the interface should feel calm, modern, and usable. The user should immediately understand two paths:

1. **Run an agent** inside MemoryMesh.
2. **Connect your agent** if they already use Cursor, Codex, Claude Code, OpenClaw, or an internal AI system.

The user journey is:

```text
Choose mode
-> choose an agent or connected tool
-> enter the task or connection method
-> choose where memory lives
-> start/run/connect
-> see memory activity
-> recover after context loss
-> review outcome
-> teach or forget memory
```

## Workspace modes

### 1. Run an agent

This is the hackathon live path.

The first available built-in agent is **Build Assistant**. It uses a sample project, runs tests, saves work memory through Cognee, simulates context loss, recalls a recovery brief, applies a fix, reruns tests, and improves memory from the result.

Visible agent lanes:

| Agent | Status | Purpose |
|---|---|---|
| Build Assistant | Available | Code/workflow proof case with objective test evidence. |
| Research Assistant | Next | Memory-backed source trails, findings, open questions. |
| Support Assistant | Next | Customer/ticket context, prior actions, unresolved issues. |
| Ops Assistant | Next | Incident steps, tool outputs, runbook decisions. |

### 2. Connect your agent

This path shows that MemoryMesh does not replace existing tools. It connects to them as a memory and recovery layer.

Supported connection directions:

| Tool/system | Connection path | MemoryMesh value |
|---|---|---|
| Cursor | MCP tools | Project/task memory across IDE sessions. |
| Codex | API or MCP | Durable coding task sessions and recovery briefs. |
| Claude Code | MCP server | Local project memory across terminal/chat restarts. |
| OpenClaw | Skill/API | Long-running workflow memory and recovery. |
| Custom agent | SDK/API | Internal AI agents get recoverable work sessions. |

The UI should provide a connection plan, not force the user to abandon their current AI tool.

## Memory location model

Do not call this a backend selector in the UI. Use user-facing language:

> Where should this agent remember the work?

Options:

| UI label | Technical mode | Purpose |
|---|---|---|
| Private local memory | `local_cognee` | Open-source/self-hosted Cognee. |
| Managed cloud memory | `cognee_cloud` | Cognee Cloud. |
| Demo memory | `offline_mirror` | Preview fallback only. |

This lets one UI support both grand-prize lanes without creating two separate products.

## UI sections

The workspace should have these sections:

1. **Hero** — "Run agents whose work survives context loss."
2. **Workspace panel** — mode switch: run an agent / connect your agent.
3. **Agent lanes** — built-in agent choices, with Build Assistant active now.
4. **Connected-agent matrix** — Cursor, Codex, Claude Code, OpenClaw, custom agents.
5. **Session progress** — staged progress appears only after a run starts.
6. **Memory activity** — remember, recall, improve, forget shown as user-facing activity.
7. **Agent work** — the work stages and status.
8. **Recovery summary** — the restored continuation brief.
9. **Outcome evidence** — tests before/after, changed file, change details.
10. **Memory locations** — local and cloud readiness comparison.

## UI tone

The UI must be:

- sleek, modern, calm, and professional;
- easy enough for a non-infrastructure judge to understand;
- honest about what has run and what is only planned;
- product-facing, not backend-facing;
- broad enough for many agent types, while proving value through Build Assistant.

Avoid these phrases on the main user screen:

- backend selector
- dual-backend proof
- judge action
- implementation guide
- control plane
- proof console
- template lane

Prefer these:

- memory location
- agent session
- memory activity
- recover session
- remembered work
- connect your agent
- forget this session

## What happens after choosing Build Assistant

1. User enters a task.
2. User selects project source.
3. User selects memory location: local, cloud, or demo.
4. User starts session.
5. Build Assistant checks the project and test state.
6. MemoryMesh remembers task, evidence, decisions, and failures through Cognee.
7. Context loss is simulated.
8. MemoryMesh recalls a recovery summary.
9. The agent continues from the restored next step.
10. Outcome evidence appears.
11. User can teach MemoryMesh or forget the session.

## What happens when connecting Cursor/Codex/Claude/OpenClaw

1. User chooses **Connect your agent**.
2. User selects the agent they already use.
3. User chooses MCP, API, or SDK connection.
4. User chooses memory location.
5. MemoryMesh gives a connection plan.
6. The external agent uses MemoryMesh to start sessions, remember work, recover state, improve memory, and forget sessions.

The external-agent path is a connection layer, not a replacement for those tools.

## Acceptance checklist

- [x] UI opens as a product workspace, not an internal guide.
- [x] Built-in agent path is visible.
- [x] Connected-agent path is visible.
- [x] Cursor, Codex, Claude Code, OpenClaw, and custom agents are represented.
- [x] Local Cognee and Cognee Cloud are both first-class memory locations.
- [x] Demo fallback is honest and labelled as preview-only.
- [x] The session starts empty; no fake completed result is shown before a run.
- [x] Memory activity shows remember, recall, improve, and forget.
- [x] Build Assistant remains the live proof case.
- [x] Documentation explains why MemoryMesh is different from Cognee.
