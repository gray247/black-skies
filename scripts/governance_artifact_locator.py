#!/usr/bin/env python3
"""Locate approved governance artifacts without implying authority."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def _build_parser() -> argparse.ArgumentParser:
    return argparse.ArgumentParser(
        description=(
            "Emit JSON records for the fixed governance-artifact allowlist. "
            "Reports path and existence only."
        )
    )


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _phase13_records(repo_root: Path) -> list[dict[str, Any]]:
    phase13_root = repo_root / "docs" / "audits" / "phase13"
    if not phase13_root.is_dir():
        return []

    return [
        {
            "path": path.relative_to(repo_root).as_posix(),
            "exists": True,
        }
        for path in sorted(phase13_root.rglob("*.md"))
        if path.is_file()
    ]


def _singleton_record(repo_root: Path, relative_path: str) -> dict[str, Any]:
    path = repo_root / relative_path
    return {
        "path": Path(relative_path).as_posix(),
        "exists": path.is_file(),
    }


def _records(repo_root: Path) -> list[dict[str, Any]]:
    records = _phase13_records(repo_root)
    records.append(
        _singleton_record(
            repo_root, "docs/audits/reconstruction_dependency_and_authority_map_pass40.md"
        )
    )
    records.append(_singleton_record(repo_root, "docs/BLACK_SKIES_FIX_TRACKER.md"))
    return sorted(records, key=lambda record: record["path"])


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    parser.parse_args(argv)

    try:
        payload = {"records": _records(_repo_root())}
        json.dump(payload, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    except Exception as exc:  # pragma: no cover - defensive fail-closed path
        print(f"governance artifact locator failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
