"""Verify roadmap statuses stay in sync with phase_log entries."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Dict


RE_ROADMAP_ROW = re.compile(r"^\| (P\d(?:\.\d)?) \| [^|]+ \| ([^|]+) \|")
RE_PHASE_ENTRY = re.compile(r"Phase\s+(\d(?:\.\d)?)\s.*\(([^)]+)\)")

STATUS_MAP: Dict[str, str] = {
    "IN PROGRESS": "In progress",
    "LOCKED": "Complete",
    "COMPLETE": "Complete",
    "DRAFT": "Planned",
    "PLANNED": "Planned",
}

PRIORITY = {"In progress": 2, "Complete": 1, "Planned": 0}


def load_roadmap_statuses(path: Path) -> Dict[str, str]:
    statuses: Dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        match = RE_ROADMAP_ROW.match(line.strip())
        if match:
            phase, status = match.groups()
            statuses[phase] = status.strip()
    return statuses


def load_phase_log_statuses(path: Path) -> Dict[str, str]:
    statuses: Dict[str, str] = {}
    for match in RE_PHASE_ENTRY.finditer(path.read_text(encoding="utf-8")):
        phase, raw = match.groups()
        normalized = STATUS_MAP.get(raw.upper(), "Planned")
        current = statuses.get(f"P{phase}", "Planned")
        if PRIORITY[normalized] >= PRIORITY.get(current, 0):
            statuses[f"P{phase}"] = normalized
    return statuses


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    roadmap_status = load_roadmap_statuses(repo_root / "docs" / "roadmap.md")
    log_status = load_phase_log_statuses(repo_root / "phase_log.md")

    errors = []
    for phase, status in roadmap_status.items():
        expected = log_status.get(phase)
        if expected and expected != status:
            errors.append(f"{phase}: roadmap={status!r} phase_log={expected!r}")

    if errors:
        print("Status mismatch detected between roadmap and phase_log:")
        for line in errors:
            print(f"  - {line}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
