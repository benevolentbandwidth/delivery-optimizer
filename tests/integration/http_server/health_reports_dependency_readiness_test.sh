#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <server-binary> [curl-binary]" >&2
  exit 2
fi

server_bin="$1"
curl_bin="${2:-curl}"
default_port="$((36000 + ($$ % 20000)))"
port="${DELIVERYOPTIMIZER_TEST_PORT:-${default_port}}"
health_file="$(mktemp)"
log_file="$(mktemp)"

cleanup() {
  if [[ -n "${server_pid:-}" ]]; then
    kill "${server_pid}" >/dev/null 2>&1 || true
    wait "${server_pid}" >/dev/null 2>&1 || true
  fi
  rm -f "${health_file}" "${log_file}"
}
trap cleanup EXIT

env DELIVERYOPTIMIZER_PORT="${port}" VROOM_BIN="/tmp/does-not-exist-vroom" OSRM_URL="http://127.0.0.1:9" "${server_bin}" >"${log_file}" 2>&1 &
server_pid=$!

ready=false
for _ in $(seq 1 50); do
  http_code="$("${curl_bin}" -sS -o "${health_file}" -w "%{http_code}" \
    "http://127.0.0.1:${port}/health" || true)"
  if [[ "${http_code}" != "000" ]]; then
    ready=true
    break
  fi
  sleep 0.2
done

if [[ "${ready}" != "true" ]]; then
  echo "server failed to start on port ${port}" >&2
  cat "${log_file}" >&2 || true
  exit 1
fi

if [[ "${http_code}" != "503" ]]; then
  echo "expected /health to return HTTP 503 when OSRM and VROOM are unavailable, got ${http_code}" >&2
  cat "${health_file}" >&2 || true
  exit 1
fi

if ! grep -Eq '"status"[[:space:]]*:[[:space:]]*"degraded"' "${health_file}"; then
  echo "expected /health response status to be degraded when dependencies are unavailable" >&2
  cat "${health_file}" >&2 || true
  exit 1
fi

if ! grep -Eq '"checks"[[:space:]]*:' "${health_file}"; then
  echo "expected /health response to include dependency checks" >&2
  cat "${health_file}" >&2 || true
  exit 1
fi
