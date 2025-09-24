"""Utilities for loading project data and writing scene files."""

from __future__ import annotations

import json
import logging
import os
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

from fastapi import HTTPException, status

from .settings import ServiceSettings

LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class ProjectMetadata:
    """Metadata loaded from `project.json`."""

    project_id: str
    name: str


@dataclass(frozen=True)
class ChapterSummary:
    """Summary information for a chapter from the outline."""

    id: str
    order: int
    title: str


@dataclass(frozen=True)
class SceneSummary:
    """Summary information for a scene from the outline."""

    id: str
    order: int
    title: str
    chapter_id: str | None
    beat_refs: list[str]


@dataclass(frozen=True)
class SceneMeta:
    """Metadata captured for a generated scene."""

    pov: str
    purpose: str
    emotion_tag: str
    word_target: int


@dataclass(frozen=True)
class ProjectOutline:
    """Outline data parsed from `outline.json`."""

    scenes_by_id: dict[str, SceneSummary]
    chapters_by_id: dict[str, ChapterSummary]
    scenes_by_chapter: dict[str, list[SceneSummary]]

    def scenes_for_ids(self, scene_ids: Sequence[str]) -> list[SceneSummary]:
        """Return scene summaries matching the given IDs sorted by outline order."""

        missing: list[str] = []
        results: list[SceneSummary] = []
        for scene_id in scene_ids:
            summary = self.scenes_by_id.get(scene_id)
            if summary is None:
                missing.append(scene_id)
                continue
            results.append(summary)

        if missing:
            details = {"scene_ids": missing}
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION",
                    "message": "One or more scene IDs are not present in the outline.",
                    "details": details,
                },
            )

        return sorted(results, key=lambda summary: summary.order)

    def scenes_for_chapter(self, chapter_id: str) -> list[SceneSummary]:
        """Return ordered scene summaries for the provided chapter."""

        if chapter_id not in self.chapters_by_id:
            details = {"chapter_id": chapter_id}
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION",
                    "message": "Chapter ID is not present in the outline.",
                    "details": details,
                },
            )

        summaries = self.scenes_by_chapter.get(chapter_id, [])
        return sorted(summaries, key=lambda summary: summary.order)


@dataclass(frozen=True)
class ProjectData:
    """In-memory representation of a project."""

    root: Path
    metadata: ProjectMetadata
    outline: ProjectOutline


class ProjectRepository:
    """Access project data on disk and support deterministic writes."""

    def __init__(self, data: ProjectData) -> None:
        self._data = data

    @property
    def data(self) -> ProjectData:
        """Expose the loaded project data."""

        return self._data

    @classmethod
    def from_settings(cls, settings: ServiceSettings, project_id: str) -> "ProjectRepository":
        """Locate and load a project based on the provided settings."""

        project_root = cls._locate_project_root(settings.projects_root, project_id)
        metadata = cls._load_metadata(project_root, expected_project_id=project_id)
        outline = cls._load_outline(project_root)
        return cls(ProjectData(root=project_root, metadata=metadata, outline=outline))

    @staticmethod
    def _locate_project_root(projects_root: Path, project_id: str) -> Path:
        """Locate the project directory containing the requested ID."""

        def _candidate_paths(root: Path) -> Iterable[Path]:
            if (root / "project.json").exists():
                yield root
            if root.is_dir():
                for child in root.iterdir():
                    if child.is_dir():
                        yield child

        for candidate in _candidate_paths(projects_root):
            project_file = candidate / "project.json"
            try:
                with project_file.open("r", encoding="utf-8") as handle:
                    data = json.load(handle)
            except FileNotFoundError:
                continue
            except json.JSONDecodeError as exc:  # pragma: no cover - invalid fixtures are developer errors
                LOGGER.exception("project.json contains invalid JSON in %s", candidate)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "code": "INTERNAL",
                        "message": "Unable to read project metadata.",
                        "details": {"path": str(project_file)},
                    },
                ) from exc

            if data.get("project_id") == project_id:
                LOGGER.debug("Located project %s at %s", project_id, candidate)
                return candidate

        LOGGER.error("Project %s not found under %s", project_id, projects_root)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION",
                "message": "Project ID is not registered on disk.",
                "details": {"project_id": project_id},
            },
        )

    @staticmethod
    def _load_metadata(project_root: Path, expected_project_id: str) -> ProjectMetadata:
        """Load the project metadata file and ensure IDs align."""

        project_file = project_root / "project.json"
        try:
            with project_file.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
        except FileNotFoundError as exc:
            LOGGER.exception("project.json missing for project %s", expected_project_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "INTERNAL",
                    "message": "Project metadata is unavailable.",
                    "details": {"path": str(project_file)},
                },
            ) from exc
        except json.JSONDecodeError as exc:
            LOGGER.exception("project.json invalid for project %s", expected_project_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "INTERNAL",
                    "message": "Project metadata is invalid JSON.",
                    "details": {"path": str(project_file)},
                },
            ) from exc

        project_id = data.get("project_id")
        name = data.get("name")
        if project_id != expected_project_id or name is None:
            LOGGER.error(
                "Project metadata does not match request: expected %s got %s", expected_project_id, project_id
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION",
                    "message": "Requested project does not match on-disk metadata.",
                    "details": {"project_id": expected_project_id},
                },
            )

        return ProjectMetadata(project_id=project_id, name=name)

    @staticmethod
    def _load_outline(project_root: Path) -> ProjectOutline:
        """Load outline summaries for the project."""

        outline_file = project_root / "outline.json"
        try:
            with outline_file.open("r", encoding="utf-8") as handle:
                outline_data = json.load(handle)
        except FileNotFoundError as exc:
            LOGGER.exception("outline.json missing for project at %s", project_root)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "INTERNAL",
                    "message": "Project outline is unavailable.",
                    "details": {"path": str(outline_file)},
                },
            ) from exc
        except json.JSONDecodeError as exc:
            LOGGER.exception("outline.json invalid for project at %s", project_root)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "INTERNAL",
                    "message": "Project outline is invalid JSON.",
                    "details": {"path": str(outline_file)},
                },
            ) from exc

        scenes = [
            SceneSummary(
                id=scene["id"],
                order=int(scene["order"]),
                title=scene["title"],
                chapter_id=scene.get("chapter_id"),
                beat_refs=list(scene.get("beat_refs", [])),
            )
            for scene in outline_data.get("scenes", [])
        ]

        chapters = [
            ChapterSummary(id=chapter["id"], order=int(chapter["order"]), title=chapter["title"])
            for chapter in outline_data.get("chapters", [])
        ]

        scenes_by_id = {scene.id: scene for scene in scenes}
        chapters_by_id = {chapter.id: chapter for chapter in chapters}
        scenes_by_chapter: dict[str, list[SceneSummary]] = {}
        for scene in scenes:
            if scene.chapter_id:
                scenes_by_chapter.setdefault(scene.chapter_id, []).append(scene)

        for chapter_scenes in scenes_by_chapter.values():
            chapter_scenes.sort(key=lambda summary: summary.order)

        return ProjectOutline(
            scenes_by_id=scenes_by_id,
            chapters_by_id=chapters_by_id,
            scenes_by_chapter=scenes_by_chapter,
        )

    def write_scene(self, scene: SceneSummary, meta: SceneMeta, body: str) -> None:
        """Write synthesized content to the scene Markdown file."""

        drafts_dir = self._data.root / "drafts"
        drafts_dir.mkdir(parents=True, exist_ok=True)
        scene_path = drafts_dir / f"{scene.id}.md"

        front_matter = self._build_front_matter(scene, meta)
        body_text = body.rstrip("\n") + "\n"
        content = f"{front_matter}\n\n{body_text}"

        with tempfile.NamedTemporaryFile(
            "w", encoding="utf-8", dir=drafts_dir, delete=False, newline="\n"
        ) as handle:
            handle.write(content)
            temp_path = Path(handle.name)

        os.replace(temp_path, scene_path)
        LOGGER.info("Wrote scene %s to %s", scene.id, scene_path)

    def _build_front_matter(self, scene: SceneSummary, meta: SceneMeta) -> str:
        """Construct YAML front matter respecting the locked structure."""

        entries: list[tuple[str, str | int | list[str]]] = [
            ("id", scene.id),
            ("slug", self._slugify(scene.title)),
            ("title", scene.title),
            ("pov", meta.pov),
            ("purpose", meta.purpose),
            ("emotion_tag", meta.emotion_tag),
            ("word_target", meta.word_target),
            ("order", scene.order),
        ]
        if scene.chapter_id:
            entries.append(("chapter_id", scene.chapter_id))
        if scene.beat_refs:
            entries.append(("beats", scene.beat_refs))

        lines = ["---"]
        for key, value in entries:
            lines.append(f"{key}: {self._format_yaml_value(value)}")
        lines.append("---")
        return "\n".join(lines)

    @staticmethod
    def _slugify(title: str) -> str:
        """Create a filesystem-safe slug from the title."""

        slug = re.sub(r"[^a-z0-9]+", "-", title.lower())
        slug = re.sub(r"-+", "-", slug).strip("-")
        return slug or "scene"

    @staticmethod
    def _format_yaml_value(value: str | int | list[str]) -> str:
        """Format the front-matter value as YAML compliant text."""

        if isinstance(value, int):
            return str(value)
        if isinstance(value, list):
            if not value:
                return "[]"
            formatted = ", ".join(ProjectRepository._format_yaml_value(item) for item in value)
            return f"[{formatted}]"
        # Strings: quote using JSON escaping for safety
        return json.dumps(value)


__all__ = [
    "ProjectData",
    "ProjectMetadata",
    "ProjectOutline",
    "ProjectRepository",
    "SceneMeta",
    "SceneSummary",
    "ChapterSummary",
]
