#!/usr/bin/env python
"""Probe host capabilities required by verification lanes."""

from __future__ import annotations

import json
import subprocess
import sys


def probe_pipe_spawn() -> dict[str, object]:
    try:
        completed = subprocess.run(
            [sys.executable, "-c", "print('ok')"],
            check=True,
            text=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        return {
            "name": "pipe_spawn",
            "supported": True,
            "stdout": completed.stdout.strip(),
            "stderr": completed.stderr.strip(),
            "error": None,
        }
    except OSError as exc:
        return {
            "name": "pipe_spawn",
            "supported": False,
            "stdout": "",
            "stderr": "",
            "error": {"type": type(exc).__name__, "message": str(exc)},
        }
    except subprocess.CalledProcessError as exc:
        return {
            "name": "pipe_spawn",
            "supported": False,
            "stdout": (exc.stdout or "").strip(),
            "stderr": (exc.stderr or "").strip(),
            "error": {"type": type(exc).__name__, "message": str(exc)},
        }


def probe_node_pipe_spawn() -> dict[str, object]:
    node_script = (
        "const {spawnSync}=require('node:child_process');"
        "const r=spawnSync(process.execPath,['-e','process.exit(0)'],{stdio:['pipe','pipe','inherit']});"
        "if(r.error){console.error(r.error.code||r.error.message);process.exit(2);}process.stdout.write('ok');"
    )
    try:
        completed = subprocess.run(
            ["node", "-e", node_script],
            check=True,
            text=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        return {
            "name": "node_pipe_spawn",
            "supported": True,
            "stdout": completed.stdout.strip(),
            "stderr": completed.stderr.strip(),
            "error": None,
        }
    except OSError as exc:
        return {
            "name": "node_pipe_spawn",
            "supported": False,
            "stdout": "",
            "stderr": "",
            "error": {"type": type(exc).__name__, "message": str(exc)},
        }
    except subprocess.CalledProcessError as exc:
        return {
            "name": "node_pipe_spawn",
            "supported": False,
            "stdout": (exc.stdout or "").strip(),
            "stderr": (exc.stderr or "").strip(),
            "error": {"type": type(exc).__name__, "message": str(exc)},
        }


def main() -> int:
    probes = [probe_pipe_spawn(), probe_node_pipe_spawn()]
    print(json.dumps({"probes": probes}, indent=2))
    return 0 if all(bool(probe["supported"]) for probe in probes) else 1


if __name__ == "__main__":
    raise SystemExit(main())
