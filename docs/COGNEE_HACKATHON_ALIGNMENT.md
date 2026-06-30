# MemoryMesh Cognee Hackathon Alignment

MemoryMesh is built for the Cognee “Where’s My Context?” challenge.

## Primary category

**Example #03 — Never-Forget Workflows**

MemoryMesh lets agents carry durable work context between runs: task contract, project/repo context, decisions, tool evidence, failures, checkpoints, and next safe actions.

## Secondary category

**Example #04 — Self-Improving Agents**

After a recovered run succeeds or a user corrects the agent, MemoryMesh calls Cognee `improve` so future agents recover with better guidance.

## Grand prize alignment

| Prize | Evidence in MemoryMesh |
|---|---|
| Best Use of Open Source | `local_cognee` backend, `.env.oss.example`, Docker override, open-source demo script. |
| Best Use of Cognee Cloud | `cognee_cloud` backend, `.env.cloud.example`, Cloud demo script, `cognee.serve()` route. |

## Cognee lifecycle shown

- `remember`: task contract, repo map, decision, failure signal
- `recall`: recovery brief after simulated context loss
- `improve`: verified recovery lesson after tests pass
- `forget`: session memory cleanup via the UI/API

## Why the demo uses coding

The product is not only for code. Coding is the proof case because the result is objective: failing tests before recovery and passing tests after recovery.

## Submission positioning

> MemoryMesh is not longer chat history. It is durable work memory for agents.

The coding-agent proof shows a real agent losing context, recalling from Cognee, patching code, and improving future behaviour. The dual backend proof shows the same workflow on open-source Cognee and Cognee Cloud.
