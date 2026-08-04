#!/usr/bin/env python
"""Write the stable CI proof manifest for delegated gauntlet passes."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def _status(result: str) -> str:
    return "success" if result == "success" else "failure"


def _job(
    pass_id: str, result: str, commit_sha: str, artifacts: list[dict[str, str]]
) -> dict[str, object]:
    status = _status(result)
    return {
        "conclusion": status,
        "status": status,
        "commit_sha": commit_sha,
        "artifacts": artifacts,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Write gauntlet CI proof manifest.")
    parser.add_argument("--commit-sha", required=True)
    parser.add_argument("--artifact-root", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--pass3-result", required=True)
    parser.add_argument("--pass4-result", required=True)
    parser.add_argument("--pass5-result", required=True)
    parser.add_argument("--pass6-result", required=True)
    args = parser.parse_args()

    manifest = {
        "schema_version": "GauntletCIProof v1",
        "commit_sha": args.commit_sha,
        "artifact_root": str(Path(args.artifact_root).resolve()),
        "jobs": {
            "PASS 3": _job(
                "PASS 3",
                args.pass3_result,
                args.commit_sha,
                [
                    {"role": "summary", "path": "pass3/summary.json"},
                ],
            ),
            "PASS 4": _job(
                "PASS 4",
                args.pass4_result,
                args.commit_sha,
                [
                    {"role": "summary", "path": "pass4/summary.json"},
                    {
                        "role": "truth_receipt_json",
                        "path": "pass4/latest.json",
                    },
                    {"role": "truth_receipt_txt", "path": "pass4/latest.txt"},
                ],
            ),
            "PASS 5": _job(
                "PASS 5",
                args.pass5_result,
                args.commit_sha,
                [
                    {"role": "summary", "path": "pass5/summary.json"},
                ],
            ),
            "PASS 6": _job(
                "PASS 6",
                args.pass6_result,
                args.commit_sha,
                [
                    {"role": "summary", "path": "pass6/summary.json"},
                ],
            ),
        },
    }

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(out_path.as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
