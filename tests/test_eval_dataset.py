from __future__ import annotations

from collections import Counter
from pathlib import Path

import pytest

from blackskies.services.eval import (
    DEFAULT_DATASET_DIR,
    EvalTaskFlow,
    iter_tasks,
    load_dataset,
    load_task,
)


def test_load_default_dataset_success() -> None:
    tasks = load_dataset(DEFAULT_DATASET_DIR)

    assert len(tasks) == 63

    flow_counts = Counter(task.flow for task in tasks)
    assert flow_counts[EvalTaskFlow.WIZARD] == 21
    assert flow_counts[EvalTaskFlow.DRAFT] == 21
    assert flow_counts[EvalTaskFlow.CRITIQUE] == 21

    wizard_tasks = list(iter_tasks(DEFAULT_DATASET_DIR, flow=EvalTaskFlow.WIZARD))
    assert len(wizard_tasks) == 21
    wizard_baseline = next(
        task for task in wizard_tasks if task.task_id == "wizard_outline_baseline"
    )
    assert wizard_baseline.expected.outline.schema_version == "OutlineSchema v1"
    wizard_generated = next(
        task for task in wizard_tasks if task.task_id == "wizard_outline_001"
    )
    assert wizard_generated.expected.outline.chapters[0].order == 1
    assert wizard_generated.expected.outline.scenes[1].beat_refs == ["inciting"]

    draft_tasks = list(iter_tasks(DEFAULT_DATASET_DIR, flow=EvalTaskFlow.DRAFT))
    assert len(draft_tasks) == 21
    draft_baseline = next(
        task for task in draft_tasks if task.task_id == "draft_scene_generation"
    )
    assert draft_baseline.expected.draft.schema_version == "DraftUnitSchema v1"
    baseline_unit = draft_baseline.expected.draft.units[0]
    assert baseline_unit.meta.purpose == "escalation"
    assert baseline_unit.model.provider == "black-skies-local"
    generated_draft = next(
        task for task in draft_tasks if task.task_id == "draft_scene_001"
    )
    generated_unit = generated_draft.expected.draft.units[0]
    assert generated_unit.meta.word_target == 1100
    assert generated_unit.model.name == "story-drafter-v1"

    critique_tasks = list(iter_tasks(DEFAULT_DATASET_DIR, flow=EvalTaskFlow.CRITIQUE))
    assert len(critique_tasks) == 21
    critique_baseline = next(
        task for task in critique_tasks if task.task_id == "critique_scene_review"
    )
    assert critique_baseline.expected.critique.schema_version == "CritiqueOutputSchema v1"
    assert critique_baseline.expected.critique.line_comments
    generated_critique = next(
        task for task in critique_tasks if task.task_id == "critique_scene_001"
    )
    assert generated_critique.expected.critique.priorities == [
        "continuity",
        "voice",
    ]
    assert generated_critique.expected.critique.suggested_edits[0].replacement


def test_load_task_validation_error(tmp_path: Path) -> None:
    bad_card = tmp_path / "invalid.yaml"
    bad_card.write_text(
        """
        schema_version: "EvalTaskSchema v1"
        task_id: invalid_task
        flow: wizard
        summary: "Missing expected block"
        inputs:
          project_id: proj_test
          wizard_locks: {}
        """,
        encoding="utf-8",
    )

    with pytest.raises(ValueError) as excinfo:
        load_task(bad_card)

    assert "Invalid eval task card" in str(excinfo.value)


def test_duplicate_task_identifiers(tmp_path: Path) -> None:
    dataset_dir = tmp_path / "cards"
    dataset_dir.mkdir()

    card_template = """
    schema_version: "EvalTaskSchema v1"
    task_id: duplicate_id
    flow: wizard
    summary: "Duplicate id should fail"
    inputs:
      project_id: proj_duplicate
      wizard_locks: {}
    expected:
      outline:
        schema_version: "OutlineSchema v1"
        outline_id: out_dup
        acts: ["Act I"]
        chapters:
          - id: ch_0001
            order: 1
            title: "Only Chapter"
        scenes:
          - id: sc_0001
            order: 1
            title: "Only Scene"
            chapter_id: ch_0001
    """

    (dataset_dir / "first.yaml").write_text(card_template, encoding="utf-8")
    (dataset_dir / "second.yaml").write_text(card_template, encoding="utf-8")

    with pytest.raises(ValueError) as excinfo:
        load_dataset(dataset_dir)

    assert "Duplicate eval task id" in str(excinfo.value)
