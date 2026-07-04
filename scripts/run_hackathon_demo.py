#!/usr/bin/env python3
"""Run the MemoryMesh + Cognee hackathon demo end-to-end.

Examples:
    python scripts/run_hackathon_demo.py --base-url http://localhost:8000 --backend local_cognee
    python scripts/run_hackathon_demo.py --base-url http://localhost:8000 --backend cognee_cloud
    python scripts/run_hackathon_demo.py --base-url http://localhost:8000 --dual
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from urllib import error, parse, request


def call(method: str, url: str, payload: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
    try:
        with request.urlopen(req, timeout=180) as resp:  # noqa: S310 - local/dev utility.
            return json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        raise RuntimeError(f"{method} {url} failed: {exc.status} {body}") from exc


def enforce_no_fallback(title: str, data: dict, backend: str, allow_fallback: bool) -> None:
    if allow_fallback or backend == "offline_mirror":
        return
    if title == "Memory backend status" and not data.get("ready"):
        raise RuntimeError(f"{backend} is not ready: {json.dumps(data, default=str)}")
    if data.get("fallback_used"):
        raise RuntimeError(f"{title} used fallback for {backend}: {json.dumps(data, default=str)[:2000]}")
    for item in data.get("remembered", []) or []:
        if isinstance(item, dict) and item.get("fallback_used"):
            raise RuntimeError(f"{title} remembered item used fallback for {backend}: {json.dumps(item, default=str)[:2000]}")
    recalled = data.get("recalled")
    if isinstance(recalled, dict) and recalled.get("fallback_used"):
        raise RuntimeError(f"{title} recall used fallback for {backend}: {json.dumps(recalled, default=str)[:2000]}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--repo", default="sample-dashboard-service")
    parser.add_argument("--backend", default="local_cognee", choices=["local_cognee", "cognee_cloud", "offline_mirror"])
    parser.add_argument("--dual", action="store_true", help="Run the open-source + Cognee Cloud comparison endpoint.")
    parser.add_argument("--allow-fallback", action="store_true", help="Do not fail when a Cognee backend falls back to offline mirror.")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    smoke_dataset = f"memorymesh-smoke-{args.backend}-{int(time.time())}"

    if args.dual:
        checks = [
            ("System status", "GET", f"{base}/api/system/status", None),
            ("Dual backend proof", "POST", f"{base}/api/demo/dual-backend-proof", {"repository_name": args.repo, "backends": ["local_cognee", "cognee_cloud"]}),
        ]
    else:
        backend_qs = parse.urlencode({"backend": args.backend})
        checks = [
            ("System status", "GET", f"{base}/api/system/status", None),
            ("Memory backend status", "GET", f"{base}/api/memory/status?{backend_qs}", None),
            ("Cognee remember smoke", "POST", f"{base}/api/memory/remember", {"text": "MemoryMesh stores agent work memory in Cognee.", "dataset": smoke_dataset, "backend": args.backend}),
            ("Cognee recall smoke", "POST", f"{base}/api/memory/recall", {"query": "What does MemoryMesh store?", "dataset": smoke_dataset, "backend": args.backend}),
            ("Coding-agent recovery demo", "POST", f"{base}/api/demo/coding-agent-recovery", {"repository_name": args.repo, "backend": args.backend}),
            ("Cognee forget smoke", "POST", f"{base}/api/memory/forget", {"dataset": smoke_dataset, "backend": args.backend}),
        ]

    for title, method, url, payload in checks:
        print(f"\n=== {title} ===")
        data = call(method, url, payload)
        print(json.dumps(data, indent=2, default=str)[:12000])
        enforce_no_fallback(title, data, args.backend, args.allow_fallback)
    return 0


if __name__ == "__main__":
    sys.exit(main())
