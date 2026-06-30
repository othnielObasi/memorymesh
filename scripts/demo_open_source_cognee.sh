#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${MEMORYMESH_API_BASE_URL:-http://localhost:8000}"
python scripts/run_hackathon_demo.py --base-url "$BASE_URL" --backend local_cognee --repo sample-dashboard-service
