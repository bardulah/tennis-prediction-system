#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="/opt/tennis-scraper"
SCRIPT="${ROOT_DIR}/scrape-with-date.js"
OUTPUT_FILE="${ROOT_DIR}/matches-$(date +%F)-strip-scores.json"
WEBHOOK_URL="http://193.24.209.9:5678/webhook/tennis-predictions"

echo "[$(date --iso-8601=seconds)] Starting morning scrape run"

cd "${ROOT_DIR}"

node "${SCRIPT}" --today --strip-scores

if [[ ! -f "${OUTPUT_FILE}" ]]; then
  echo "[$(date --iso-8601=seconds)] ERROR: Expected output file '${OUTPUT_FILE}' not found" >&2
  exit 1
fi

echo "[$(date --iso-8601=seconds)] Uploading '${OUTPUT_FILE}' to predictions webhook"

curl --fail-with-body --silent --show-error \
  -X POST \
  -H "Content-Type: application/json" \
  --data-binary "@${OUTPUT_FILE}" \
  "${WEBHOOK_URL}"

echo "[$(date --iso-8601=seconds)] Morning scrape run completed successfully"
