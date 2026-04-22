#!/usr/bin/env python3
"""Launch the truth-lane Electron app and print its PID.

This helper exists because Node child-process spawn of Electron is blocked in
some Windows environments used for this repository. The Node truth launcher
starts the backend, calls this helper, and then attaches over CDP.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    app_dir = repo_root / "app"
    electron_bin = (
        app_dir
        / "node_modules"
        / "electron"
        / "dist"
        / ("electron.exe" if os.name == "nt" else "electron")
    )
    entry_point = app_dir / "dist-electron" / "main" / "main.js"
    if not entry_point.exists():
        entry_point = app_dir / "main" / "main.ts"

    debug_port = os.environ.get("BLACKSKIES_TRUTH_DEBUG_PORT", "9222")
    env = os.environ.copy()
    args = [
        str(electron_bin),
        "--remote-debugging-port=" + debug_port,
        "--remote-debugging-address=127.0.0.1",
        str(entry_point),
    ]

    try:
        proc = subprocess.Popen(
            args,
            cwd=str(app_dir),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as exc:  # pragma: no cover - launcher errors are reported directly.
        print(f"[truth-helper] failed to launch Electron: {exc}", file=sys.stderr)
        return 1

    print(proc.pid, flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
