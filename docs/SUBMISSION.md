# MemoryMesh Hackathon Submission

## Recommended Track

**Track 2: Best Use of Cognee Cloud**

Reason: the deployed MemoryMesh demo is live on Vercel and uses Cognee Cloud as the managed memory backend. The project also supports a self-hosted/open-source Cognee path, but the public judging experience is strongest and easiest to verify through Cognee Cloud.

## Form Responses

### Track you are submitting for

Track 2: Best Use of Cognee Cloud

### Project description

MemoryMesh is a durable memory layer for AI coding, research, and support agents. Most agents lose useful context between sessions: prior decisions, source trails, unresolved tasks, customer history, and why a tool made a recommendation. MemoryMesh solves this by placing Cognee-backed memory behind a clean product, SDK, MCP server, and API so agents can remember, recall, improve, and forget context across runs.

The product has three modes:

- **Demo memory**: no login required, so judges and first-time users can immediately see how a memory-backed agent behaves.
- **Cloud memory**: managed Cognee Cloud memory for team workspaces, persistent runs, API keys, and shared agent memory.
- **Local memory**: self-hosted/open-source Cognee mode for developers who need private memory on their own infrastructure.

The core workflow is simple: choose an agent, connect or select project context, run a task, store the useful work memory in Cognee, recall it across later runs, and return an auditable receipt showing what was remembered, recalled, improved, and forgotten.

### GitHub link to project

https://github.com/othnielObasi/memorymesh

### Deployed link to project

https://memorymesh-two.vercel.app

API:

https://api-two-blue-75.vercel.app

### YouTube video demo link

TODO: Add the final YouTube link after recording.

Suggested title:

**MemoryMesh: Durable Cognee Cloud Memory for AI Agents**

### Describe how you have used Cognee in your project

MemoryMesh uses Cognee as the memory engine behind agent runs. Cognee is not treated as a side integration; it is the system of record for reusable agent memory.

In the Cloud track, MemoryMesh connects to Cognee Cloud so user and team workspaces can store persistent memory without running infrastructure. Agent runs call Cognee-backed memory operations during the workflow:

- **remember**: store task context, project facts, decisions, source trails, and run outputs.
- **recall**: retrieve relevant memory before or during a new agent task.
- **improve**: enrich and refine stored memory after the run so future recalls become more useful.
- **forget**: remove temporary, stale, or unwanted memory when cleanup is required.

MemoryMesh wraps these memory operations in a product experience designed for working agents: run receipts, memory operations, recovery checkpoints, SDK access, MCP access, API keys, and multiple memory modes. The goal is to make Cognee memory usable not only in a single script, but across real coding agents, research agents, support agents, IDEs, and team workflows.

The project also includes an open-source/self-hosted Cognee path. This mode runs a local MemoryMesh API against a local Cognee service and verifies that memory operations work with offline fallback disabled. That proves the architecture can support both managed Cognee Cloud and private Cognee deployments.

## Three-Minute Video Outline

### 0:00 - 0:25: Problem

Most AI agents are stateless. They may answer one request well, but they forget project decisions, previous runs, source trails, support context, and what they already learned. That makes coding and research agents repeat themselves, lose continuity, and become hard to trust.

### 0:25 - 0:55: Solution

MemoryMesh gives agents durable memory powered by Cognee. It lets an agent remember useful context, recall it later, improve memory over time, and forget stale data. It exposes this through a web app, SDKs, MCP server, and API.

### 0:55 - 1:35: Demo

Show the deployed app:

1. Open the demo mode.
2. Choose an agent such as Build, Research, or Support.
3. Run a sample task.
4. Show the receipt, memory operations, and recalled context.
5. Show how the agent output is no longer just a chat answer; it includes reusable memory and proof.

### 1:35 - 2:10: Cognee Usage

Explain that Cognee Cloud is the memory backend for the deployed app. MemoryMesh calls Cognee through the memory lifecycle:

- remember important run context,
- recall relevant memory,
- improve/refine the memory,
- forget what should not persist.

Mention that MemoryMesh also supports local/self-hosted Cognee for private developer environments.

### 2:10 - 2:40: Architecture

Tech stack:

- React/Vite frontend on Vercel
- FastAPI backend on Vercel
- Postgres document store for tenant/run records
- Cognee Cloud for durable managed memory
- Local Cognee service for self-hosted mode
- TypeScript SDK, Python SDK, and MCP server for agent integrations

### 2:40 - 3:00: Why It Matters

MemoryMesh turns Cognee memory into a usable agent platform. Developers can plug it into Cursor, Codex, Claude, or custom agents. Teams can use Cloud memory for shared context. Privacy-sensitive users can run local memory. The result is an AI agent workflow that remembers, recovers, and improves instead of starting from zero every time.

## Submission Readiness Evidence

Latest verification before submission:

- Frontend live URL returns HTTP 200.
- API health returns `ok`.
- Postgres is connected.
- Cognee Cloud reports ready.
- Signup, login, and `/me` resolve the same persisted user workspace.
- Python tests pass.
- Frontend production build passes.
- Open-source/local Cognee proof path passes with fallback disabled.

## Short Pitch

MemoryMesh gives AI agents durable memory powered by Cognee Cloud. It lets coding, research, and support agents remember useful work context, recall it across sessions, improve it over time, and produce receipts that show what happened. It ships as a web app, API, SDKs, MCP server, cloud mode, demo mode, and local self-hosted mode.

