"""Dependency injection helpers for FastAPI routers."""

from __future__ import annotations

from typing import TYPE_CHECKING, cast

from fastapi import Request

from ..config import ServiceSettings
from ..critique import CritiqueService
from ..diagnostics import DiagnosticLogger
from ..operations.recovery import RecoveryService
from ..persistence import SnapshotPersistence
from ..resilience import ServiceResilienceExecutor, ServiceResilienceRegistry

if TYPE_CHECKING:  # pragma: no cover - import for typing only
    from .outline import BuildTracker
    from .recovery import RecoveryTracker

__all__ = [
    "get_settings",
    "get_build_tracker",
    "get_critique_service",
    "get_diagnostics",
    "get_snapshot_persistence",
    "get_recovery_service",
    "get_recovery_tracker",
    "get_resilience_registry",
    "get_analytics_resilience",
    "get_critique_resilience",
]


def get_settings(request: Request) -> ServiceSettings:
    """Return the service settings configured for the application."""

    return cast(ServiceSettings, request.app.state.settings)


def get_build_tracker(request: Request) -> "BuildTracker":
    """Return the shared build tracker stored on the application state."""

    return cast("BuildTracker", request.app.state.build_tracker)


def get_diagnostics(request: Request) -> DiagnosticLogger:
    """Return the diagnostics logger stored on the application state."""

    return cast(DiagnosticLogger, request.app.state.diagnostics)


def get_snapshot_persistence(request: Request) -> SnapshotPersistence:
    """Return the snapshot persistence helper from the application state."""

    return cast(SnapshotPersistence, request.app.state.snapshot_persistence)


def get_recovery_tracker(request: Request) -> "RecoveryTracker":
    """Return the recovery tracker responsible for crash recovery flows."""

    return cast("RecoveryTracker", request.app.state.recovery_tracker)


def get_recovery_service(request: Request) -> RecoveryService:
    """Return a recovery service bound to the application snapshot persistence."""

    snapshot_persistence = get_snapshot_persistence(request)
    return RecoveryService(snapshot_persistence=snapshot_persistence)


def get_critique_service(request: Request) -> CritiqueService:
    """Return the critique service stored on the application state."""

    return cast(CritiqueService, request.app.state.critique_service)


def get_resilience_registry(request: Request) -> ServiceResilienceRegistry:
    """Return the resilience registry stored on the application state."""

    return cast(ServiceResilienceRegistry, request.app.state.resilience_registry)


def get_analytics_resilience(request: Request) -> ServiceResilienceExecutor:
    """Return the analytics resilience executor."""

    return cast(ServiceResilienceExecutor, get_resilience_registry(request).analytics)


def get_critique_resilience(request: Request) -> ServiceResilienceExecutor:
    """Return the critique resilience executor."""

    return cast(ServiceResilienceExecutor, get_resilience_registry(request).critique)
