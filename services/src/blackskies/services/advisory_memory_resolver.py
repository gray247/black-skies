"""Advisory Memory Lab access for prompt assembly."""

from __future__ import annotations

from pathlib import Path

from .memory_lab.options import MemoryLabRuntimeOptions
from .memory_lab.orchestrator import orchestrate_memory_resolution
from .memory_lab.schemas import ResolvedMemoryPacket


def resolve_advisory_memory_packet(
    *,
    project_root: Path | None,
    current_scene_id: str,
    current_chapter_id: str | None,
    current_scene_order: int,
    memory_lab_options: MemoryLabRuntimeOptions | None = None,
) -> ResolvedMemoryPacket | None:
    if project_root is None:
        return None
    if memory_lab_options is None or not memory_lab_options.enabled:
        return None
    packet, _diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id=current_scene_id,
        current_chapter_id=current_chapter_id,
        current_scene_order=current_scene_order,
        options=memory_lab_options,
    )
    if packet is None:
        return None
    if not packet.selected_artifact_ids:
        return None
    return packet


__all__ = ["resolve_advisory_memory_packet"]
