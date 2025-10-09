#!/usr/bin/env bash
# Headless smoke test runner for Black Skies FastAPI services.

set -euo pipefail

log() {
  local level="$1"
  shift
  printf '[smoke][%s] %s\n' "$level" "$*"
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
PYTHON_BIN="${VENV_DIR}/bin/python"
PROJECT_ID="${PROJECT_ID:-proj_esther_estate}"
CYCLES="${CYCLES:-3}"
HOST="${SMOKE_HOST:-127.0.0.1}"
PORT="${SMOKE_PORT:-43750}"
TIMEOUT="${SMOKE_TIMEOUT:-60}"
PROJECT_BASE_DIR="${BLACKSKIES_PROJECT_BASE_DIR:-${ROOT_DIR}/sample_project}"
PIP_FLAGS=(--require-virtualenv -r "${ROOT_DIR}/requirements.lock")

bootstrap_environment() {
  if [[ ! -d "${VENV_DIR}" ]]; then
    log info "Creating virtual environment at ${VENV_DIR}"
    python3 -m venv "${VENV_DIR}"
  fi

  # shellcheck disable=SC1090
  source "${VENV_DIR}/bin/activate"

  if [[ "${SMOKE_SKIP_INSTALL:-0}" != "1" ]]; then
    log info "Installing Python dependencies"
    "${PYTHON_BIN}" -m pip install --upgrade pip >/dev/null
    "${PYTHON_BIN}" -m pip install "${PIP_FLAGS[@]}" >/dev/null
  else
    log info "Skipping dependency installation (SMOKE_SKIP_INSTALL=1)"
  fi
}

start_service() {
  log info "Starting FastAPI services on ${HOST}:${PORT}"
  BLACKSKIES_PROJECT_BASE_DIR="${PROJECT_BASE_DIR}" \
    "${PYTHON_BIN}" -m blackskies.services --host "${HOST}" --port "${PORT}" &
  SERVICE_PID=$!
  log info "Service PID ${SERVICE_PID}"
}

stop_service() {
  if [[ -n "${SERVICE_PID:-}" ]]; then
    if kill -0 "${SERVICE_PID}" 2>/dev/null; then
      log info "Stopping FastAPI services (PID ${SERVICE_PID})"
      kill "${SERVICE_PID}" 2>/dev/null || true
      wait "${SERVICE_PID}" 2>/dev/null || true
    fi
  fi
}

run_smoke() {
  log info "Running smoke cycles (${CYCLES}) against ${PROJECT_ID}"
  BLACKSKIES_PROJECT_BASE_DIR="${PROJECT_BASE_DIR}" \
    PYTHONPATH="${ROOT_DIR}:${PYTHONPATH:-}" \
    "${PYTHON_BIN}" -m scripts.smoke_runner \
      --host "${HOST}" \
      --port "${PORT}" \
      --project-id "${PROJECT_ID}" \
      --project-base-dir "${PROJECT_BASE_DIR}" \
      --cycles "${CYCLES}" \
      --timeout "${TIMEOUT}" \
      --log-level "INFO"
}

main() {
  bootstrap_environment
  trap stop_service EXIT INT TERM
  start_service
  run_smoke
}

main "$@"
