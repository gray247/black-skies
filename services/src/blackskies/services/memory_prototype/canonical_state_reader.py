"""Read-only canonical input reader for Memory Prototype v1.

This boundary enforces conservative canonical reads and excludes advisory lanes.
"""

from __future__ import annotations

import json
from importlib.util import find_spec
from pathlib import Path

from .schemas import CanonicalLineageKey, CanonicalNarrativeSnapshot

_yaml_spec = find_spec("yaml")
if _yaml_spec is not None:  # pragma: no branch - import branch is deterministic at runtime.
    import yaml  # type: ignore[import-not-found]
else:
    yaml = None


class CanonicalStateReader:
    """Build a canonical read snapshot from a single accepted lineage key."""

    def __init__(self, project_root: Path) -> None:
        self._project_root = project_root

    def read_snapshot(self, lineage: CanonicalLineageKey) -> CanonicalNarrativeSnapshot:
        draft_path = self._project_root / "drafts" / f"{lineage.unit_id}.md"
        if not draft_path.exists():
            raise FileNotFoundError(f"Missing accepted draft: {draft_path}")
        draft_text = draft_path.read_text(encoding="utf-8")

        locked_source, locked_payload = self._read_locked_fields()
        outline_source, outline_payload = self._read_outline()
        lore_sources, lore_payloads = self._read_lore()

        return CanonicalNarrativeSnapshot(
            lineage=lineage,
            draft_path=draft_path,
            draft_text=draft_text,
            locked_fields_source=locked_source,
            locked_fields_payload=locked_payload,
            outline_source=outline_source,
            outline_payload=outline_payload,
            lore_sources=lore_sources,
            lore_payloads=lore_payloads,
        )

    def _read_locked_fields(self) -> tuple[Path | None, list[str] | dict[str, object] | None]:
        candidates = (
            self._project_root / "locked_facts.json",
            self._project_root / ".blackskies" / "locked_facts.json",
        )
        for path in candidates:
            if not path.exists():
                continue
            payload = self._read_json(path)
            if isinstance(payload, (list, dict)):
                return path, payload
        return None, None

    def _read_outline(self) -> tuple[Path | None, dict[str, object] | None]:
        path = self._project_root / "outline.json"
        if not path.exists():
            return None, None
        payload = self._read_json(path)
        if isinstance(payload, dict):
            return path, payload
        return path, None

    def _read_lore(self) -> tuple[tuple[Path, ...], tuple[dict[str, object], ...]]:
        lore_root = self._project_root / "lore"
        if not lore_root.exists() or not lore_root.is_dir():
            return (), ()

        sources: list[Path] = []
        payloads: list[dict[str, object]] = []
        for path in sorted(lore_root.glob("*.y*ml")):
            if path.suffix not in {".yaml", ".yml"}:
                continue
            parsed = self._read_yaml(path)
            if isinstance(parsed, dict):
                sources.append(path)
                payloads.append(parsed)
        return tuple(sources), tuple(payloads)

    @staticmethod
    def _read_json(path: Path) -> object:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    @staticmethod
    def _read_yaml(path: Path) -> object:
        text = path.read_text(encoding="utf-8")
        if yaml is None:
            return None
        return yaml.safe_load(text)
