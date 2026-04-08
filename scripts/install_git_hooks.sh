#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
template_path="${repo_root}/scripts/hooks/pre-commit"
hook_dir="${repo_root}/.git/hooks"
hook_file="${hook_dir}/pre-commit"

if [[ ! -f "${template_path}" ]]; then
  echo "Expected hook template not found: ${template_path}" >&2
  exit 1
fi

mkdir -p "${hook_dir}"
cp "${template_path}" "${hook_file}"
chmod +x "${hook_file}"
git config --local core.hooksPath '.git/hooks'

echo "Installed pre-commit hook at: ${hook_file}"
echo "Git hooks path: .git/hooks"
