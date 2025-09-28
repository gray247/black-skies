#!/usr/bin/env bash
set -euo pipefail

# Resolve repository root (parent of this script directory)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$REPO_ROOT/vendor/wheels"

mkdir -p "$TARGET_DIR"

REQ_FILES=(
  "$REPO_ROOT/requirements.lock"
  "$REPO_ROOT/requirements.dev.lock"
)

for req_file in "${REQ_FILES[@]}"; do
  if [[ -f "$req_file" ]]; then
    echo "Downloading wheels from $req_file"
    pip download --exists-action i --dest "$TARGET_DIR" -r "$req_file"
  else
    echo "Skipping missing requirements file: $req_file" >&2
  fi
done
