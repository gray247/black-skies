"""Draft export utilities shared across the draft router."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from .models.outline import OutlineArtifact, OutlineScene
from .scene_docs import DraftRequestError, read_scene_document
from .utils.paths import to_posix

LOGGER = logging.getLogger(__name__)


def load_outline_artifact(project_root: Path) -> OutlineArtifact:
    """Load and validate the outline artifact for a project."""

    outline_path = project_root / "outline.json"
    if not outline_path.exists():
        raise DraftRequestError(
            "Outline artifact is missing.", {"path": to_posix(outline_path)}
        )

    try:
        with outline_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except json.JSONDecodeError as exc:
        raise DraftRequestError(
            "Outline artifact contains invalid JSON.", {"path": to_posix(outline_path)}
        ) from exc

    try:
        return OutlineArtifact.model_validate(payload)
    except ValidationError as exc:
        raise DraftRequestError(
            "Outline artifact failed schema validation.",
            {"path": to_posix(outline_path), "errors": exc.errors()},
        ) from exc


def normalize_markdown(value: str) -> str:
    """Normalize Markdown line endings and trim trailing whitespace."""

    return value.replace("\r\n", "\n").strip()


def build_meta_header(front_matter: dict[str, Any]) -> str | None:
    """Construct a human-readable meta header from scene front matter."""

    def _normalize(value: Any) -> str | None:
        if value is None:
            return None
        normalized = str(value).strip()
        if not normalized:
            return None
        return normalized

    parts: list[str] = []
    purpose = _normalize(front_matter.get("purpose"))
    if purpose:
        parts.append(f"purpose: {purpose}")

    emotion = _normalize(front_matter.get("emotion_tag"))
    if emotion:
        parts.append(f"emotion: {emotion}")

    pov = _normalize(front_matter.get("pov"))
    if pov and parts:
        parts.append(f"pov: {pov}")

    if not parts:
        return None

    return "> " + " · ".join(parts)


def merge_front_matter(
    front_matter: dict[str, Any], meta: dict[str, Any] | None
) -> dict[str, Any]:
    """Merge user-provided metadata into a scene's front matter."""

    if not meta:
        return front_matter

    merged = dict(front_matter)
    allowed = {
        "order",
        "purpose",
        "emotion_tag",
        "pov",
        "goal",
        "conflict",
        "turn",
        "word_target",
        "beats",
    }
    for key, value in meta.items():
        if key not in allowed:
            continue
        if value is None:
            continue
        merged[key] = value
    return merged


def _scenes_by_chapter(outline: OutlineArtifact) -> dict[str, list[OutlineScene]]:
    scenes_by_chapter: dict[str, list[OutlineScene]] = {}
    for scene in outline.scenes:
        scenes_by_chapter.setdefault(scene.chapter_id, []).append(scene)
    for scene_list in scenes_by_chapter.values():
        scene_list.sort(key=lambda item: item.order)
    return scenes_by_chapter


def compile_manuscript(
    project_root: Path,
    outline: OutlineArtifact,
    *,
    include_meta_header: bool = False,
) -> tuple[str, int, int]:
    """Assemble the manuscript from outline metadata and scene documents."""

    chapters = sorted(outline.chapters, key=lambda chapter: chapter.order)
    scenes_by_chapter = _scenes_by_chapter(outline)

    lines: list[str] = []
    chapter_count = 0
    scene_count = 0

    for chapter in chapters:
        chapter_scenes = scenes_by_chapter.get(chapter.id, [])
        if not chapter_scenes:
            continue

        chapter_count += 1
        lines.append(f"# {chapter.title}")
        lines.append("")

        seen_orders: set[int] = set()
        for scene in chapter_scenes:
            try:
                _, front_matter, body = read_scene_document(project_root, scene.id)
            except DraftRequestError as exc:
                raise DraftRequestError(str(exc), {**exc.details, "unit_id": scene.id}) from exc

            missing_fields: list[str] = []
            front_matter_id = front_matter.get("id")
            if not isinstance(front_matter_id, str) or not front_matter_id.strip():
                missing_fields.append("id")
            front_matter_title = front_matter.get("title")
            if not isinstance(front_matter_title, str) or not front_matter_title.strip():
                missing_fields.append("title")
            order_value_raw = front_matter.get("order")
            if not isinstance(order_value_raw, int):
                missing_fields.append("order")

            if missing_fields:
                missing_fields = sorted(set(missing_fields))
                raise DraftRequestError(
                    "Scene front-matter is missing required fields.",
                    {"unit_id": scene.id, "missing_fields": missing_fields},
                )

            order_value = order_value_raw
            if order_value in seen_orders:
                raise DraftRequestError(
                    "Duplicate scene order detected within chapter.",
                    {
                        "unit_id": scene.id,
                        "chapter_id": chapter.id,
                        "order": order_value,
                    },
                )
            if order_value != scene.order:
                raise DraftRequestError(
                    "Scene order does not match outline entry.",
                    {
                        "unit_id": scene.id,
                        "chapter_id": chapter.id,
                        "outline_order": scene.order,
                        "front_matter_order": order_value,
                    },
                )
            seen_orders.add(order_value)

            title = front_matter.get("title") or scene.title
            section_lines = [f"## {title}"]
            meta_line = build_meta_header(front_matter) if include_meta_header else None
            if meta_line:
                section_lines.append(meta_line)

            body_text = normalize_markdown(body)
            if body_text:
                if meta_line:
                    section_lines.append("")
                section_lines.append(body_text)

            lines.extend(section_lines)
            lines.append("")
            scene_count += 1

        if lines and lines[-1] != "":
            lines.append("")

    manuscript = "\n".join(line.rstrip() for line in lines).strip()
    return manuscript, chapter_count, scene_count


__all__ = [
    "build_meta_header",
    "compile_manuscript",
    "load_outline_artifact",
    "merge_front_matter",
    "normalize_markdown",
]
