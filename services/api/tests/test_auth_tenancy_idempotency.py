import asyncio
from types import SimpleNamespace

from fastapi import HTTPException

from app.auth_api import LoginRequest, SignupRequest, login, signup
from app.api import agent_run_response
from app.config import Settings
from app.db.postgres import PostgresStore
from app.security import resolve_principal
from app.services.production_agents import ProductionAgentRuntime


def make_store() -> tuple[PostgresStore, Settings]:
    settings = Settings(SIGNING_SECRET="test-secret", MEMORYMESH_DEV_INMEMORY_STORE=True)
    store = PostgresStore(settings)
    store._memory_records = {}
    store.indexes_ready = True
    return store, settings


def test_signup_login_and_session_resolve_tenant_context():
    async def run():
        store, settings = make_store()
        signup_response = await signup(
            SignupRequest(
                name="Othniel Tester",
                email="othniel@example.com",
                password="correct-password",
                organisation_name="MemoryMesh Test Org",
            ),
            store,
            settings,
        )
        assert signup_response.access_token.startswith("mms_")
        assert signup_response.user.tenant.organisation_id.startswith("org_")
        assert signup_response.user.tenant.workspace_id.startswith("wrk_")

        login_response = await login(LoginRequest(email="OTHNIEL@example.com", password="correct-password"), store, settings)
        principal = await resolve_principal(
            SimpleNamespace(headers={}),
            store,
            settings,
            x_memorymesh_api_key=None,
            authorization=f"Bearer {login_response.access_token}",
        )
        assert principal.organisation_id == signup_response.user.tenant.organisation_id
        assert principal.workspace_id == signup_response.user.tenant.workspace_id
        assert principal.role == "owner"

    asyncio.run(run())


def test_login_missing_account_explains_create_workspace():
    async def run():
        store, settings = make_store()
        try:
            await login(LoginRequest(email="missing@example.com", password="correct-password"), store, settings)
        except HTTPException as exc:
            assert exc.status_code == 401
            assert "Create a new workspace first" in str(exc.detail)
        else:  # pragma: no cover - defensive assertion
            raise AssertionError("login should reject unknown accounts")

    asyncio.run(run())


def test_production_agent_receipts_replay_by_workspace_idempotency_key():
    async def run():
        store, settings = make_store()
        runtime = ProductionAgentRuntime(store, settings)
        tenant = {
            "organisation_id": "org_product",
            "workspace_id": "wrk_product",
            "project_id": "prj_product",
            "environment_id": "prod",
            "actor_id": "usr_product",
        }
        first = await runtime._receipt(
            agent_id="research",
            agent_name="Research Assistant",
            task="Investigate release risk",
            status="complete",
            final_output="Done",
            evidence=[],
            memory_operations=[],
            tool_traces=[],
            recovery={},
            outcome={},
            model_trace={},
            tenant_context=tenant,
            idempotency_key="idem-product-001",
        )
        second = await runtime._receipt(
            agent_id="research",
            agent_name="Research Assistant",
            task="Investigate release risk",
            status="complete",
            final_output="Duplicate",
            evidence=[],
            memory_operations=[],
            tool_traces=[],
            recovery={},
            outcome={},
            model_trace={},
            tenant_context=tenant,
            idempotency_key="idem-product-001",
        )
        assert first["run_id"] == second["run_id"]
        assert second["idempotent_replay"] is True
        assert second["workspace_id"] == "wrk_product"

    asyncio.run(run())


def test_agent_run_response_includes_nested_receipt_without_breaking_flat_contract():
    receipt = {
        "run_id": "agent_run_123",
        "agent_id": "research",
        "agent_name": "Research Assistant",
        "status": "complete",
        "evidence": [{"title": "Source"}],
    }

    response = agent_run_response(receipt)

    assert response["run_id"] == "agent_run_123"
    assert response["agent_id"] == "research"
    assert response["receipt"] == receipt
    assert response["receipt_ref"] == "agent_runs/agent_run_123"
