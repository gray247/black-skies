"""Pydantic models implementing OutlineSchema v1."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class OutlineChapter(BaseModel):
    """Chapter metadata persisted in the outline artifact."""

    id: str = Field(pattern=r"^ch_\d{4}$")
    order: int = Field(ge=1)
    title: str


class OutlineScene(BaseModel):
    """Scene summary persisted in the outline artifact."""

    id: str = Field(pattern=r"^sc_\d{4}$")
    order: int = Field(ge=1)
    title: str
    chapter_id: str = Field(pattern=r"^ch_\d{4}$")
    beat_refs: list[str] = Field(default_factory=list)


class OutlineArtifact(BaseModel):
    """Top-level outline artifact validated before persistence."""

    schema_version: Literal["OutlineSchema v1"] = "OutlineSchema v1"
    outline_id: str = Field(pattern=r"^out_\d{3}$")
    acts: list[str] = Field(default_factory=list)
    chapters: list[OutlineChapter] = Field(default_factory=list)
    scenes: list[OutlineScene] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate_collections(self) -> "OutlineArtifact":
        if not self.acts:
            msg = "At least one act is required."
            raise ValueError(msg)
        if not self.chapters:
            msg = "At least one chapter is required."
            raise ValueError(msg)
        if not self.scenes:
            msg = "At least one scene is required."
            raise ValueError(msg)

        chapter_ids = {chapter.id for chapter in self.chapters}
        if len(chapter_ids) != len(self.chapters):
            msg = "Chapter IDs must be unique."
            raise ValueError(msg)

        scene_ids = {scene.id for scene in self.scenes}
        if len(scene_ids) != len(self.scenes):
            msg = "Scene IDs must be unique."
            raise ValueError(msg)

        for scene in self.scenes:
            if scene.chapter_id not in chapter_ids:
                msg = f"Scene {scene.id} references missing chapter {scene.chapter_id}."
                raise ValueError(msg)

        return self


__all__ = ["OutlineArtifact", "OutlineChapter", "OutlineScene"]
