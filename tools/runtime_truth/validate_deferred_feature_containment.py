"""Validate deferred-feature containment between docs and runtime truth ledger."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

DEFERRED_DOCS: dict[str, str] = {
    "voice_notes": "docs/deferred/voice_notes_transcription.md",
    "smart_merge": "docs/deferred/smart_merge_tool.md",
    "accessibility_toggles": "docs/gui/accessibility_toggles.md",
}


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _parse_doc_declaration(text: str) -> tuple[bool, str, str]:
    dep_match = re.search(r"Live runtime dependency:\s*\*\*(yes|no)\*\*", text, flags=re.IGNORECASE)
    state_match = re.search(r"Seam state:\s*\*\*([a-z_]+)\*\*", text, flags=re.IGNORECASE)
    type_match = re.search(r"Seam type:\s*\*\*([a-z_]+)\*\*", text, flags=re.IGNORECASE)

    if dep_match is None:
        raise ValueError("Missing 'Live runtime dependency' declaration.")
    if state_match is None:
        raise ValueError("Missing 'Seam state' declaration.")
    if type_match is None:
        raise ValueError("Missing 'Seam type' declaration.")

    dependency = dep_match.group(1).lower() == "yes"
    seam_state = state_match.group(1).lower()
    seam_type = type_match.group(1).lower()
    return dependency, seam_state, seam_type


def _load_ledger(root: Path) -> dict[str, Any]:
    ledger_path = root / "build" / "runtime_truth.json"
    return json.loads(ledger_path.read_text(encoding="utf-8"))


def validate_deferred_feature_containment(repo_root: Path | None = None) -> list[str]:
    root = repo_root or REPO_ROOT
    errors: list[str] = []

    ledger = _load_ledger(root)
    deferred_entries = {
        entry["name"]: entry
        for entry in ledger.get("deferred_docs", [])
        if isinstance(entry, dict) and "name" in entry
    }

    for feature_name, rel_path in DEFERRED_DOCS.items():
        doc_path = root / rel_path
        if not doc_path.exists():
            errors.append(f"{rel_path}: deferred doc missing.")
            continue

        text = _read(doc_path)
        lowered = text.lower()
        if "seam owner:" not in lowered:
            errors.append(f"{rel_path}: missing seam owner declaration.")
            continue

        try:
            doc_dep, doc_seam_state, doc_seam_type = _parse_doc_declaration(text)
        except ValueError as exc:
            errors.append(f"{rel_path}: {exc}")
            continue

        ledger_entry = deferred_entries.get(feature_name)
        if ledger_entry is None:
            errors.append(f"{rel_path}: missing deferred_docs ledger entry '{feature_name}'.")
            continue

        ledger_dep = bool(ledger_entry.get("live_runtime_dependency"))
        ledger_state = str(ledger_entry.get("seam_state", "")).lower()
        ledger_type = str(ledger_entry.get("seam_type", "")).lower()
        ledger_owners = ledger_entry.get("seam_owners", [])
        if not isinstance(ledger_owners, list):
            errors.append(f"{rel_path}: ledger seam_owners must be an array.")
            continue

        if doc_dep != ledger_dep:
            errors.append(
                f"{rel_path}: doc/ledger mismatch for live runtime dependency "
                f"(doc={doc_dep}, ledger={ledger_dep})."
            )
        if doc_seam_state != ledger_state:
            errors.append(
                f"{rel_path}: doc/ledger mismatch for seam state (doc={doc_seam_state}, ledger={ledger_state})."
            )
        if doc_seam_type != ledger_type:
            errors.append(
                f"{rel_path}: doc/ledger mismatch for seam type (doc={doc_seam_type}, ledger={ledger_type})."
            )

        seam_owner_line = next((line for line in text.splitlines() if "Seam owner:" in line), "")
        owner_line_lower = seam_owner_line.lower()
        if doc_dep:
            if "none" in owner_line_lower:
                errors.append(f"{rel_path}: live seam cannot declare seam owner as none.")
            for owner in ledger_owners:
                if owner not in text:
                    errors.append(f"{rel_path}: seam owner '{owner}' missing from doc declaration.")
        else:
            if "none" not in owner_line_lower:
                errors.append(f"{rel_path}: no-seam deferred doc must declare seam owner as none.")
            if ledger_owners:
                errors.append(
                    f"{rel_path}: no-seam deferred ledger entry must not declare seam owners."
                )

    return errors


def main() -> None:
    errors = validate_deferred_feature_containment()
    if errors:
        joined = "\n".join(f"- {entry}" for entry in errors)
        raise SystemExit(f"Deferred feature containment violations:\n{joined}")
    print("Deferred feature containment check passed.")


if __name__ == "__main__":
    main()
