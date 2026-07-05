# MemoryMesh Local: Open-source Cognee Track Submission

## Track

**Track 1: Best Use of Cognee Open Source**

## Project Name

**MemoryMesh Local**

## Positioning

MemoryMesh Local is the self-hosted version of MemoryMesh. It turns open-source Cognee into a private work-memory layer for coding, research, and support agents.

This is distinct from the Cognee Cloud submission angle:

- **MemoryMesh Cloud** proves managed shared memory with Cognee Cloud.
- **MemoryMesh Local** proves private self-hosted memory with open-source Cognee.

The same MemoryMesh agent workflow runs on both, but Track 1 is judged on the local open-source Cognee path.

## Project Description

MemoryMesh Local gives AI agents durable private memory using open-source Cognee. It is built for developers and teams who want their coding or support agent to remember work context without sending project memory to a hosted MemoryMesh service.

The local workflow is:

1. Start a local open-source Cognee service.
2. Start the MemoryMesh API with `MEMORYMESH_MEMORY_BACKEND=local_cognee`.
3. Run a memory-backed coding agent task.
4. Store task contract, repo map, decisions, failure signals, and handoff instructions in Cognee.
5. Simulate context loss.
6. Recall the recovery brief from Cognee.
7. Continue the task and return a receipt showing the memory operations.

The proof runner disables offline fallback, so a passing run proves that open-source Cognee is actually being used.

## GitHub Link

https://github.com/othnielObasi/memorymesh

## Deployed Link

The hosted app is available here:

https://memorymesh-two.vercel.app

For Track 1, the primary proof is local/self-hosted because open-source Cognee runs in the user's own environment.

## How Judges Can Verify Track 1

Run:

```bash
npm install
python scripts/run_open_source_cognee_local.py
```

The runner starts:

- MemoryMesh Local Cognee Service: `http://127.0.0.1:8001`
- MemoryMesh API: `http://127.0.0.1:8000`

It sets:

```env
MEMORYMESH_MEMORY_BACKEND=local_cognee
COGNEE_ENABLED=true
COGNEE_ALLOW_OFFLINE_FALLBACK=false
COGNEE_LOCAL_SERVICE_URL=http://127.0.0.1:8001
```

Then it runs the strict proof:

```bash
python scripts/run_hackathon_demo.py --base-url http://127.0.0.1:8000 --backend local_cognee
```

A passing run writes:

```text
.memorymesh-local/open-source-proof.json
```

That proof file records:

- `backend=local_cognee`
- `provider=Open-source Cognee`
- `fallback_allowed=false`
- `fallback_used=false`
- local Cognee service URL
- MemoryMesh API URL
- verified capabilities

## Describe How Cognee Open Source Is Used

MemoryMesh Local uses open-source Cognee as the memory backend for agent work. Cognee is responsible for durable graph/vector memory, while MemoryMesh provides the agent workspace, receipts, recovery state, and SDK/MCP/API access.

During a local agent run, MemoryMesh calls Cognee-backed lifecycle operations:

- **remember** stores project context, task contracts, decisions, file traces, failure signals, and handoff instructions.
- **recall** retrieves prior work memory after simulated context loss.
- **improve** stores verified lessons and recovery guidance after the task completes.
- **forget** removes temporary session memory during cleanup.

This proves open-source Cognee is not only installed, but actively used in the agent workflow. The local proof disables offline fallback, so if Cognee is unavailable or a memory operation falls back, the proof fails.

## What Makes This Strong For Track 1

- Uses `local_cognee`, not the cloud backend.
- Runs open-source Cognee as a local service.
- Disables fallback during proof.
- Produces a machine-readable proof file.
- Demonstrates real agent memory lifecycle, not just a single API call.
- Shows context-loss recovery from Cognee memory.
- Keeps project memory private and self-hosted.
- Can be used by local developer tools through API, SDK, or MCP.

## Video Guidance For Track 1

Use a video focused on the local path:

1. Show the command:

   ```bash
   python scripts/run_open_source_cognee_local.py
   ```

2. Show the local status:

   ```text
   backend: local_cognee
   provider: Open-source Cognee
   fallback_allowed: false
   fallback_used: false
   ```

3. Show the workflow:

   - remember task context,
   - recall after context loss,
   - improve memory,
   - forget cleanup,
   - receipt/proof file.

4. Explain the architecture:

   ```text
   MemoryMesh UI/API/SDK/MCP
       -> local_cognee router
       -> self-hosted open-source Cognee service
       -> private local graph/vector memory
   ```

5. End with the value:

   > MemoryMesh Local makes open-source Cognee usable as private durable work memory for real coding and agent workflows.

## Short Pitch

MemoryMesh Local turns open-source Cognee into a private memory layer for AI agents. It lets coding, research, and support agents remember work context, recover after context loss, improve memory over time, and produce receipts, while keeping project memory self-hosted.

