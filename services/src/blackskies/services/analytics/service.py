"""Analytics summary service that reads project artifacts and caches results."""

from __future__ import annotations

import json
import hashlib
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List

from ..analytics import RevisionEvent, generate_analytics_payload
from ..config import ServiceSettings
from ..constants import (
    DEFAULT_EMOTION_INTENSITY,
    DEFAULT_HARD_BUDGET_LIMIT_USD,
    DEFAULT_SOFT_BUDGET_LIMIT_USD,
    EMOTION_INTENSITY_MAP,
    PACE_FAST_THRESHOLD,
    PACE_SLOW_THRESHOLD,
)
from ..diagnostics import DiagnosticLogger
from ..export import load_outline_artifact
from ..persistence.atomic import write_json_atomic
from ..scene_docs import DraftRequestError, read_scene_document
from ..utils.paths import to_posix
from ..operations.budget_service import BudgetService
from ..analytics.runtime import read_runtime_events


class AnalyticsSummaryService:
    """Build and cache analytics summaries for renderer consumption."""

    def __init__(self, *, settings: ServiceSettings, diagnostics: DiagnosticLogger) -> None:
        self._settings = settings
        self._diagnostics = diagnostics
        self._budget_service = BudgetService(settings=settings, diagnostics=diagnostics)

    def build_summary(self, project_id: str) -> dict[str, Any]:
        project_root = (self._settings.project_base_dir / project_id).resolve()
        if not project_root.exists():
            raise DraftRequestError(
                "Project root does not exist.",
                {"project_id": project_id, "path": to_posix(project_root)},
            )

        outline = load_outline_artifact(project_root)
        draft_units = self._load_draft_units(project_root, outline.scenes)
        revision_events = self._load_revision_events(project_root)

        fingerprint = self._compute_fingerprint(outline.model_dump(mode="json"), draft_units, revision_events)
        cached = self._read_cache(project_root)
        if cached and cached.get("fingerprint") == fingerprint:
            payload = cached.get("payload")
            if isinstance(payload, dict):
                return payload

        analytics_payload = generate_analytics_payload(
            outline=outline.model_dump(mode="json"),
            draft_units=draft_units,
            revision_events=revision_events,
        )
        rendered = {
            "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "runtime_hints": self._runtime_hints(),
            "cost_overlays": self._cost_overlays(project_root),
            "runtime_event_summary": self._runtime_event_summary(project_root),
            **asdict(analytics_payload),
        }
        self._write_cache(project_root, {"fingerprint": fingerprint, "payload": rendered})
        return rendered

    def _load_draft_units(self, project_root: Path, scenes: List[Any]) -> list[dict[str, Any]]:
        draft_units: list[dict[str, Any]] = []
        for scene in scenes:
            scene_id = scene.id
            try:
                _, front_matter, body = read_scene_document(project_root, scene_id)
            except DraftRequestError as exc:
                self._diagnostics.log(
                    project_root,
                    code="ANALYTICS",
                    message="Scene missing for analytics; skipping.",
                    details={"unit_id": scene_id, **exc.details},
                )
                continue
            draft_units.append(
                {
                    "id": scene_id,
                    "scene_id": scene_id,
                    "title": front_matter.get("title") or scene.title,
                    "text": body,
                    "meta": front_matter,
                }
            )
        return draft_units

    def _load_revision_events(self, project_root: Path) -> list[RevisionEvent]:
        events: list[RevisionEvent] = []
        snapshots_dir = project_root / "history" / "snapshots"
        if not snapshots_dir.exists():
            return events

        for metadata_path in sorted(snapshots_dir.glob("*/metadata.json")):
            try:
                payload = json.loads(metadata_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                self._diagnostics.log(
                    project_root,
                    code="ANALYTICS",
                    message="Failed to read snapshot metadata for analytics.",
                    details={"path": to_posix(metadata_path), "error": str(exc)},
                )
                continue
            snapshot_id = str(payload.get("snapshot_id") or "")
            timestamp = str(payload.get("created_at") or "")
            if not snapshot_id:
                continue
            events.append(
                RevisionEvent(
                    snapshot_id=snapshot_id,
                    type=self._classify_snapshot_event(payload.get("label")),
                    timestamp=timestamp,
                )
            )
        return events

    def _classify_snapshot_event(self, label: Any) -> str:
        label_text = str(label or "").lower()
        if "accept" in label_text:
            return "accept"
        if "feedback" in label_text:
            return "feedback"
        if "wizard" in label_text or "lock" in label_text:
            return "wizard"
        return "snapshot"

    def _cache_path(self, project_root: Path) -> Path:
        return project_root / ".blackskies" / "cache" / "analytics_summary.json"

    def _read_cache(self, project_root: Path) -> dict[str, Any] | None:
        cache_path = self._cache_path(project_root)
        if not cache_path.exists():
            return None
        try:
            with cache_path.open("r", encoding="utf-8") as handle:
                return json.load(handle)
        except (OSError, json.JSONDecodeError) as exc:
            self._diagnostics.log(
                project_root,
                code="ANALYTICS",
                message="Failed to read analytics cache; regenerating.",
                details={"path": to_posix(cache_path), "error": str(exc)},
            )
            return None

    def _write_cache(self, project_root: Path, payload: dict[str, Any]) -> None:
        cache_path = self._cache_path(project_root)
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        write_json_atomic(cache_path, payload)

    def _compute_fingerprint(
        self,
        outline_payload: dict[str, Any],
        draft_units: list[dict[str, Any]],
        revision_events: list[RevisionEvent],
    ) -> str:
        hasher = hashlib.sha256()
        hasher.update(json.dumps(outline_payload, sort_keys=True, ensure_ascii=False).encode("utf-8"))
        for draft in sorted(draft_units, key=lambda unit: unit.get("id", "")):
            hasher.update(
                json.dumps(draft, sort_keys=True, ensure_ascii=False).encode("utf-8")
            )
        for event in sorted(revision_events, key=lambda item: (item.timestamp, item.snapshot_id)):
            hasher.update(f"{event.snapshot_id}:{event.type}:{event.timestamp}".encode("utf-8"))
        return hasher.hexdigest()

    def _runtime_hints(self) -> dict[str, Any]:
        return {
            "budget": {
                "soft_limit_usd": DEFAULT_SOFT_BUDGET_LIMIT_USD,
                "hard_limit_usd": DEFAULT_HARD_BUDGET_LIMIT_USD,
            },
            "analytics_overrides": {
                "emotion_intensity": dict(EMOTION_INTENSITY_MAP),
                "default_emotion_intensity": DEFAULT_EMOTION_INTENSITY,
                "pace": {
                    "slow_threshold": PACE_SLOW_THRESHOLD,
                    "fast_threshold": PACE_FAST_THRESHOLD,
                },
            },
        }

    def _cost_overlays(self, project_root: Path) -> dict[str, Any]:
        try:
            state = self._budget_service.load_state(project_root)
        except Exception as exc:  # pragma: no cover - defensive logging
            self._diagnostics.log(
                project_root,
                code="ANALYTICS",
                message="Failed to load budget state for cost overlays.",
                details={"error": str(exc)},
            )
            return {}

        budget_meta = state.metadata.get("budget", {}) if isinstance(state.metadata, dict) else {}
        last_generate = None
        cached_response = budget_meta.get("last_generate_response")
        if isinstance(cached_response, dict):
            cached_budget = cached_response.get("budget")
            if isinstance(cached_budget, dict):
                last_generate = {
                    "draft_id": cached_response.get("draft_id"),
                    "estimated_usd": cached_budget.get("estimated_usd"),
                    "status": cached_budget.get("status"),
                    "total_after_usd": cached_budget.get("total_after_usd"),
                }

        overlay = {
            "budget": {
                "soft_limit_usd": round(state.soft_limit, 2),
                "hard_limit_usd": round(state.hard_limit, 2),
                "spent_usd": round(state.spent_usd, 2),
                "remaining_usd": round(max(state.hard_limit - state.spent_usd, 0.0), 2),
            },
            "last_generate": last_generate,
        }
        return overlay

    def _runtime_event_summary(self, project_root: Path) -> dict[str, Any]:
        events = list(read_runtime_events(project_root))
        total = len(events)
        services: dict[str, list[float]] = {}
        hints: dict[str, int] = {}
        for event in events:
            service = str(event.get("service") or "unknown")
            estimated = float(event.get("estimated_usd") or 0.0)
            services.setdefault(service, []).append(estimated)
            hint = str(event.get("hint") or "unknown")
            hints[hint] = hints.get(hint, 0) + 1
        service_summary = {
            service: {
                "count": len(costs),
                "avg_cost": round(sum(costs) / len(costs), 2) if costs else 0.0,
            }
            for service, costs in services.items()
        }
        latest_hint = events[-1].get("hint") if events else "none"
        return {
            "total_events": total,
            "service_summary": service_summary,
            "hint_counts": hints,
            "latest_hint": latest_hint,
        }

__all__ = ["AnalyticsSummaryService"]
