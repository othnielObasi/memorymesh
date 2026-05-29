export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type MemoryBackend = "local_cognee" | "cognee_cloud" | "offline_mirror";
export type AgentId = "build" | "research" | "support" | (string & {});

export interface MemoryMeshClientOptions {
  baseUrl: string;
  apiKey?: string;
  apiKeyHeader?: "X-MemoryMesh-API-Key" | "Authorization" | (string & {});
  fetch?: typeof fetch;
  defaultMemoryBackend?: MemoryBackend;
  defaultHeaders?: Record<string, string>;
}

export interface MemoryMeshErrorBody {
  detail?: unknown;
  message?: string;
  [key: string]: unknown;
}

export interface HealthResponse {
  status?: string;
  app?: string;
  version?: string;
  [key: string]: unknown;
}

export interface StartRunInput {
  agentId: string;
  task: string;
  datasetType?: string;
  taskVersion?: number;
  parentCheckpointId?: string;
  simulateRestart?: boolean;
  taskModification?: string;
  idempotencyKey?: string;
}

export interface ToolTraceInput {
  tool: string;
  toolType?: "read" | "write" | "external_action" | "unknown";
  input: Record<string, Json>;
  output: Record<string, Json>;
  validation?: Record<string, Json>;
  observedSignals?: Record<string, Json>;
  checkpointId?: string;
  traceId?: string;
  idempotencyKey?: string;
}

export interface ResumeStateInput {
  currentStep?: string;
  pageToken?: string | null;
  partialResultsRef?: string | null;
  partialResults?: Record<string, Json>[];
  validatedRecords?: number;
  pendingActions?: Record<string, Json>[];
  observedSignals?: Record<string, Json>;
}

export interface CheckpointInput {
  checkpointName: string;
  state: Record<string, Json>;
  resumeState?: ResumeStateInput;
  safeToResume?: boolean;
  requiresHumanReview?: boolean;
  metadata?: Record<string, Json>;
}

export interface ActionExecutionInput {
  toolName: string;
  toolType?: "write" | "external_action" | "read" | "unknown";
  idempotencyKey: string;
  input?: Record<string, Json>;
}

export interface FireworksPlanInput {
  task: string;
  runEvents?: string[];
  checkpointId?: string;
  taskVersion?: number;
}

export interface VoiceSummaryInput {
  text: string;
  voiceId?: string;
  runId?: string;
  checkpointId?: string;
}


export interface MemoryInput {
  text?: string;
  query?: string;
  feedback?: string;
  dataset?: string;
  sessionId?: string;
  topK?: number;
  metadata?: Record<string, Json>;
  backend?: MemoryBackend;
}

export interface AgentRunInput {
  agentId?: AgentId;
  task: string;
  repositoryName?: string;
  workspacePath?: string;
  githubUrl?: string;
  backend?: MemoryBackend;
}

export interface MemoryOperation {
  operation?: string;
  provider?: string;
  backend?: MemoryBackend | string;
  status?: string;
  fallback_used?: boolean;
  error?: string | null;
  dataset?: string;
  session_id?: string;
  content?: unknown;
  [key: string]: unknown;
}

export interface AgentRunReceipt {
  run_id: string;
  task_id: string;
  agent_id: string;
  agent_name: string;
  task: string;
  status: string;
  final_output: string;
  evidence: unknown[];
  memory_operations: MemoryOperation[];
  tool_traces: unknown[];
  recovery: Record<string, unknown>;
  outcome: Record<string, unknown>;
  model_trace: Record<string, unknown>;
  created_at: string;
  raw?: Record<string, unknown>;
}

export interface CodingAgentRunInput {
  task?: string;
  repositoryName?: string;
  workspacePath?: string;
  dataset?: string;
  sessionId?: string;
  resetWorkspace?: boolean;
  simulateContextLoss?: boolean;
  runTests?: boolean;
  forgetAfterRun?: boolean;
  backend?: MemoryBackend;
}
