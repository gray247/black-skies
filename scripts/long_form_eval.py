"""Run a lightweight long-form evaluation against a project."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import request as url_request

from blackskies.services.long_form_eval import (
    load_chunk_payloads,
    summarize_long_form_run,
    write_eval_summary,
)


REPO_ROOT = Path(__file__).resolve().parents[1]


def _post_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = url_request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with url_request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
    if not raw:
        raise RuntimeError("Empty response from long-form execute endpoint.")
    decoded = json.loads(raw.decode("utf-8"))
    if not isinstance(decoded, dict):
        raise RuntimeError("Invalid response shape from long-form execute endpoint.")
    return decoded


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Long-form evaluation harness")
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--chapter-id", required=True)
    parser.add_argument("--scene-ids", required=True, help="Comma-separated scene IDs")
    parser.add_argument("--chunk-size", type=int, default=1)
    parser.add_argument("--target-words", type=int, default=600)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--output", type=Path, default=None)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    scene_ids = [scene.strip() for scene in args.scene_ids.split(",") if scene.strip()]
    if not scene_ids:
        raise SystemExit("Scene IDs are required.")

    request_payload = {
        "project_id": args.project_id,
        "chapter_id": args.chapter_id,
        "scene_ids": scene_ids,
        "chunk_size": args.chunk_size,
        "target_words_per_chunk": args.target_words,
        "enabled": True,
    }

    response = _post_json(f"{args.base_url.rstrip('/')}/api/v1/long-form/execute", request_payload)
    chunks = response.get("chunks") if isinstance(response.get("chunks"), list) else []
    stopped_reason = response.get("stopped_reason")

    project_root = REPO_ROOT / "sample_project" / args.project_id
    if not project_root.exists():
        project_root = REPO_ROOT / args.project_id
    persisted_chunks = load_chunk_payloads(project_root)
    if persisted_chunks:
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
    write_eval_summary(output_path=output_path, summary=summary, extra=extra)
    print(json.dumps(summary.to_dict(), indent=2))
    print(f"Summary saved to: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
