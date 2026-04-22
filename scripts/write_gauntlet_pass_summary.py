#!/usr/bin/env python
"""Write a stable Gauntlet pass-summary artifact."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Write Gauntlet pass proof summary.")
    parser.add_argument("--pass-id", required=True)
    parser.add_argument("--command", required=True)
    parser.add_argument("--commit-sha", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--status", default="success")
    parser.add_argument(
        "--artifact",
        action="append",
        default=[],
        help="Optional artifact path to include in summary.",
    )
    args = parser.parse_args()

    payload: dict[str, object] = {
        "schema_version": "GauntletPassProof v1",
        "pass_id": args.pass_id,
        "status": args.status,
        "commit_sha": args.commit_sha,
        "command": args.command,
    }
    if args.artifact:
        payload["artifacts"] = args.artifact

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(out_path.as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
