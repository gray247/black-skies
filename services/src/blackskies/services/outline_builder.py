"""Logic for building outline artifacts from Wizard locks."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .models.outline import OutlineArtifact, OutlineChapter, OutlineScene
from .models.wizard import OutlineBuildRequest, WizardChapterLock, WizardSceneLock


class MissingLocksError(RuntimeError):
    """Raised when Wizard locks are incomplete for outline generation."""

    def __init__(self, message: str, *, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.details = details or {}


@dataclass
class OutlineBuilder:
    """Generate OutlineSchema artifacts from Wizard lock requests."""

    outline_id: str = "out_001"

    def build(self, request: OutlineBuildRequest) -> OutlineArtifact:
        """Build an outline artifact from the provided request."""

        locks = request.wizard_locks
        if not locks.acts:
            raise MissingLocksError(
                "Wizard locks missing acts.", details={"missing": "acts"}
            )
        if not locks.chapters:
            raise MissingLocksError(
                "Wizard locks missing chapters.", details={"missing": "chapters"}
            )
        if not locks.scenes:
            raise MissingLocksError(
                "Wizard locks missing scenes.", details={"missing": "scenes"}
            )

        acts = [act.title for act in locks.acts]
        chapter_map = self._build_chapters(locks.chapters)
        scenes = self._build_scenes(locks.scenes, chapter_map)

        return OutlineArtifact(
            outline_id=self.outline_id,
            acts=acts,
            chapters=list(chapter_map.values()),
            scenes=scenes,
        )

    def _build_chapters(
        self, chapters: list[WizardChapterLock]
    ) -> dict[int, OutlineChapter]:
        chapter_map: dict[int, OutlineChapter] = {}
        for index, chapter in enumerate(chapters, start=1):
            chapter_id = f"ch_{index:04d}"
            chapter_map[index] = OutlineChapter(
                id=chapter_id, order=index, title=chapter.title
            )
        return chapter_map

    def _build_scenes(
        self,
        scenes: list[WizardSceneLock],
        chapter_map: dict[int, OutlineChapter],
    ) -> list[OutlineScene]:
        built_scenes: list[OutlineScene] = []
        for index, scene in enumerate(scenes, start=1):
            chapter = chapter_map.get(scene.chapter_index)
            if chapter is None:
                raise MissingLocksError(
                    "Scene references unknown chapter.",
                    details={
                        "scene_title": scene.title,
                        "chapter_index": scene.chapter_index,
                    },
                )
            scene_id = f"sc_{index:04d}"
            built_scenes.append(
                OutlineScene(
                    id=scene_id,
                    order=index,
                    title=scene.title,
                    chapter_id=chapter.id,
                    beat_refs=list(scene.beat_refs),
                )
            )
        return built_scenes


__all__ = ["MissingLocksError", "OutlineBuilder"]
