from __future__ import annotations

from blackskies.services.memory_lab.interpretations import (
    build_interpretation_group_id,
    create_interpretation_variants,
)
from blackskies.services.memory_lab.schemas import MemoryArtifact


def _artifact(*, artifact_type: str = "summary") -> MemoryArtifact:
    return MemoryArtifact(
        artifact_id="art_base",
        schema_version="memory_artifact_v1",
        artifact_type=artifact_type,
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt="Excerpt",
        content="Mara keeps the key hidden in the cellar wall.",
        weight=0.85,
        confidence=0.75,
        recency_order=7,
        tags=["carryover"],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )


def test_group_id_is_stable() -> None:
    group_id_a = build_interpretation_group_id(
        scene_id="sc_0001",
        base_content="Mara keeps the key hidden in the cellar wall.",
    )
    group_id_b = build_interpretation_group_id(
        scene_id="sc_0001",
        base_content="Mara keeps the key hidden in the cellar wall.",
    )

    assert group_id_a == group_id_b


def test_variant_count_is_capped_at_two() -> None:
    group, variants = create_interpretation_variants(
        scene_id="sc_0001",
        chapter_id="ch_0001",
        base_artifact=_artifact(),
        labels=["literal", "deceptive", "symbolic"],
        created_at="2026-04-12T00:05:00Z",
    )

    assert len(variants) == 2
    assert len(group.artifact_ids) == 2
    assert [variant.interpretation_label for variant in variants] == ["literal", "deceptive"]


def test_parent_linkage_is_preserved() -> None:
    base = _artifact(artifact_type="emotional_state")
    group, variants = create_interpretation_variants(
        scene_id="sc_0001",
        chapter_id="ch_0001",
        base_artifact=base,
        labels=["guarded", "resigned"],
        created_at="2026-04-12T00:05:00Z",
    )

    assert len(variants) == 2
    assert group.artifact_ids == [variant.artifact_id for variant in variants]
    for variant in variants:
        assert variant.parent_artifact_id == base.artifact_id
        assert variant.interpretation_group_id == group.group_id
        assert variant.weight == base.weight
        assert variant.confidence == base.confidence
