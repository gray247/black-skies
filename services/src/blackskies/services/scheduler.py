"""Scheduled verifier runner for snapshots."""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Iterable

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .backup_verifier import run_verification
from .config import ServiceSettings
from .persistence import write_json_atomic
from .snapshots import SNAPSHOT_DIR_NAME

LOGGER = logging.getLogger(__name__)
DEFAULT_INTERVAL_SECONDS = 3600


class VerificationScheduler:
    """Periodic runner that verifies snapshots and persists the latest report."""

    def __init__(self, settings: ServiceSettings, *, interval_seconds: int | None = None) -> None:
        self._settings = settings
        self._interval = interval_seconds or getattr(settings, "verifier_schedule_seconds", DEFAULT_INTERVAL_SECONDS)
        self._scheduler = BackgroundScheduler()
        self._job = None

    def start(self) -> None:
        if self._job is not None:
            return
        trigger = IntervalTrigger(seconds=self._interval, start_date=datetime.now())
        self._job = self._scheduler.add_job(
            self._run_all,
            trigger,
            id="snapshot-verifier",
            max_instances=1,
            replace_existing=True,
        )
        self._scheduler.start()
        LOGGER.info("Scheduled verifier started (interval=%ss)", self._interval)

    def shutdown(self) -> None:
        if self._job is None:
            return
        self._scheduler.shutdown(wait=False)
        self._job = None
        LOGGER.info("Scheduled verifier stopped")

    def _run_all(self) -> None:
        for project_root in self._project_roots():
            try:
                report = run_verification(project_root, latest_only=False)
                self._persist_report(project_root, report)
            except Exception as exc:  # pragma: no cover - defensive guard
                LOGGER.exception("Scheduled verification failed for %s", project_root, exc_info=exc)

    def _project_roots(self) -> Iterable[Path]:
        base = self._settings.project_base_dir
        if not base.exists():
            return []
        for candidate in base.iterdir():
            if candidate.is_dir():
                if (candidate / "project.json").exists():
                    yield candidate

    def _persist_report(self, project_root: Path, report: dict[str, object]) -> None:
        snapshot_dir = project_root / SNAPSHOT_DIR_NAME
        snapshot_dir.mkdir(parents=True, exist_ok=True)
        target = snapshot_dir / "last_verification.json"
        write_json_atomic(target, report)
