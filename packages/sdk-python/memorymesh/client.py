import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Iterator, Optional


class MemoryMeshError(RuntimeError):
    """Raised when the MemoryMesh API returns a non-success response."""

    def __init__(self, message: str, status: int, body: str = "", detail: Any = None):
        super().__init__(message)
        self.status = status
        self.body = body
        self.detail = detail


class MemoryMeshClient:
    """API-first client for MemoryMesh production runtime state.

    The SDK intentionally mirrors the infrastructure primitives: runs, events,
    tool traces, checkpoints, recovery, idempotent actions, and approved memory.
    """

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: int = 30,
        api_key_header: str = "X-MemoryMesh-API-Key",
        default_memory_backend: Optional[str] = None,
        default_headers: Optional[Dict[str, str]] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.api_key_header = api_key_header
        self.default_memory_backend = default_memory_backend
        self.default_headers = default_headers or {}

    def _auth_headers(self) -> Dict[str, str]:
        if not self.api_key:
            return {}
        if self.api_key_header.lower() == "authorization":
            value = self.api_key if self.api_key.lower().startswith("bearer ") else f"Bearer {self.api_key}"
            return {"Authorization": value}
        return {self.api_key_header: self.api_key}

    def _request(self, method: str, path: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any] | list[Any]:
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        headers = {"Content-Type": "application/json", **self.default_headers, **self._auth_headers()}
        req = urllib.request.Request(f"{self.base_url}{path}", data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            detail: Any = None
            try:
                parsed = json.loads(body) if body else {}
                detail = parsed.get("detail") or parsed.get("message")
            except json.JSONDecodeError:
                parsed = {}
            message = detail if isinstance(detail, str) else f"MemoryMesh request failed: {exc.code}"
            raise MemoryMeshError(message, exc.code, body, detail=detail) from exc

    def health(self) -> Dict[str, Any]:
        return self._request("GET", "/health")  # type: ignore[return-value]

    def system_status(self) -> Dict[str, Any]:
        return self._request("GET", "/api/system/status")  # type: ignore[return-value]

    def start_run(self, agent_id: str, task: str, dataset_type: str = "support_tickets", **kwargs: Any) -> Dict[str, Any]:
        return self._request("POST", "/api/tasks/run", {"agent_id": agent_id, "task_description": task, "dataset_type": dataset_type, **kwargs})  # type: ignore[return-value]

    def record_event(self, task_id: str, code: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._request("POST", f"/api/runs/{task_id}/events", {"code": code, "payload": payload or {}})  # type: ignore[return-value]

    def record_tool_trace(
        self,
        task_id: str,
        tool: str,
        input: Dict[str, Any],
        output: Dict[str, Any],
        validation: Optional[Dict[str, Any]] = None,
        observed_signals: Optional[Dict[str, Any]] = None,
        tool_type: str = "read",
        checkpoint_id: Optional[str] = None,
        trace_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request("POST", f"/api/runs/{task_id}/tool-traces", {
            "tool": tool,
            "tool_type": tool_type,
            "input": input,
            "output": output,
            "validation": validation or {},
            "observed_signals": observed_signals or {},
            "checkpoint_id": checkpoint_id,
            "trace_id": trace_id,
            "idempotency_key": idempotency_key,
        })  # type: ignore[return-value]

    def save_checkpoint(
        self,
        task_id: str,
        checkpoint_name: str,
        state: Dict[str, Any],
        resume_state: Optional[Dict[str, Any]] = None,
        safe_to_resume: bool = True,
        requires_human_review: bool = False,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return self._request("POST", f"/api/runs/{task_id}/checkpoints", {
            "checkpoint_name": checkpoint_name,
            "state": state,
            "resume_state": resume_state or {},
            "safe_to_resume": safe_to_resume,
            "requires_human_review": requires_human_review,
            "metadata": metadata or {},
        })  # type: ignore[return-value]

    def restore_checkpoint(self, checkpoint_id: str) -> Dict[str, Any]:
        return self._request("POST", f"/api/checkpoints/{checkpoint_id}/restore", {})  # type: ignore[return-value]

    def recover_task(self, checkpoint_id: str, **kwargs: Any) -> Dict[str, Any]:
        return self._request("POST", "/api/tasks/recover", {"checkpoint_id": checkpoint_id, **kwargs})  # type: ignore[return-value]

    def modify_task(self, task_id: str, new_task_description: str, modification: str, parent_checkpoint_id: Optional[str] = None) -> Dict[str, Any]:
        return self._request("POST", f"/api/tasks/{task_id}/modify", {"new_task_description": new_task_description, "modification": modification, "parent_checkpoint_id": parent_checkpoint_id})  # type: ignore[return-value]

    def approve_memory(self, task_id: str, rule: str, applies_to: list[str], confidence: float = 0.8, evidence: Optional[Dict[str, Any]] = None, **kwargs: Any) -> Dict[str, Any]:
        return self._request("POST", f"/api/runs/{task_id}/memory/approve", {"rule": rule, "applies_to": applies_to, "confidence": confidence, "evidence": evidence or {}, **kwargs})  # type: ignore[return-value]

    def execute_action(self, task_id: str, tool_name: str, idempotency_key: str, input: Optional[Dict[str, Any]] = None, tool_type: str = "external_action") -> Dict[str, Any]:
        return self._request("POST", f"/api/runs/{task_id}/actions/execute", {"tool_name": tool_name, "tool_type": tool_type, "idempotency_key": idempotency_key, "input": input or {}})  # type: ignore[return-value]

    def list_events(self, task_id: str) -> list[Any]:
        return self._request("GET", f"/api/runs/{task_id}/events")  # type: ignore[return-value]

    def stream_events(self, task_id: str) -> Iterator[Dict[str, Any]]:
        headers = {**self.default_headers, **self._auth_headers()}
        req = urllib.request.Request(f"{self.base_url}/api/runs/{task_id}/stream", headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            for raw_line in resp:
                line = raw_line.decode("utf-8").strip()
                if line.startswith("data: "):
                    yield json.loads(line[len("data: "):])

    def generate_plan(self, task: str, run_events: Optional[list[str]] = None, checkpoint_id: Optional[str] = None, task_version: int = 1) -> Dict[str, Any]:
        return self._request("POST", "/api/ai/plan", {"task_description": task, "run_events": run_events or [], "checkpoint_id": checkpoint_id, "task_version": task_version})  # type: ignore[return-value]

    def synthesize_run_summary(self, text: str, voice_id: Optional[str] = None, run_id: Optional[str] = None, checkpoint_id: Optional[str] = None) -> Dict[str, Any]:
        return self._request("POST", "/api/voice/run-summary", {"text": text, "voice_id": voice_id, "run_id": run_id, "checkpoint_id": checkpoint_id})  # type: ignore[return-value]


    def memory_status(self, backend: Optional[str] = None, probe: bool = False) -> Dict[str, Any]:
        query = {}
        selected_backend = backend or self.default_memory_backend
        if selected_backend:
            query["backend"] = selected_backend
        if probe:
            query["probe"] = "true"
        suffix = f"?{urllib.parse.urlencode(query)}" if query else ""
        return self._request("GET", f"/api/memory/status{suffix}")  # type: ignore[return-value]

    def remember(self, text: str, dataset: str = "memorymesh-agent-work-memory", session_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None, backend: Optional[str] = None) -> Dict[str, Any]:
        return self._request("POST", "/api/memory/remember", {"text": text, "dataset": dataset, "session_id": session_id, "metadata": metadata or {}, "backend": backend or self.default_memory_backend})  # type: ignore[return-value]

    def recall(self, query: str, dataset: str = "memorymesh-agent-work-memory", session_id: Optional[str] = None, top_k: int = 5, metadata: Optional[Dict[str, Any]] = None, backend: Optional[str] = None) -> Dict[str, Any]:
        return self._request("POST", "/api/memory/recall", {"query": query, "dataset": dataset, "session_id": session_id, "top_k": top_k, "metadata": metadata or {}, "backend": backend or self.default_memory_backend})  # type: ignore[return-value]

    def improve_memory(self, feedback: str, dataset: str = "memorymesh-agent-work-memory", session_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None, backend: Optional[str] = None) -> Dict[str, Any]:
        return self._request("POST", "/api/memory/improve", {"feedback": feedback, "dataset": dataset, "session_id": session_id, "metadata": metadata or {}, "backend": backend or self.default_memory_backend})  # type: ignore[return-value]

    def forget_memory(self, dataset: str = "memorymesh-agent-work-memory", session_id: Optional[str] = None, everything: bool = False, backend: Optional[str] = None) -> Dict[str, Any]:
        return self._request("POST", "/api/memory/forget", {"dataset": dataset, "session_id": session_id, "everything": everything, "backend": backend or self.default_memory_backend})  # type: ignore[return-value]

    def run_agent(
        self,
        task: str,
        agent_id: str = "build",
        repository_name: Optional[str] = None,
        workspace_path: Optional[str] = None,
        github_url: Optional[str] = None,
        backend: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request("POST", "/api/agents/run", {
            "agent_id": agent_id,
            "task": task,
            "repository_name": repository_name,
            "workspace_path": workspace_path,
            "github_url": github_url,
            "backend": backend or self.default_memory_backend,
        })  # type: ignore[return-value]

    def run_coding_agent(self, task: str = "Fix dashboard RBAC so only admins can access the dashboard.", repository_name: str = "sample-dashboard-service", **kwargs: Any) -> Dict[str, Any]:
        return self._request("POST", "/api/coding-agent/run", {"task": task, "repository_name": repository_name, **kwargs})  # type: ignore[return-value]

    def run_coding_agent_recovery_demo(self, repository_name: str = "sample-dashboard-service", real_agent: bool = True, backend: Optional[str] = None) -> Dict[str, Any]:
        return self._request("POST", "/api/demo/coding-agent-recovery", {"repository_name": repository_name, "real_agent": real_agent, "backend": backend})  # type: ignore[return-value]

    def run_dual_backend_proof(self, repository_name: str = "sample-dashboard-service", backends: Optional[list[str]] = None) -> Dict[str, Any]:
        return self._request("POST", "/api/demo/dual-backend-proof", {"repository_name": repository_name, "backends": backends or ["local_cognee", "cognee_cloud"]})  # type: ignore[return-value]

    def partner_status(self) -> Dict[str, Any]:
        return self._request("GET", "/api/partners/status")  # type: ignore[return-value]
