"""Scaffolding for the Memory Prototype v1 backend lane.

This package is advisory-only and intentionally decoupled from runtime APIs
until prototype validation is complete.
"""

from .canonical_state_reader import CanonicalStateReader
from .continuity_signal_normalizer import ContinuitySignalNormalizer
from .provider import NarrativeStateProvider
from .scene_delta_extractor import SceneDeltaExtractor
from .schemas import (
    CanonicalLineageKey,
    CanonicalNarrativeSnapshot,
    ContinuitySignalArtifact,
    SceneDeltaArtifact,
    TaskPacket,
)
from .storage import MemoryPrototypeStorage
from .task_packet_assembler import TaskPacketAssembler

__all__ = [
    "CanonicalLineageKey",
    "CanonicalNarrativeSnapshot",
    "SceneDeltaArtifact",
    "ContinuitySignalArtifact",
    "TaskPacket",
    "CanonicalStateReader",
    "SceneDeltaExtractor",
    "ContinuitySignalNormalizer",
    "TaskPacketAssembler",
    "MemoryPrototypeStorage",
    "NarrativeStateProvider",
]
