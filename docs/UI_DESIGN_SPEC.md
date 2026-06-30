# MemoryMesh UI Design Spec

## Intent

MemoryMesh should feel like a real user-facing workspace for running or connecting AI agents whose work must survive context loss.

The UI is not an implementation guide, not a backend dashboard, and not a static case study. It should be sleek, modern, calm, and easy to use.

## Core screen promise

When the UI opens, users should understand this immediately:

> I can run an AI agent here, choose where its memory lives, and recover the work if context is lost. If I already use Cursor, Codex, Claude Code, OpenClaw, or my own agent, I can connect it instead.

## Product model

```text
MemoryMesh Workspace
├── Run an agent
│   ├── Build Assistant             available now
│   ├── Research Assistant          next
│   ├── Support Assistant           next
│   └── Ops Assistant               next
│
├── Connect your agent
│   ├── Cursor                      MCP tools
│   ├── Codex                       API or MCP
│   ├── Claude Code                 MCP server
│   ├── OpenClaw                    skill/API
│   └── Custom agent                SDK/API
│
└── Memory location
    ├── Private local memory        open-source/self-hosted Cognee
    ├── Managed cloud memory        Cognee Cloud
    └── Demo memory                 temporary preview fallback
```

## User flow: built-in agent

```text
Choose Run an agent
-> choose Build Assistant
-> enter task
-> choose project source
-> choose memory location
-> start session
-> watch progress
-> see memory activity
-> recover context
-> review outcome evidence
-> teach or forget memory
```

## User flow: connected agent

```text
Choose Connect your agent
-> choose Cursor/Codex/Claude Code/OpenClaw/custom agent
-> choose MCP/API/SDK
-> choose memory location
-> copy connection plan
-> external agent calls MemoryMesh memory/session tools
```

## Wording rules

Use user-facing language:

| Use | Avoid |
|---|---|
| Memory location | Backend selector |
| Run an agent | Execute proof |
| Connect your agent | Integration implementation |
| Memory activity | Lifecycle trace |
| Recovery summary | Rehydration payload |
| Outcome evidence | Internal verification dump |
| Forget this session | Delete dataset |
| Private local memory | Local backend |
| Managed cloud memory | Cloud backend |

## Layout sections

1. **Topbar**: product name and service/memory status.
2. **Hero**: clear product statement: agents whose work survives context loss.
3. **Workspace panel**: mode switch, task/connection setup, memory location, action buttons.
4. **Agents section**: visible built-in assistants; Build Assistant active now.
5. **Connect your agent section**: Cursor, Codex, Claude Code, OpenClaw, custom agents.
6. **Session section**: progress, memory activity, agent work status.
7. **Recovery section**: human-readable recovery summary.
8. **Outcome section**: before/after evidence and change details.
9. **Memory locations section**: local/cloud readiness and comparison.

## Visual principles

- Keep the page spacious and restrained.
- Use large sectioned panels instead of many small cards.
- Do not prefill completed results before a run.
- Let the Build Assistant be the first working proof, but keep the product broader than code.
- Show local/cloud memory choices without forcing infrastructure language on the user.
- Give connected-agent support a visible home without pretending all external integrations are already fully live.

## Opening feeling

The UI should project:

> Controlled readiness with clear choices.

Users should feel they can start work, not that they are reading technical architecture.

## Functional acceptance checklist

- [x] UI opens without fake completed results.
- [x] User can select Run an agent or Connect your agent.
- [x] Build Assistant is available and runnable.
- [x] Research, Support, and Ops assistants are visible as future lanes.
- [x] Cursor, Codex, Claude Code, OpenClaw, and custom agents are visible as connected-agent paths.
- [x] Local Cognee and Cognee Cloud are first-class memory locations.
- [x] Demo memory is clearly labelled as preview-only.
- [x] Memory activity shows remember, recall, improve, and forget.
- [x] Recovery summary and outcome evidence remain empty until a run happens.
- [x] UI documentation explains MemoryMesh vs Cognee clearly.

## Runtime acceptance checklist

- [ ] Test live local Cognee with `MEMORYMESH_MEMORY_BACKEND=local_cognee`.
- [ ] Test live Cognee Cloud with `COGNEE_SERVICE_URL` and `COGNEE_API_KEY`.
- [ ] Wire external-agent MCP server when the hackathon scope allows.
- [ ] Keep API/SDK path available for teams that do not use MCP.
