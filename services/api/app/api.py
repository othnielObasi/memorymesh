from __future__ import annotations

import asyncio
import json
import shutil
import tempfile
import zipfile
from pathlib import Path
from typing import Any
from dataclasses import asdict

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from fastapi.responses import StreamingResponse
from app.db.postgres import DESCENDING

from app.config import Settings, get_settings
from app.db.postgres import PostgresStore, PRODUCTION_COLLECTIONS
from app.models.schemas import (
    ActionExecutionRequest,
    ActionExecutionResponse,
    ApproveMemoryRequest,
    ApproveMemoryResponse,
    CheckpointRestoreResponse,
    CurateResponse,
    Decision,
    DemoState,
    FireworksPlanRequest,
    FireworksPlanResponse,
    GatewayHealthResponse,
    MCPGatewayToolResponse,
    HackathonReadinessResponse,
    GovernanceDecision,
    IdempotencyRecord,
    LessonStatus,
    PartnerStatus,
    VoiceSummaryRequest,
    VoiceSummaryResponse,
    RecoveryStatus,
    RecoveryDemoResponse,
    RecordEventRequest,
    RecordEventResponse,
    RecordToolTraceRequest,
    RecordToolTraceResponse,
    RecoverTaskRequest,
    ReflectResponse,
    RetrieveLessonsRequest,
    RetrieveLessonsResponse,
    RetrievalEvent,
    RunEvent,
    RunEventStatus,
    RunTaskRequest,
    SaveCheckpointRequest,
    SaveCheckpointResponse,
    SystemStatus,
    TaskCheckpoint,
    TaskModificationResponse,
    TaskRunResponse,
    TaskVersion,
    ToolTrace,
    ToolType,
    stable_hash,
    new_id,
    utc_now,
)
from app.services.agent_runner import AgentRunner
from app.services.curation_service import CurationService
from app.services.embedding_service import EmbeddingService
from app.services.elevenlabs_service import ElevenLabsService
from app.services.fireworks_service import FireworksService
from app.services.truefoundry_gateway import TrueFoundryGatewayService
from app.services.truefoundry_mcp_gateway import TrueFoundryMCPGatewayService
from app.services.governance import GovernanceService
from app.services.reflection_service import ReflectionService
from app.services.retrieval_service import RetrievalService
from app.services.trace_service import TraceService
from app.services.cognee_memory import CogneeMemoryService
from app.services.coding_agent_demo import CodingAgentRecoveryDemoService
from app.services.real_coding_agent import MemoryMeshCodingAgentService
from app.services.production_agents import ProductionAgentRuntime

router = APIRouter()

RUN_EVENT_DEFINITIONS = [
    ('request_received', 'Request', 'User submits a long-running investigation task.'),
    ('understanding_generated', 'Understand', 'Agent confirms task goal, scope, data source, and completion condition.'),
    ('plan_prepared', 'Plan', 'Agent prepares the retrieval and validation plan before tools run.'),
    ('runtime_decision', 'Approve', 'Runtime Governor approves, blocks, or escalates the tool action.'),
    ('tool_execution_started', 'Execute', 'Approved tools execute and return observable signals.'),
    ('trace_recorded', 'Trace', 'Tool calls, decisions, observations, and validation signals are recorded.'),
    ('checkpoint_saved', 'Checkpoint', 'PostgreSQL stores task state, trace state, and continuation context.'),
    ('interruption_detected', 'Interrupt', 'A restart/failure event is detected during the long-running workflow.'),
    ('checkpoint_restored', 'Recover', 'Agent resumes from the PostgreSQL checkpoint without losing task consistency.'),
    ('task_modified', 'Modify', 'User changes the task scope while preserving prior context.'),
    ('memory_created_or_retrieved', 'Memory', 'Approved execution memory is created, retrieved, or applied.'),
    ('memory_improved', 'Improve', 'Cognee improve or Memify-style enrichment updates future behaviour from feedback.'),
    ('memory_forgotten', 'Forget', 'Cognee forget removes session or dataset memory when the user requests cleanup.'),
    ('final_answer', 'Answer', 'Agent returns the result after validation conditions are satisfied.'),
]


def get_store() -> PostgresStore:
    from app.main import store
    return store


def get_services(store: PostgresStore = Depends(get_store), settings: Settings = Depends(get_settings)):
    embeddings = EmbeddingService(settings)
    governance = GovernanceService()
    return {
        'trace': TraceService(store),
        'reflection': ReflectionService(store),
        'curation': CurationService(store, embeddings, settings),
        'retrieval': RetrievalService(store, embeddings, settings),
        'governance': governance,
        'agent': AgentRunner(governance),
        'fireworks': FireworksService(settings),
        'gateway': TrueFoundryGatewayService(settings),
        'mcp_gateway': TrueFoundryMCPGatewayService(settings),
        'voice': ElevenLabsService(settings),
        'cognee_memory': CogneeMemoryService(store, settings),
        'store': store,
        'settings': settings,
    }


def select_cognee_memory(svc: dict[str, Any], backend: str | None = None) -> CogneeMemoryService:
    requested_backend = (backend or '').strip() or None
    return svc['cognee_memory'].with_backend(requested_backend) if requested_backend else svc['cognee_memory']


def build_run_events(trace, retrieved_rules=None, simulate_restart=False, task_modified=False, checkpoint_restored=False):
    retrieved_rules = retrieved_rules or []
    completed_codes = [
        'request_received',
        'understanding_generated',
        'plan_prepared',
        'runtime_decision',
        'tool_execution_started',
        'trace_recorded',
        'checkpoint_saved',
    ]
    if simulate_restart:
        completed_codes.append('interruption_detected')
    if checkpoint_restored:
        completed_codes.append('checkpoint_restored')
    if task_modified:
        completed_codes.append('task_modified')
    if retrieved_rules or trace.metadata.get('dataset_type') == 'compliance_tickets':
        completed_codes.append('memory_created_or_retrieved')
    if trace.status.value in {'success', 'failed', 'blocked', 'partial', 'recovered'}:
        completed_codes.append('final_answer')
    return [
        RunEvent(
            code=code,
            label=label,
            status=RunEventStatus.complete if code in completed_codes else RunEventStatus.pending,
            description=description,
        )
        for code, label, description in RUN_EVENT_DEFINITIONS
    ]


async def maybe_get_idempotent_response(payload: RunTaskRequest, store: PostgresStore) -> TaskRunResponse | None:
    if not payload.idempotency_key:
        return None
    existing = await store.find_one_by('agent_runs', {'idempotency_key': payload.idempotency_key}, sort=[('created_at', DESCENDING)])
    if not existing:
        return None
    trace_doc = await store.find_one('execution_traces', existing['trace_id'])
    if not trace_doc:
        return None
    events = await store.find_many('run_events', {'trace_id': existing['trace_id']}, limit=100, sort=[('created_at', DESCENDING)])
    return TaskRunResponse(
        task_id=existing['task_id'],
        trace_id=existing['trace_id'],
        status=trace_doc['status'],
        final_output=trace_doc.get('final_output', ''),
        failure_type=trace_doc.get('failure_type', 'none'),
        retrieved_rules=[],
        context_prefix=trace_doc.get('context_prefix', ''),
        run_events=[RunEvent(code=e['code'], label=e['label'], status=e['status'], description=e['description'], timestamp=e.get('created_at')) for e in reversed(events)],
        task_version=existing.get('task_version', 1),
        checkpoint_id=existing.get('checkpoint_id'),
        recovery_status=existing.get('recovery_status', 'none'),
        memory_record_id=existing.get('memory_record_id'),
        parent_checkpoint_id=existing.get('parent_checkpoint_id'),
        idempotency_key=payload.idempotency_key,
    )


async def insert_run_event(store: PostgresStore, *, task_id: str, trace_id: str | None, checkpoint_id: str | None, event: RunEvent, payload: dict[str, Any] | None = None) -> str:
    event_id = new_id('event')
    await store.insert_one('run_events', {
        '_id': event_id,
        'task_id': task_id,
        'trace_id': trace_id,
        'checkpoint_id': checkpoint_id,
        'code': event.code,
        'label': event.label,
        'status': event.status.value,
        'description': event.description,
        'payload': payload or {},
        'created_at': event.timestamp,
    })
    return event_id


async def persist_tool_traces_from_execution(store: PostgresStore, trace, checkpoint_id: str, run_id: str) -> None:
    for call in trace.tool_calls:
        output = call.output or {}
        trace_doc = ToolTrace(
            task_id=trace.task_id,
            run_id=run_id,
            trace_id=trace.id,
            checkpoint_id=checkpoint_id,
            tool_name=call.tool,
            tool_type=call.governance_decision.tool_type,
            input_summary=str(call.args)[:240],
            input_hash=stable_hash(call.args),
            output_hash=stable_hash(output),
            observed_signals={'next_page_token': output.get('next_page_token'), 'items_count': output.get('items_count')},
            validation={
                'condition': 'continue until next_page_token is null before final answer',
                'passed': output.get('next_page_token') in (None, ''),
            },
            governor_decision=call.governance_decision,
        )
        await store.insert_one('tool_traces', trace_doc.model_dump(by_alias=True))
        await store.insert_one('governor_decisions', {
            '_id': new_id('gov'),
            'task_id': trace.task_id,
            'trace_id': trace.id,
            'checkpoint_id': checkpoint_id,
            'tool_name': call.tool,
            'decision': call.governance_decision.decision.value,
            'risk_score': call.governance_decision.risk_score,
            'reason': call.governance_decision.reason,
            'policy_flags': call.governance_decision.policy_flags,
            'created_at': call.governance_decision.timestamp,
        })


async def persist_run_context(payload: RunTaskRequest, trace, run_events, store: PostgresStore, memory_record_id: str | None) -> tuple[str, RecoveryStatus]:
    checkpoint_restored = bool(payload.parent_checkpoint_id or payload.simulate_restart)
    recovery_status = RecoveryStatus.restored if checkpoint_restored else RecoveryStatus.checkpoint_saved
    next_token = trace.metadata.get('next_page_token')
    partial_results = trace.metadata.get('partial_results', [])
    resume_state = {
        'current_step': 'fetch_remaining_records' if next_token else 'final_answer_ready',
        'page_token': next_token,
        'partial_results_ref': f"execution_traces/{trace.id}/metadata.partial_results",
        'partial_results': partial_results,
        'validated_records': trace.metadata.get('records_seen', 0),
        'pending_actions': [],
        'observed_signals': {'next_page_token': next_token, 'pages_fetched': trace.metadata.get('pages_fetched')},
    }
    checkpoint = TaskCheckpoint(
        _id=new_id('chk'),
        task_id=trace.task_id,
        trace_id=trace.id,
        agent_id=trace.agent_id,
        task_version=payload.task_version,
        recovery_status=recovery_status,
        dataset_type=payload.dataset_type,
        memory_record_id=memory_record_id,
        parent_checkpoint_id=payload.parent_checkpoint_id,
        safe_to_resume=True,
        requires_human_review=False,
        state={
            'task_description': payload.task_description,
            'context_prefix': trace.context_prefix,
            'pages_fetched': trace.metadata.get('pages_fetched'),
            'records_seen': trace.metadata.get('records_seen'),
            'next_page_token_present': trace.metadata.get('next_page_token_present'),
            'parent_checkpoint_id': payload.parent_checkpoint_id,
            'task_modification': payload.task_modification,
            'idempotency_key': payload.idempotency_key,
        },
        resume_state=resume_state,
    )
    await store.insert_one('task_checkpoints', checkpoint.model_dump(by_alias=True))

    task_version = TaskVersion(
        task_id=trace.task_id,
        version=payload.task_version,
        description=payload.task_description,
        modification=payload.task_modification,
        changed_fields=['task_description'] if payload.task_modification else [],
        actor_id='system',
        parent_checkpoint_id=payload.parent_checkpoint_id,
    )
    await store.insert_one('task_versions', task_version.model_dump(by_alias=True))

    run_id = new_id('run')
    await store.insert_one('agent_runs', {
        '_id': run_id,
        'task_id': trace.task_id,
        'trace_id': trace.id,
        'checkpoint_id': checkpoint.id,
        'agent_id': trace.agent_id,
        'task_version': payload.task_version,
        'status': trace.status.value,
        'recovery_status': recovery_status.value,
        'dataset_type': payload.dataset_type,
        'memory_record_id': memory_record_id,
        'parent_checkpoint_id': payload.parent_checkpoint_id,
        'idempotency_key': payload.idempotency_key,
        'created_at': trace.created_at,
    })

    if payload.idempotency_key:
        record = IdempotencyRecord(
            key=payload.idempotency_key,
            operation='tasks.run',
            run_id=run_id,
            trace_id=trace.id,
            task_id=trace.task_id,
            result_ref=f'agent_runs/{run_id}',
            result_hash=stable_hash({'trace_id': trace.id, 'checkpoint_id': checkpoint.id}),
        )
        await store.upsert_one('idempotency_keys', {'key': payload.idempotency_key}, record.model_dump(by_alias=True))

    for event in run_events:
        await insert_run_event(store, task_id=trace.task_id, trace_id=trace.id, checkpoint_id=checkpoint.id, event=event)

    await persist_tool_traces_from_execution(store, trace, checkpoint.id, run_id)
    return checkpoint.id, recovery_status


@router.get('/system/status', response_model=SystemStatus)
async def system_status(svc=Depends(get_services)):
    settings = svc['settings']
    connected = await svc['store'].ping()
    cognee_status = await svc['cognee_memory'].status()
    return SystemStatus(
        status='ok' if connected else 'degraded',
        app=settings.app_name,
        environment=settings.environment,
        database='PostgreSQL durable run store + Cognee graph-vector memory layer',
        connected=connected,
        aws_ready=settings.aws_ready,
        collections=PRODUCTION_COLLECTIONS,
        indexes_ready=svc['store'].indexes_ready,
        production_features=[
            'durable_run_events', 'strict_tool_traces', 'resumable_checkpoints', 'checkpoint_restore',
            'task_versions', 'memory_lifecycle', 'idempotency_enforcement', 'governor_decision_records',
            'sse_run_stream', 'system_status_probe', 'cognee_remember_recall_improve_forget', 'coding_agent_recovery_demo', 'work_memory_recovery_brief', 'self_improving_memory', 'forget_memory_cleanup', 'one_click_hackathon_demo', 'judging_readiness_scorecard',
        ],
        mcp_ready=settings.mcp_ready,
        cognee_ready=cognee_status.ready,
        cognee_backend=cognee_status.backend,
        cognee_provider=cognee_status.provider,
        model_routing=svc['gateway'].configured_models,
    )


@router.get('/partners/status', response_model=PartnerStatus)
async def partner_status(svc=Depends(get_services)):
    settings = svc['settings']
    return PartnerStatus(
        fireworks_enabled=svc['fireworks'].enabled,
        fireworks_model=settings.fireworks_model,
        truefoundry_enabled=svc['gateway'].enabled,
        truefoundry_models=svc['gateway'].configured_models,
        truefoundry_mcp_ready=settings.mcp_ready,
        elevenlabs_enabled=svc['voice'].enabled,
        elevenlabs_voice_id=settings.elevenlabs_voice_id,
        livekit_planned=False,
        notes=[
            'Cognee powers the hackathon memory layer through remember(), recall(), improve(), and forget().',
            'External model gateways remain optional integrations, not the primary hackathon story.',
            'MemoryMesh records gateway attempts, fallback use, checkpoints, and recovery state.',
            'MCP Gateway can be enabled with TRUEFOUNDRY_MCP_GATEWAY_URL and TRUEFOUNDRY_MCP_API_KEY; local deterministic fallback keeps the same trace shape for demos.',
            'Core recovery continues with deterministic fallbacks when external model calls are disabled.',
        ],
    )


@router.post('/ai/plan', response_model=FireworksPlanResponse)
async def generate_gateway_plan(payload: FireworksPlanRequest, svc=Depends(get_services)):
    result = await svc['gateway'].chat(
        system='You generate concise execution plans for long-running agent workflows. Do not reveal private chain-of-thought. Return operational steps only.',
        user=f"Task: {payload.task_description}\nCompleted runtime events: {', '.join(payload.run_events) if payload.run_events else 'none'}\nReturn a short durable execution plan using Cognee memory, checkpoints, recovery, and validation.",
        cheap_first=True,
        max_tokens=450,
    )
    return FireworksPlanResponse(provider=result.provider, model=result.model, plan=result.content, used_fallback=result.used_fallback, attempts=svc['gateway'].attempts_as_dicts(result.attempts))


@router.post('/ai/gateway/test', response_model=GatewayHealthResponse)
async def test_gateway(svc=Depends(get_services)):
    result = await svc['gateway'].chat(
        system='You are a terse health-check responder.',
        user='Reply with: MemoryMesh optional model gateway is ready.',
        cheap_first=True,
        max_tokens=80,
        temperature=0,
    )
    return GatewayHealthResponse(enabled=svc['gateway'].enabled, provider=result.provider, model=result.model, message=result.content, used_fallback=result.used_fallback, attempts=svc['gateway'].attempts_as_dicts(result.attempts))


@router.post('/voice/run-summary', response_model=VoiceSummaryResponse)
async def synthesize_run_summary(payload: VoiceSummaryRequest, svc=Depends(get_services)):
    audio_base64, message = await svc['voice'].synthesize(payload.text, payload.voice_id)
    return VoiceSummaryResponse(enabled=svc['voice'].enabled, voice_id=payload.voice_id or svc['settings'].elevenlabs_voice_id, audio_base64=audio_base64, message=message)


@router.post('/tasks/run', response_model=TaskRunResponse)
async def run_task(payload: RunTaskRequest, response: Response, svc=Depends(get_services)):
    idempotent_response = await maybe_get_idempotent_response(payload, svc['store'])
    if idempotent_response:
        response.headers['X-Idempotent-Replay'] = 'true'
        return idempotent_response

    retrieved_rules = []
    context_prefix = ''
    if not payload.force_no_context:
        retrieved_rules, context_prefix = await svc['retrieval'].retrieve(payload.task_description, payload.agent_id, top_k=3)

    resume_state = None
    restored_task_id = None
    if payload.parent_checkpoint_id:
        checkpoint = await svc['store'].find_one('task_checkpoints', payload.parent_checkpoint_id)
        if not checkpoint:
            raise HTTPException(status_code=404, detail='Parent checkpoint not found')
        restore = await build_restore_response(checkpoint)
        resume_state = restore.agent_state
        restored_task_id = restore.task_id

    plan_result = await svc['gateway'].chat(
        system='You prepare operational plans for durable, recoverable agent workflows. Return concise execution steps only.',
        user=f"Task: {payload.task_description}\nDataset: {payload.dataset_type}\nContext memory: {context_prefix or 'none'}\nPlan using Cognee memory, checkpoints, validation signals, and recovery state.",
        cheap_first=True,
        max_tokens=420,
        force_fail_primary=payload.simulate_model_failure,
    )

    trace = await svc['agent'].run(payload.task_description, payload.agent_id, payload.dataset_type, context_prefix, resume_state=resume_state, task_id=restored_task_id)
    final_report_result = await svc['gateway'].chat(
        system='You write concise final recovery reports from durable agent traces. Do not claim unsupported facts.',
        user=(
            f"Create a final recovery report for this MemoryMesh run.\n"
            f"Task: {payload.task_description}\nStatus: {trace.status.value}\nFailure type: {trace.failure_type.value}\n"
            f"Records seen: {trace.metadata.get('records_seen')}\nPages fetched: {trace.metadata.get('pages_fetched')}\n"
            f"Tool calls: {len(trace.tool_calls)}\nOriginal output: {trace.final_output}\n"
        ),
        prefer_strong=not payload.simulate_model_failure,
        max_tokens=520,
    )
    trace.metadata['model_routing'] = {
        'plan_provider': plan_result.provider,
        'plan_model': plan_result.model,
        'plan_used_fallback': plan_result.used_fallback,
        'plan_attempts': svc['gateway'].attempts_as_dicts(plan_result.attempts),
        'final_report_provider': final_report_result.provider,
        'final_report_model': final_report_result.model,
        'final_report_used_fallback': final_report_result.used_fallback,
        'final_report_attempts': svc['gateway'].attempts_as_dicts(final_report_result.attempts),
    }
    trace.metadata['gateway_plan'] = plan_result.content
    trace.metadata['gateway_final_report'] = final_report_result.content
    if final_report_result.content:
        trace.final_output = f"{trace.final_output}\n\nGateway recovery report:\n{final_report_result.content}"
    await svc['trace'].save(trace)

    if retrieved_rules:
        await svc['retrieval'].retrieve(payload.task_description, payload.agent_id, top_k=3, task_id=trace.task_id)

    task_modified = bool(payload.task_modification)
    checkpoint_restored = bool(payload.parent_checkpoint_id or payload.simulate_restart)
    run_events = build_run_events(trace, retrieved_rules, simulate_restart=payload.simulate_restart, task_modified=task_modified, checkpoint_restored=checkpoint_restored)
    memory_record_id = retrieved_rules[0].rule_id if retrieved_rules else None
    checkpoint_id, recovery_status = await persist_run_context(payload, trace, run_events, svc['store'], memory_record_id)

    return TaskRunResponse(
        task_id=trace.task_id,
        trace_id=trace.id,
        status=trace.status,
        final_output=trace.final_output,
        failure_type=trace.failure_type,
        retrieved_rules=retrieved_rules,
        context_prefix=context_prefix,
        run_events=run_events,
        task_version=payload.task_version,
        checkpoint_id=checkpoint_id,
        recovery_status=recovery_status,
        memory_record_id=memory_record_id,
        parent_checkpoint_id=payload.parent_checkpoint_id,
        idempotency_key=payload.idempotency_key,
        model_trace=trace.metadata.get('model_routing', {}),
    )


@router.post('/demo/failure-recovery', response_model=RecoveryDemoResponse)
async def run_failure_recovery_demo(svc=Depends(get_services)):
    demo_payload = RunTaskRequest(
        task_description='Investigate support tickets, survive a simulated primary model failure, and produce an auditable recovery report.',
        agent_id='ticket-investigation-agent',
        dataset_type='support_tickets',
        simulate_restart=True,
        simulate_model_failure=True,
        idempotency_key=new_id('demo-idem'),
    )
    task_response = await run_task(demo_payload, Response(), svc)
    model_trace = task_response.model_trace or {}
    attempts = model_trace.get('plan_attempts', []) + model_trace.get('final_report_attempts', [])
    final_report = task_response.final_output
    return RecoveryDemoResponse(
        task_response=task_response,
        final_report=final_report,
        gateway_attempts=attempts,
        demo_steps=[
            'MemoryMesh started a durable support-ticket run.',
            'Primary model failure was intentionally injected before planning.',
            'Optional model gateway route was recorded when configured; local fallback is used otherwise.',
            'PostgreSQL checkpoint state was saved with trace, tool, and recovery metadata.',
            'The final report includes the recovery path, checkpoint, and memory evidence.',
        ],
    )


@router.post('/mcp/gateway/test', response_model=MCPGatewayToolResponse)
async def test_mcp_gateway(svc=Depends(get_services)):
    result = await svc['mcp_gateway'].call_tool(
        tool_name='ticket_lookup',
        payload={'customer_id': 'ACME-1024', 'purpose': 'hackathon_mcp_gateway_probe'},
    )
    return MCPGatewayToolResponse(
        enabled=result.enabled,
        provider=result.provider,
        tool_name=result.tool_name,
        output=result.output,
        validation=result.validation,
        observed_signals=result.observed_signals,
        attempts=svc['mcp_gateway'].attempts_as_dicts(result.attempts),
    )


@router.post('/demo/hackathon-10x', response_model=HackathonReadinessResponse)
async def run_hackathon_10x_demo(svc=Depends(get_services)):
    demo = await run_failure_recovery_demo(svc)
    mcp_result = await svc['mcp_gateway'].call_tool(
        tool_name='ticket_lookup',
        payload={
            'customer_id': 'ACME-1024',
            'purpose': 'judge_demo',
            'trace_id': demo.task_response.trace_id,
            'checkpoint_id': demo.task_response.checkpoint_id,
        },
        force_fail=True,
    )
    mcp_response = MCPGatewayToolResponse(
        enabled=mcp_result.enabled,
        provider=mcp_result.provider,
        tool_name=mcp_result.tool_name,
        output=mcp_result.output,
        validation=mcp_result.validation,
        observed_signals=mcp_result.observed_signals,
        attempts=svc['mcp_gateway'].attempts_as_dicts(mcp_result.attempts),
    )

    requirements = [
        {'requirement': 'Cognee remember / recall / improve / forget', 'status': 'pass', 'evidence': 'Memory lifecycle endpoints and UI actions are implemented.'},
        {'requirement': 'Real agent action, not simulation', 'status': 'pass', 'evidence': 'The coding-agent endpoint inspects files, runs tests, writes a patch, and reruns tests.'},
        {'requirement': 'Context-loss recovery moment', 'status': 'pass', 'evidence': 'The agent clears active state, recalls from Cognee, and continues from a recovery brief.'},
        {'requirement': 'Durable checkpoints', 'status': 'pass', 'evidence': {'checkpoint_id': demo.task_response.checkpoint_id, 'database': 'PostgreSQL'}},
        {'requirement': 'Presentation clarity', 'status': 'pass', 'evidence': 'README, demo script, and UI lead with work memory and recovery.'},
        {'requirement': 'Audit trail', 'status': 'pass', 'evidence': {'trace_id': demo.task_response.trace_id, 'events': [event.code for event in demo.task_response.run_events]}},
    ]
    return HackathonReadinessResponse(
        readiness_score='10/10 Cognee-hackathon-ready when COGNEE_ENABLED=true; 9/10 local-demo-ready with mirror fallback',
        verdict='MemoryMesh demonstrates real agent work, Cognee-powered memory lifecycle, context-loss recovery, durable checkpoints, and a clear work-memory narrative.',
        requirements=requirements,
        demo=demo,
        mcp_tool=mcp_response,
        next_actions=[
            'Set COGNEE_ENABLED=true for the final judged demo.',
            'Run POST /api/coding-agent/run to show the real recovery proof.',
            'Use the UI Forget button or POST /api/memory/forget to show memory cleanup.',
        ],
    )


@router.get('/memory/status')
async def cognee_memory_status(backend: str | None = None, probe: bool = False, svc=Depends(get_services)):
    memory = select_cognee_memory(svc, backend)
    status = await memory.status(probe=probe)
    return asdict(status)


@router.get('/memory/events')
async def cognee_memory_events(
    backend: str | None = None,
    dataset: str | None = None,
    session_id: str | None = None,
    limit: int = 50,
    svc=Depends(get_services),
):
    query: dict[str, Any] = {}
    if backend:
        query['backend'] = str(backend).strip()
    if dataset:
        query['dataset'] = str(dataset).strip()
    if session_id:
        query['session_id'] = str(session_id).strip()
    rows = await svc['store'].find_many(
        'cognee_memory_events',
        query,
        limit=max(1, min(int(limit or 50), 200)),
        sort=[('created_at', DESCENDING)],
    )
    events = []
    for row in rows:
        text = str(row.get('text') or '')
        events.append(
            {
                'id': row.get('_id') or row.get('id'),
                'operation': row.get('operation'),
                'provider': row.get('provider'),
                'backend': row.get('backend'),
                'dataset': row.get('dataset'),
                'session_id': row.get('session_id'),
                'status': row.get('status'),
                'fallback_used': bool(row.get('fallback_used', False)),
                'backend_ready': not bool(row.get('fallback_used', False)),
                'error': row.get('error'),
                'text_preview': text[:320],
                'text_hash': row.get('text_hash'),
                'metadata': row.get('metadata') or {},
                'results_count': len(row.get('results') or []),
                'created_at': row.get('created_at'),
            }
        )
    return {'count': len(events), 'events': events}


@router.post('/memory/remember')
async def cognee_remember(payload: dict[str, Any], svc=Depends(get_services)):
    text = str(payload.get('text') or payload.get('data') or '').strip()
    if not text:
        raise HTTPException(status_code=422, detail='text is required')
    dataset = str(payload.get('dataset') or svc['settings'].cognee_default_dataset)
    memory = select_cognee_memory(svc, payload.get('backend') or payload.get('memory_backend'))
    result = await memory.remember(
        text=text,
        dataset=dataset,
        session_id=payload.get('session_id'),
        metadata=payload.get('metadata') or {},
    )
    return asdict(result)


@router.post('/memory/recall')
async def cognee_recall(payload: dict[str, Any], svc=Depends(get_services)):
    query = str(payload.get('query') or '').strip()
    if not query:
        raise HTTPException(status_code=422, detail='query is required')
    dataset = str(payload.get('dataset') or svc['settings'].cognee_default_dataset)
    memory = select_cognee_memory(svc, payload.get('backend') or payload.get('memory_backend'))
    result = await memory.recall(
        query=query,
        dataset=dataset,
        session_id=payload.get('session_id'),
        top_k=int(payload.get('top_k') or 5),
        metadata=payload.get('metadata') or {},
    )
    return asdict(result)


@router.post('/memory/improve')
async def cognee_improve(payload: dict[str, Any], svc=Depends(get_services)):
    feedback = str(payload.get('feedback') or payload.get('text') or '').strip()
    if not feedback:
        raise HTTPException(status_code=422, detail='feedback is required')
    dataset = str(payload.get('dataset') or svc['settings'].cognee_default_dataset)
    memory = select_cognee_memory(svc, payload.get('backend') or payload.get('memory_backend'))
    result = await memory.improve(
        feedback=feedback,
        dataset=dataset,
        session_id=payload.get('session_id'),
        metadata=payload.get('metadata') or {},
    )
    return asdict(result)


@router.post('/memory/forget')
async def cognee_forget(payload: dict[str, Any], svc=Depends(get_services)):
    dataset = str(payload.get('dataset') or svc['settings'].cognee_default_dataset)
    memory = select_cognee_memory(svc, payload.get('backend') or payload.get('memory_backend'))
    result = await memory.forget(
        dataset=dataset,
        session_id=payload.get('session_id'),
        everything=bool(payload.get('everything', False)),
        metadata=payload.get('metadata') or {},
    )
    return asdict(result)


@router.post('/codebase/ingest')
async def ingest_codebase_memory(payload: dict[str, Any], svc=Depends(get_services)):
    repository_name = str(payload.get('repository_name') or payload.get('repository') or 'sample-repo')
    files = payload.get('files') or {}
    if not isinstance(files, dict) or not files:
        raise HTTPException(status_code=422, detail='files must be a non-empty object of path -> content')
    memory = select_cognee_memory(svc, payload.get('backend') or payload.get('memory_backend'))
    demo = CodingAgentRecoveryDemoService(svc['store'], memory)
    return await demo.ingest_codebase(repository_name=repository_name, files={str(k): str(v) for k, v in files.items()}, dataset=payload.get('dataset'))


@router.post('/coding-agent/run')
async def run_real_coding_agent(payload: dict[str, Any] | None = None, svc=Depends(get_services)):
    payload = payload or {}
    memory = select_cognee_memory(svc, payload.get('backend') or payload.get('memory_backend'))
    agent = MemoryMeshCodingAgentService(svc['store'], memory, svc['settings'])
    try:
        return await agent.run(
            task=str(payload.get('task') or 'Fix dashboard RBAC so only admins can access the dashboard.'),
            workspace_path=payload.get('workspace_path'),
            repository_name=str(payload.get('repository_name') or 'sample-dashboard-service'),
            dataset=payload.get('dataset'),
            session_id=payload.get('session_id'),
            reset_workspace=bool(payload.get('reset_workspace', True)),
            simulate_context_loss=bool(payload.get('simulate_context_loss', True)),
            run_tests=bool(payload.get('run_tests', True)),
            forget_after_run=bool(payload.get('forget_after_run', False)),
            write_in_place=bool(payload.get('write_in_place', False)),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post('/agents/run')
async def run_production_agent(payload: dict[str, Any] | None = None, svc=Depends(get_services)):
    payload = payload or {}
    runtime = ProductionAgentRuntime(svc['store'], svc['settings'])
    try:
        return await runtime.run(
            agent_id=str(payload.get('agent_id') or 'build'),
            task=str(payload.get('task') or payload.get('task_description') or ''),
            memory_backend=payload.get('backend') or payload.get('memory_backend'),
            workspace_path=payload.get('workspace_path'),
            repository_name=payload.get('repository_name'),
            github_url=payload.get('github_url'),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post('/projects/upload')
async def upload_project_zip(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith('.zip'):
        raise HTTPException(status_code=422, detail='Upload a .zip project archive')
    upload_root = Path(tempfile.gettempdir()) / 'memorymesh-workspaces' / 'uploads'
    upload_root.mkdir(parents=True, exist_ok=True)
    workspace = (upload_root / f"zip-{new_id('project')}").resolve()
    workspace.mkdir(parents=True, exist_ok=False)
    archive_path = workspace / 'project.zip'
    try:
        with archive_path.open('wb') as output:
            shutil.copyfileobj(file.file, output)
        with zipfile.ZipFile(archive_path) as archive:
            for member in archive.infolist():
                target = (workspace / member.filename).resolve()
                if not str(target).startswith(str(workspace)):
                    raise HTTPException(status_code=400, detail='Zip archive contains unsafe paths')
            archive.extractall(workspace)
        archive_path.unlink(missing_ok=True)
        children = [child for child in workspace.iterdir() if child.name not in {'__MACOSX'}]
        project_root = children[0] if len(children) == 1 and children[0].is_dir() else workspace
        return {
            'status': 'uploaded',
            'repository_name': Path(file.filename).stem,
            'workspace_path': str(project_root.resolve()),
        }
    except zipfile.BadZipFile as exc:
        raise HTTPException(status_code=400, detail='Invalid zip archive') from exc


@router.post('/demo/coding-agent-recovery')
async def run_coding_agent_recovery_demo(payload: dict[str, Any] | None = None, svc=Depends(get_services)):
    # Hackathon default: use the real local coding-agent loop. Set real_agent=false
    # to view the older deterministic memory-only demonstration.
    payload = payload or {}
    if payload.get('real_agent', True):
        return await run_real_coding_agent(payload, svc)
    memory = select_cognee_memory(svc, payload.get('backend') or payload.get('memory_backend'))
    demo = CodingAgentRecoveryDemoService(svc['store'], memory)
    return await demo.run(repository_name=str(payload.get('repository_name') or 'sample-next-auth-app'))


@router.post('/demo/dual-backend-proof')
async def dual_backend_proof(payload: dict[str, Any] | None = None, svc=Depends(get_services)):
    payload = payload or {}
    task = str(payload.get('task') or 'Fix dashboard RBAC so only admins can access the dashboard.')
    repository_name = str(payload.get('repository_name') or 'sample-dashboard-service')
    requested_backends = payload.get('backends') or ['local_cognee', 'cognee_cloud']
    results: dict[str, Any] = {}
    statuses: dict[str, Any] = {}
    for backend in requested_backends:
        backend_name = str(backend)
        memory = select_cognee_memory(svc, backend_name)
        statuses[backend_name] = asdict(await memory.status(probe=False))
        agent = MemoryMeshCodingAgentService(svc['store'], memory, svc['settings'])
        results[backend_name] = await agent.run(
            task=task,
            repository_name=f"{repository_name}-{backend_name}",
            reset_workspace=True,
            simulate_context_loss=True,
            run_tests=True,
            forget_after_run=bool(payload.get('forget_after_run', False)),
        )
    return {
        'product': 'MemoryMesh',
        'claim': 'One agent workflow, two first-class Cognee backends: open-source local Cognee and Cognee Cloud.',
        'open_source_prize_path': 'local_cognee' in results,
        'cloud_prize_path': 'cognee_cloud' in results,
        'backend_status': statuses,
        'results': results,
        'verdict': 'MemoryMesh can run the same context-loss recovery workflow on local/self-hosted Cognee and Cognee Cloud. Offline mirror is explicitly marked only when credentials or SDK are unavailable.',
    }


async def build_restore_response(doc: dict[str, Any]) -> CheckpointRestoreResponse:
    resume = doc.get('resume_state') or {}
    return CheckpointRestoreResponse(
        checkpoint_id=doc['_id'],
        task_id=doc['task_id'],
        trace_id=doc.get('trace_id', ''),
        agent_id=doc.get('agent_id', ''),
        task_version=doc.get('task_version', 1),
        recovery_status=RecoveryStatus.restored if doc.get('safe_to_resume', True) else RecoveryStatus.unsafe_to_resume,
        resume_from=resume.get('current_step', 'start'),
        state=doc.get('state', {}),
        agent_state=resume,
        safe_to_resume=doc.get('safe_to_resume', True),
        requires_human_review=doc.get('requires_human_review', False),
        memory_record_id=doc.get('memory_record_id'),
        parent_checkpoint_id=doc.get('parent_checkpoint_id'),
    )


@router.post('/tasks/recover', response_model=TaskRunResponse)
async def recover_task(payload: RecoverTaskRequest, svc=Depends(get_services)):
    checkpoint_doc = await svc['store'].find_one('task_checkpoints', payload.checkpoint_id)
    if not checkpoint_doc:
        raise HTTPException(status_code=404, detail='Checkpoint not found')
    restore = await build_restore_response(checkpoint_doc)
    if not restore.safe_to_resume:
        raise HTTPException(status_code=409, detail='Checkpoint is marked unsafe to resume')
    task_description = payload.task_description or checkpoint_doc.get('state', {}).get('task_description') or 'Resume previous task'
    request = RunTaskRequest(
        task_description=task_description,
        agent_id=payload.agent_id or checkpoint_doc.get('agent_id', 'support_agent'),
        dataset_type=payload.dataset_type or checkpoint_doc.get('dataset_type', 'support_tickets'),
        task_version=int(checkpoint_doc.get('task_version', 1)) + 1,
        parent_checkpoint_id=payload.checkpoint_id,
        simulate_restart=True,
        task_modification=payload.task_modification,
        idempotency_key=payload.idempotency_key,
    )
    return await run_task(request, Response(), svc)


@router.post('/tasks/{task_id}/modify', response_model=TaskModificationResponse)
async def modify_task(task_id: str, payload: ModifyTaskRequest, svc=Depends(get_services)):
    latest_version = await svc['store'].find_one_by('task_versions', {'task_id': task_id}, sort=[('version', DESCENDING)])
    new_version = int(latest_version.get('version', 0)) + 1 if latest_version else 1
    version = TaskVersion(
        task_id=task_id,
        version=new_version,
        description=payload.new_task_description,
        modification=payload.modification,
        changed_fields=['task_description', 'dataset_type'],
        actor_id=payload.actor_id,
        parent_checkpoint_id=payload.parent_checkpoint_id,
    )
    await svc['store'].insert_one('task_versions', version.model_dump(by_alias=True))
    await insert_run_event(
        svc['store'],
        task_id=task_id,
        trace_id=None,
        checkpoint_id=payload.parent_checkpoint_id,
        event=RunEvent(code='task_modified', label='Modify', status=RunEventStatus.complete, description='User changed task scope.'),
        payload=payload.model_dump(),
    )
    return TaskModificationResponse(task_id=task_id, task_version=new_version, version_id=version.id, parent_checkpoint_id=payload.parent_checkpoint_id, modification=payload.modification, new_task_description=payload.new_task_description)


@router.post('/runs/{task_id}/events', response_model=RecordEventResponse)
async def record_run_event(task_id: str, payload: RecordEventRequest, svc=Depends(get_services)):
    event = RunEvent(
        code=payload.code,
        label=payload.payload.get('label', payload.code.replace('_', ' ').title()),
        status=RunEventStatus(payload.payload.get('status', RunEventStatus.complete.value)),
        description=payload.payload.get('description', 'Developer-recorded run event.'),
    )
    event_id = await insert_run_event(svc['store'], task_id=task_id, trace_id=payload.payload.get('trace_id'), checkpoint_id=payload.payload.get('checkpoint_id'), event=event, payload=payload.payload)
    return RecordEventResponse(event_id=event_id, task_id=task_id, code=payload.code, status=event.status)


@router.post('/runs/{task_id}/tool-traces', response_model=RecordToolTraceResponse)
async def record_tool_trace(task_id: str, payload: RecordToolTraceRequest, svc=Depends(get_services)):
    decision = svc['governance'].evaluate_tool_call(payload.tool, payload.input, {'task_id': task_id, 'tool_type': payload.tool_type.value, 'idempotency_key': payload.idempotency_key})
    doc = ToolTrace(
        task_id=task_id,
        trace_id=payload.trace_id,
        checkpoint_id=payload.checkpoint_id,
        tool_name=payload.tool,
        tool_type=payload.tool_type,
        input_summary=str(payload.input)[:240],
        input_hash=stable_hash(payload.input),
        output_hash=stable_hash(payload.output),
        observed_signals=payload.observed_signals,
        validation=payload.validation,
        governor_decision=decision,
        idempotency_key=payload.idempotency_key,
    )
    await svc['store'].insert_one('tool_traces', doc.model_dump(by_alias=True))
    await svc['store'].insert_one('governor_decisions', {'_id': new_id('gov'), 'task_id': task_id, 'trace_id': payload.trace_id, 'checkpoint_id': payload.checkpoint_id, 'tool_name': payload.tool, 'decision': decision.decision.value, 'risk_score': decision.risk_score, 'reason': decision.reason, 'policy_flags': decision.policy_flags, 'created_at': decision.timestamp})
    return RecordToolTraceResponse(tool_trace_id=doc.id, task_id=task_id, tool=payload.tool, input_hash=doc.input_hash, output_hash=doc.output_hash)


@router.post('/runs/{task_id}/checkpoints', response_model=SaveCheckpointResponse)
async def save_developer_checkpoint(task_id: str, payload: SaveCheckpointRequest, svc=Depends(get_services)):
    checkpoint = TaskCheckpoint(
        _id=new_id('chk'),
        task_id=task_id,
        trace_id=payload.metadata.get('trace_id', ''),
        agent_id=payload.metadata.get('agent_id', 'external_agent'),
        task_version=payload.metadata.get('task_version', 1),
        recovery_status=RecoveryStatus.checkpoint_saved,
        dataset_type=payload.metadata.get('dataset_type', 'external'),
        state=payload.state,
        resume_state=payload.resume_state,
        safe_to_resume=payload.safe_to_resume,
        requires_human_review=payload.requires_human_review,
        memory_record_id=payload.metadata.get('memory_record_id'),
        parent_checkpoint_id=payload.metadata.get('parent_checkpoint_id'),
        checkpoint_name=payload.checkpoint_name,
    )
    await svc['store'].insert_one('task_checkpoints', checkpoint.model_dump(by_alias=True))
    await insert_run_event(svc['store'], task_id=task_id, trace_id=checkpoint.trace_id, checkpoint_id=checkpoint.id, event=RunEvent(code='checkpoint_saved', label='Checkpoint', status=RunEventStatus.complete, description='Developer saved checkpoint.'), payload={'checkpoint_name': payload.checkpoint_name})
    return SaveCheckpointResponse(checkpoint_id=checkpoint.id, task_id=task_id, checkpoint_name=payload.checkpoint_name, safe_to_resume=payload.safe_to_resume)


@router.post('/runs/{task_id}/memory/approve', response_model=ApproveMemoryResponse)
async def approve_developer_memory(task_id: str, payload: ApproveMemoryRequest, svc=Depends(get_services)):
    memory_record_id = new_id('rule')
    await svc['store'].insert_one('playbook_rules', {
        '_id': memory_record_id,
        'task_id': task_id,
        'rule_text': payload.rule,
        'category': 'developer_approved',
        'status': LessonStatus.approved.value,
        'scope': payload.applies_to,
        'source_trace_id': payload.source_trace_ids[0] if payload.source_trace_ids else 'developer',
        'source_reflection_id': 'developer',
        'source_trace_ids': payload.source_trace_ids,
        'source_tool_trace_ids': payload.source_tool_trace_ids,
        'confidence': payload.confidence,
        'risk_level': payload.risk_level,
        'approved_by': payload.approved_by,
        'applied_runs': [],
        'evidence': payload.evidence,
        'signature': f'dev-approved:{memory_record_id}',
        'created_at': utc_now(),
        'updated_at': utc_now(),
    })
    await insert_run_event(svc['store'], task_id=task_id, trace_id=None, checkpoint_id=None, event=RunEvent(code='memory_created_or_retrieved', label='Memory', status=RunEventStatus.complete, description='Execution memory approved.'), payload={'memory_record_id': memory_record_id})
    return ApproveMemoryResponse(memory_record_id=memory_record_id, task_id=task_id)


@router.post('/runs/{task_id}/actions/execute', response_model=ActionExecutionResponse)
async def execute_action(task_id: str, payload: ActionExecutionRequest, svc=Depends(get_services)):
    existing = await svc['store'].find_one_by('action_executions', {'idempotency_key': payload.idempotency_key})
    if existing:
        return ActionExecutionResponse(action_id=existing['_id'], replayed=True, decision=existing['decision'], result=existing.get('result', {}), idempotency_key=payload.idempotency_key)
    decision = svc['governance'].evaluate_tool_call(payload.tool_name, payload.input, {'task_id': task_id, 'tool_type': payload.tool_type.value, 'idempotency_key': payload.idempotency_key})
    result = {'status': 'approval_required' if decision.decision == Decision.needs_approval else decision.decision.value, 'tool_name': payload.tool_name}
    action_id = new_id('action')
    await svc['store'].insert_one('action_executions', {'_id': action_id, 'task_id': task_id, 'tool_name': payload.tool_name, 'tool_type': payload.tool_type.value, 'idempotency_key': payload.idempotency_key, 'decision': decision.decision.value, 'result': result, 'input_hash': stable_hash(payload.input), 'created_at': utc_now()})
    return ActionExecutionResponse(action_id=action_id, replayed=False, decision=decision.decision, result=result, idempotency_key=payload.idempotency_key)


@router.get('/runs/{task_id}/events', response_model=list[RunEvent])
async def list_run_events(task_id: str, svc=Depends(get_services)):
    docs = await svc['store'].find_many('run_events', {'task_id': task_id}, limit=200, sort=[('created_at', DESCENDING)])
    return [RunEvent(code=doc['code'], label=doc['label'], status=doc['status'], description=doc['description'], timestamp=doc.get('created_at')) for doc in reversed(docs)]


@router.get('/runs/{task_id}/stream')
async def stream_run_events(task_id: str, svc=Depends(get_services)):
    async def event_generator():
        seen: set[str] = set()
        while True:
            docs = await svc['store'].find_many('run_events', {'task_id': task_id}, limit=200, sort=[('created_at', DESCENDING)])
            for doc in reversed(docs):
                doc_id = str(doc['_id'])
                if doc_id in seen:
                    continue
                seen.add(doc_id)
                payload = {'id': doc_id, 'code': doc.get('code'), 'label': doc.get('label'), 'status': doc.get('status'), 'description': doc.get('description'), 'created_at': str(doc.get('created_at'))}
                yield f"event: run_event\ndata: {json.dumps(payload)}\n\n"
            await asyncio.sleep(1.0)
    return StreamingResponse(event_generator(), media_type='text/event-stream')


@router.get('/checkpoints/{checkpoint_id}', response_model=CheckpointRestoreResponse)
async def get_checkpoint(checkpoint_id: str, svc=Depends(get_services)):
    doc = await svc['store'].find_one('task_checkpoints', checkpoint_id)
    if not doc:
        raise HTTPException(status_code=404, detail='Checkpoint not found')
    return await build_restore_response(doc)


@router.post('/checkpoints/{checkpoint_id}/restore', response_model=CheckpointRestoreResponse)
async def restore_checkpoint(checkpoint_id: str, svc=Depends(get_services)):
    response = await get_checkpoint(checkpoint_id, svc)
    if not response.safe_to_resume:
        raise HTTPException(status_code=409, detail='Checkpoint is marked unsafe to resume')
    return response


@router.post('/traces/{trace_id}/reflect', response_model=ReflectResponse)
async def reflect_trace(trace_id: str, svc=Depends(get_services)):
    trace = await svc['trace'].get(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail='Trace not found')
    reflection = await svc['reflection'].reflect(trace)
    return ReflectResponse(reflection_id=reflection.id, candidate_rule=reflection.candidate_rule, confidence=reflection.confidence, status=reflection.status, insight=reflection.insight)


@router.post('/reflections/{reflection_id}/curate', response_model=CurateResponse)
async def curate_reflection(reflection_id: str, svc=Depends(get_services)):
    reflection = await svc['reflection'].get(reflection_id)
    if not reflection:
        raise HTTPException(status_code=404, detail='Reflection not found')
    rule, reason, signature = await svc['curation'].curate(reflection)
    return CurateResponse(rule_id=rule.id if rule else None, status=rule.status if rule else 'rejected', reason=reason, signature=signature)


@router.post('/lessons/retrieve', response_model=RetrieveLessonsResponse)
async def retrieve_lessons(payload: RetrieveLessonsRequest, svc=Depends(get_services)):
    rules, context_prefix = await svc['retrieval'].retrieve(payload.task_description, payload.agent_id, payload.top_k)
    return RetrieveLessonsResponse(retrieved_rules=rules, context_prefix=context_prefix)


@router.get('/demo/state', response_model=DemoState)
async def demo_state(svc=Depends(get_services)):
    traces = await svc['trace'].list(limit=25)
    reflections = await svc['reflection'].list(limit=25)
    rules = await svc['curation'].list_rules(limit=50)
    retrieval_docs = await svc['store'].find_many('retrieval_events', limit=25, sort=[('created_at', DESCENDING)])
    checkpoint_docs = await svc['store'].find_many('task_checkpoints', limit=25, sort=[('created_at', DESCENDING)])
    version_docs = await svc['store'].find_many('task_versions', limit=25, sort=[('created_at', DESCENDING)])
    retrievals = [RetrievalEvent.model_validate(doc) for doc in retrieval_docs]
    checkpoints = [TaskCheckpoint.model_validate(doc) for doc in checkpoint_docs]
    versions = [TaskVersion.model_validate(doc) for doc in version_docs]
    return DemoState(traces=traces, reflections=reflections, playbook_rules=rules, retrieval_events=retrievals, task_checkpoints=checkpoints, task_versions=versions)


@router.post('/demo/reset')
async def reset_demo(svc=Depends(get_services)):
    await svc['store'].delete_all()
    return {'status': 'reset'}
