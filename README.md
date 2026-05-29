# MemoryMesh

**Run or connect AI agents whose work survives context loss.**

MemoryMesh is a Cognee-powered user-facing workspace and connection layer for AI agents. It lets people run built-in assistants, or connect the agents they already use, so agent work can be remembered, recovered, improved, and forgotten safely.

For the adoption-ready product strategy, see [`docs/ADOPTION_READY_PRODUCT_STRATEGY.md`](docs/ADOPTION_READY_PRODUCT_STRATEGY.md).

The project is designed to be strong on **both Cognee hackathon grand-prize tracks**:

| Prize path | MemoryMesh implementation |
|---|---|
| **Best Use of Open Source** | `MEMORYMESH_MEMORY_BACKEND=local_cognee` runs against a local/self-hosted open-source Cognee service, with the in-process SDK kept as an optional developer path. |
| **Best Use of Cognee Cloud** | `MEMORYMESH_MEMORY_BACKEND=cognee_cloud` routes the same lifecycle operations to the Cognee Cloud HTTP API. |

The same real agent workflow runs on both backends.

## What MemoryMesh is

MemoryMesh is not a replacement for Cognee, Cursor, Codex, Claude Code, OpenClaw, or a company's existing AI system. It sits around agents as a recoverable work-session layer.

```text
Cognee = memory infrastructure
MemoryMesh = agent workspace + connection layer built on Cognee
Existing agents = the systems that do the work
```

People can use MemoryMesh in two ways:

| Mode | Who it is for | What happens |
|---|---|---|
| **Run an agent** | Users/judges who want a working product experience | Open MemoryMesh, choose Build Assistant, enter a task, choose memory location, start a session, recover context, review outcome. |
| **Connect your agent** | Teams already using Cursor, Codex, Claude Code, OpenClaw, or internal agents | The external agent calls MemoryMesh through MCP/API/SDK to remember, recall, improve, and forget work memory. |

## Workspace experience

The UI now brings together the full product direction discussed:

- built-in assistants: Build, Research, Support, and Ops lanes;
- connected-agent path: Cursor, Codex, Claude Code, OpenClaw, and custom agents;
- local/cloud memory: private local memory via open-source Cognee, managed cloud memory via Cognee Cloud, and honest demo fallback;
- user-facing session flow: choose agent, enter task, choose memory location, run session, recover context, review outcome, teach or forget memory.

See:

- `docs/WORKSPACE_AND_UI_BLUEPRINT.md`
- `docs/UI_DESIGN_SPEC.md`
- `docs/LOCAL_SELF_HOSTED_MEMORY_CONSOLE.md`
- `docs/ADOPTION_READY_PRODUCT_STRATEGY.md`
- `docs/CONNECTED_AGENTS_MCP_API_SDK.md`
- `docs/COGNEE_VS_MEMORYMESH.md`

## The thesis

Most memory demos show an assistant that remembers the user. MemoryMesh shows an agent that remembers the work.

LLM calls are stateless. Long workflows lose task intent, decisions, evidence, failed attempts, checkpoints, and next actions. MemoryMesh uses Cognee's memory lifecycle to turn these into durable work memory:

- `remember` - store task contracts, repo/project context, decisions, checkpoints, and failure signals.
- `recall` - restore the right recovery brief after context loss.
- `improve` - save verified lessons from test outcomes or user correction.
- `forget` - delete or prune session memory when the user asks for cleanup.

## Why this fits the Cognee hackathon

Primary category: **Example #03 - Never-Forget Workflows**  
Secondary category: **Example #04 - Self-Improving Agents**

MemoryMesh is not a generic chatbot and not a code-only product. It is a reusable work-memory layer for coding, research, support, operations, and enterprise agents. The included coding-agent demo is the evidence-backed proof because tests make recovery objectively verifiable.

## UI correction: visible agents and connected tools

The UI keeps agents visible while remaining run-first. It opens with no fake completed result, but it clearly shows what the user can run or connect:

- Build Assistant - live working proof agent.
- Research Assistant - future knowledge-work lane.
- Support Assistant - future customer-workflow lane.
- Ops Assistant - future operational-workflow lane.
- Cursor, Codex, Claude Code, OpenClaw, and custom agents - connected-agent paths through MCP/API/SDK.

See `docs/UI_CONTEXT_CORRECTION.md` and `docs/WORKSPACE_AND_UI_BLUEPRINT.md`.


## User-facing UI direction

The UI has been corrected from an internal proof console into a user-facing agent workspace. The visible product flow is now:

```text
Choose an agent -> choose where memory lives -> run a session -> recover context -> review the outcome -> forget the session if needed
```

The screen avoids internal wording such as backend selector, proof console, template lane, judge action, and prize track. It uses product language: agents, session, memory location, recovery summary, memory activity, outcome evidence, and change details.

See `docs/UI_PRODUCT_EXPERIENCE.md` and `docs/UI_DESIGN_SPEC.md`.

## What the real demo does

`POST /api/coding-agent/run` runs an actual local coding-agent loop:

1. Copies the sample repo into `/tmp/memorymesh-workspaces`.
2. Lists files and reads relevant source/tests.
3. Runs tests before the patch and captures the failing signal.
4. Uses Cognee `remember` to store task contract, repo map, decision, and failure memory.
5. Saves a resumable checkpoint in PostgreSQL.
6. Simulates context loss by clearing active working state.
7. Uses Cognee `recall` to rebuild the recovery brief.
8. Patches the central dashboard RBAC guard.
9. Reruns tests and verifies the fix.
10. Uses Cognee `improve` to store a future recovery lesson.
11. Supports Cognee `forget` through the API and UI for memory cleanup.

## Backend modes

MemoryMesh has a real backend router:

```text
MEMORYMESH_MEMORY_BACKEND=local_cognee | cognee_cloud | offline_mirror | auto
```

| Mode | Purpose |
|---|---|
| `local_cognee` | Open-source/self-hosted Cognee prize path. Prefer `COGNEE_LOCAL_SERVICE_URL` for production local installs. |
| `cognee_cloud` | Cognee Cloud prize path through `COGNEE_SERVICE_URL` and `COGNEE_API_KEY`. |
| `offline_mirror` | No-key local fallback for tests/previews only. |
| `auto` | Uses Cognee Cloud if URL/key are present, local Cognee if `COGNEE_ENABLED=true`, otherwise offline mirror. |

Every memory response exposes `backend`, `provider`, `backend_ready`, and `fallback_used`, so judging can see what actually powered the lifecycle.

## Secrets and provider configuration

Secrets are backend-only. Do not place Cognee or LLM keys in `apps/coding-agent-demo/index.html`.

| Capability | Environment variables | Needed now? |
|---|---|---|
| Local/self-hosted Cognee memory | `MEMORYMESH_MEMORY_BACKEND=local_cognee`, `COGNEE_ENABLED=true`, `COGNEE_LOCAL_SERVICE_URL` | Yes for production local Cognee mode |
| Cognee Cloud memory | `MEMORYMESH_MEMORY_BACKEND=cognee_cloud`, `COGNEE_SERVICE_URL`, `COGNEE_API_KEY` | Yes for managed Cognee Cloud mode |
| OpenAI LLM route | `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_CHAT_MODEL` | Needed for live OpenAI reasoning |
| AIMLAPI fallback route | `AIMLAPI_API_KEY`, `AIMLAPI_BASE_URL`, `AIMLAPI_MODEL` | Needed for OpenAI-compatible fallback |
| LLM routing | `LLM_PRIMARY_PROVIDER=openai`, `LLM_FALLBACK_PROVIDER=aimlapi` | Recommended |

For development without live keys, MemoryMesh keeps deterministic local fallback enabled so the UI and API contracts can still be tested.

## Quickstart: Open-source Cognee mode

```bash
npm install
cp .env.oss.example .env
# Set COGNEE_LOCAL_SERVICE_URL to your self-hosted Cognee service.
# Docker Compose can reach Cognee on the host at http://host.docker.internal:8001.
# Use http://127.0.0.1:8001 only when running the API directly outside Docker.
# Use http://cognee:8000 if Cognee is another service on the same Docker network.
# If blank, MemoryMesh tries the optional in-process Cognee SDK when installed.
# Add any local Cognee LLM/embedding provider keys needed by your setup.
docker compose -f docker-compose.yml -f docker-compose.cognee-local.yml up --build
```

For the self-hosted operator UI, open:

```text
http://127.0.0.1:5174/?mode=local
```

Local mode is intentionally separate from the cloud/product shell. It shows local Cognee status, recent memory events, manual recall, and a local recovery test without Product, Pricing, or Docs navigation.

Then run the smoke/demo script:

```bash
./scripts/demo_open_source_cognee.sh
```

Or manually:

```bash
python scripts/run_hackathon_demo.py --backend local_cognee
```

## Quickstart: Cognee Cloud mode

```bash
npm install
cp .env.cloud.example .env
# Edit .env and set COGNEE_SERVICE_URL and COGNEE_API_KEY.
docker compose up --build
```

Then run:

```bash
./scripts/demo_cognee_cloud.sh
```

Or manually:

```bash
python scripts/run_hackathon_demo.py --backend cognee_cloud
```

## Dual-backend proof

To show both prize paths through the same workflow:

```bash
python scripts/run_hackathon_demo.py --dual
```

Or call:

```text
POST /api/demo/dual-backend-proof
```

The response contains separate `local_cognee` and `cognee_cloud` runs, each with tests-before, Cognee lifecycle trace, context-loss recovery, patch diff, tests-after, and improvement memory.

## Core endpoints

```text
GET  /api/memory/status?backend=local_cognee
GET  /api/memory/events?backend=local_cognee
POST /api/memory/remember
POST /api/memory/recall
POST /api/memory/improve
POST /api/memory/forget
POST /api/codebase/ingest
POST /api/coding-agent/run
POST /api/demo/coding-agent-recovery
POST /api/demo/dual-backend-proof
```

All memory lifecycle endpoints accept an optional `backend` field:

```json
{
  "backend": "local_cognee",
  "dataset": "memorymesh-agent-work-memory",
  "text": "Task contract or work memory"
}
```

## Repository map

```text
apps/coding-agent-demo/                 Main workspace UI plus ?mode=local self-hosted memory console
apps/console/                           Broader platform console
services/api/                           FastAPI runtime + Cognee backend router
services/api/app/services/cognee_memory.py
services/api/app/services/real_coding_agent.py
examples/memorymesh-sample-dashboard-service/
packages/sdk-python/memorymesh/         Python SDK
packages/sdk-typescript/                TypeScript SDK
scripts/run_hackathon_demo.py           CLI smoke demo
scripts/demo_open_source_cognee.sh      Open-source Cognee demo helper
scripts/demo_cognee_cloud.sh            Cognee Cloud demo helper
docs/OPEN_SOURCE_COGNEE_MODE.md
docs/COGNEE_CLOUD_MODE.md
docs/DUAL_BACKEND_PRIZE_STRATEGY.md
docs/UI_DESIGN_SPEC.md              UI design, screen structure, interaction model, and acceptance checklist
docs/UI_IMPLEMENTATION_NOTES.md     Implemented UI changes, acceptance checklist, and validation notes
docs/WORKSPACE_AND_UI_BLUEPRINT.md  Consolidated product workspace and UI design
docs/LOCAL_SELF_HOSTED_MEMORY_CONSOLE.md Local/self-hosted MemoryMesh console on top of Cognee
docs/CONNECTED_AGENTS_MCP_API_SDK.md Connected-agent model for Cursor, Codex, Claude Code, OpenClaw, custom agents
docs/COGNEE_VS_MEMORYMESH.md        Clear distinction between Cognee infrastructure and MemoryMesh product layer
```

## UI design documentation

The MemoryMesh UI is documented in [`docs/UI_DESIGN_SPEC.md`](docs/UI_DESIGN_SPEC.md) and the full product workspace direction is captured in [`docs/WORKSPACE_AND_UI_BLUEPRINT.md`](docs/WORKSPACE_AND_UI_BLUEPRINT.md). The current UI uses a restrained, professional layout with two user paths: **Run an agent** and **Connect your agent**. It keeps local/cloud memory choices user-facing as memory locations, not backend plumbing.

For judging, use the live React app connected to the API for the real proof run. The standalone HTML file is a visual preview only. Cognee Cloud success requires valid `COGNEE_SERVICE_URL` and `COGNEE_API_KEY`; production local mode requires `COGNEE_LOCAL_SERVICE_URL` or a compatible in-process Cognee SDK. Without a live memory backend, the UI should show a clear fallback state rather than silently claiming Cognee success.

## Winning demo narrative

**Before MemoryMesh:** the agent forgets the task, repeats investigation, loses the failed test, and starts from zero.

**With MemoryMesh:** the agent recalls the task contract, repo context, decision, failed test, checkpoint, and next safe action, then continues correctly.

One-line pitch:

> MemoryMesh gives AI agents durable memory of work, so they can recover, continue, and improve after context loss.

## Validation

Verified in this package:

```text
npm run build:agent                         passed
npm run build:console                       passed
npm --workspace @memorymesh/sdk run build   passed
python -m compileall services/api/app packages/sdk-python/memorymesh   passed
cd services/api && python -m pytest tests -q   10 passed
python -c "import yaml; yaml.safe_load(open('docker-compose.yml'))"   passed
```

Full `docker compose up` should be run on a machine with Docker installed.

## UI intent: user-facing agent workspace

The MemoryMesh UI intentionally opens with **no claimed proof result**, but it is not an empty console. It should feel like a polished workspace where users can:

1. choose **Run an agent** or **Connect your agent**;
2. select a built-in assistant or an existing external tool;
3. choose where the agent remembers work: private local memory, managed cloud memory, or demo memory;
4. start a session or copy a connection plan;
5. inspect memory activity, recovery summary, outcome evidence, and forget controls after a run.

The standalone HTML preview uses the same workspace layout and clearly shows API-offline/static-shell state until connected to the live API. The real hackathon proof should be run from the React app connected to the API.

## Main UI wiring

The main coding-agent app now opens the standalone MemoryMesh UI design from `apps/coding-agent-demo/index.html`. The same HTML is copied to `apps/coding-agent-demo/dist/index.html` so static hosting and simple deployment previews use the updated design instead of the older React workspace shell.

The previous React source remains in `apps/coding-agent-demo/src` for reference while the design is being consolidated, but it is no longer the visible entry point.

## Standalone UI preview

The package includes `memorymesh_workspace_unified_preview.html`, a self-contained user-facing workspace preview. It opens with no claimed result, shows built-in and connected-agent paths, and marks API-offline/static-shell state until connected to the live service.
## Latest UI correction - user-facing workspace redesign

The workspace UI has been redesigned away from an internal proof console into a user-facing agent workspace. It now centers on a simple flow: run an agent or connect an existing one, enter a task, choose where the agent remembers the work, start a session, and review memory activity, recovery, and outcome. The Build Assistant remains the live proof case, while Cursor/Codex/Claude Code/OpenClaw/custom agents are shown through the connection path.

See `docs/USER_FACING_WORKSPACE_REDESIGN.md` for the final UI intent and acceptance contract.
