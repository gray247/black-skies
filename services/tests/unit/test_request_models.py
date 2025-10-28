from __future__ import annotations

from pydantic import ValidationError
import pytest

from blackskies.services.models.accept import DraftAcceptRequest
from blackskies.services.models.critique import DraftCritiqueRequest
from blackskies.services.models.draft import DraftGenerateRequest, DraftUnitScope


def test_draft_generate_rejects_extra_fields() -> None:
    with pytest.raises(ValidationError):
        DraftGenerateRequest(  # type: ignore[call-arg]
            project_id="proj_test",
            unit_scope=DraftUnitScope.SCENE,
            unit_ids=["sc_0001"],
            unexpected=True,
        )


def test_draft_accept_rejects_extra_fields() -> None:
    with pytest.raises(ValidationError):
        DraftAcceptRequest.model_validate(  # type: ignore[arg-type]
            {
                "project_id": "proj_test",
                "draft_id": "dr_001",
                "unit_id": "sc_0001",
                "unit": {
                    "id": "sc_0001",
                    "previous_sha256": "0" * 64,
                    "text": "sample",
                    "meta": {},
                },
                "extra": "nope",
            }
        )


def test_draft_critique_rejects_extra_fields() -> None:
    with pytest.raises(ValidationError):
        DraftCritiqueRequest.model_validate(  # type: ignore[arg-type]
            {
                "draft_id": "dr_001",
                "unit_id": "sc_0001",
                "rubric": ["Logic"],
                "foo": "bar",
            }
        )


def test_draft_critique_accepts_extended_draft_id() -> None:
    payload = {
        "draft_id": "dr_sc0001_67178fe6_5db5b3",
        "unit_id": "sc_0001",
        "rubric": ["Continuity", "Pacing"],
    }

    model = DraftCritiqueRequest.model_validate(payload)

    assert model.draft_id == payload["draft_id"]
    assert model.unit_id == payload["unit_id"]
    assert model.rubric == ["Continuity", "Pacing"]


def test_draft_critique_rejects_invalid_draft_id() -> None:
    with pytest.raises(ValidationError):
        DraftCritiqueRequest.model_validate(  # type: ignore[arg-type]
            {
                "draft_id": "dr_bad id",
                "unit_id": "sc_0001",
                "rubric": ["Continuity"],
            }
        )


def test_draft_critique_normalises_rubric_id() -> None:
    payload = {
        "draft_id": "dr_001",
        "unit_id": "sc_0001",
        "rubric": ["Continuity"],
        "rubric_id": "Team.Story",
    }
    model = DraftCritiqueRequest.model_validate(payload)
    assert model.rubric_id == "team.story"


def test_draft_critique_rejects_invalid_rubric_id() -> None:
    with pytest.raises(ValidationError):
        DraftCritiqueRequest.model_validate(  # type: ignore[arg-type]
            {
                "draft_id": "dr_001",
                "unit_id": "sc_0001",
                "rubric": ["Continuity"],
                "rubric_id": "??bad",
            }
        )
