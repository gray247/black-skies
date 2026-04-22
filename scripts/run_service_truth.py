#!/usr/bin/env python
"""Run the authoritative PASS 2 backend truth lane with isolated temp/cache paths."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
PASS2_TESTS = [
    "services/tests/test_rewrite_error_path.py",
    "services/tests/test_draft_submission_normalization.py",
    "services/tests/test_snapshot_authority_enforcement.py",
    "services/tests/test_phase4_loop.py",
    "services/tests/test_e2e_synthetic_switch.py",
    "services/tests/unit/test_audited_chain_contract.py",
    "services/tests/unit/test_e2e_seam_metadata.py",
    "services/tests/unit/test_runtime_truth.py",
]


def resolve_python_executable() -> Path | None:
    candidates = (
        REPO_ROOT / ".venv" / "Scripts" / "python.exe",
        REPO_ROOT / ".venv" / "bin" / "python",
        Path(sys.executable),
    )
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def main() -> int:
    python_exe = resolve_python_executable()
    if python_exe is None:
        print("[service-truth] missing python executable (.venv or interpreter)", file=sys.stderr)
        return 2

    run_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    temp_root = REPO_ROOT / "codex_temp" / "service-truth" / run_id
    base_temp = temp_root / "basetemp"
    scratch = temp_root / "scratch"
    cache_dir = REPO_ROOT / ".pytest-cache-local" / "service-truth"

    for path in (base_temp, scratch, cache_dir):
        path.mkdir(parents=True, exist_ok=True)

    env = dict(os.environ)
    env["TEMP"] = str(scratch)
    env["TMP"] = str(scratch)
    env["TMPDIR"] = str(scratch)

    cmd = [
        str(python_exe),
        "-m",
        "pytest",
        "--basetemp",
        str(base_temp),
        "-o",
        f"cache_dir={cache_dir}",
        "-o",
        "addopts=",
        "--import-mode=importlib",
        "-p",
        "scripts.pytest_repo_temp_compat",
        "-p",
        "no:cacheprovider",
        "-q",
        *PASS2_TESTS,
    ]

    print("[service-truth] running authoritative PASS 2 lane")
    print(f"[service-truth] python: {python_exe}")
    print("[service-truth] command:", " ".join(cmd))
    result = subprocess.run(cmd, cwd=REPO_ROOT, env=env)

    # Best effort cleanup of stale basetemp entries from earlier failed runs.
    try:
        if result.returncode == 0 and base_temp.exists():
            shutil.rmtree(base_temp, ignore_errors=True)
    except Exception:
        pass
    return int(result.returncode)


if __name__ == "__main__":
    raise SystemExit(main())
