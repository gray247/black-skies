"""Tests for the offline eval dataset loader."""

from __future__ import annotations

from pathlib import Path

import pytest

from black_skies.eval import (
    DEFAULT_DATASET_DIR,
    EvalTaskFlow,
    iter_tasks,
    load_dataset,
    load_task,
)


def test_load_default_dataset_success() -> None:
    tasks = load_dataset(DEFAULT_DATASET_DIR)
    flows = {task.flow for task in tasks}

    assert EvalTaskFlow.WIZARD in flows
    assert EvalTaskFlow.DRAFT in flows
    assert EvalTaskFlow.CRITIQUE in flows

    wizard_tasks = list(iter_tasks(DEFAULT_DATASET_DIR, flow=EvalTaskFlow.WIZARD))
    assert len(wizard_tasks) == 1
    wizard = wizard_tasks[0]
    assert wizard.expected.outline.schema_version == "OutlineSchema v1"

    draft = next(task for task in tasks if task.flow == EvalTaskFlow.DRAFT)
    assert draft.expected.draft.schema_version == "DraftUnitSchema v1"
    unit = draft.expected.draft.units[0]
    assert unit.meta.purpose == "escalation"
    assert unit.model.provider == "black-skies-local"

    critique = next(task for task in tasks if task.flow == EvalTaskFlow.CRITIQUE)
    assert critique.expected.critique.schema_version == "CritiqueOutputSchema v1"
    assert critique.expected.critique.line_comments


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
