"""Models for persisted project metadata."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ._project_id import validate_project_id


class ProjectBudget(BaseModel):
    """Budget configuration stored in ``project.json``."""

    model_config = ConfigDict(extra="allow")

    soft: float = Field(default=5.0, ge=0.0)
    hard: float = Field(default=10.0, ge=0.0)
    spent_usd: float = Field(default=0.0, ge=0.0)

    @model_validator(mode="after")
    def _validate_limits(self) -> "ProjectBudget":
        if self.soft > self.hard:
            msg = "Soft limit must not exceed hard limit."
            raise ValueError(msg)
        if self.spent_usd > self.hard:
            msg = "Spent total exceeds hard limit."
            raise ValueError(msg)
        return self


class ProjectMetadata(BaseModel):
    """Top-level project metadata stored alongside drafts and outline."""

    model_config = ConfigDict(extra="allow")

    project_id: str | None = None
    name: str | None = None
    budget: ProjectBudget = Field(default_factory=ProjectBudget)

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return validate_project_id(value)


__all__ = ["ProjectBudget", "ProjectMetadata"]
