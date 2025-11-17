"""Unit tests for the scheduled verification runner."""

from __future__ import annotations

import json
import time
from pathlib import Path

from blackskies.services.config import ServiceSettings
from blackskies.services.scheduler import VerificationScheduler


def test_scheduler_writes_last_report(tmp_path: Path, monkeypatch) -> None:
    project_root = tmp_path / "scheduled"
    project_root.mkdir()
    (project_root / "project.json").write_text('{"project_id":"scheduled"}', encoding="utf-8")
    (project_root / "outline.json").write_text('{"schema_version":"OutlineSchema v1"}', encoding="utf-8")

    report = {"project_id": "scheduled", "snapshots": []}

    called: list[Path] = []

    def fake_verification(root: Path, *, latest_only: bool = False) -> dict[str, object]:
        assert not latest_only
        called.append(root)
        return report

    monkeypatch.setattr("blackskies.services.scheduler.run_verification", fake_verification)

    settings = ServiceSettings(project_base_dir=tmp_path)
    scheduler = VerificationScheduler(settings, interval_seconds=1)
    scheduler.start()
    try:
        time.sleep(1.5)
        assert called
        file_path = project_root / ".snapshots" / "last_verification.json"
        assert file_path.exists()
        payload = json.loads(file_path.read_text(encoding="utf-8"))
        assert payload == report
    finally:
        scheduler.shutdown()
