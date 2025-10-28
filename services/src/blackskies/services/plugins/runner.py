"""Isolated plugin runner executable."""

from __future__ import annotations

import argparse
import json
import os
import sys
import traceback
from pathlib import Path
from typing import Any, Dict, TextIO

try:
    import resource  # type: ignore[attr-defined]
except ModuleNotFoundError:  # pragma: no cover - Windows fallback
    resource = None  # type: ignore[assignment]

DEFAULT_CPU_SECONDS = 10
DEFAULT_MEMORY_BYTES = 512 * 1024 * 1024  # 512 MB
DEFAULT_FD_LIMIT = 64


def _configure_resource_limits(
    *,
    cpu_seconds: int,
    memory_bytes: int,
    fd_limit: int,
) -> None:
    if resource is None:
        return
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
    resource.setrlimit(resource.RLIMIT_AS, (memory_bytes, memory_bytes))
    resource.setrlimit(resource.RLIMIT_NOFILE, (fd_limit, fd_limit))


def _load_plugin_descriptor(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _write_message(target: TextIO, payload: Dict[str, Any]) -> None:
    target.write(json.dumps(payload))
    target.write("\n")
    target.flush()


def execute_plugin(descriptor: Dict[str, Any], request: Dict[str, Any]) -> Dict[str, Any]:
    entrypoint = descriptor.get("entrypoint")
    if not isinstance(entrypoint, str) or not entrypoint.strip():
        raise RuntimeError("Plugin manifest missing entrypoint.")

    module_path = descriptor.get("module_path")
    if module_path:
        sys.path.insert(0, module_path)

    module_name, _, attr = entrypoint.partition(":")
    if not module_name:
        raise RuntimeError("Plugin entrypoint missing module.")

    module = __import__(module_name, fromlist=[attr] if attr else [])

    if attr:
        callable_obj = getattr(module, attr)
    else:
        callable_obj = getattr(module, "run", None)
        if callable_obj is None:
            callable_obj = getattr(module, "main", None)
        if callable_obj is None:
            raise RuntimeError("Plugin entrypoint missing callable.")

    if not callable(callable_obj):
        raise RuntimeError("Plugin entrypoint is not callable.")

    result = callable_obj(request)
    if not isinstance(result, dict):
        raise RuntimeError("Plugin must return a dictionary payload.")
    return result


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="plugin-runner")
    parser.add_argument("--manifest", required=True, help="Path to plugin manifest JSON.")
    parser.add_argument("--request", help="Path to JSON request (defaults to stdin).")
    parser.add_argument("--cpu-seconds", type=int, default=DEFAULT_CPU_SECONDS)
    parser.add_argument("--memory-bytes", type=int, default=DEFAULT_MEMORY_BYTES)
    parser.add_argument("--fd-limit", type=int, default=DEFAULT_FD_LIMIT)

    args = parser.parse_args(argv)

    try:
        _configure_resource_limits(
            cpu_seconds=args.cpu_seconds,
            memory_bytes=args.memory_bytes,
            fd_limit=args.fd_limit,
        )
    except Exception as exc:
        _write_message(
            sys.stdout,
            {
                "ok": False,
                "error": "Failed to configure resource limits.",
                "details": {"error": str(exc)},
            },
        )
        sys.exit(1)

    try:
        descriptor = _load_plugin_descriptor(Path(args.manifest))
        request_payload: Dict[str, Any]
        if args.request:
            request_payload = _load_plugin_descriptor(Path(args.request))
        else:
            request_payload = json.load(sys.stdin)

        response = execute_plugin(descriptor, request_payload)
        _write_message(sys.stdout, {"ok": True, "response": response})
    except SystemExit:
        raise
    except Exception as exc:
        traceback.print_exc()
        _write_message(
            sys.stdout,
            {
                "ok": False,
                "error": str(exc),
                "details": {"stack": traceback.format_exc()},
            },
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
