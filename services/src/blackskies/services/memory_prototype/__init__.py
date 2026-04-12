"""Scaffolding for the Memory Prototype v1 backend lane.

This package is advisory-only and intentionally decoupled from runtime APIs
until prototype validation is complete.
"""

from .canonical_state_reader import CanonicalStateReader
from .continuity_signal_normalizer import ContinuitySignalNormalizer
from .provider import NarrativeStateProvider
from .scene_delta_extractor import SceneDeltaExtractor
from .schemas import CanonicalLineageKey, CanonicalNarrativeSnapshot, ContinuitySignalArtifact, SceneDeltaArtifact
from .storage import MemoryPrototypeStorage

__all__ = [
    "CanonicalLineageKey",
    "CanonicalNarrativeSnapshot",
    "SceneDeltaArtifact",
    "ContinuitySignalArtifact",
    "CanonicalStateReader",
    "SceneDeltaExtractor",
    "ContinuitySignalNormalizer",
    "MemoryPrototypeStorage",
    "NarrativeStateProvider",
]
