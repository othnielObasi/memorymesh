# MemoryMesh TypeScript SDK

MemoryMesh gives AI agents durable work memory: decisions, evidence, tool traces, checkpoints, recovery state, and inspectable run receipts.

Use this SDK from Node.js services, browser apps, agent workers, internal tools, or framework adapters that need to talk to a MemoryMesh API deployment.

## What You Can Build

- Run a MemoryMesh built-in/reference agent and receive a receipt.
- Store, recall, improve, and forget Cognee-backed memory.
- Record tool traces and checkpoints around your own tools.
- Stream run events for live UIs.
- Integrate with LangGraph, CrewAI-style flows, OpenAI Agents-style middleware, or custom agents.

## Install

```bash
npm install @memorymsh/sdk
```

Requirements:

- Node.js 18+
- A MemoryMesh API URL
- A signed session token or API key when auth is enabled

## Choose a Memory Mode

| Mode | Backend value | Best for |
| --- | --- | --- |
| Local/self-hosted Cognee | `local_cognee` | Private developer machines, self-hosted teams, regulated environments. |
| Cognee Cloud | `cognee_cloud` | Managed memory with minimal infrastructure work. |
| Demo/offline mirror | `offline_mirror` | Demos, tests, and fallback when Cognee is unavailable. |

## Connect to MemoryMesh

```ts
import { MemoryMeshClient } from "@memorymsh/sdk";

const client = new MemoryMeshClient({
  baseUrl: process.env.MEMORYMESH_API_URL ?? "http://149.28.238.73:8000",
  apiKey: process.env.MEMORYMESH_API_KEY,
  defaultMemoryBackend: "cognee_cloud",
});
```

For a signed user session or a gateway that expects bearer auth:

```ts
const client = new MemoryMeshClient({
  baseUrl: "https://your-memorymesh-api.example.com",
  apiKey: process.env.MEMORYMESH_SESSION_TOKEN,
  apiKeyHeader: "Authorization",
});
```

For API-key deployments, keep the default `X-MemoryMesh-API-Key` header:

```ts
const client = new MemoryMeshClient({
  baseUrl: "https://your-memorymesh-api.example.com",
  apiKey: process.env.MEMORYMESH_API_KEY,
});
```

## Verify the Runtime

```ts
console.log(await client.health());
console.log(await client.memoryStatus("cognee_cloud", true));
```

## Run an Agent and Inspect the Receipt

```ts
const receipt = await client.runAgent({
  agentId: "research",
  task: "Compare durable memory options for coding agents.",
  backend: "cognee_cloud",
});

console.log(receipt.run_id);
console.log(receipt.status);
console.log(receipt.final_output);
console.log(receipt.receipt_ref);

for (const op of receipt.memory_operations) {
  console.log(op.operation, op.backend, op.status);
}
```

Agent ids currently used by the reference runtime:

| Agent | Purpose |
| --- | --- |
| `build` | Code/project work with checkpoints, test traces, and handoff receipts. |
| `research` | Source-backed investigation with memory and reusable findings. |
| `support` | Ticket/support investigation with tool traces and recovery state. |

The response is both a flat receipt and, on newer APIs, includes `receipt` and `receipt_ref` for clients that prefer an explicit receipt envelope.

## Remember, Recall, Improve, Forget

```ts
const sessionId = "pricing-research-2026-07";

await client.remember({
  text: "The research agent found that pricing pages changed after the July launch.",
  dataset: "gtm-intelligence",
  sessionId,
  metadata: { source: "pricing_monitor", confidence: 0.86 },
});

const matches = await client.recall({
  query: "What changed on pricing pages?",
  dataset: "gtm-intelligence",
  sessionId,
  topK: 3,
});

await client.improveMemory({
  feedback: "Future GTM research should compare pricing claims against saved baseline evidence.",
  dataset: "gtm-intelligence",
  sessionId,
});

// Use carefully in production.
await client.forgetMemory("gtm-intelligence", sessionId);
```

## Tool Tracing and Checkpoints

Wrap your agent tools so MemoryMesh records what happened and can recover after a crash or handoff.

```ts
import { MemoryMeshClient, wrapTool } from "@memorymsh/sdk";

const client = new MemoryMeshClient("http://localhost:8000");

const run = await client.startRun({
  agentId: "support-agent",
  task: "Investigate payment failures.",
});

const fetchTickets = wrapTool(
  client,
  run.task_id,
  async (status: string) => [{ id: "ticket_1", status, priority: "high" }],
  {
    toolName: "fetch_tickets",
    toolType: "read",
    checkpointAfter: true,
    validation: (_args, result) => ({ records: result.length }),
    observedSignals: (_args, result) => ({
      hasHighPriority: result.some((ticket) => ticket.priority === "high"),
    }),
  },
);

await fetchTickets("open");
```

For external actions such as sending email, filing a ticket, or changing infrastructure, pass a stable `idempotencyKey` so the server can prevent duplicate side effects.

## Stream Events

```ts
for await (const event of client.streamEventIterator(run.task_id)) {
  console.log(event);
}
```

Browser clients can use:

```ts
const stream = client.streamEvents(run.task_id);
stream.onmessage = (event) => console.log(JSON.parse(event.data));
```

## Framework Adapters

```ts
import {
  MemoryMeshCheckpointer,
  MemoryMeshCrewAIAdapter,
  MemoryMeshLangGraphAdapter,
  MemoryMeshOpenAIAgentsMiddleware,
} from "@memorymsh/sdk";
```

Use adapters when you already have a framework runtime. Use `wrapTool` when you want the smallest framework-neutral integration.

## Error Handling

```ts
import { MemoryMeshError } from "@memorymsh/sdk";

try {
  await client.memoryStatus("cognee_cloud", true);
} catch (error) {
  if (error instanceof MemoryMeshError) {
    console.error(error.status, error.detail ?? error.body);
  }
}
```

## Production Checklist

- Set `MEMORYMESH_API_URL` to your deployed API.
- Use `Authorization` for signed user sessions or `X-MemoryMesh-API-Key` for API-key deployments.
- Pick the memory backend intentionally: `local_cognee`, `cognee_cloud`, or `offline_mirror`.
- Store source URLs and evidence metadata so receipts are auditable.
- Use checkpoints before long or risky tool sequences.
- Use idempotency keys for write/external actions.
- Use `forgetMemory` for temporary, sensitive, or stale sessions.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `401` | Use the correct header: `Authorization` for session tokens, `X-MemoryMesh-API-Key` for API keys. |
| Cognee status not ready | Check `COGNEE_SERVICE_URL`, `COGNEE_API_KEY`, and whether fallback is enabled. |
| Empty recall results | Use the same `dataset`, `sessionId`, and backend used by `remember`. |
| Duplicate external action | Add a stable idempotency key to action/tool execution. |
| Receipt is missing expected evidence | Ensure tools are wrapped or evidence is passed into memory metadata. |

## Links

- Repository: https://github.com/othnielObasi/memorymesh
- Documentation: https://github.com/othnielObasi/memorymesh/tree/main/docs
- Live API used in examples: http://149.28.238.73:8000
