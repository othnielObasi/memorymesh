#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const config = {
  apiBaseUrl: (process.env.MM_API_URL || process.env.MEMORYMESH_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, ""),
  apiKey: process.env.MM_API_KEY || process.env.MEMORYMESH_API_KEY || undefined,
  apiKeyHeader: process.env.MM_API_KEY_HEADER || "X-MemoryMesh-API-Key",
  agentId: process.env.MM_AGENT_ID || "connected-agent",
  project: process.env.MM_PROJECT || process.env.MM_DATASET || "current-project",
  memoryBackend: process.env.MM_MEMORY_BACKEND || "local_cognee",
};

function asObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function stringArg(args, key, fallback = "") {
  const value = args[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberArg(args, key, fallback) {
  const value = args[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function boolArg(args, key, fallback = false) {
  const value = args[key];
  return typeof value === "boolean" ? value : fallback;
}

function isJson(value) {
  if (value === null) return true;
  if (["string", "number", "boolean"].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isJson);
  if (typeof value === "object") return Object.values(value).every(isJson);
  return false;
}

function metadata(args) {
  const raw = asObject(args.metadata);
  return {
    ...Object.fromEntries(Object.entries(raw).filter(([, value]) => isJson(value))),
    agent_id: stringArg(args, "agent_id", config.agentId),
    project: stringArg(args, "dataset", config.project),
    source: "memorymesh-mcp",
  };
}

function headers() {
  const result = { "Content-Type": "application/json" };
  if (!config.apiKey) return result;
  if (config.apiKeyHeader.toLowerCase() === "authorization") {
    result.Authorization = config.apiKey.toLowerCase().startsWith("bearer ") ? config.apiKey : `Bearer ${config.apiKey}`;
  } else {
    result[config.apiKeyHeader] = config.apiKey;
  }
  return result;
}

async function api(path, init = {}) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...headers(),
      ...(init.headers || {}),
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new McpError(
      ErrorCode.InternalError,
      `MemoryMesh API ${response.status}: ${body || response.statusText}`,
    );
  }
  return body ? JSON.parse(body) : {};
}

function result(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

const tools = [
  {
    name: "memorymesh_status",
    description: "Check MemoryMesh and selected Cognee memory backend status.",
    inputSchema: {
      type: "object",
      properties: {
        backend: { type: "string", description: "Memory backend: local_cognee, cognee_cloud, or offline_mirror." },
        probe: { type: "boolean", description: "Whether to probe the backend connection." },
      },
    },
  },
  {
    name: "memorymesh_start_session",
    description: "Create a local session identity for an agent run. Use the returned session_id for remember/recall/improve.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string" },
        dataset: { type: "string" },
        agent_id: { type: "string" },
      },
    },
  },
  {
    name: "memorymesh_remember",
    description: "Store project/task decisions, tool traces, failures, source trails, or recovery notes in MemoryMesh.",
    inputSchema: {
      type: "object",
      required: ["text"],
      properties: {
        text: { type: "string" },
        dataset: { type: "string" },
        session_id: { type: "string" },
        backend: { type: "string" },
        metadata: { type: "object" },
      },
    },
  },
  {
    name: "memorymesh_recall",
    description: "Recall relevant project/task memory before or during an agent run.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string" },
        dataset: { type: "string" },
        session_id: { type: "string" },
        top_k: { type: "number" },
        backend: { type: "string" },
        metadata: { type: "object" },
      },
    },
  },
  {
    name: "memorymesh_improve",
    description: "Bridge feedback from this session into long-term memory so future agents behave better.",
    inputSchema: {
      type: "object",
      required: ["feedback"],
      properties: {
        feedback: { type: "string" },
        dataset: { type: "string" },
        session_id: { type: "string" },
        backend: { type: "string" },
        metadata: { type: "object" },
      },
    },
  },
  {
    name: "memorymesh_forget",
    description: "Forget a dataset/session from MemoryMesh when memory is stale, sensitive, or no longer needed.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: { type: "string" },
        session_id: { type: "string" },
        everything: { type: "boolean" },
        backend: { type: "string" },
      },
    },
  },
  {
    name: "memorymesh_run_agent",
    description: "Run a MemoryMesh built-in/reference agent and return its receipt.",
    inputSchema: {
      type: "object",
      required: ["task"],
      properties: {
        task: { type: "string" },
        agent_id: { type: "string" },
        repository_name: { type: "string" },
        workspace_path: { type: "string" },
        github_url: { type: "string" },
        backend: { type: "string" },
      },
    },
  },
  {
    name: "memorymesh_session_summary",
    description: "Recall a compact recovery summary for the current session or project.",
    inputSchema: {
      type: "object",
      properties: {
        dataset: { type: "string" },
        session_id: { type: "string" },
        query: { type: "string" },
        backend: { type: "string" },
      },
    },
  },
];

async function callTool(name, args) {
  const dataset = stringArg(args, "dataset", config.project);
  const sessionId = stringArg(args, "session_id", "");
  const backend = stringArg(args, "backend", config.memoryBackend);

  switch (name) {
    case "memorymesh_status": {
      const params = new URLSearchParams();
      params.set("backend", stringArg(args, "backend", config.memoryBackend));
      if (boolArg(args, "probe", true)) params.set("probe", "true");
      return result(await api(`/memory/status?${params}`));
    }
    case "memorymesh_start_session": {
      const id = `mm_${randomUUID()}`;
      return result({
        session_id: id,
        dataset,
        agent_id: stringArg(args, "agent_id", config.agentId),
        task: stringArg(args, "task", ""),
        memory_backend: backend,
        next: ["memorymesh_recall", "memorymesh_remember", "memorymesh_improve"],
      });
    }
    case "memorymesh_remember":
      return result(await api("/memory/remember", {
        method: "POST",
        body: JSON.stringify({
          text: stringArg(args, "text"),
          dataset,
          session_id: sessionId || undefined,
          backend,
          metadata: metadata(args),
        }),
      }));
    case "memorymesh_recall":
      return result(await api("/memory/recall", {
        method: "POST",
        body: JSON.stringify({
          query: stringArg(args, "query"),
          dataset,
          session_id: sessionId || undefined,
          top_k: numberArg(args, "top_k", 5),
          backend,
          metadata: metadata(args),
        }),
      }));
    case "memorymesh_improve":
      return result(await api("/memory/improve", {
        method: "POST",
        body: JSON.stringify({
          feedback: stringArg(args, "feedback"),
          dataset,
          session_id: sessionId || undefined,
          backend,
          metadata: metadata(args),
        }),
      }));
    case "memorymesh_forget":
      return result(await api("/memory/forget", {
        method: "POST",
        body: JSON.stringify({
          dataset,
          session_id: sessionId || undefined,
          everything: boolArg(args, "everything"),
          backend,
        }),
      }));
    case "memorymesh_run_agent":
      return result(await api("/agents/run", {
        method: "POST",
        body: JSON.stringify({
          agent_id: stringArg(args, "agent_id", "build"),
          task: stringArg(args, "task"),
          repository_name: stringArg(args, "repository_name") || undefined,
          workspace_path: stringArg(args, "workspace_path") || undefined,
          github_url: stringArg(args, "github_url") || undefined,
          backend,
        }),
      }));
    case "memorymesh_session_summary":
      return result(await api("/memory/recall", {
        method: "POST",
        body: JSON.stringify({
          query: stringArg(
            args,
            "query",
            "Summarize the current project memory, decisions, failures, next actions, and recovery context for this agent session.",
          ),
          dataset,
          session_id: sessionId || undefined,
          top_k: 8,
          backend,
          metadata: metadata(args),
        }),
      }));
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown MemoryMesh tool: ${name}`);
  }
}

const server = new Server(
  {
    name: "memorymesh-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async request => callTool(request.params.name, asObject(request.params.arguments)));

await server.connect(new StdioServerTransport());
