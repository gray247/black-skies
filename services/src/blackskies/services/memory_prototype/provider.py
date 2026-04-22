"""Architecture seam for future narrative-state providers.

M1 keeps this as a read-only protocol to prevent accidental canonical writes.
"""

from __future__ import annotations

from typing import Protocol

from .schemas import CanonicalLineageKey, CanonicalNarrativeSnapshot


class NarrativeStateProvider(Protocol):
    """Read-only provider seam for canonical narrative snapshots."""

    def read_snapshot(self, lineage: CanonicalLineageKey) -> CanonicalNarrativeSnapshot:
        """Return canonical data for a single accepted lineage snapshot."""
