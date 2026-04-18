from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.memory_lab.compat import (
    append_reinforcement_event_current,
    load_reinforcement_events_compat,
)
from blackskies.services.memory_lab.schemas import ReinforcementEvent
from blackskies.services.memory_lab.storage import (
    legacy_reinforcement_events_path,
    reinforcement_events_path,
)


def test_compat_preserves_legacy_reinforcement_event_reads(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    legacy_target = legacy_reinforcement_events_path(project_root, "art_legacy")
    legacy_target.parent.mkdir(parents=True, exist_ok=True)
    legacy_target.write_text(
        json.dumps(
            [
                {
                    "event_id": "re_legacy_001",
                    "artifact_id": "art_legacy",
                    "event_type": "selection",
                    "delta_weight": 0.03,
                    "created_at": "2026-04-13T00:00:00Z",
                    "notes": None,
                }
            ]
        ),
        encoding="utf-8",
    )

    events = load_reinforcement_events_compat(project_root, "art_legacy")

    assert len(events) == 1
    assert events[0].event_id == "re_legacy_001"


def test_compat_append_reinforcement_event_applies_retention_limit(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    for idx in range(3):
        append_reinforcement_event_current(
            project_root,
            ReinforcementEvent(
                event_id=f"re_{idx}",
                artifact_id="art_keep_two",
                event_type="selection",
                delta_weight=0.03,
                created_at=f"2026-04-13T00:00:0{idx}Z",
                notes=None,
            ),
            retention_limit=2,
        )

    payload = json.loads(reinforcement_events_path(project_root, "art_keep_two").read_text(encoding="utf-8"))
    assert [item["event_id"] for item in payload] == ["re_1", "re_2"]
