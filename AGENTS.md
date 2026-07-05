# MemoryMesh

## Cursor Cloud specific instructions

MemoryMesh is a polyglot monorepo: a Python/FastAPI backend plus React/Vite frontends,
Python/TypeScript SDKs, and a Node MCP server. The environment is set up so the backend
API and both frontends can run. `docker` is **not** available in this environment, so run
services directly (not via `docker compose`).

### Services and how to run them

Run everything from the repo root. Python commands require the virtualenv at `.venv`
(activate with `source .venv/bin/activate`).

| Service | Dir | Command | Port | Required? |
|---|---|---|---|---|
| API (FastAPI) | `services/api` | `source .venv/bin/activate && npm run api:dev` | 8000 | Required |
| coding-agent-demo (main UI) | `apps/coding-agent-demo` | `npm run dev:agent` | 5173 | Main product UI |
| console (operator UI) | `apps/console` | `npm run dev:console` | 5174 | Optional |

- Tests: `source .venv/bin/activate && python -m pytest services/api/tests` — **run from the
  repo root**, because `tests/test_real_coding_agent.py` uses the relative path
  `examples/memorymesh-sample-dashboard-service` and fails if run from `services/api`.
- Lint/typecheck/build (UIs): `npm run build:agent`, `npm run build:console` (console build
  runs `tsc` first).

### Non-obvious gotchas

- **`python` must be on PATH with pytest available.** The coding agent
  (`services/api/app/services/real_coding_agent.py`) shells out to `python -m pytest -q`
  inside a copied sample repo. This environment only ships `python3`, so **always activate
  the venv (`source .venv/bin/activate`) before starting the API**; that puts a `python`
  (with pytest) on PATH for the agent's subprocess. Without it, `/api/coding-agent/run` and
  two `test_real_coding_agent.py` tests fail with `FileNotFoundError: 'python'`.
- **No keys / no Docker needed to run and test.** Start the API with
  `MEMORYMESH_DEV_INMEMORY_STORE=true`, `MEMORYMESH_MEMORY_BACKEND=offline_mirror`,
  `AUTH_REQUIRED=false`, `MEMORYMESH_ALLOW_ANY_LOCAL_PROJECT=true`. This bypasses PostgreSQL
  and Cognee and gives a fully keyless, deterministic end-to-end path. The `local_cognee`
  and `cognee_cloud` backends additionally require the heavy `cognee==1.1.2` package
  (`services/cognee-local`) and/or Cognee Cloud credentials, so `services/cognee-local`
  tests are skipped in this setup (`ModuleNotFoundError: No module named 'cognee'`).
- **Frontend → API wiring:** set `VITE_MEMORYMESH_API_BASE_URL=http://127.0.0.1:8000` for
  the Vite dev servers so the UI talks to the local API.
- **Local self-hosted memory console** is a `?mode=local` flag on the `coding-agent-demo`
  app (dev `http://127.0.0.1:5173/?mode=local`), not the separate `console` app on `:5174`.
- **Open-source Cognee proof** (`python scripts/run_open_source_cognee_local.py`, aka
  `npm run demo:oss:local`) requires the heavy `cognee` package and writes its proof to
  `.memorymesh-local/open-source-proof.json`.
- **npm installs are network-flaky here.** The registry gateway intermittently drops
  connections (`ECONNRESET`), which triggers npm's "Exit handler never called!" crash, and
  the optional-dependency bug (npm #4828) can skip platform-native bindings
  (`@rolldown/binding-linux-x64-gnu`, `lightningcss-linux-x64-gnu`) needed by the console's
  `vite@8` build. The dependencies are already installed/cached in this VM, so prefer
  `npm install --prefer-offline`. If a native-binding error appears, seed it with
  `npm cache add <pkg>@<version>` (retrying) then rerun `npm install --offline`.
- The coding-agent loop writes workspaces to `/tmp/memorymesh-workspaces` and patches a copy
  of `examples/memorymesh-sample-dashboard-service` (the source repo is left untouched).
