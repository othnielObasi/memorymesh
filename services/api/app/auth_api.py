from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.config import Settings, get_settings
from app.db.postgres import PostgresStore
from app.models.schemas import TenantContext, new_id, utc_now
from app.security import (
    EnterprisePrincipal,
    create_audit_log,
    create_session_token,
    hash_password,
    resolve_principal,
    verify_password,
)

router = APIRouter(tags=["auth"])


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=8, max_length=200)
    organisation_name: str | None = Field(default=None, max_length=160)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=1, max_length=200)


class AuthUser(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    tenant: TenantContext


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: AuthUser


def get_store() -> PostgresStore:
    from app.main import store

    return store


def _slug(value: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned[:80] or f"tenant-{new_id('org')[-6:]}"


def _normalise_email(value: str) -> str:
    email = value.strip().lower()
    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Enter a valid email address")
    return email


def _tenant_for_user(user: dict[str, Any]) -> TenantContext:
    return TenantContext(
        organisation_id=user["organisation_id"],
        workspace_id=user["workspace_id"],
        project_id=user.get("project_id") or "prj_default",
        environment_id=user.get("environment_id") or "dev",
        actor_id=user.get("user_id") or user["_id"],
    )


def _auth_response(user: dict[str, Any], settings: Settings) -> AuthResponse:
    tenant = _tenant_for_user(user)
    token, expires_at = create_session_token(
        {
            "user_id": user.get("user_id") or user["_id"],
            "email": user["email"],
            "role": user.get("role", "owner"),
            **tenant.model_dump(),
        },
        settings,
    )
    return AuthResponse(
        access_token=token,
        expires_at=expires_at,
        user=AuthUser(
            user_id=user.get("user_id") or user["_id"],
            name=user["name"],
            email=user["email"],
            role=user.get("role", "owner"),
            tenant=tenant,
        ),
    )


async def principal_dependency(
    request: Request,
    x_memorymesh_api_key: str | None = Header(default=None, alias="X-MemoryMesh-API-Key"),
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_organisation_id: str | None = Header(default=None, alias="X-Organisation-Id"),
    x_workspace_id: str | None = Header(default=None, alias="X-Workspace-Id"),
    x_project_id: str | None = Header(default=None, alias="X-Project-Id"),
    x_environment_id: str | None = Header(default=None, alias="X-Environment-Id"),
    store: PostgresStore = Depends(get_store),
    settings: Settings = Depends(get_settings),
) -> EnterprisePrincipal:
    return await resolve_principal(
        request,
        store,
        settings,
        x_memorymesh_api_key=x_memorymesh_api_key,
        authorization=authorization,
        x_organisation_id=x_organisation_id,
        x_workspace_id=x_workspace_id,
        x_project_id=x_project_id,
        x_environment_id=x_environment_id,
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest, store: PostgresStore = Depends(get_store), settings: Settings = Depends(get_settings)):
    email = _normalise_email(payload.email)
    existing = await store.find_one_by("users", {"email_lower": email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email")

    created_at = utc_now()
    organisation_id = new_id("org")
    workspace_id = new_id("wrk")
    project_id = new_id("prj")
    user_id = new_id("usr")
    org_name = payload.organisation_name or f"{payload.name}'s organisation"
    org_slug = _slug(org_name)

    await store.insert_one(
        "organisations",
        {
            "_id": organisation_id,
            "organisation_id": organisation_id,
            "name": org_name,
            "slug": org_slug,
            "metadata": {"created_from": "signup"},
            "created_at": created_at,
        },
    )
    await store.insert_one(
        "workspaces",
        {
            "_id": workspace_id,
            "workspace_id": workspace_id,
            "organisation_id": organisation_id,
            "name": "Primary Workspace",
            "slug": "primary",
            "metadata": {"memory_backend": "cognee_cloud"},
            "created_at": created_at,
        },
    )
    await store.insert_one(
        "projects",
        {
            "_id": project_id,
            "project_id": project_id,
            "workspace_id": workspace_id,
            "organisation_id": organisation_id,
            "environment_id": "prod",
            "name": "Production",
            "slug": "production",
            "metadata": {},
            "created_at": created_at,
        },
    )
    user = {
        "_id": user_id,
        "user_id": user_id,
        "name": payload.name,
        "email": email,
        "email_lower": email,
        "password_hash": hash_password(payload.password, settings),
        "organisation_id": organisation_id,
        "workspace_id": workspace_id,
        "project_id": project_id,
        "environment_id": "prod",
        "role": "owner",
        "status": "active",
        "created_at": created_at,
    }
    await store.insert_one("users", user)
    principal = EnterprisePrincipal(
        organisation_id=organisation_id,
        workspace_id=workspace_id,
        project_id=project_id,
        environment_id="prod",
        actor_id=user_id,
        role="owner",
        scopes=set(),
    )
    await create_audit_log(store, action="auth.signup", principal=principal, resource_type="user", resource_id=user_id)
    return _auth_response(user, settings)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, store: PostgresStore = Depends(get_store), settings: Settings = Depends(get_settings)):
    email = _normalise_email(payload.email)
    user = await store.find_one_by("users", {"email_lower": email})
    if not user or user.get("status", "active") != "active" or not verify_password(payload.password, user.get("password_hash", ""), settings):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    await store.update_one("users", {"_id": user["_id"]}, {"$set": {"last_login_at": utc_now()}})
    await create_audit_log(
        store,
        action="auth.login",
        principal=EnterprisePrincipal(
            organisation_id=user["organisation_id"],
            workspace_id=user["workspace_id"],
            project_id=user.get("project_id", "prj_default"),
            environment_id=user.get("environment_id", "dev"),
            actor_id=user.get("user_id") or user["_id"],
            role=user.get("role", "owner"),
            scopes=set(),
        ),
        resource_type="user",
        resource_id=user.get("user_id") or user["_id"],
    )
    return _auth_response(user, settings)


@router.get("/me", response_model=AuthUser)
async def me(principal: EnterprisePrincipal = Depends(principal_dependency), store: PostgresStore = Depends(get_store)):
    user = await store.find_one("users", principal.actor_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AuthUser(
        user_id=user.get("user_id") or user["_id"],
        name=user["name"],
        email=user["email"],
        role=user.get("role", principal.role),
        tenant=_tenant_for_user(user),
    )
