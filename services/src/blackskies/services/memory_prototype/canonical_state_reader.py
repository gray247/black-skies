"""Read-only canonical input reader for Memory Prototype v1."""

from __future__ import annotations

import json
from importlib.util import find_spec
from pathlib import Path
from typing import Any

from .schemas import CanonicalLineageKey, CanonicalNarrativeSnapshot, sha256_text

_yaml_spec = find_spec("yaml")
if _yaml_spec is not None:  # pragma: no branch - import branch is deterministic at runtime.
    import yaml  # type: ignore[import-not-found]
else:
    yaml = None


class CanonicalInputEligibilityError(ValueError):
    """Raised when canonical input eligibility checks fail."""


class CanonicalStateReader:
    """Build a canonical read snapshot from a single accepted lineage key."""

    def __init__(self, project_root: Path) -> None:
        self._project_root = project_root.resolve()
        self._excluded_roots = (
            self._project_root / ".blackskies" / "continuity",
            self._project_root / ".blackskies" / "analytics",
            self._project_root / ".blackskies" / "memory",
            self._project_root / "history" / "diagnostics",
            self._project_root / "history" / "critiques",
            self._project_root / "history" / "rewrites",
            self._project_root / "history" / "memory_prototype",
        )

    def read_snapshot(self, lineage: CanonicalLineageKey) -> CanonicalNarrativeSnapshot:
        self._enforce_lineage_eligibility(lineage)
        canonical_root = self._resolve_canonical_root(lineage)
        snapshot_metadata = self._read_snapshot_metadata(lineage)

        draft_path = canonical_root / "drafts" / f"{lineage.unit_id}.md"
        if not draft_path.exists():
            raise FileNotFoundError(f"Missing accepted draft: {draft_path}")
        self._assert_not_excluded(draft_path)
        draft_text = draft_path.read_text(encoding="utf-8")

        locked_source, locked_payload = self._read_locked_fields(canonical_root)
        outline_source, outline_payload = self._read_outline(canonical_root)
        lore_sources, lore_payloads = self._read_lore(canonical_root)

        accepted_hash_mode = "lineage_fallback_hash" if lineage.accepted_source_hash else "unknown"
        if lineage.accepted_source_hash:
            computed = self._compute_accepted_source_hash(
                unit_id=lineage.unit_id,
                draft_text=draft_text,
                outline_payload=outline_payload,
            )
            if computed != lineage.accepted_source_hash:
                raise CanonicalInputEligibilityError(
                    "accepted_source_hash mismatch; draft content is not eligible for canonical memory input"
                )
            accepted_hash = computed
        elif snapshot_metadata is not None:
            metadata_hash = str(snapshot_metadata.get("accepted_source_hash", "")).strip()
            if metadata_hash:
                computed = self._compute_accepted_source_hash(
                    unit_id=lineage.unit_id,
                    draft_text=draft_text,
                    outline_payload=outline_payload,
                )
                if computed != metadata_hash:
                    raise CanonicalInputEligibilityError(
                        "accepted_source_hash check failed for replay/eval lineage"
                    )
                accepted_hash = computed
                accepted_hash_mode = "metadata_hash"
            else:
                # Legacy compatibility: old snapshots may not persist accepted_source_hash.
                self._validate_legacy_replay_metadata(snapshot_metadata)
                accepted_hash = self._compute_accepted_source_hash(
                    unit_id=lineage.unit_id,
                    draft_text=draft_text,
                    outline_payload=outline_payload,
                    require_front_matter=True,
                )
                accepted_hash_mode = "legacy_replay_derived"
        else:
            accepted_hash = self._compute_accepted_source_hash(
                unit_id=lineage.unit_id,
                draft_text=draft_text,
                outline_payload=outline_payload,
            )
            accepted_hash_mode = "live_accept"

        source_hashes = self._compute_source_hashes(
            draft_text=draft_text,
            locked_payload=locked_payload,
            outline_payload=outline_payload,
            lore_payloads=lore_payloads,
        )
        source_hashes["accepted_source_hash"] = accepted_hash
        source_hashes["accepted_source_hash_mode"] = accepted_hash_mode
        if accepted_hash_mode == "legacy_replay_derived":
            source_hashes["legacy_replay_bounded"] = "true"

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
            source_hashes=source_hashes,
            excluded_inputs_checked=tuple(str(path) for path in self._excluded_roots),
        )

    def _enforce_lineage_eligibility(self, lineage: CanonicalLineageKey) -> None:
        if lineage.snapshot_id and not lineage.snapshot_id.strip():
            raise CanonicalInputEligibilityError("snapshot_id cannot be empty")
        if lineage.context in {"replay", "eval"} and lineage.snapshot_id:
            self._find_snapshot_dir(lineage.project_id, lineage.snapshot_id)

    def _resolve_canonical_root(self, lineage: CanonicalLineageKey) -> Path:
        if lineage.context == "live_accept":
            if not lineage.snapshot_id:
                raise CanonicalInputEligibilityError(
                    "live_accept context requires snapshot_id lineage evidence"
                )
            return self._project_root
        if lineage.snapshot_id:
            return self._find_snapshot_dir(lineage.project_id, lineage.snapshot_id)
        return self._project_root

    def _read_snapshot_metadata(self, lineage: CanonicalLineageKey) -> dict[str, Any] | None:
        if lineage.context not in {"replay", "eval"} or not lineage.snapshot_id:
            return None
        snapshot_dir = self._find_snapshot_dir(lineage.project_id, lineage.snapshot_id)
        payload = self._read_json(snapshot_dir / "metadata.json")
        if not isinstance(payload, dict):
            raise CanonicalInputEligibilityError("snapshot metadata must be a JSON object")
        return payload

    def _find_snapshot_dir(self, project_id: str, snapshot_id: str) -> Path:
        snapshots_root = self._project_root / "history" / "snapshots"
        if not snapshots_root.exists():
            raise CanonicalInputEligibilityError(
                "history/snapshots is missing; cannot validate replay/eval lineage"
            )
        matches = sorted(snapshots_root.glob(f"{snapshot_id}_*"))
        if not matches:
            raise CanonicalInputEligibilityError(
                f"snapshot_id {snapshot_id!r} not found under history/snapshots"
            )
        snapshot_dir = matches[-1]
        metadata_path = snapshot_dir / "metadata.json"
        if not metadata_path.exists():
            raise CanonicalInputEligibilityError(
                f"snapshot metadata missing for snapshot_id={snapshot_id}"
            )
        metadata = self._read_json(metadata_path)
        if not isinstance(metadata, dict):
            raise CanonicalInputEligibilityError("snapshot metadata is not a JSON object")
        if str(metadata.get("snapshot_id", "")) != snapshot_id:
            raise CanonicalInputEligibilityError("snapshot_id mismatch in metadata")
        if str(metadata.get("project_id", "")) != project_id:
            raise CanonicalInputEligibilityError("project_id mismatch in snapshot metadata")
        return snapshot_dir

    def _read_locked_fields(
        self, canonical_root: Path
    ) -> tuple[Path | None, list[str] | dict[str, object] | None]:
        candidates = (
            canonical_root / "locked_facts.json",
            canonical_root / ".blackskies" / "locked_facts.json",
        )
        for path in candidates:
            if not path.exists():
                continue
            self._assert_not_excluded(path)
            payload = self._read_json(path)
            if isinstance(payload, (list, dict)):
                return path, payload
        return None, None

    def _read_outline(self, canonical_root: Path) -> tuple[Path | None, dict[str, object] | None]:
        path = canonical_root / "outline.json"
        if not path.exists():
            return None, None
        self._assert_not_excluded(path)
        payload = self._read_json(path)
        if isinstance(payload, dict):
            return path, payload
        return path, None

    def _read_lore(self, canonical_root: Path) -> tuple[tuple[Path, ...], tuple[dict[str, object], ...]]:
        lore_root = canonical_root / "lore"
        if not lore_root.exists() or not lore_root.is_dir():
            return (), ()

        sources: list[Path] = []
        payloads: list[dict[str, object]] = []
        for path in sorted(lore_root.glob("*.y*ml")):
            if path.suffix not in {".yaml", ".yml"}:
                continue
            self._assert_not_excluded(path)
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

    def _assert_not_excluded(self, path: Path) -> None:
        resolved = path.resolve()
        for excluded_root in self._excluded_roots:
            try:
                if resolved.is_relative_to(excluded_root.resolve()):
                    raise CanonicalInputEligibilityError(
                        f"excluded advisory source cannot be read as canonical input: {resolved}"
                    )
            except ValueError:
                continue

    @staticmethod
    def _compute_accepted_source_hash(
        *,
        unit_id: str,
        draft_text: str,
        outline_payload: dict[str, object] | None,
        require_front_matter: bool = False,
    ) -> str:
        front_matter = CanonicalStateReader._scene_front_matter(unit_id, outline_payload)
        if require_front_matter and front_matter is None:
            raise CanonicalInputEligibilityError(
                "legacy replay hash derivation requires matching outline scene front-matter"
            )
        return sha256_text(f"{unit_id}\n{front_matter}\n{draft_text}")

    @staticmethod
    def _scene_front_matter(unit_id: str, outline_payload: dict[str, object] | None) -> str | None:
        if not isinstance(outline_payload, dict):
            return None
        scenes = outline_payload.get("scenes")
        if not isinstance(scenes, list):
            return None
        for scene in scenes:
            if not isinstance(scene, dict):
                continue
            if str(scene.get("id", "")) != unit_id:
                continue
            return json.dumps(scene, sort_keys=True, ensure_ascii=False)
        return None

    @staticmethod
    def _compute_source_hashes(
        *,
        draft_text: str,
        locked_payload: list[str] | dict[str, object] | None,
        outline_payload: dict[str, object] | None,
        lore_payloads: tuple[dict[str, object], ...],
    ) -> dict[str, str]:
        hashes: dict[str, str] = {"draft": sha256_text(draft_text)}
        if locked_payload is not None:
            hashes["locked_fields"] = sha256_text(
                json.dumps(locked_payload, sort_keys=True, ensure_ascii=False)
            )
        if outline_payload is not None:
            hashes["outline"] = sha256_text(json.dumps(outline_payload, sort_keys=True, ensure_ascii=False))
        if lore_payloads:
            lore_blob = json.dumps(list(lore_payloads), sort_keys=True, ensure_ascii=False)
            hashes["lore"] = sha256_text(lore_blob)
        return hashes

    @staticmethod
    def _validate_legacy_replay_metadata(snapshot_metadata: dict[str, Any]) -> None:
        label = str(snapshot_metadata.get("label", "")).strip().lower()
        if label != "accept":
            raise CanonicalInputEligibilityError(
                "legacy replay hash derivation requires metadata label='accept'"
            )

        includes = snapshot_metadata.get("includes")
        if not isinstance(includes, list):
            raise CanonicalInputEligibilityError(
                "legacy replay hash derivation requires metadata includes list"
            )
        include_set = {str(item).strip() for item in includes if str(item).strip()}
        required = {"drafts", "outline.json"}
        if not required.issubset(include_set):
            raise CanonicalInputEligibilityError(
                "legacy replay hash derivation requires metadata includes drafts and outline.json"
            )
