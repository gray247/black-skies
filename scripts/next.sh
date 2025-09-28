#!/usr/bin/env bash
# Print the next build-plan step and record progress.

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROGRESS_FILE="$ROOT_DIR/.codex_step"
HISTORY_FILE="$ROOT_DIR/.codex_history"

read_progress() {
  if [[ -f "$PROGRESS_FILE" ]]; then
    cat "$PROGRESS_FILE"
  else
    echo -1
  fi
}

write_progress() {
  printf '%s\n' "$1" > "$PROGRESS_FILE"
}

log_history() {
  local step="$1"; shift
  local ts
  ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  printf '%s | %s | %s\n' "$ts" "$step" "$*" >> "$HISTORY_FILE"
}

print_step() {
  local code="$1"; shift
  local title="$1"; shift
  local details="$1"; shift

  printf '
[1;34m�[0m Step %s � %s
' "$code" "$title"
  printf '%s
' '----------------------------------------------------------------'
  printf '%b' "$details"
  printf '

'
}

steps=(
  '1.0|Phase P1.0 – Preflight service endpoint|Implement `/draft/preflight` on the FastAPI service, return budget status + estimate, and add pytest coverage.\nCodex ask: "Implement Phase P1.0: add `/draft/preflight` to the FastAPI service, returning budget status and estimates with tests."'
  '1.1|Phase P1.1 – Preflight renderer integration|Hook the preload bridge and `PreflightModal` into the real endpoint, surface status/error states, and add Vitest coverage.\nCodex ask: "Implement Phase P1.1: hook the renderer into `/draft/preflight`, update the modal, and add Vitest coverage."'
  '1.2|Phase P1.2 – Docs & regression tests|Document the preflight workflow, add regression tests, and update `phase_log.md`.\nCodex ask: "Implement Phase P1.2: document the preflight flow, add regression tests, and update the phase log."'
  '2.0|Phase P2.0 – Critique accept API|Create an accept endpoint that applies critique diffs, persists history, and logs diagnostics with tests.\nCodex ask: "Implement Phase P2.0: add an accept endpoint that applies critique diffs, persists history, and includes tests."'
  '2.1|Phase P2.1 – Snapshots & crash recovery|Persist snapshots on accept, detect crashes, and surface a recovery banner with restore option.\nCodex ask: "Implement Phase P2.1: add snapshot persistence and crash recovery banner with tests."'
  '2.2|Phase P2.2 – Critique UI polish|Expose accept/reject controls, show history, and add UI smoke tests.\nCodex ask: "Implement Phase P2.2: build the renderer UX for critique accept/reject and history with tests."'
  '3.0|Phase P3.0 – Export pipeline|Produce `draft_full.md` and YAML snapshots per the data model with pytest coverage.\nCodex ask: "Implement Phase P3.0: finalize the export pipeline (Markdown + YAML) with tests."'
  '3.1|Phase P3.1 – Packaging|Produce Windows installer + portable builds and document the process.\nCodex ask: "Implement Phase P3.1: produce Windows installer/portable builds and document the process."'
  '3.2|Phase P3.2 – Docs refresh|Update README, phase log, and changelog for the completed workflow.\nCodex ask: "Implement Phase P3.2: document the completed workflow in README/phase_log/CHANGELOG."'
  '4.0|Phase P4.0 – Observability|Add structured logging, request IDs, `/metrics`, and document monitoring.\nCodex ask: "Implement Phase P4.0: add metrics and structured logging with documentation."'
  '4.1|Phase P4.1 – Release wrap|Final doc sweep, tag release, ensure CI passes.\nCodex ask: "Implement Phase P4.1: finalize documentation, tag the release, and ensure CI passes."'
)

TOTAL=${#steps[@]}

if [[ "${1:-}" == "--reset" ]]; then
  write_progress -1
  : > "$HISTORY_FILE"
  printf '\033[1;32m✔\033[0m Progress reset.\n'
  exit 0
fi

current_index=$(read_progress)
next_index=$((current_index + 1))

if (( next_index >= TOTAL )); then
  printf '\n\033[1;32m✔\033[0m All build-plan steps have been completed!\n'
  exit 0
fi

entry=${steps[next_index]}
IFS='|' read -r code title details <<< "$entry"

print_step "$code" "$title" "$details"
write_progress "$next_index"
log_history "$code" "$title"

