# Cognee Hackathon Submission Gate

This is the final quality gate before submitting MemoryMesh to the Cognee "Where's My Context?" hackathon.

The goal is not to add more features. The goal is to make the project easy to judge:

```text
problem -> product flow -> Cognee memory lifecycle -> proof -> user value
```

## One-sentence submission position

MemoryMesh gives AI agents durable memory of work, powered by Cognee, so they can remember, recover, improve, and forget across sessions instead of starting from zero after context loss.

## Prize track alignment

| Track | Claim | Required proof |
| --- | --- | --- |
| Best Use of Open Source Cognee | MemoryMesh can run against self-hosted/open-source Cognee through `local_cognee`. | Local memory status, local run receipt, lifecycle events, and local recovery proof. |
| Best Use of Cognee Cloud | MemoryMesh can run the same lifecycle against managed Cognee Cloud through `cognee_cloud`. | Cloud memory status, cloud run receipt, lifecycle events, and cloud recovery proof. |

## Cognee lifecycle evidence

Every demo path should show these operations in the UI, receipt, API output, or script output:

| Cognee operation | MemoryMesh evidence |
| --- | --- |
| `remember` | Task contract, source trail, ticket evidence, project constraints, decisions, or failure signal saved to memory. |
| `recall` | Agent restores prior context before planning, after context loss, or during a follow-up run. |
| `improve` | Human correction, successful recovery, or verified lesson saved for future runs. |
| `forget` | Session cleanup available through API/UI for temporary, stale, or sensitive memory. |

## Current built-in agent truth

| Agent | Status | Submission role |
| --- | --- | --- |
| Build Assistant | Live | Objective code/test proof: recover after context loss and complete work. |
| Research Assistant | Live | Source-backed investigation proof: preserve findings, contradictions, and open questions. |
| Support Assistant | Live | Ticket-investigation proof: preserve tool traces, checkpoints, and recovery state. |
| Ops Assistant | Future | Do not present as live. |

## Judging criteria checklist

| Criterion | What judges should see |
| --- | --- |
| Potential Impact | Agents can continue useful work after context loss instead of repeating work. |
| Creativity & Innovation | MemoryMesh turns Cognee memory into a workspace, SDK, MCP server, API, receipts, and Context Map. |
| Technical Excellence | Backend routes, SDKs, MCP server, local/cloud memory routing, tests, and auditable receipts. |
| Best Use of Cognee | Both `local_cognee` and `cognee_cloud` exercise remember, recall, improve, and forget. |
| User Experience | User chooses an agent, chooses memory location, runs a task, sees memory activity, and reviews the receipt. |
| Presentation Quality | README, docs, demo page, and submission text tell the same story without stale claims. |

## Must-pass checks before submitting

1. `npm --workspace @memorymesh/coding-agent-demo run build`
2. `python scripts/run_hackathon_demo.py --backend local_cognee`
3. `python scripts/run_hackathon_demo.py --backend cognee_cloud`
4. `python scripts/run_hackathon_demo.py --dual`
5. Browser check on live URL:
   - Home explains durable work memory.
   - Demo works without sign-in.
   - Agents page marks Build, Research, and Support available.
   - Docs page has SDK/MCP/API setup and the corrected `/api/agents/run` endpoint.
   - Memory page explains local, cloud, and demo modes.

If a Cognee backend is unavailable during judging, use `offline_mirror` only as a fallback and say so clearly. Do not describe fallback memory as Cognee Cloud or self-hosted Cognee.

## Current proof status

Last checked: 2026-07-04.

| Proof | Status | Notes |
| --- | --- | --- |
| Frontend build | Passed | `npm --workspace @memorymesh/coding-agent-demo run build`. |
| Backend contract tests | Passed | Cognee backend router, production agents, and API contract tests passed locally. |
| Cognee Cloud | Passed | `python scripts/run_hackathon_demo.py --base-url https://api-two-blue-75.vercel.app --backend cognee_cloud` returned `fallback_used=false` for remember/recall/forget and `backend_ready=true`. |
| Offline mirror fallback | Passed | `offline_mirror` is healthy and clearly labelled as fallback-only. |
| Open-source/local Cognee | Blocked on local Docker runtime | Production API currently reports `local_cognee` falling back because `COGNEE_LOCAL_SERVICE_URL` is not configured there. Local Docker proof requires Docker Desktop/Linux engine running, then `docker compose -f docker-compose.yml -f docker-compose.cognee-local.yml up -d --build postgres cognee-local api`. |

Submission should not claim the open-source Cognee prize proof is live until `local_cognee` reports `ready=true`, `service_url_configured=true`, and lifecycle operations return `fallback_used=false`.

## Submission demo script

Use this sequence for the recorded demo:

1. Open MemoryMesh and state the problem: agents lose work context.
2. Choose a built-in agent.
3. Choose memory location: local Cognee or Cognee Cloud.
4. Run a task.
5. Show memory activity: remember, recall, improve, forget.
6. Show the receipt: task, backend, evidence, memory operations, and recovery state.
7. Switch memory backend and run the same proof.
8. Open SDK/MCP docs to show that existing agents can connect.

## Final rule

Do not submit claims that are not visible in one of these places:

- live UI,
- README,
- submission video,
- run receipt,
- API/script output,
- SDK/MCP package documentation.
