"""Exporter utilities for Black Skies drafts."""

from __future__ import annotations

import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional

from .models import Draft

EXPORT_ROOT = Path("data/exports")
EXPORT_ROOT.mkdir(parents=True, exist_ok=True)


def _timestamp() -> str:
    return datetime.now().strftime("%Y%m%dT%H%M%S")


def export_markdown(
    draft: Draft, *, directory: Optional[Path] = None, filename: Optional[str] = None
) -> Path:
    """Write a draft to Markdown with front-matter metadata."""

    target_dir = directory or EXPORT_ROOT
    target_dir.mkdir(parents=True, exist_ok=True)
    name = filename or f"{draft.unit_id}_{_timestamp()}.md"
    target = target_dir / name
    front_matter = ["---"]
    front_matter.append(f"id: {draft.unit_id}")
    front_matter.append(f"title: {draft.title}")
    for key, value in sorted(draft.metadata.items()):
        front_matter.append(f"{key}: {value}")
    front_matter.append("---\n")
    content = "\n".join(front_matter) + draft.text.strip() + "\n"
    target.write_text(content, encoding="utf-8")
    return target


def export_text(
    draft: Draft, *, directory: Optional[Path] = None, filename: Optional[str] = None
) -> Path:
    """Write a draft to plain-text format."""

    target_dir = directory or EXPORT_ROOT
    target_dir.mkdir(parents=True, exist_ok=True)
    name = filename or f"{draft.unit_id}_{_timestamp()}.txt"
    target = target_dir / name
    header = f"{draft.title}\n{'=' * len(draft.title)}\n\n"
    target.write_text(header + draft.text.strip() + "\n", encoding="utf-8")
    return target


def checksum(path: Path) -> str:
    """Return the SHA-256 checksum of a file."""

    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


__all__ = ["export_markdown", "export_text", "checksum", "EXPORT_ROOT"]
