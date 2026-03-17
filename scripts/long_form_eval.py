"""Run a lightweight long-form evaluation against a project."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error as url_error
from urllib import request as url_request

from blackskies.services.long_form_eval import (
    load_chunk_payloads,
    summarize_long_form_run,
    summarize_long_form_variance,
    write_eval_summary,
)


REPO_ROOT = Path(__file__).resolve().parents[1]


def classify_provider_type(base_url: str | None) -> str:
    normalized = str(base_url or "").rstrip("/").lower()
    if normalized.startswith("https://api.openai.com/v1"):
        return "REAL OPENAI API"
    if normalized:
        return "LOCAL COMPATIBLE ENDPOINT"
    return "UNKNOWN"


def _post_json(
    url: str,
    payload: dict[str, Any],
    *,
    timeout_seconds: float,
) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = url_request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with url_request.urlopen(req, timeout=timeout_seconds) as resp:
        raw = resp.read()
    if not raw:
        raise RuntimeError("Empty response from long-form execute endpoint.")
    decoded = json.loads(raw.decode("utf-8"))
    if not isinstance(decoded, dict):
        raise RuntimeError("Invalid response shape from long-form execute endpoint.")
    return decoded


def _get_json(
    url: str,
    *,
    timeout_seconds: float,
) -> dict[str, Any]:
    req = url_request.Request(url, method="GET")
    with url_request.urlopen(req, timeout=timeout_seconds) as resp:
        raw = resp.read()
    if not raw:
        raise RuntimeError("Empty response from health endpoint.")
    decoded = json.loads(raw.decode("utf-8"))
    if not isinstance(decoded, dict):
        raise RuntimeError("Invalid response shape from health endpoint.")
    return decoded


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Long-form evaluation harness")
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--chapter-id", required=True)
    parser.add_argument("--scene-ids", required=True, help="Comma-separated scene IDs")
    parser.add_argument("--chunk-size", type=int, default=1)
    parser.add_argument("--target-words", type=int, default=600)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument(
        "--request-timeout-seconds",
        type=float,
        default=120.0,
        help="Client timeout for the long-form execute HTTP request.",
    )
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument(
        "--skip-preflight",
        action="store_true",
        help="Skip runtime/server preflight checks before executing the eval request.",
    )
    parser.add_argument(
        "--allow-local-compatible-provider",
        action="store_true",
        help="Permit local OpenAI-compatible endpoints during eval preflight.",
    )
    parser.add_argument(
        "--compare",
        nargs="*",
        type=Path,
        default=None,
        help="Existing eval summary JSON files to aggregate for variance reporting.",
    )
    return parser.parse_args()


def _load_summary_payload(path: Path) -> dict[str, Any] | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(payload, dict):
        return None
    summary = payload.get("summary")
    if isinstance(summary, dict):
        return summary
    return None


def _runtime_preflight_error(message: str) -> RuntimeError:
    return RuntimeError(f"EVAL PREFLIGHT FAILED: {message}")


def validate_runtime_preflight(
    health_payload: dict[str, Any],
    *,
    require_real_openai: bool,
) -> dict[str, Any]:
    if str(health_payload.get("status")) != "ok":
        raise _runtime_preflight_error("API server is reachable but not healthy.")
    runtime = health_payload.get("runtime")
    if not isinstance(runtime, dict):
        raise _runtime_preflight_error("Health payload does not expose runtime provider state.")
    provider_type = classify_provider_type(runtime.get("resolved_base_url"))
    routing_policy = str(runtime.get("routing_policy") or "")
    provider_calls_enabled = bool(runtime.get("provider_calls_enabled"))
    long_form_provider_enabled = bool(runtime.get("long_form_provider_enabled"))
    long_form_prefer_api = bool(runtime.get("long_form_prefer_api"))
    if require_real_openai and provider_type != "REAL OPENAI API":
        raise _runtime_preflight_error(
            f"Expected real OpenAI API, got {provider_type} at {runtime.get('resolved_base_url')}."
        )
    if routing_policy != "api_only":
        raise _runtime_preflight_error(f"Expected routing_policy=api_only, got {routing_policy or 'unknown'}.")
    if not provider_calls_enabled:
        raise _runtime_preflight_error("provider_calls_enabled is false.")
    if not long_form_provider_enabled:
        raise _runtime_preflight_error("long_form_provider_enabled is false.")
    if not long_form_prefer_api:
        raise _runtime_preflight_error("long_form_prefer_api is false.")
    return {
        "provider_type": provider_type,
        "resolved_base_url": runtime.get("resolved_base_url"),
        "resolved_model": runtime.get("resolved_model"),
        "rewrite_retry_model": runtime.get("rewrite_retry_model"),
        "rescue_model": runtime.get("rescue_model"),
        "routing_policy": routing_policy,
        "provider_calls_enabled": provider_calls_enabled,
        "long_form_provider_enabled": long_form_provider_enabled,
        "long_form_prefer_api": long_form_prefer_api,
    }


def run_preflight(
    *,
    base_url: str,
    timeout_seconds: float,
    require_real_openai: bool,
) -> dict[str, Any]:
    health_url = f"{base_url.rstrip('/')}/api/v1/healthz"
    try:
        health_payload = _get_json(health_url, timeout_seconds=timeout_seconds)
    except url_error.URLError as exc:
        raise _runtime_preflight_error(f"API server unreachable at {health_url}: {exc.reason}") from exc
    except TimeoutError as exc:
        raise _runtime_preflight_error(f"API server timed out at {health_url}: {exc}") from exc
    return validate_runtime_preflight(
        health_payload,
        require_real_openai=require_real_openai,
    )


def main() -> int:
    args = parse_args()
    scene_ids = [scene.strip() for scene in args.scene_ids.split(",") if scene.strip()]
    if not scene_ids:
        raise SystemExit("Scene IDs are required.")
    preflight_summary: dict[str, Any] | None = None
    if not args.skip_preflight:
        preflight_summary = run_preflight(
            base_url=args.base_url,
            timeout_seconds=min(args.request_timeout_seconds, 15.0),
            require_real_openai=not args.allow_local_compatible_provider,
        )
        print("EVAL PREFLIGHT: OK")
        print(json.dumps(preflight_summary, indent=2))

    request_payload = {
        "project_id": args.project_id,
        "chapter_id": args.chapter_id,
        "scene_ids": scene_ids,
        "chunk_size": args.chunk_size,
        "target_words_per_chunk": args.target_words,
        "enabled": True,
    }

    response = _post_json(
        f"{args.base_url.rstrip('/')}/api/v1/long-form/execute",
        request_payload,
        timeout_seconds=args.request_timeout_seconds,
    )
    chunks = response.get("chunks") if isinstance(response.get("chunks"), list) else []
    response_chunk_ids = [
        chunk.get("chunk_id")
        for chunk in chunks
        if isinstance(chunk, dict) and chunk.get("chunk_id")
    ]
    stopped_reason = response.get("stopped_reason")

    project_root = REPO_ROOT / "sample_project" / args.project_id
    if not project_root.exists():
        project_root = REPO_ROOT / args.project_id
    persisted_chunks = load_chunk_payloads(project_root)
    if persisted_chunks:
        if response_chunk_ids:
            chunks = [chunk for chunk in persisted_chunks if chunk.get("chunk_id") in response_chunk_ids]
        else:
            chunks = persisted_chunks

    summary = summarize_long_form_run(
        project_id=args.project_id,
        chapter_id=args.chapter_id,
        chunks=chunks,
        stopped_reason=stopped_reason,
    )

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    output_path = args.output
    if output_path is None:
        output_path = (
            project_root
            / ".blackskies"
            / "long_form"
            / "eval"
            / f"eval_{timestamp}.json"
        )

    extra = {
        "request": request_payload,
        "response": {
            "stopped_reason": stopped_reason,
            "chunk_count": len(chunks),
        },
    }
    if preflight_summary is not None:
        extra["preflight"] = preflight_summary
    if args.compare:
        summaries: list[dict[str, Any]] = []
        for path in args.compare:
            summary_payload = _load_summary_payload(path)
            if summary_payload:
                summaries.append(summary_payload)
        summaries.append(summary.to_dict())
        extra["variance"] = summarize_long_form_variance(summaries)
    write_eval_summary(output_path=output_path, summary=summary, extra=extra)
    print(json.dumps(summary.to_dict(), indent=2))
    print(f"Summary saved to: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
