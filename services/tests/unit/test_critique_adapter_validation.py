from __future__ import annotations

from pathlib import Path
import json

import pytest

from blackskies.services.critique import CritiqueService
from blackskies.services.model_router import create_default_model_router
from blackskies.services.model_routing import ModelRouterConfig, ModelRoutingPolicy
from blackskies.services.model_adapters import AdapterError
from blackskies.services.models.critique import DraftCritiqueRequest


def _write_scene(project_root: Path, unit_id: str = "sc_0001") -> None:
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    content = "\n".join(
        [
            "---",
            f"id: {unit_id}",
            "title: Scene 1",
            "---",
            "The cellar hums with static and distant thunder.",
            "",
        ]
    )
    (drafts_dir / f"{unit_id}.md").write_text(content, encoding="utf-8")


class _StubAdapter:
    def __init__(self, *, text: str | None = None, exc: Exception | None = None) -> None:
        self._text = text
        self._exc = exc

    def critique(self, _payload: dict[str, object]) -> dict[str, object]:
        if self._exc:
            raise self._exc
        return {"text": self._text}


def _build_service(adapter: _StubAdapter, monkeypatch: pytest.MonkeyPatch) -> CritiqueService:
    config = ModelRouterConfig(
        policy=ModelRoutingPolicy.LOCAL_ONLY,
        provider_calls_enabled=True,
    )
    router = create_default_model_router(config)
    provider = router.providers["local_llm"]
    monkeypatch.setattr(provider, "adapter", lambda: adapter)
    return CritiqueService(model_router=router)


def _run_critique(service: CritiqueService, project_root: Path) -> dict[str, object]:
    request = DraftCritiqueRequest(
        draft_id="dr_test",
        unit_id="sc_0001",
        rubric=["Logic"],
    )
    return service.run(request, project_root=project_root, project_id=project_root.name)


def test_critique_adapter_malformed_json_falls_back(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_malformed"
    project_root.mkdir(parents=True, exist_ok=True)
    _write_scene(project_root)
    service = _build_service(_StubAdapter(text="not json"), monkeypatch)

    payload = _run_critique(service, project_root)

    assert payload["summary"].startswith("Draft 'Scene 1' spans")
    assert payload["schema_version"] == "CritiqueOutputSchema v1"


def test_critique_adapter_valid_payload_used(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_valid_payload"
    project_root.mkdir(parents=True, exist_ok=True)
    _write_scene(project_root)
    adapter_payload = json.dumps(
        {
            "summary": "Adapter summary.",
            "priorities": ["Tighten beats."],
            "line_comments": [{"line": 1, "note": "Sharper opening.", "excerpt": "The cellar"}],
            "suggested_edits": [{"range": [0, 10], "replacement": "New opening."}],
            "severity": "low",
        }
    )
    service = _build_service(_StubAdapter(text=adapter_payload), monkeypatch)

    payload = _run_critique(service, project_root)

    assert payload["summary"] == "Adapter summary."
    assert payload["severity"] == "low"
    assert payload["line_comments"][0]["line"] == 1
    assert payload["priorities"] == ["Tighten beats."]


def test_critique_adapter_missing_fields_falls_back(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_missing_fields"
    project_root.mkdir(parents=True, exist_ok=True)
    _write_scene(project_root)
    service = _build_service(_StubAdapter(text='{"summary": "Adapter summary"}'), monkeypatch)

    payload = _run_critique(service, project_root)

    assert payload["summary"].startswith("Draft 'Scene 1' spans")
    assert payload["schema_version"] == "CritiqueOutputSchema v1"


def test_critique_adapter_exception_falls_back(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_adapter_exc"
    project_root.mkdir(parents=True, exist_ok=True)
    _write_scene(project_root)
    service = _build_service(_StubAdapter(exc=AdapterError("boom")), monkeypatch)

    payload = _run_critique(service, project_root)

    assert payload["summary"].startswith("Draft 'Scene 1' spans")
    assert payload["schema_version"] == "CritiqueOutputSchema v1"
