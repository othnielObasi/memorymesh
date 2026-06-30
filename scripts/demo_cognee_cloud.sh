#!/usr/bin/env bash
set -euo pipefail
: "${COGNEE_SERVICE_URL:?Set COGNEE_SERVICE_URL for Cognee Cloud mode}"
: "${COGNEE_API_KEY:?Set COGNEE_API_KEY for Cognee Cloud mode}"
BASE_URL="${MEMORYMESH_API_BASE_URL:-http://localhost:8000}"
python scripts/run_hackathon_demo.py --base-url "$BASE_URL" --backend cognee_cloud --repo sample-dashboard-service
