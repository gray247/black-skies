#!/usr/bin/env python3
"""M1 scaffold entrypoint for Memory Prototype v1 evaluation lane.

This script intentionally provides path/bootstrap validation only in M1.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from blackskies.services.memory_prototype.storage import MemoryPrototypeStorage


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Memory Prototype v1 eval scaffold")
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path.cwd(),
        help="Target project root for scaffold validation (default: current working directory).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    project_root = args.project_root.resolve()
    storage = MemoryPrototypeStorage(project_root=project_root)
    storage.ensure_scaffold()

    payload = {
        "status": "scaffold_only",
        "phase": "m1",
        "project_root": str(project_root),
        "created_paths": {
            "memory_root": str(storage.memory_root),
            "history_root": str(storage.history_root),
        },
        "note": "Evaluation logic is intentionally deferred until later M-batches.",
    }
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

