from __future__ import annotations

from pathlib import Path
import json

import pytest

from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.model_adapters import AdapterError
from blackskies.services.model_router import create_default_model_router
from blackskies.services.model_routing import ModelRouterConfig, ModelRoutingPolicy
from blackskies.services.models.draft import DraftGenerateRequest, DraftUnitScope
from blackskies.services.models.outline import OutlineScene
from blackskies.services.operations.draft_generation import DraftGenerationService


def _write_project_budget(project_root: Path) -> None:
    project_root.mkdir(parents=True, exist_ok=True)
    payload = {
        "project_id": project_root.name,
        "name": f"Project {project_root.name}",
        "budget": {"soft": 5.0, "hard": 10.0, "spent_usd": 0.0},
    }
    (project_root / "project.json").write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )


class _StubAdapter:
    def __init__(self, *, text: str | None = None, exc: Exception | None = None) -> None:
        self._text = text
        self._exc = exc

    def generate_draft(self, _payload: dict[str, object]) -> dict[str, object]:
        if self._exc:
            raise self._exc
        return {"text": self._text}


def _build_service(
    tmp_path: Path,
    adapter: _StubAdapter,
    monkeypatch: pytest.MonkeyPatch,
    *,
    routing_metadata_enabled: bool = False,
) -> DraftGenerationService:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        model_router_metadata_enabled=routing_metadata_enabled,
    )
    router = create_default_model_router(
        ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
            routing_metadata_enabled=routing_metadata_enabled,
        )
    )
    provider = router.providers["local_llm"]
    monkeypatch.setattr(provider, "adapter", lambda: adapter)
    diagnostics = DiagnosticLogger()
    return DraftGenerationService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
    )


@pytest.mark.anyio("asyncio")
async def test_draft_generation_uses_adapter_text(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_adapter_text"
    _write_project_budget(project_root)
    service = _build_service(
        tmp_path,
        _StubAdapter(text="Adapter draft."),
        monkeypatch,
    )
    scenes = [
        OutlineScene(
            id="sc_0001",
            order=1,
            title="Scene 1",
            chapter_id="ch_0001",
            beat_refs=[],
        )
    ]
    request = DraftGenerateRequest(
        project_id=project_root.name,
        unit_scope=DraftUnitScope.SCENE,
        unit_ids=["sc_0001"],
    )

    result = await service.generate(request, scenes, project_root=project_root)

    assert result.response["units"][0]["text"] == "Adapter draft."


@pytest.mark.anyio("asyncio")
async def test_draft_generation_adapter_exception_falls_back(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_adapter_fallback"
    _write_project_budget(project_root)
    service = _build_service(
        tmp_path,
        _StubAdapter(exc=AdapterError("boom")),
        monkeypatch,
    )
    scenes = [
        OutlineScene(
            id="sc_0001",
            order=1,
            title="Scene 1",
            chapter_id="ch_0001",
            beat_refs=[],
        )
    ]
    request = DraftGenerateRequest(
        project_id=project_root.name,
        unit_scope=DraftUnitScope.SCENE,
        unit_ids=["sc_0001"],
    )

    result = await service.generate(request, scenes, project_root=project_root)

    assert "enters Scene 1" in result.response["units"][0]["text"]


@pytest.mark.anyio("asyncio")
async def test_draft_generation_budget_includes_routing_metadata(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_budget_routing"
    _write_project_budget(project_root)
    service = _build_service(
        tmp_path,
        _StubAdapter(text="Adapter draft."),
        monkeypatch,
        routing_metadata_enabled=True,
    )
    scenes = [
        OutlineScene(
            id="sc_0001",
            order=1,
            title="Scene 1",
            chapter_id="ch_0001",
            beat_refs=[],
        )
    ]
    request = DraftGenerateRequest(
        project_id=project_root.name,
        unit_scope=DraftUnitScope.SCENE,
        unit_ids=["sc_0001"],
    )

    result = await service.generate(request, scenes, project_root=project_root)

    routing = result.response["budget"]["routing"]
    assert routing["policy"] == "local_only"
    assert routing["provider"] == "local_llm"
    assert routing["model"]
    assert routing["reason"]
    assert routing["fallback_used"] is False
