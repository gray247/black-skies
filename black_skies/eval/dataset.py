"""Eval dataset loader and task models."""

from __future__ import annotations

from enum import StrEnum
from pathlib import Path
from typing import Annotated, Iterator, Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, ValidationError, model_validator


class EvalTaskSchemaVersion(StrEnum):
    """Supported schema versions for eval task cards."""

    V1 = "EvalTaskSchema v1"


class EvalTaskFlow(StrEnum):
    """High-level flow grouping for evaluation tasks."""

    WIZARD = "wizard"
    DRAFT = "draft"
    CRITIQUE = "critique"


class OutlineChapter(BaseModel):
    """Chapter shape from OutlineSchema v1."""

    model_config = ConfigDict(extra="forbid")

    id: str
    order: int = Field(..., ge=1)
    title: str


class OutlineScene(BaseModel):
    """Scene summary shape from OutlineSchema v1."""

    model_config = ConfigDict(extra="forbid")

    id: str
    order: int = Field(..., ge=1)
    title: str
    chapter_id: str | None = None
    beat_refs: list[str] | None = None


class OutlineArtifact(BaseModel):
    """Outline artifact as defined in docs/data_model.md."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["OutlineSchema v1"]
    outline_id: str
    acts: list[str]
    chapters: list[OutlineChapter]
    scenes: list[OutlineScene]


class SceneMeta(BaseModel):
    """Metadata describing a draft unit."""

    model_config = ConfigDict(extra="forbid")

    pov: str | None = None
    purpose: Literal["setup", "escalation", "payoff", "breath"] | None = None
    emotion_tag: Literal["dread", "tension", "respite", "revelation", "aftermath"] | None = None
    goal: str | None = None
    conflict: str | None = None
    turn: str | None = None
    word_target: int | None = Field(default=None, ge=0)
    beats: list[str] | None = None


class ModelInfo(BaseModel):
    """Model metadata captured alongside generated artifacts."""

    model_config = ConfigDict(extra="forbid")

    name: str
    provider: str


class DraftUnitPayload(BaseModel):
    """Draft unit input payload used for critique tasks."""

    model_config = ConfigDict(extra="forbid")

    id: str
    text: str
    meta: SceneMeta
    prompt_fingerprint: str | None = None
    model: ModelInfo | None = None


class DraftUnitArtifact(DraftUnitPayload):
    """Draft unit output artifact enforcing required generation fields."""

    prompt_fingerprint: str
    model: ModelInfo


class DraftBudget(BaseModel):
    """Budget estimate accompanying a draft artifact."""

    model_config = ConfigDict(extra="forbid")

    estimated_usd: float = Field(..., ge=0.0)


class DraftArtifact(BaseModel):
    """Draft artifact aligned with DraftUnitSchema v1."""

    model_config = ConfigDict(extra="forbid")

    draft_id: str
    schema_version: Literal["DraftUnitSchema v1"]
    units: list[DraftUnitArtifact]
    budget: DraftBudget


class CritiqueLineComment(BaseModel):
    """Inline critique comment referencing a line number."""

    model_config = ConfigDict(extra="forbid")

    line: int = Field(..., ge=1)
    note: str


class CritiqueSuggestedEdit(BaseModel):
    """Suggested edit referencing a character range."""

    model_config = ConfigDict(extra="forbid")

    range: tuple[int, int]
    replacement: str

    @model_validator(mode="after")
    def validate_range(self) -> "CritiqueSuggestedEdit":
        start, end = self.range
        if start < 0 or end < 0:
            msg = "Suggested edit range positions must be non-negative"
            raise ValueError(msg)
        if end < start:
            msg = "Suggested edit range end must be greater than or equal to start"
            raise ValueError(msg)
        return self


class CritiqueArtifact(BaseModel):
    """Critique output aligned with CritiqueOutputSchema v1."""

    model_config = ConfigDict(extra="forbid")

    unit_id: str
    schema_version: Literal["CritiqueOutputSchema v1"]
    summary: str
    line_comments: list[CritiqueLineComment]
    priorities: list[str]
    suggested_edits: list[CritiqueSuggestedEdit]
    model: ModelInfo


class WizardEvalInputs(BaseModel):
    """Wizard flow inputs that seed an outline build."""

    model_config = ConfigDict(extra="forbid")

    project_id: str
    wizard_locks: dict[str, object] = Field(default_factory=dict)


class WizardEvalExpected(BaseModel):
    """Expected Wizard flow output artifact."""

    model_config = ConfigDict(extra="forbid")

    outline: OutlineArtifact


class DraftEvalInputs(BaseModel):
    """Draft flow inputs containing context and prompts."""

    model_config = ConfigDict(extra="forbid")

    project_id: str
    scene_id: str
    brief: str | None = None
    outline: OutlineArtifact | None = None


class DraftEvalExpected(BaseModel):
    """Expected Draft flow output artifact."""

    model_config = ConfigDict(extra="forbid")

    draft: DraftArtifact


class CritiqueEvalInputs(BaseModel):
    """Critique flow inputs using a draft unit."""

    model_config = ConfigDict(extra="forbid")

    project_id: str
    unit: DraftUnitPayload


class CritiqueEvalExpected(BaseModel):
    """Expected Critique flow output artifact."""

    model_config = ConfigDict(extra="forbid")

    critique: CritiqueArtifact


class _EvalTaskBase(BaseModel):
    """Common fields shared by all eval tasks."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal[EvalTaskSchemaVersion.V1]
    task_id: str = Field(..., pattern=r"^[a-z0-9_\-]+$")
    summary: str


class WizardEvalTask(_EvalTaskBase):
    flow: Literal[EvalTaskFlow.WIZARD]
    inputs: WizardEvalInputs
    expected: WizardEvalExpected


class DraftEvalTask(_EvalTaskBase):
    flow: Literal[EvalTaskFlow.DRAFT]
    inputs: DraftEvalInputs
    expected: DraftEvalExpected


class CritiqueEvalTask(_EvalTaskBase):
    flow: Literal[EvalTaskFlow.CRITIQUE]
    inputs: CritiqueEvalInputs
    expected: CritiqueEvalExpected


EvalTask = WizardEvalTask | DraftEvalTask | CritiqueEvalTask
_EvalTaskAdapter = TypeAdapter(
    Annotated[EvalTask, Field(discriminator="flow")]
)

DEFAULT_DATASET_DIR = Path(__file__).resolve().parents[2] / "data" / "eval_tasks"


def load_task(path: Path) -> EvalTask:
    """Load and validate a single eval task card."""

    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise
    except Exception as exc:  # pragma: no cover - pyyaml specific
        msg = f"Failed to read eval task card: {path}"
        raise ValueError(msg) from exc

    if not isinstance(data, dict):
        msg = f"Eval task card must contain a mapping: {path}"
        raise ValueError(msg)

    try:
        task = _EvalTaskAdapter.validate_python(data)
    except ValidationError as exc:
        msg = f"Invalid eval task card at {path}: {exc}"
        raise ValueError(msg) from exc
    return task


def _iter_task_files(root: Path) -> Iterator[Path]:
    for pattern in ("*.yaml", "*.yml"):
        for path in sorted(root.glob(pattern)):
            if path.is_file():
                yield path


def load_dataset(root: Path | None = None) -> list[EvalTask]:
    """Load all eval tasks from ``root`` ensuring unique task identifiers."""

    base = Path(root or DEFAULT_DATASET_DIR)
    if not base.exists():
        msg = f"Eval task directory does not exist: {base}"
        raise FileNotFoundError(msg)

    tasks: list[EvalTask] = []
    seen: dict[str, Path] = {}

    for path in _iter_task_files(base):
        task = load_task(path)
        if task.task_id in seen:
            other = seen[task.task_id]
            msg = f"Duplicate eval task id '{task.task_id}' detected in {path} and {other}"
            raise ValueError(msg)
        seen[task.task_id] = path
        tasks.append(task)

    return tasks


def iter_tasks(root: Path | None = None, *, flow: EvalTaskFlow | None = None) -> Iterator[EvalTask]:
    """Iterate over eval tasks, optionally filtering by flow."""

    tasks = load_dataset(root)
    for task in tasks:
        if flow is None or task.flow == flow:
            yield task


__all__ = [
    "CritiqueArtifact",
    "CritiqueEvalExpected",
    "CritiqueEvalInputs",
    "CritiqueEvalTask",
    "CritiqueLineComment",
    "CritiqueSuggestedEdit",
    "DEFAULT_DATASET_DIR",
    "DraftArtifact",
    "DraftEvalExpected",
    "DraftEvalInputs",
    "DraftEvalTask",
    "DraftUnitArtifact",
    "DraftUnitPayload",
    "EvalTask",
    "EvalTaskFlow",
    "EvalTaskSchemaVersion",
    "ModelInfo",
    "OutlineArtifact",
    "OutlineChapter",
    "OutlineScene",
    "SceneMeta",
    "WizardEvalExpected",
    "WizardEvalInputs",
    "WizardEvalTask",
    "iter_tasks",
    "load_dataset",
    "load_task",
]
