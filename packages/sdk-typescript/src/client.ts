import type {
  ActionExecutionInput,
  AgentRunInput,
  AgentRunReceipt,
  CheckpointInput,
  CodingAgentRunInput,
  FireworksPlanInput,
  HealthResponse,
  MemoryInput,
  MemoryMeshClientOptions,
  MemoryMeshErrorBody,
  StartRunInput,
  ToolTraceInput,
  VoiceSummaryInput,
} from "./types.js";

export class MemoryMeshError extends Error {
  readonly status: number;
  readonly body: string;
  readonly detail?: unknown;

  constructor(message: string, status: number, body: string, detail?: unknown) {
    super(message);
    this.name = "MemoryMeshError";
    this.status = status;
    this.body = body;
    this.detail = detail;
  }
}

export class MemoryMeshClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly apiKeyHeader: string;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;
  private readonly defaultMemoryBackend?: string;

  constructor(baseUrlOrOptions: string | MemoryMeshClientOptions, apiKey?: string) {
    const options: MemoryMeshClientOptions =
      typeof baseUrlOrOptions === "string" ? { baseUrl: baseUrlOrOptions, apiKey } : baseUrlOrOptions;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.apiKeyHeader = options.apiKeyHeader ?? "X-MemoryMesh-API-Key";
    this.fetchImpl = options.fetch ?? fetch;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.defaultMemoryBackend = options.defaultMemoryBackend;
  }

  private authHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    if (this.apiKeyHeader.toLowerCase() === "authorization") {
      return { Authorization: this.apiKey.toLowerCase().startsWith("bearer ") ? this.apiKey : `Bearer ${this.apiKey}` };
    }
    return { [this.apiKeyHeader]: this.apiKey };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.defaultHeaders,
      ...this.authHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    };
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, { ...init, headers });
    const body = await res.text();
    if (!res.ok) {
      let parsed: MemoryMeshErrorBody | undefined;
      try {
        parsed = body ? (JSON.parse(body) as MemoryMeshErrorBody) : undefined;
      } catch {
        parsed = undefined;
      }
      const detail = parsed?.detail ?? parsed?.message;
      const message = typeof detail === "string" ? detail : `MemoryMesh request failed: ${res.status}`;
      throw new MemoryMeshError(message, res.status, body, detail);
    }
    return (body ? JSON.parse(body) : {}) as T;
  }

  health() {
    return this.request<HealthResponse>("/health");
  }

  systemStatus() {
    return this.request("/api/system/status");
  }

  startRun(input: StartRunInput) {
    return this.request("/api/tasks/run", {
      method: "POST",
      body: JSON.stringify({
        agent_id: input.agentId,
        task_description: input.task,
        dataset_type: input.datasetType ?? "support_tickets",
        task_version: input.taskVersion,
        parent_checkpoint_id: input.parentCheckpointId,
        simulate_restart: input.simulateRestart,
        task_modification: input.taskModification,
        idempotency_key: input.idempotencyKey,
      }),
    });
  }

  recoverTask(checkpointId: string, input: Partial<StartRunInput> = {}) {
    return this.request(`/api/tasks/recover`, {
      method: "POST",
      body: JSON.stringify({
        checkpoint_id: checkpointId,
        task_description: input.task,
        agent_id: input.agentId,
        dataset_type: input.datasetType,
        task_modification: input.taskModification,
        idempotency_key: input.idempotencyKey,
      }),
    });
  }

  recordEvent(taskId: string, code: string, payload: Record<string, unknown> = {}) {
    return this.request(`/api/runs/${taskId}/events`, { method: "POST", body: JSON.stringify({ code, payload }) });
  }

  recordToolTrace(taskId: string, trace: ToolTraceInput) {
    return this.request(`/api/runs/${taskId}/tool-traces`, {
      method: "POST",
      body: JSON.stringify({
        tool: trace.tool,
        tool_type: trace.toolType ?? "read",
        input: trace.input,
        output: trace.output,
        validation: trace.validation ?? {},
        observed_signals: trace.observedSignals ?? {},
        checkpoint_id: trace.checkpointId,
        trace_id: trace.traceId,
        idempotency_key: trace.idempotencyKey,
      }),
    });
  }

  saveCheckpoint(taskId: string, checkpoint: CheckpointInput) {
    return this.request(`/api/runs/${taskId}/checkpoints`, {
      method: "POST",
      body: JSON.stringify({
        checkpoint_name: checkpoint.checkpointName,
        state: checkpoint.state,
        resume_state: checkpoint.resumeState ?? {},
        safe_to_resume: checkpoint.safeToResume ?? true,
        requires_human_review: checkpoint.requiresHumanReview ?? false,
        metadata: checkpoint.metadata ?? {},
      }),
    });
  }

  restoreCheckpoint(checkpointId: string) {
    return this.request(`/api/checkpoints/${checkpointId}/restore`, { method: "POST", body: JSON.stringify({}) });
  }

  modifyTask(taskId: string, newTaskDescription: string, modification: string, parentCheckpointId?: string) {
    return this.request(`/api/tasks/${taskId}/modify`, {
      method: "POST",
      body: JSON.stringify({ new_task_description: newTaskDescription, modification, parent_checkpoint_id: parentCheckpointId }),
    });
  }

  approveMemory(taskId: string, rule: string, appliesTo: string[], confidence = 0.8, evidence: Record<string, unknown> = {}) {
    return this.request(`/api/runs/${taskId}/memory/approve`, {
      method: "POST",
      body: JSON.stringify({ rule, applies_to: appliesTo, confidence, evidence }),
    });
  }

  executeAction(taskId: string, input: ActionExecutionInput) {
    return this.request(`/api/runs/${taskId}/actions/execute`, {
      method: "POST",
      body: JSON.stringify({
        tool_name: input.toolName,
        tool_type: input.toolType ?? "external_action",
        idempotency_key: input.idempotencyKey,
        input: input.input ?? {},
      }),
    });
  }

  listEvents(taskId: string) {
    return this.request(`/api/runs/${taskId}/events`);
  }

  streamEvents(taskId: string): EventSource {
    return new EventSource(`${this.baseUrl}/api/runs/${taskId}/stream`);
  }

  async *streamEventIterator(taskId: string): AsyncGenerator<unknown> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/runs/${taskId}/stream`, {
      headers: { ...this.defaultHeaders, ...this.authHeaders() },
    });
    if (!res.ok) throw new MemoryMeshError(`MemoryMesh stream failed: ${res.status}`, res.status, await res.text());
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) yield JSON.parse(line.slice("data: ".length));
      }
    }
  }

  generatePlan(input: FireworksPlanInput) {
    return this.request(`/api/ai/plan`, {
      method: "POST",
      body: JSON.stringify({ task_description: input.task, run_events: input.runEvents ?? [], checkpoint_id: input.checkpointId, task_version: input.taskVersion ?? 1 }),
    });
  }

  synthesizeRunSummary(input: VoiceSummaryInput) {
    return this.request(`/api/voice/run-summary`, {
      method: "POST",
      body: JSON.stringify({ text: input.text, voice_id: input.voiceId, run_id: input.runId, checkpoint_id: input.checkpointId }),
    });
  }


  memoryStatus(backend?: string, probe = false) {
    const params = new URLSearchParams();
    if (backend ?? this.defaultMemoryBackend) params.set("backend", backend ?? this.defaultMemoryBackend ?? "");
    if (probe) params.set("probe", "true");
    return this.request(`/api/memory/status${params.toString() ? `?${params}` : ""}`);
  }

  remember(input: MemoryInput) {
    return this.request(`/api/memory/remember`, {
      method: "POST",
      body: JSON.stringify({ text: input.text, dataset: input.dataset, session_id: input.sessionId, metadata: input.metadata ?? {}, backend: input.backend ?? this.defaultMemoryBackend }),
    });
  }

  recall(input: MemoryInput) {
    return this.request(`/api/memory/recall`, {
      method: "POST",
      body: JSON.stringify({ query: input.query, dataset: input.dataset, session_id: input.sessionId, top_k: input.topK ?? 5, metadata: input.metadata ?? {}, backend: input.backend ?? this.defaultMemoryBackend }),
    });
  }

  improveMemory(input: MemoryInput) {
    return this.request(`/api/memory/improve`, {
      method: "POST",
      body: JSON.stringify({ feedback: input.feedback ?? input.text, dataset: input.dataset, session_id: input.sessionId, metadata: input.metadata ?? {}, backend: input.backend ?? this.defaultMemoryBackend }),
    });
  }

  forgetMemory(dataset = "memorymesh-agent-work-memory", sessionId?: string, everything = false, backend?: string) {
    return this.request(`/api/memory/forget`, { method: "POST", body: JSON.stringify({ dataset, session_id: sessionId, everything, backend: backend ?? this.defaultMemoryBackend }) });
  }

  runAgent(input: AgentRunInput): Promise<AgentRunReceipt> {
    return this.request<AgentRunReceipt>(`/api/agents/run`, {
      method: "POST",
      body: JSON.stringify({
        agent_id: input.agentId ?? "build",
        task: input.task,
        repository_name: input.repositoryName,
        workspace_path: input.workspacePath,
        github_url: input.githubUrl,
        backend: input.backend ?? this.defaultMemoryBackend,
      }),
    });
  }

  runCodingAgent(input: CodingAgentRunInput = {}) {
    return this.request(`/api/coding-agent/run`, {
      method: "POST",
      body: JSON.stringify({
        task: input.task,
        repository_name: input.repositoryName ?? "sample-dashboard-service",
        workspace_path: input.workspacePath,
        dataset: input.dataset,
        session_id: input.sessionId,
        reset_workspace: input.resetWorkspace ?? true,
        simulate_context_loss: input.simulateContextLoss ?? true,
        run_tests: input.runTests ?? true,
        forget_after_run: input.forgetAfterRun ?? false,
        backend: input.backend,
      }),
    });
  }

  runCodingAgentRecoveryDemo(repositoryName = "sample-dashboard-service", realAgent = true, backend?: string) {
    return this.request(`/api/demo/coding-agent-recovery`, { method: "POST", body: JSON.stringify({ repository_name: repositoryName, real_agent: realAgent, backend }) });
  }

  runDualBackendProof(repositoryName = "sample-dashboard-service", backends = ["local_cognee", "cognee_cloud"]) {
    return this.request(`/api/demo/dual-backend-proof`, { method: "POST", body: JSON.stringify({ repository_name: repositoryName, backends }) });
  }

  partnerStatus() {
    return this.request(`/api/partners/status`);
  }
}
