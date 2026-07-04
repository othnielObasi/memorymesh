#!/usr/bin/env python3
"""Run the open-source Cognee proof path without Docker.

This script starts two local processes:

1. MemoryMesh Local Cognee Service on http://127.0.0.1:8001
2. MemoryMesh API on http://127.0.0.1:8000

It then runs the strict local_cognee hackathon proof. Fallback is disabled, so
the script fails if the open-source Cognee path is not actually used.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = ROOT / ".memorymesh-local" / "logs"
DATA_DIR = ROOT / ".memorymesh-local" / "cognee"


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in values:
            values[key] = value
    return values


def wait_for(url: str, *, timeout: int, name: str) -> None:
    deadline = time.time() + timeout
    last_error = ""
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=5) as response:  # noqa: S310 - local proof utility.
                if response.status < 500:
                    return
        except (OSError, urllib.error.URLError) as exc:
            last_error = str(exc)
        time.sleep(1)
    raise RuntimeError(f"{name} did not become ready at {url}: {last_error}")


def start_process(name: str, command: list[str], *, cwd: Path, env: dict[str, str]) -> subprocess.Popen:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    stdout = (LOG_DIR / f"{name}.log").open("w", encoding="utf-8")
    stderr = subprocess.STDOUT
    print(f"Starting {name}: {' '.join(command)}")
    return subprocess.Popen(command, cwd=str(cwd), env=env, stdout=stdout, stderr=stderr)


def terminate(processes: list[subprocess.Popen]) -> None:
    for process in reversed(processes):
        if process.poll() is None:
            process.terminate()
    deadline = time.time() + 15
    for process in reversed(processes):
        while process.poll() is None and time.time() < deadline:
            time.sleep(0.2)
        if process.poll() is None:
            process.kill()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default="sample-dashboard-service")
    parser.add_argument("--api-port", default="8000")
    parser.add_argument("--cognee-port", default="8001")
    parser.add_argument("--timeout", type=int, default=120)
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    env_file_values = {
        **read_env_file(ROOT / ".env"),
        **read_env_file(ROOT / "services" / "api" / ".env"),
    }

    local_service_env = os.environ.copy()
    local_service_env.update({key: value for key, value in env_file_values.items() if value})
    if local_service_env.get("OPENAI_API_KEY") and not local_service_env.get("LLM_API_KEY"):
        local_service_env["LLM_API_KEY"] = local_service_env["OPENAI_API_KEY"]
    if local_service_env.get("OPENAI_API_KEY") and not local_service_env.get("EMBEDDING_API_KEY"):
        local_service_env["EMBEDDING_API_KEY"] = local_service_env["OPENAI_API_KEY"]
    if local_service_env.get("OPENAI_CHAT_MODEL") and not local_service_env.get("LLM_MODEL"):
        local_service_env["LLM_MODEL"] = local_service_env["OPENAI_CHAT_MODEL"]
    local_service_env.update(
        {
            "PYTHONPATH": str(ROOT / "services" / "cognee-local"),
            "DATA_ROOT_DIRECTORY": str(DATA_DIR / ".data_storage"),
            "SYSTEM_ROOT_DIRECTORY": str(DATA_DIR / ".cognee_system"),
            "CACHE_ROOT_DIRECTORY": str(DATA_DIR / ".cognee_cache"),
            "COGNEE_LOGS_DIR": str(DATA_DIR / "logs"),
            "EMBEDDING_PROVIDER": os.getenv("EMBEDDING_PROVIDER", "hash"),
            "LLM_PROVIDER": os.getenv("LLM_PROVIDER", "openai"),
            "ENABLE_BACKEND_ACCESS_CONTROL": os.getenv("ENABLE_BACKEND_ACCESS_CONTROL", "false"),
        }
    )

    api_env = os.environ.copy()
    api_env.update({key: value for key, value in env_file_values.items() if value})
    api_env.update(
        {
            "PYTHONPATH": str(ROOT / "services" / "api"),
            "ENVIRONMENT": "development",
            "API_PREFIX": "/api",
            "MEMORYMESH_DEV_INMEMORY_STORE": "true",
            "MEMORYMESH_MEMORY_BACKEND": "local_cognee",
            "COGNEE_ENABLED": "true",
            "COGNEE_LOCAL_SERVICE_URL": f"http://127.0.0.1:{args.cognee_port}",
            "COGNEE_ALLOW_OFFLINE_FALLBACK": "false",
            "AUTH_REQUIRED": "false",
        }
    )

    processes: list[subprocess.Popen] = []
    try:
        processes.append(
            start_process(
                "cognee-local",
                [
                    sys.executable,
                    "-m",
                    "uvicorn",
                    "cognee_local_service.main:app",
                    "--host",
                    "127.0.0.1",
                    "--port",
                    str(args.cognee_port),
                ],
                cwd=ROOT,
                env=local_service_env,
            )
        )
        wait_for(f"http://127.0.0.1:{args.cognee_port}/health", timeout=args.timeout, name="local Cognee service")

        processes.append(
            start_process(
                "memorymesh-api",
                [
                    sys.executable,
                    "-m",
                    "uvicorn",
                    "app.main:app",
                    "--host",
                    "127.0.0.1",
                    "--port",
                    str(args.api_port),
                ],
                cwd=ROOT / "services" / "api",
                env=api_env,
            )
        )
        wait_for(f"http://127.0.0.1:{args.api_port}/health", timeout=args.timeout, name="MemoryMesh API")

        proof = [
            sys.executable,
            str(ROOT / "scripts" / "run_hackathon_demo.py"),
            "--base-url",
            f"http://127.0.0.1:{args.api_port}",
            "--backend",
            "local_cognee",
            "--repo",
            args.repo,
        ]
        subprocess.run(proof, cwd=str(ROOT), check=True)
        return 0
    finally:
        terminate(processes)
        print(f"Logs written to {LOG_DIR}")


if __name__ == "__main__":
    raise SystemExit(main())
