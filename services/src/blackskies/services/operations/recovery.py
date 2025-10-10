"""Recovery service helpers for snapshot restoration."""

from __future__ import annotations

from typing import Any

from fastapi.concurrency import run_in_threadpool

from ..persistence import SnapshotPersistence


class RecoveryService:
    """Provide recovery-related operations backed by snapshot persistence."""

    def __init__(self, *, snapshot_persistence: SnapshotPersistence) -> None:
        self._snapshot_persistence = snapshot_persistence

    async def restore_snapshot(self, project_id: str, snapshot_id: str) -> dict[str, Any]:
        """Restore the given snapshot using a worker thread."""

        return await run_in_threadpool(
            self._snapshot_persistence.restore_snapshot,
            project_id,
            snapshot_id,
        )
