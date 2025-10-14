"""Validation tests for draft request models."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from blackskies.services.models.draft import DraftGenerateRequest


def test_draft_generate_rejects_unknown_override_scene() -> None:
    with pytest.raises(ValidationError) as exc:
        DraftGenerateRequest(
            project_id="proj_draft",
            unit_scope="scene",
            unit_ids=["sc_0001"],
            overrides={"sc_9999": {}},
        )

    assert "Override provided for unknown scene" in str(exc.value)


def test_draft_generate_rejects_overrides_for_chapter_scope() -> None:
    with pytest.raises(ValidationError) as exc:
        DraftGenerateRequest(
            project_id="proj_draft",
            unit_scope="chapter",
            unit_ids=["ch_0001"],
            overrides={"sc_0001": {}},
        )

    assert "Overrides are only supported for scene scope requests." in str(exc.value)

