"""Verify roadmap statuses stay in sync with phase_log entries."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Dict


RE_ROADMAP_ROW = re.compile(r"^\| (P\d(?:\.\d)?) \| [^|]+ \| ([^|]+) \|")
RE_PHASE_ENTRY = re.compile(r"Phase\s+(\d(?:\.\d)?)\s.*\(([^)]+)\)")
RE_PHASE_TABLE_ROW = re.compile(r"^\|\s*(P\d(?:\.\d)?)\s*\|[^|]*\|[^|]*\|\s*([^|]+)\|")

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
    content = path.read_text(encoding="utf-8")
    for line in content.splitlines():
        match = RE_PHASE_TABLE_ROW.match(line.strip())
        if not match:
            continue
        phase, raw = match.groups()
        normalized = _normalize_status(raw)
        if normalized is None:
            continue
        current = statuses.get(phase, "Planned")
        if PRIORITY[normalized] >= PRIORITY.get(current, 0):
            statuses[phase] = normalized

    # Legacy fallback: preserve compatibility with older phase_log entry formats.
    for match in RE_PHASE_ENTRY.finditer(content):
        phase, raw = match.groups()
        normalized = STATUS_MAP.get(raw.upper(), "Planned")
        current = statuses.get(f"P{phase}", "Planned")
        if PRIORITY[normalized] >= PRIORITY.get(current, 0):
            statuses[f"P{phase}"] = normalized
    return statuses


def _normalize_status(raw: str) -> str | None:
    candidate = raw.strip().lower()
    if "in progress" in candidate:
        return "In progress"
    if "lock" in candidate or "complete" in candidate:
        return "Complete"
    if "planned" in candidate:
        return "Planned"
    return None


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    roadmap_status = load_roadmap_statuses(repo_root / "docs" / "roadmap.md")
    log_status = load_phase_log_statuses(repo_root / "docs" / "phases" / "phase_log.md")

    if not log_status:
        print("No phase statuses detected in docs/phases/phase_log.md")
        return 1

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
