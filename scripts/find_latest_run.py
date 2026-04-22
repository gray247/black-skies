#!/usr/bin/env python
"""Print the newest run.json path for a run family."""

from __future__ import annotations

import argparse
from pathlib import Path


PATTERNS = {
    "evaluation": "evaluation-*/run.json",
    "load-test": "load-test-*/run.json",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Find latest run.json for a run family.")
    parser.add_argument(
        "--kind",
        choices=sorted(PATTERNS.keys()),
        required=True,
        help="Run family to search for.",
    )
    parser.add_argument(
        "--root",
        default="sample_project/_runtime/runs",
        help="Runs root directory.",
    )
    args = parser.parse_args()

    root = Path(args.root)
    if not root.exists():
        raise SystemExit(f"No run root found: {root}")

    pattern = PATTERNS[args.kind]
    candidates = sorted(
        (path for path in root.glob(pattern) if path.is_file()),
        key=lambda path: path.stat().st_mtime,
    )
    if not candidates:
        raise SystemExit(f"No {args.kind} runs found under {root}")

    print(candidates[-1].resolve().as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
