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
LOCKFILE="${ROOT_DIR}/requirements.lock"
VENDOR_WHEELS_DIR="${ROOT_DIR}/vendor/wheels"
INSTALL_STAMP="${VENV_DIR}/.smoke-lock"

calculate_lock_hash() {
  if [[ ! -f "${LOCKFILE}" ]]; then
    log error "Lockfile not found at ${LOCKFILE}"
    exit 1
  fi

  sha256sum "${LOCKFILE}" | awk '{print $1}'
}

mark_install_complete() {
  local lock_hash="$1"
  printf '%s\n' "${lock_hash}" > "${INSTALL_STAMP}"
}

should_skip_install() {
  if [[ "${SMOKE_SKIP_INSTALL:-0}" == "1" ]]; then
    log info "Skipping dependency installation (SMOKE_SKIP_INSTALL=1)"
    return 0
  fi

  if [[ -f "${INSTALL_STAMP}" ]]; then
    local recorded_hash
    recorded_hash="$(<"${INSTALL_STAMP}")"
    local current_hash
    current_hash="$(calculate_lock_hash)"
    if [[ "${recorded_hash}" == "${current_hash}" ]]; then
      log info "Python dependencies already match requirements.lock (${current_hash}); skipping install."
      return 0
    fi
  fi

  return 1
}

install_dependencies() {
  if should_skip_install; then
    return
  fi

  local lock_hash
  lock_hash="$(calculate_lock_hash)"

  if compgen -G "${VENDOR_WHEELS_DIR}"'/*.whl' >/dev/null 2>&1; then
    log info "Installing Python dependencies from cached wheels in ${VENDOR_WHEELS_DIR}"
    if "${PYTHON_BIN}" -m pip install --require-virtualenv --no-index --find-links "${VENDOR_WHEELS_DIR}" -r "${LOCKFILE}" >/dev/null; then
      mark_install_complete "${lock_hash}"
      return
    fi
    log warn "Cached wheel installation failed; falling back to PyPI"
  else
    log info "No cached wheels detected; installing Python dependencies from PyPI"
  fi

  if "${PYTHON_BIN}" -m pip install --require-virtualenv -r "${LOCKFILE}" >/dev/null; then
    mark_install_complete "${lock_hash}"
    return
  fi

  log error "Dependency installation failed. Verify connectivity or refresh vendor wheels."
  exit 1
}

bootstrap_environment() {
  if [[ ! -d "${VENV_DIR}" ]]; then
    log info "Creating virtual environment at ${VENV_DIR}"
    python3 -m venv "${VENV_DIR}"
  fi

  # shellcheck disable=SC1090
  source "${VENV_DIR}/bin/activate"

  install_dependencies
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
