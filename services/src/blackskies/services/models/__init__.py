"""Pydantic models for service IO."""

from .errors import ErrorCode, ErrorDetail
from .outline import OutlineArtifact, OutlineChapter, OutlineScene
from .outline_response import OutlineBuildResponse
from .draft import DraftGenerateRequest, DraftUnitOverrides, DraftUnitScope
from .draft_response_shared import (
    BudgetStatus,
    DraftBudgetSummary,
    DraftPreflightBudget,
    DraftSceneSummary,
    DraftUnitModel,
    ModelDescriptor,
    SnapshotInfo,
)
from .draft_generate_response import DraftGenerateResponse, GeneratedDraftUnit
from .draft_preflight_response import DraftPreflightResponse
from .draft_rewrite_response import (
    DiffAddition,
    DiffAnchors,
    DiffChange,
    DiffRemoval,
    DraftRewriteDiff,
    DraftRewriteResponse,
)
from .draft_critique_response import (
    CritiqueLineComment,
    CritiqueSuggestedEdit,
    DraftCritiqueResponse,
)
from .draft_export_response import DraftExportResponse
from .draft_recovery_response import DraftRecoveryResponse, RecoveryStatus
from .wizard import (
    OutlineBuildRequest,
    WizardActLock,
    WizardChapterLock,
    WizardLocks,
    WizardSceneLock,
)
from .accept import DraftAcceptRequest, DraftAcceptUnit
from .rewrite import DraftRewriteRequest, DraftRewriteUnit
from .project import ProjectBudget, ProjectMetadata

__all__ = [
    "BudgetStatus",
    "CritiqueLineComment",
    "CritiqueSuggestedEdit",
    "DiffAddition",
    "DiffAnchors",
    "DiffChange",
    "DiffRemoval",
    "DraftAcceptRequest",
    "DraftAcceptUnit",
    "DraftBudgetSummary",
    "DraftCritiqueResponse",
    "DraftExportResponse",
    "DraftGenerateRequest",
    "DraftGenerateResponse",
    "DraftPreflightBudget",
    "DraftPreflightResponse",
    "DraftRecoveryResponse",
    "DraftRewriteDiff",
    "DraftRewriteRequest",
    "DraftRewriteResponse",
    "DraftRewriteUnit",
    "DraftSceneSummary",
    "DraftUnitModel",
    "DraftUnitOverrides",
    "DraftUnitScope",
    "ErrorCode",
    "ErrorDetail",
    "GeneratedDraftUnit",
    "ModelDescriptor",
    "OutlineArtifact",
    "OutlineBuildRequest",
    "OutlineBuildResponse",
    "OutlineChapter",
    "OutlineScene",
    "ProjectBudget",
    "ProjectMetadata",
    "RecoveryStatus",
    "SnapshotInfo",
    "WizardActLock",
    "WizardChapterLock",
    "WizardLocks",
    "WizardSceneLock",
]
