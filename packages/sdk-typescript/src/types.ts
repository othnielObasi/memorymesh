export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type MemoryBackend = "local_cognee" | "cognee_cloud" | "offline_mirror";

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
