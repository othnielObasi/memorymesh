# End-to-End System Audit - 2026-07-03

## Scope

This audit covers the current MemoryMesh product path:

```text
Landing page -> auth/signup -> workspace -> agent run -> API -> Cognee/offline memory -> receipt -> UI rendering
```

It also covers backend contracts, custom auth and tenancy, memory backends, local/self-hosted Cognee configuration, deployment config, SDK packages, and browser-level behavior.

## Current Verdict

MemoryMesh is functional for the core demo/cloud/local product story, but it is not yet fully release-clean.

Working now:

- Custom signup/login/session flow works against the current API.
- Tenant context is attached to signed sessions and agent receipts.
- Demo memory/offline mirror works and is clearly labelled as fallback.
- Cognee Cloud status and lifecycle can work when tenant URL/key are configured.
- Local/self-hosted Cognee now has a production path through `COGNEE_LOCAL_SERVICE_URL`.
- Browser flow works when the frontend points at the correct API base.
- The main coding-agent demo frontend builds and e2e tests pass.

Still needs attention before a serious production push:

- TypeScript workspace builds are not reproducible until `typescript` is installed/available for `@memorymsh/sdk` and `@memorymesh/console`.
- Vercel API config currently enables `MEMORYMESH_DEV_INMEMORY_STORE=true`, which is acceptable for preview demos but not durable production.
- The normal workspace top bar and bottom memory-location cards still show some static status instead of fully live service status.
- The Playwright suite now protects auth routing, but it still does not cover a full real agent run in CI.

## Evidence

### Automated Checks

| Check | Result | Evidence |
|---|---:|---|
| API tests | Pass | `26 passed` |
| Main frontend build | Pass | `vite build` completed |
| Main frontend e2e | Pass | `2 passed` |
| Python SDK build | Pass | `memorymesh_sdk-0.1.0` sdist/wheel built |
| TypeScript SDK build | Fail | `tsc` not recognized |
| Console build | Fail | `tsc` not recognized |
| Docker Compose config | Not verified | Docker CLI unavailable in this shell |

### Live HTTP Smoke

Fresh API run on `127.0.0.1:8010` with in-memory store:

- `GET /health` returned `200`.
- `GET /ready` returned `200`.
- `POST /api/auth/signup` returned a signed `mms_` token.
- `GET /api/auth/me` resolved the tenant context.
- `POST /api/agents/run` returned a research receipt with 3 memory operations.
- Repeating the same idempotency key returned the same run with `idempotent_replay=true`.
- Offline memory remember/recall returned a recalled result.

### Browser Flow

Fresh frontend on `127.0.0.1:4181` with `VITE_MEMORYMESH_API_BASE_URL=http://127.0.0.1:8010`:

- Landing page loaded.
- Signup completed.
- Workspace opened.
- Demo memory selected.
- Research Assistant ran.
- Backend receipt rendered.
- Memory operations rendered.
- Outcome rendered.
- No browser console errors, page errors, or failed API requests.

## Fixes Applied During Audit

### Local Preview API Routing

Problem:

When the Vite app was served from preview ports such as `4179` or `4180`, auth submitted to the frontend origin:

```text
POST http://127.0.0.1:4180/api/auth/signup -> 404
```

Fix:

`resolveApiBase()` now routes any localhost/127.0.0.1 frontend port to `:8000`, unless explicitly overridden by `VITE_MEMORYMESH_API_BASE_URL`.

Files:

- `apps/coding-agent-demo/src/app/App.tsx`
- `apps/coding-agent-demo/src/app/pages/MemoryPage.tsx`
- `apps/coding-agent-demo/tests/landing-auth.spec.ts`

### Vercel Example API Prefix

Problem:

`.env.vercel.example` used:

```env
API_PREFIX=
```

The frontend and SDK call `/api/...`, so this config can break auth, memory, and agent routes.

Fix:

```env
API_PREFIX=/api
```

File:

- `.env.vercel.example`

### Local Cognee Service Wiring

Problem:

Docker Compose did not pass `COGNEE_LOCAL_SERVICE_URL` or `COGNEE_LOCAL_API_KEY` into the API container.

Fix:

- `docker-compose.yml` now passes both variables.
- `docker-compose.cognee-local.yml` defaults to `http://host.docker.internal:8001`.
- Docs explain when to use `127.0.0.1`, `host.docker.internal`, or `http://cognee:8000`.

## Production Risks

### 1. Durable Production Storage Is Not Guaranteed on Vercel

`services/api/vercel.json` currently sets:

```json
"MEMORYMESH_DEV_INMEMORY_STORE": "true"
```

That makes preview demos easier, but it means data is not durable in a production serverless runtime. For production, set this to `false` and provide a real managed Postgres `DATABASE_URL`.

Recommended next fix:

- Use managed Postgres.
- Set `MEMORYMESH_DEV_INMEMORY_STORE=false`.
- Add a production smoke that verifies a run survives a function restart.

### 2. TypeScript SDK and Console Builds Are Not Reproducible

Both fail because `tsc` is not available in the current installed workspace:

```text
'tsc' is not recognized as an internal or external command
```

Recommended next fix:

- Ensure workspace install includes TypeScript.
- Add a root CI command that runs:

```bash
npm run build:agent
npm run build:console
npm --workspace @memorymsh/sdk run build
```

### 3. UI Status Has Static Claims

The normal workspace top bar currently receives:

```tsx
memoryStatus="ready"
serviceStatus="operational"
```

The bottom memory-location cards also mark local/cloud memory as `ready` without reading live status.

Recommended next fix:

- Fetch `/api/system/status`.
- Fetch `/api/memory/status` for selected backend.
- Show `available`, `fallback`, or `needs setup` from the API response.

### 4. CI E2E Does Not Yet Run a Full Agent Session

The new e2e test verifies auth routing, but CI still does not run the full agent session path with an API server.

Recommended next fix:

- Start an in-memory API test server in Playwright.
- Run signup -> workspace -> demo memory -> research agent -> receipt rendered.

### 5. Local/Self-Hosted Cognee Needs a Real Service to Claim Production Local

The code now supports:

```env
COGNEE_LOCAL_SERVICE_URL=http://host.docker.internal:8001
```

But the repo does not currently define a Cognee service container. That is acceptable if users run Cognee separately, but the product should not claim one-command self-hosted Cognee until a Compose service or documented Cognee start command exists.

## Readiness Summary

| Area | Status | Notes |
|---|---|---|
| Landing/product UI | Working | Browser smoke passed |
| Signup/login | Working | Live HTTP and browser smoke passed |
| Tenant context | Working | Session resolves org/workspace/project |
| Demo memory | Working | Offline mirror remember/recall passed |
| Agent run receipt | Working | Research flow returned receipt and UI rendered it |
| Cognee Cloud | Partially verified | Previous smoke passed; native improve may be stored as improvement note |
| Local Cognee | Wiring improved | Needs actual self-hosted Cognee service for full proof |
| TypeScript SDK | Not clean | Build tooling missing `tsc` |
| Console app | Not clean | Build tooling missing `tsc` |
| Production persistence | Not clean | Vercel config uses in-memory store |

## Recommended Next Actions

1. Fix TypeScript workspace dependencies so console and SDK builds pass.
2. Decide production storage posture for Vercel: preview in-memory or durable Postgres.
3. Wire live backend status into the workspace top bar and memory-location cards.
4. Add full agent-session Playwright coverage with API server.
5. Add or document the actual self-hosted Cognee service command for `COGNEE_LOCAL_SERVICE_URL`.
