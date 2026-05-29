# MemoryMesh TypeScript SDK

MemoryMesh gives AI agents durable working memory, inspectable run receipts, checkpoints, and recovery state. Use this SDK from Node, browser apps, agent frameworks, or internal tools.

## Install

```bash
npm install @memorymsh/sdk
```

## Quick Start

```ts
import { MemoryMeshClient } from "@memorymsh/sdk";

const client = new MemoryMeshClient({
  baseUrl: "https://api-two-blue-75.vercel.app",
  apiKey: process.env.MEMORYMESH_API_KEY,
  defaultMemoryBackend: "cognee_cloud",
});

const receipt = await client.runAgent({
  agentId: "research",
  task: "Compare durable memory options for coding agents.",
});

console.log(receipt.final_output);
console.log(receipt.memory_operations);
```

## Memory

```ts
await client.remember({
  text: "The build agent should preserve project constraints before editing.",
  dataset: "agent-lessons",
});

const matches = await client.recall({
  query: "What should the build agent remember before editing?",
  dataset: "agent-lessons",
  topK: 3,
});
```

## Auth

The SDK defaults to the production MemoryMesh API header:

```ts
new MemoryMeshClient({
  baseUrl: "https://your-memorymesh-api.example.com",
  apiKey: process.env.MEMORYMESH_API_KEY,
});
```

For gateways that expect bearer auth:

```ts
new MemoryMeshClient({
  baseUrl: "https://your-memorymesh-api.example.com",
  apiKey: process.env.MEMORYMESH_API_KEY,
  apiKeyHeader: "Authorization",
});
```

## Tool Tracing

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
  async (status: string) => [{ id: "ticket_1", status }],
  {
    toolName: "fetch_tickets",
    validation: (_args, result) => ({ records: result.length }),
    checkpointAfter: true,
  },
);

await fetchTickets("open");
```

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
