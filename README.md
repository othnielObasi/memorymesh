# MemoryMesh

**Run or connect AI agents whose work survives context loss.**

MemoryMesh is a Cognee-powered user-facing workspace and connection layer for AI agents. It lets people run built-in assistants, or connect the agents they already use, so agent work can be remembered, recovered, improved, and forgotten safely.

The project is designed to be strong on **both Cognee hackathon grand-prize tracks**:

| Prize path | MemoryMesh implementation |
|---|---|
| **Best Use of Open Source** | `MEMORYMESH_MEMORY_BACKEND=local_cognee` runs against a local/self-hosted open-source Cognee service, with the in-process SDK kept as an optional developer path. |
| **Best Use of Cognee Cloud** | `MEMORYMESH_MEMORY_BACKEND=cognee_cloud` routes the same lifecycle operations to the Cognee Cloud HTTP API. |

The same real agent workflow runs on both backends.

Submission guides:

- **Cognee Cloud track:** [`docs/SUBMISSION.md`](docs/SUBMISSION.md)
- **Open-source Cognee track:** [`docs/SUBMISSION_OPEN_SOURCE.md`](docs/SUBMISSION_OPEN_SOURCE.md)

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

## Solution and use cases

The core problem is not that an LLM cannot answer a question. The problem is that useful agent work is usually trapped in one session: the agent reads a codebase, follows sources, tries fixes, hits failures, makes decisions, and then that earned context disappears when the session changes.

MemoryMesh turns that earned context into durable work memory:

| User | Pain point | MemoryMesh value |
|---|---|---|
| Developers using Codex, Cursor, Claude Code, OpenClaw, or custom agents | Every new session needs repo re-orientation and repeats earlier mistakes. | Store repo decisions, source trails, test failures, attempted fixes, and recovery checkpoints so the next agent starts from known context. |
| Engineering teams | One person's agent run is hard for another person to trust or continue. | Produce receipts, Context Maps, and memory operations that show what happened and what should happen next. |
| Support and operations teams | Tickets and incidents lose history across shifts, tools, and escalations. | Preserve root causes, customer context, incident timelines, failed remediations, and verified recovery steps. |
| Research and knowledge teams | Sources and reasoning get flattened into summaries that are hard to verify later. | Store evidence, citations, decisions, and recallable research context backed by Cognee memory. |
| Cognee builders and partners | Cognee's memory engine is powerful, but users need to see how it helps real workflows. | MemoryMesh makes Cognee visible through demo, local, and cloud product flows, plus SDK, MCP, API, receipts, and Context Maps. |

The simplest product statement is:

```text
Cognee is the memory engine.
MemoryMesh is the agent workflow layer that makes Cognee memory usable, visible, and valuable.
```

### Three adoption paths

| Path | What it proves | When to use it |
|---|---|---|
| **Demo memory** | A no-login preview of the memory workflow with temporary labelled data. | First evaluation, judging, product walkthroughs, and developer onboarding. |
| **Local memory** | Open-source/self-hosted Cognee can power private agent memory. | Private codebases, regulated data, internal support queues, and offline/local development. |
| **Cloud memory** | Cognee Cloud can power shared persistent team memory. | Team workspaces, managed memory, shared receipts, API keys, tenant controls, and production deployments. |

## Workspace experience

The UI now brings together the full product direction discussed:

- built-in assistants: live Build, Research, and Support lanes, with Ops reserved as a future lane;
- connected-agent path: Cursor, Codex, Claude Code, OpenClaw, and custom agents;
- local/cloud memory: private local memory via open-source Cognee, managed cloud memory via Cognee Cloud, and honest demo fallback;
- user-facing session flow: choose agent, enter task, choose memory location, run session, recover context, review outcome, teach or forget memory.

See:

- `docs/WORKSPACE_AND_UI_BLUEPRINT.md`
- `docs/UI_DESIGN_SPEC.md`
- `docs/LOCAL_SELF_HOSTED_MEMORY_CONSOLE.md`
- `docs/CONNECTED_AGENTS_MCP_API_SDK.md`
- `docs/COGNEE_VS_MEMORYMESH.md`

## The thesis

Most memory demos show an assistant that remembers the user. MemoryMesh shows an agent that remembers the work.

MemoryMesh is not another memory engine. Cognee is the memory layer; MemoryMesh is the user-facing workflow layer that makes Cognee memory visible through work sessions, recovery briefs, run receipts, Context Maps, and explicit forget controls.

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
- Research Assistant - live research and source-trail lane.
- Support Assistant - live ticket and customer-memory lane.
- Ops Assistant - future operational-workflow lane.
- Cursor, Codex, Claude Code, OpenClaw, and custom agents - connected-agent paths through MCP/API/SDK.

See `docs/WORKSPACE_AND_UI_BLUEPRINT.md`.


## User-facing UI direction

The UI has been corrected from an internal proof console into a user-facing agent workspace. The visible product flow is now:

```text
Choose an agent -> choose where memory lives -> run a session -> recover context -> review the outcome -> forget the session if needed
```

The screen avoids internal wording such as backend selector, proof console, template lane, judge action, and prize track. It uses product language: agents, session, memory location, recovery summary, memory activity, outcome evidence, and change details.

See `docs/UI_DESIGN_SPEC.md`.

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

# Deployment

MemoryMesh can run three ways. Pick based on whether you want a quick local dev loop, a **self-hosted** production instance you fully own, or **managed** Cognee Cloud memory.

| Path | Persistence | Cognee | Best for |
|---|---|---|---|
| Local development | in-memory or local Postgres | offline mirror / local | Hacking on the code |
| **Self-hosted (Docker Compose)** | Postgres container (durable) | **open-source Cognee** + optional Cloud | Production you own, private data, all three modes |
| Managed (Cognee Cloud + Vercel/serverless) | external managed Postgres | Cognee Cloud | Zero-infra teams, quick hosted demo |

### Prerequisites

- Node.js 18+ and Python 3.12 (for local dev)
- Docker + Docker Compose plugin (for self-hosted)
- An LLM key for real Cognee reasoning: `OPENAI_API_KEY` (Cognee Cloud additionally needs `COGNEE_SERVICE_URL` + `COGNEE_API_KEY`)

---

## 1. Local development

```bash
npm install                     # workspaces: apps/* and packages/*
cp .env.oss.example .env

# Backend API (needs a Python venv with services/api/requirements.txt)
python3 -m venv .venv && . .venv/bin/activate
pip install -r services/api/requirements.txt
npm run api:dev                 # FastAPI on http://127.0.0.1:8000

# Frontend (separate shell)
VITE_MEMORYMESH_API_BASE_URL=http://127.0.0.1:8000 npm run dev:agent   # UI on :5173
```

Keyless option: start the API with `MEMORYMESH_DEV_INMEMORY_STORE=true` and `MEMORYMESH_MEMORY_BACKEND=offline_mirror` to run with no database and no Cognee keys (data is not persisted).

No-Docker open-source Cognee proof (starts a local Cognee service + API, disables fallback, runs the strict proof, writes `.memorymesh-local/open-source-proof.json`):

```bash
npm run demo:oss:local          # = python scripts/run_open_source_cognee_local.py
```

---

## 2. Self-hosted full stack (Docker Compose) — recommended

This runs the **entire product on one machine** with durable Postgres and open-source Cognee. This is the path that makes **all three memory modes** work with real persistence.

```bash
git clone https://github.com/othnielObasi/memorymesh.git
cd memorymesh
cp .env.oss.example .env
```

Edit `.env` and set at least:

```env
SIGNING_SECRET=<random-strong-secret>        # e.g. openssl rand -hex 32
OPENAI_API_KEY=sk-...                          # LLM for Cognee cognify/recall
# Optional: also enable Cognee Cloud as a selectable backend
COGNEE_SERVICE_URL=https://your-tenant.cognee.ai
COGNEE_API_KEY=your-cognee-cloud-api-key
```

Bring up the full stack (base + the open-source Cognee override):

```bash
docker compose -f docker-compose.yml -f docker-compose.cognee-local.yml up -d --build
```

Services started:

| Service | Port | Notes |
|---|---|---|
| `postgres` | 5432 | Durable store (named volume `postgres_data`) — accounts/memory persist |
| `api` | 8000 | FastAPI runtime; `DATABASE_URL` defaults to the `postgres` service |
| `cognee-local` | 8001 | Open-source Cognee service; API points at `http://cognee-local:8000` |
| `recovery-worker` | – | Background run-recovery worker |
| `coding-agent-demo` | 5173 | Agent workspace UI |
| `console` | 5174 | Optional marketing/enterprise console |

### Exposing it on a public host (IP or domain)

The browser UI must know the **public** API URL, and the API must allow the UI origin for CORS. Add a `docker-compose.deploy.yml` next to the others (replace `YOUR_HOST`):

```yaml
services:
  api:
    environment:
      FRONTEND_ORIGIN: "http://YOUR_HOST:5173"
  coding-agent-demo:
    environment:
      VITE_MEMORYMESH_API_BASE_URL: "http://YOUR_HOST:8000"
  console:
    profiles: ["disabled"]        # omit to skip the console UI entirely
```

Then start with all three files:

```bash
docker compose -f docker-compose.yml -f docker-compose.cognee-local.yml -f docker-compose.deploy.yml up -d --build
```

### Verify the deployment

```bash
curl http://YOUR_HOST:8000/health                                      # {"status":"ok","postgres_connected":true}
curl "http://YOUR_HOST:8000/api/memory/status?backend=local_cognee&probe=true"   # ready:true
curl "http://YOUR_HOST:8000/api/memory/status?backend=cognee_cloud&probe=true"   # ready:true if cloud keys set
# account creation persists across restarts (real Postgres):
curl -X POST http://YOUR_HOST:8000/api/auth/signup -H 'Content-Type: application/json' \
  -d '{"name":"You","email":"you@example.com","password":"password123"}'
```

### Operating

```bash
docker compose ps                 # status
docker compose logs -f api        # tail a service
docker compose restart api        # restart one service
docker compose down               # stop (add -v to also drop the Postgres volume)
```

### Production hardening

- Put a TLS reverse proxy (Caddy/Nginx) in front so the app is served over **HTTPS on a domain**, then set `VITE_MEMORYMESH_API_BASE_URL`/`FRONTEND_ORIGIN` to the `https://` domain.
- Set `AUTH_REQUIRED=true` and a strong `SIGNING_SECRET`; restrict a firewall to 80/443 only.
- Back up the `postgres_data` and `cognee_local_data` volumes.

---

## 3. Managed: Cognee Cloud (Vercel / serverless)

Use Cognee Cloud for memory and a managed Postgres for persistence.

```bash
cp .env.cloud.example .env        # set COGNEE_SERVICE_URL + COGNEE_API_KEY
docker compose up -d --build      # or deploy the API + UI to your platform
```

Required environment for a **persistent** managed API (e.g. on Vercel):

```env
MEMORYMESH_MEMORY_BACKEND=cognee_cloud
COGNEE_ENABLED=true
COGNEE_SERVICE_URL=https://your-tenant.cognee.ai
COGNEE_API_KEY=your-cognee-cloud-api-key
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:password@host:5432/memorymesh   # managed Postgres
MEMORYMESH_DEV_INMEMORY_STORE=false
AUTH_REQUIRED=true
```

> Important: on serverless (Vercel), a **missing `DATABASE_URL`** (or `MEMORYMESH_DEV_INMEMORY_STORE=true`) means the in-memory store is used and **accounts will not persist across cold starts** — this is the usual cause of "account created but login later fails" in a hosted deploy. Always point the managed API at a real Postgres.

---

## Environment variable reference

| Variable | Purpose | Default |
|---|---|---|
| `MEMORYMESH_MEMORY_BACKEND` | `local_cognee` \| `cognee_cloud` \| `offline_mirror` \| `auto` | `auto` |
| `DATABASE_URL` | PostgreSQL DSN (required for persistence) | local dev DSN |
| `MEMORYMESH_DEV_INMEMORY_STORE` | Bypass Postgres with an in-memory store (non-durable) | `false` |
| `SIGNING_SECRET` | Session-token signing secret | dev placeholder |
| `AUTH_REQUIRED` | Require auth for protected endpoints | `false` |
| `COGNEE_ENABLED` | Enable a Cognee backend (vs offline mirror) | `false` |
| `COGNEE_SERVICE_URL`, `COGNEE_API_KEY` | Cognee **Cloud** endpoint + key | – |
| `COGNEE_LOCAL_SERVICE_URL` | Self-hosted Cognee HTTP URL (e.g. `http://cognee-local:8000`) | – |
| `COGNEE_ALLOW_OFFLINE_FALLBACK` | Fall back to offline mirror if Cognee fails | `true` |
| `OPENAI_API_KEY` | LLM key Cognee uses for cognify/recall | – |
| `FRONTEND_ORIGIN` | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |
| `VITE_MEMORYMESH_API_BASE_URL` | Public API URL the browser UI calls (build/run-time) | inferred |

Env templates: `.env.example` (full), `.env.oss.example` (self-hosted Cognee), `.env.cloud.example` (Cognee Cloud), `.env.vercel.example` (serverless). Mode-specific guides: [`docs/OPEN_SOURCE_COGNEE_MODE.md`](docs/OPEN_SOURCE_COGNEE_MODE.md), [`docs/COGNEE_CLOUD_MODE.md`](docs/COGNEE_CLOUD_MODE.md). API details: [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md).

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
docs/UI_DESIGN_SPEC.md              UI design, screen structure, interaction model, and acceptance checklist
docs/WORKSPACE_AND_UI_BLUEPRINT.md  Consolidated product workspace and UI design
docs/LOCAL_SELF_HOSTED_MEMORY_CONSOLE.md Local/self-hosted MemoryMesh console on top of Cognee
docs/CONNECTED_AGENTS_MCP_API_SDK.md Connected-agent model for Cursor, Codex, Claude Code, OpenClaw, custom agents
docs/COGNEE_VS_MEMORYMESH.md        Clear distinction between Cognee infrastructure and MemoryMesh product layer
```

## UI design documentation

The MemoryMesh UI is documented in [`docs/UI_DESIGN_SPEC.md`](docs/UI_DESIGN_SPEC.md) and the full product workspace direction is captured in [`docs/WORKSPACE_AND_UI_BLUEPRINT.md`](docs/WORKSPACE_AND_UI_BLUEPRINT.md). The current UI uses a restrained, professional layout with two user paths: **Run an agent** and **Connect your agent**. It keeps local/cloud memory choices user-facing as memory locations, not backend plumbing.

For judging, use the live React app connected to the API for the real proof run. Cognee Cloud success requires valid `COGNEE_SERVICE_URL` and `COGNEE_API_KEY`; production local mode requires `COGNEE_LOCAL_SERVICE_URL` or a compatible in-process Cognee SDK. Without a live memory backend, the UI should show a clear fallback state rather than silently claiming Cognee success.

## Winning demo narrative

**Before MemoryMesh:** the agent forgets the task, repeats investigation, loses the failed test, and starts from zero.

**With MemoryMesh:** the agent recalls the task contract, repo context, decision, failed test, checkpoint, and next safe action, then continues correctly.

One-line pitch:

> MemoryMesh gives AI agents durable memory of work, so they can recover, continue, and improve after context loss.

## Validation

Verified in this package:

```text
npm run build:agent                              passed
npm run build:console                            passed
python -m pytest services/api/tests -q           28 passed   (run from the repo root)
docker compose -f docker-compose.yml -f docker-compose.cognee-local.yml up -d --build   full stack healthy
```

Run `python -m pytest` from the repo root: one coding-agent test resolves `examples/memorymesh-sample-dashboard-service` by relative path. The full `docker compose` stack has been verified end-to-end (signup persists across restarts; `cognee_cloud` and `local_cognee` return `fallback_used=false`).

## UI intent: user-facing agent workspace

The MemoryMesh UI intentionally opens with **no claimed proof result**, but it is not an empty console. It should feel like a polished workspace where users can:

1. choose **Run an agent** or **Connect your agent**;
2. select a built-in assistant or an existing external tool;
3. choose where the agent remembers work: private local memory, managed cloud memory, or demo memory;
4. start a session or copy a connection plan;
5. inspect memory activity, recovery summary, outcome evidence, and forget controls after a run.

The real hackathon proof should be run from the React app connected to the API.

## Main UI wiring

The main coding-agent app is the React/Vite workspace in `apps/coding-agent-demo/src`. It exposes the product pages, demo entry, memory-mode flows, built-in agents, and connected-agent paths used by the live deployment.

## Latest UI correction - user-facing workspace redesign

The workspace UI has been redesigned away from an internal proof console into a user-facing agent workspace. It now centers on a simple flow: run an agent or connect an existing one, enter a task, choose where the agent remembers the work, start a session, and review memory activity, recovery, and outcome. Build, Research, and Support are wired built-in agents; Cursor/Codex/Claude Code/OpenClaw/custom agents are shown through the connection path.

See `docs/WORKSPACE_AND_UI_BLUEPRINT.md` for the UI intent and design direction.
