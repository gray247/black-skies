from __future__ import annotations

import json
from pathlib import Path

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
        self.calls = 0

    def generate_draft(self, _payload: dict[str, object]) -> dict[str, object]:
        self.calls += 1
        if self._exc:
            raise self._exc
        return {"text": self._text}


def _build_service(
    tmp_path: Path,
    adapter: _StubAdapter,
    monkeypatch: pytest.MonkeyPatch,
    *,
    provider_calls_enabled: bool,
) -> DraftGenerationService:
    settings = ServiceSettings(project_base_dir=tmp_path)
    router = create_default_model_router(
        ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=provider_calls_enabled,
        )
    )
    provider = router.providers.get("local_llm")
    if provider:
        monkeypatch.setattr(provider, "adapter", lambda: adapter)
    diagnostics = DiagnosticLogger()
    return DraftGenerationService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
    )


def _request(project_root: Path) -> DraftGenerateRequest:
    return DraftGenerateRequest(
        project_id=project_root.name,
        unit_scope=DraftUnitScope.SCENE,
        unit_ids=["sc_0001"],
    )


def _scenes() -> list[OutlineScene]:
    return [
        OutlineScene(
            id="sc_0001",
            order=1,
            title="Scene 1",
            chapter_id="ch_0001",
            beat_refs=[],
        )
    ]


@pytest.mark.anyio("asyncio")
async def test_provider_backed_draft_success(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_provider_success"
    _write_project_budget(project_root)
    adapter = _StubAdapter(text="Adapter draft.")
    service = _build_service(
        tmp_path,
        adapter,
        monkeypatch,
        provider_calls_enabled=True,
    )

    result = await service.generate(_request(project_root), _scenes(), project_root=project_root)

    assert result.response["units"][0]["text"] == "Adapter draft."
    assert adapter.calls == 1


@pytest.mark.anyio("asyncio")
async def test_provider_backed_draft_empty_text_falls_back(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_provider_empty"
    _write_project_budget(project_root)
    adapter = _StubAdapter(text="   ")
    service = _build_service(
        tmp_path,
        adapter,
        monkeypatch,
        provider_calls_enabled=True,
    )

    result = await service.generate(_request(project_root), _scenes(), project_root=project_root)

    assert "enters Scene 1" in result.response["units"][0]["text"]
    assert adapter.calls == 1


@pytest.mark.anyio("asyncio")
async def test_provider_backed_draft_error_falls_back(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_provider_error"
    _write_project_budget(project_root)
    adapter = _StubAdapter(exc=AdapterError("timeout"))
    service = _build_service(
        tmp_path,
        adapter,
        monkeypatch,
        provider_calls_enabled=True,
    )

    result = await service.generate(_request(project_root), _scenes(), project_root=project_root)

    assert "enters Scene 1" in result.response["units"][0]["text"]
    assert adapter.calls == 1


@pytest.mark.anyio("asyncio")
async def test_provider_calls_disabled_skips_adapter(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_provider_disabled"
    _write_project_budget(project_root)
    adapter = _StubAdapter(text="Adapter draft.")
    service = _build_service(
        tmp_path,
        adapter,
        monkeypatch,
        provider_calls_enabled=False,
    )

    result = await service.generate(_request(project_root), _scenes(), project_root=project_root)

    assert "enters Scene 1" in result.response["units"][0]["text"]
    assert adapter.calls == 0
