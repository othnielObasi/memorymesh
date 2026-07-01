import os
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = Field(default='MemoryMesh', alias='APP_NAME')
    environment: str = Field(default='development', alias='ENVIRONMENT')
    api_prefix: str = Field(default='/api', alias='API_PREFIX')
    frontend_origin: str = Field(default='http://localhost:5173', alias='FRONTEND_ORIGIN')
    database_url: str = Field(default='postgresql://memorymesh:memorymesh@localhost:5432/memorymesh_dev', alias='DATABASE_URL')
    database_pool_min_size: int = Field(default=1, alias='DATABASE_POOL_MIN_SIZE')
    database_pool_max_size: int = Field(default=10, alias='DATABASE_POOL_MAX_SIZE')
    database_command_timeout_seconds: int = Field(default=30, alias='DATABASE_COMMAND_TIMEOUT_SECONDS')
    dev_inmemory_store: bool = Field(default=False, alias='MEMORYMESH_DEV_INMEMORY_STORE')
    signing_secret: str = Field(default='replace-with-a-secure-secret', alias='SIGNING_SECRET')
    runtime_governor_mode: str = Field(default='local', alias='RUNTIME_GOVERNOR_MODE')
    embedding_provider: str = Field(default='hash', alias='EMBEDDING_PROVIDER')
    embedding_dimensions: int = Field(default=384, alias='EMBEDDING_DIMENSIONS')
    openai_api_key: str | None = Field(default=None, alias='OPENAI_API_KEY')
    openai_base_url: str = Field(default='https://api.openai.com/v1', alias='OPENAI_BASE_URL')
    openai_chat_model: str = Field(default='gpt-4o-mini', alias='OPENAI_CHAT_MODEL')
    openai_embedding_model: str = Field(default='text-embedding-3-small', alias='OPENAI_EMBEDDING_MODEL')
    anthropic_api_key: str | None = Field(default=None, alias='ANTHROPIC_API_KEY')
    aimlapi_api_key: str | None = Field(default=None, alias='AIMLAPI_API_KEY')
    aimlapi_base_url: str = Field(default='https://api.aimlapi.com/v1', alias='AIMLAPI_BASE_URL')
    aimlapi_model: str = Field(default='gpt-4o-mini', alias='AIMLAPI_MODEL')
    llm_primary_provider: str = Field(default='openai', alias='LLM_PRIMARY_PROVIDER')
    llm_fallback_provider: str = Field(default='aimlapi', alias='LLM_FALLBACK_PROVIDER')
    llm_timeout_seconds: int = Field(default=45, alias='LLM_TIMEOUT_SECONDS')
    fireworks_api_key: str | None = Field(default=None, alias='FIREWORKS_API_KEY')
    fireworks_model: str = Field(default='accounts/fireworks/models/llama-v3p1-70b-instruct', alias='FIREWORKS_MODEL')
    fireworks_base_url: str = Field(default='https://api.fireworks.ai/inference/v1', alias='FIREWORKS_BASE_URL')
    truefoundry_base_url: str | None = Field(default=None, alias='TRUEFOUNDRY_BASE_URL')
    truefoundry_api_key: str | None = Field(default=None, alias='TRUEFOUNDRY_API_KEY')
    truefoundry_model: str = Field(default='global.anthropic.claude-haiku-4-5-20251001-v1-0', alias='TRUEFOUNDRY_MODEL')
    truefoundry_fallback_model: str = Field(default='us.amazon.nova-2-lite-v1-0', alias='TRUEFOUNDRY_FALLBACK_MODEL')
    truefoundry_cheap_model: str = Field(default='us.amazon.nova-micro-v1-0', alias='TRUEFOUNDRY_CHEAP_MODEL')
    truefoundry_strong_model: str = Field(default='global.anthropic.claude-sonnet-4-5-20250929-v1-0', alias='TRUEFOUNDRY_STRONG_MODEL')
    truefoundry_embedding_model: str = Field(default='amazon.titan-embed-text-v2-0', alias='TRUEFOUNDRY_EMBEDDING_MODEL')
    truefoundry_timeout_seconds: int = Field(default=45, alias='TRUEFOUNDRY_TIMEOUT_SECONDS')
    elevenlabs_api_key: str | None = Field(default=None, alias='ELEVENLABS_API_KEY')
    elevenlabs_voice_id: str = Field(default='21m00Tcm4TlvDq8ikWAM', alias='ELEVENLABS_VOICE_ID')
    elevenlabs_model_id: str = Field(default='eleven_multilingual_v2', alias='ELEVENLABS_MODEL_ID')
    use_atlas_vector_search: bool = Field(default=False, alias='USE_ATLAS_VECTOR_SEARCH')
    truefoundry_mcp_gateway_url: str | None = Field(default=None, alias='TRUEFOUNDRY_MCP_GATEWAY_URL')
    truefoundry_mcp_api_key: str | None = Field(default=None, alias='TRUEFOUNDRY_MCP_API_KEY')
    truefoundry_mcp_tool_invoke_path: str = Field(default='/tools/{tool_name}/invoke', alias='TRUEFOUNDRY_MCP_TOOL_INVOKE_PATH')
    atlas_vector_index: str = Field(default='playbook_vector_index', alias='ATLAS_VECTOR_INDEX')
    aws_region: str | None = Field(default=None, alias='AWS_REGION')
    aws_runtime: str | None = Field(default=None, alias='AWS_RUNTIME')
    deployment_id: str | None = Field(default=None, alias='DEPLOYMENT_ID')



    # Cognee memory layer for the Cognee hackathon build
    # MEMORYMESH_MEMORY_BACKEND controls the prize path:
    #   auto | local_cognee | cognee_cloud | offline_mirror
    memorymesh_memory_backend: str = Field(default='auto', alias='MEMORYMESH_MEMORY_BACKEND')
    cognee_enabled: bool = Field(default=False, alias='COGNEE_ENABLED')
    cognee_service_url: str | None = Field(default=None, alias='COGNEE_SERVICE_URL')
    cognee_api_key: str | None = Field(default=None, alias='COGNEE_API_KEY')
    cognee_default_dataset: str = Field(default='memorymesh-agent-work-memory', alias='COGNEE_DEFAULT_DATASET')
    cognee_allow_offline_fallback: bool = Field(default=True, alias='COGNEE_ALLOW_OFFLINE_FALLBACK')
    memorymesh_local_project_roots: str = Field(default='', alias='MEMORYMESH_LOCAL_PROJECT_ROOTS')
    memorymesh_allow_any_local_project: bool = Field(default=False, alias='MEMORYMESH_ALLOW_ANY_LOCAL_PROJECT')

    # Google/Gemini reference integration
    google_gemini_api_key: str | None = Field(default=None, alias='GOOGLE_GEMINI_API_KEY')
    google_vertex_project: str | None = Field(default=None, alias='GOOGLE_VERTEX_PROJECT')
    google_vertex_location: str = Field(default='us-central1', alias='GOOGLE_VERTEX_LOCATION')
    google_gemini_model: str = Field(default='gemini-2.5-pro', alias='GOOGLE_GEMINI_MODEL')
    google_gemini_fallback_model: str = Field(default='gemini-2.5-flash', alias='GOOGLE_GEMINI_FALLBACK_MODEL')
    google_embedding_model: str = Field(default='text-embedding-004', alias='GOOGLE_EMBEDDING_MODEL')
    google_agent_engine_runtime: str | None = Field(default=None, alias='GOOGLE_AGENT_ENGINE_RUNTIME')

    # Enterprise adoption controls
    auth_required: bool = Field(default=False, alias='AUTH_REQUIRED')
    default_organisation_id: str = Field(default='org_default', alias='DEFAULT_ORGANISATION_ID')
    default_workspace_id: str = Field(default='wrk_default', alias='DEFAULT_WORKSPACE_ID')
    default_project_id: str = Field(default='prj_default', alias='DEFAULT_PROJECT_ID')
    default_environment_id: str = Field(default='dev', alias='DEFAULT_ENVIRONMENT_ID')
    bootstrap_admin_token: str | None = Field(default=None, alias='BOOTSTRAP_ADMIN_TOKEN')
    default_model_gateway: str = Field(default='truefoundry', alias='DEFAULT_MODEL_GATEWAY')
    audit_log_retention_days: int = Field(default=365, alias='AUDIT_LOG_RETENTION_DAYS')
    run_retention_days: int = Field(default=365, alias='RUN_RETENTION_DAYS')
    enable_open_telemetry: bool = Field(default=False, alias='ENABLE_OPEN_TELEMETRY')
    otel_service_name: str = Field(default='memorymesh-api', alias='OTEL_SERVICE_NAME')
    worker_poll_interval_seconds: int = Field(default=5, alias='WORKER_POLL_INTERVAL_SECONDS')
    worker_lease_seconds: int = Field(default=300, alias='WORKER_LEASE_SECONDS')

    @property
    def cors_origins(self) -> List[str]:
        return list({self.frontend_origin, 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'})

    @property
    def aws_ready(self) -> bool:
        return bool(self.truefoundry_base_url and self.truefoundry_api_key)

    @property
    def mcp_ready(self) -> bool:
        return bool(self.truefoundry_mcp_gateway_url and self.truefoundry_mcp_api_key)

    @property
    def cognee_backend(self) -> str:
        backend = (self.memorymesh_memory_backend or 'auto').strip().lower()
        aliases = {
            'oss': 'local_cognee',
            'open_source': 'local_cognee',
            'open-source': 'local_cognee',
            'local': 'local_cognee',
            'cloud': 'cognee_cloud',
            'mirror': 'offline_mirror',
            'offline': 'offline_mirror',
        }
        backend = aliases.get(backend, backend)
        if backend == 'auto':
            if self.cognee_enabled:
                if self.cognee_service_url and self.cognee_api_key:
                    return 'cognee_cloud'
                if self.cognee_api_key and (os.getenv('VERCEL') or self.environment.lower() in {'production', 'preview'}):
                    return 'cognee_cloud'
                return 'local_cognee'
            return 'offline_mirror'
        return backend if backend in {'local_cognee', 'cognee_cloud', 'offline_mirror'} else 'offline_mirror'

    @property
    def cognee_ready(self) -> bool:
        if self.cognee_backend == 'cognee_cloud':
            return bool(self.cognee_service_url and self.cognee_api_key)
        return self.cognee_backend in {'local_cognee', 'offline_mirror'}


@lru_cache
def get_settings() -> Settings:
    return Settings()
