"""Generate a lightweight dependency/metadata report for security review."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, Iterator


@dataclass(frozen=True)
class DependencyRecord:
    name: str
    version: str
    source: str


def parse_requirements(path: Path) -> Iterator[DependencyRecord]:
    if not path.exists():
        return iter(())
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "==" in stripped:
            name, version = stripped.split("==", 1)
            yield DependencyRecord(name=name.lower(), version=version, source=str(path))
        else:
            yield DependencyRecord(name=stripped.lower(), version="*", source=str(path))


def collect_records(paths: Iterable[Path]) -> list[DependencyRecord]:
    records: list[DependencyRecord] = []
    seen: set[tuple[str, str]] = set()
    for path in paths:
        for record in parse_requirements(path):
            key = (record.name, record.version)
            if key not in seen:
                records.append(record)
                seen.add(key)
    return records


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Summarize dependencies from requirements lockfiles."
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("dependency-report.json"),
        help="Path to write the JSON report (default: dependency-report.json)",
    )
    parser.add_argument(
        "files",
        nargs="*",
        type=Path,
        default=[Path("requirements.lock"), Path("requirements.dev.lock")],
        help="Lockfiles or requirement snapshots to inspect.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    records = collect_records(args.files)
    payload = {
        "dependencies": [asdict(record) for record in sorted(records, key=lambda r: r.name)],
        "sources": [str(path) for path in args.files],
    }
    args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote dependency report with {len(records)} entries to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
