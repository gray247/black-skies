"""Utility to assert that a run ledger meets service-level objectives."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check a run ledger (load/eval) for SLO violations."
    )
    parser.add_argument("ledger", type=Path, help="Path to a run.json file emitted by scripts/load.py or scripts/eval.py")
    parser.add_argument(
        "--require",
        choices=["ok", "completed"],
        default="ok",
        help="Expected SLO status (default: ok).",
    )
    return parser.parse_args(argv)


def load_ledger(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"ledger not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    ledger = load_ledger(args.ledger)

    result = ledger.get("result")
    if not isinstance(result, dict):
        print("Ledger missing result payload.", file=sys.stderr)
        return 2

    slo = result.get("slo")
    if not isinstance(slo, dict):
        print("Ledger missing slo metadata.", file=sys.stderr)
        return 2

    status = slo.get("status")
    violations = slo.get("violations", [])
    print(f"SLO status: {status}")
    if violations:
        print("Violations:")
        for entry in violations:
            print(f" - {entry}")

    if status != args.require:
        print(f"SLO status expected '{args.require}' but was '{status}'.", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
