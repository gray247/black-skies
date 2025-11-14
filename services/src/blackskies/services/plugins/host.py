"""Host helpers for launching plugin runner subprocesses."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping, MutableMapping

RUNNER_MODULE = "blackskies.services.plugins.runner"


class PluginExecutionError(RuntimeError):
    """Raised when the plugin runner reports an error."""


def _write_temp_json(payload: Dict[str, Any]) -> Path:
    fd, path = tempfile.mkstemp(prefix="plugin_", suffix=".json")
    Path(path).write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return Path(path)


def launch_plugin(
    *,
    manifest_path: Path,
    request_payload: Dict[str, Any],
    python_executable: str = sys.executable,
    cpu_seconds: int | None = None,
    memory_bytes: int | None = None,
    fd_limit: int | None = None,
    env: Mapping[str, str] | None = None,
) -> Dict[str, Any]:
    """Execute a plugin inside the sandbox runner and return the response."""

    request_path = _write_temp_json(request_payload)
    cmd: list[str] = [
        python_executable,
        "-m",
        RUNNER_MODULE,
        "--manifest",
        str(manifest_path),
        "--request",
        str(request_path),
    ]
    if cpu_seconds is not None:
        cmd.extend(["--cpu-seconds", str(cpu_seconds)])
    if memory_bytes is not None:
        cmd.extend(["--memory-bytes", str(memory_bytes)])
    if fd_limit is not None:
        cmd.extend(["--fd-limit", str(fd_limit)])

    try:
        runner_env: MutableMapping[str, str] | None = None
        if env is not None:
            runner_env = dict(env)

        completed = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            env=runner_env,
        )
    finally:
        try:
            request_path.unlink()
        except OSError:
            pass

    if not completed.stdout:
        raise PluginExecutionError("Plugin runner produced no output.")

    last_line = completed.stdout.strip().splitlines()[-1]
    try:
        response = json.loads(last_line)
    except json.JSONDecodeError as exc:
        raise PluginExecutionError(f"Malformed runner response: {exc}") from exc

    if not response.get("ok"):
        raise PluginExecutionError(response.get("error", "Unknown plugin failure."))

    return response.get("response", {})


__all__ = ["launch_plugin", "PluginExecutionError"]
