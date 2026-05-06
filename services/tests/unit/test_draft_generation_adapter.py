from __future__ import annotations

from pathlib import Path
import json
import time

import pytest

from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.model_adapters import AdapterConfig, AdapterError
from blackskies.services.model_router import create_default_model_router
from blackskies.services.model_routing import ModelRouterConfig, ModelRoutingPolicy
from blackskies.services.models.draft import DraftGenerateRequest, DraftUnitScope
from blackskies.services.models.outline import OutlineScene
from blackskies.services.operations.draft_generation import (
    DraftGenerationProviderTimeoutError,
    DraftGenerationService,
)


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


def _render_log_call(call_args: tuple[object, ...]) -> str:
    if not call_args:
        return ""
    if len(call_args) == 1:
        return str(call_args[0])
    try:
        return str(call_args[0] % call_args[1:])
    except Exception:
        return " ".join(str(part) for part in call_args)


class _StubAdapter:
    def __init__(self, *, text: str | None = None, exc: Exception | None = None) -> None:
        self._text = text
        self._exc = exc

    def generate_draft(self, _payload: dict[str, object]) -> dict[str, object]:
        if self._exc:
            raise self._exc
        return {"text": self._text}


class _SlowAdapter:
    config = AdapterConfig(
        base_url="http://127.0.0.1:9999", model="slow-model", timeout_seconds=1.0
    )

    def generate_draft(self, _payload: dict[str, object]) -> dict[str, object]:
        time.sleep(1.2)
        return {"text": "Too late."}


def _build_service(
    tmp_path: Path,
    adapter: _StubAdapter,
    monkeypatch: pytest.MonkeyPatch,
    *,
    routing_metadata_enabled: bool = False,
    memory_lab_enabled: bool = False,
    memory_lab_write_legacy_continuity: bool = True,
    memory_lab_max_interpretations_per_group: int = 2,
) -> DraftGenerationService:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        model_router_metadata_enabled=routing_metadata_enabled,
        memory_lab_enabled=memory_lab_enabled,
        memory_lab_write_legacy_continuity=memory_lab_write_legacy_continuity,
        memory_lab_max_interpretations_per_group=memory_lab_max_interpretations_per_group,
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
        _StubAdapter(
            text=(
                "Mara steadied her breath as the chandelier swayed. "
                "The dust smelled of old rain and iron. "
                'She whispered, "Who\'s there?" and the hallway answered with a hush. '
                "A cold draft curled around her wrists, and the floorboards groaned beneath her step. "
                "She held her lamp higher, watching the shadows thin and thicken."
            )
        ),
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

    assert "chandelier" in result.response["units"][0]["text"]


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
async def test_draft_generation_scales_timeout_for_multi_scene_batches(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_multi_scene_timeout"
    _write_project_budget(project_root)
    service = _build_service(tmp_path, _SlowAdapter(), monkeypatch)
    scenes = [
        OutlineScene(
            id="sc_0001",
            order=1,
            title="Scene 1",
            chapter_id="ch_0001",
            beat_refs=[],
        ),
        OutlineScene(
            id="sc_0002",
            order=2,
            title="Scene 2",
            chapter_id="ch_0001",
            beat_refs=[],
        ),
    ]
    request = DraftGenerateRequest(
        project_id=project_root.name,
        unit_scope=DraftUnitScope.SCENE,
        unit_ids=["sc_0001", "sc_0002"],
    )

    result = await service.generate(request, scenes, project_root=project_root)

    assert [unit["id"] for unit in result.response["units"]] == ["sc_0001", "sc_0002"]


@pytest.mark.anyio("asyncio")
async def test_draft_generation_budget_includes_routing_metadata(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_budget_routing"
    _write_project_budget(project_root)
    service = _build_service(
        tmp_path,
        _StubAdapter(
            text=(
                "Mara steadied her breath as the chandelier swayed. "
                "The dust smelled of old rain and iron. "
                'She whispered, "Who\'s there?" and the hallway answered with a hush. '
                "A cold draft curled around her wrists, and the floorboards groaned beneath her step. "
                "She held her lamp higher, watching the shadows thin and thicken."
            )
        ),
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


@pytest.mark.anyio("asyncio")
async def test_draft_generation_legacy_continuity_still_writes(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_legacy_continuity"
    _write_project_budget(project_root)
    service = _build_service(
        tmp_path,
        _StubAdapter(
            text=(
                "Mara forced the door open. "
                "She discovered a broken lock. "
                "But the whisper still lingered in the hall."
            )
        ),
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

    await service.generate(request, scenes, project_root=project_root)

    continuity_path = project_root / ".blackskies" / "continuity" / "sc_0001.json"
    assert continuity_path.exists()


@pytest.mark.anyio("asyncio")
async def test_draft_generation_attempts_memory_lab_write_when_enabled(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_memory_lab_enabled"
    _write_project_budget(project_root)
    service = _build_service(
        tmp_path,
        _StubAdapter(
            text=(
                "Mara forced the door open. "
                "She discovered a broken lock. "
                "But the whisper still lingered in the hall."
            )
        ),
        monkeypatch,
        memory_lab_enabled=True,
    )
    scenes = [
        OutlineScene(
            id="sc_0001",
            order=4,
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

    calls: list[dict[str, object]] = []

    def _capture_memory_lab_entry(**kwargs):  # type: ignore[no-untyped-def]
        calls.append(kwargs)

    import blackskies.services.operations.draft_generation as dg_module

    monkeypatch.setattr(dg_module, "persist_scene_advisory_entry", _capture_memory_lab_entry)

    await service.generate(request, scenes, project_root=project_root)

    assert len(calls) == 1
    assert calls[0]["scene_id"] == "sc_0001"
    assert calls[0]["chapter_id"] == "ch_0001"
    assert calls[0]["recency_order"] == 4
    assert calls[0]["max_interpretations_per_group"] == 2


@pytest.mark.anyio("asyncio")
async def test_draft_generation_respects_legacy_continuity_write_flag(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_legacy_flag_off"
    _write_project_budget(project_root)
    service = _build_service(
        tmp_path,
        _StubAdapter(
            text=(
                "Mara forced the door open. "
                "She discovered a broken lock. "
                "But the whisper still lingered in the hall."
            )
        ),
        monkeypatch,
        memory_lab_enabled=True,
        memory_lab_write_legacy_continuity=False,
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

    await service.generate(request, scenes, project_root=project_root)

    continuity_path = project_root / ".blackskies" / "continuity" / "sc_0001.json"
    assert not continuity_path.exists()


@pytest.mark.anyio("asyncio")
async def test_draft_generation_memory_lab_failure_does_not_break_generation(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_memory_lab_failure"
    _write_project_budget(project_root)
    service = _build_service(
        tmp_path,
        _StubAdapter(
            text=(
                "Mara forced the door open. "
                "She discovered a broken lock. "
                "But the whisper still lingered in the hall."
            )
        ),
        monkeypatch,
        memory_lab_enabled=True,
    )
    scenes = [
        OutlineScene(
            id="sc_0001",
            order=2,
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

    def _raise_memory_lab_entry(**_kwargs):  # type: ignore[no-untyped-def]
        raise RuntimeError("memory lab write failed")

    import blackskies.services.operations.draft_generation as dg_module

    monkeypatch.setattr(dg_module, "persist_scene_advisory_entry", _raise_memory_lab_entry)

    result = await service.generate(request, scenes, project_root=project_root)

    assert result.response["units"]
    assert result.response["units"][0]["id"] == "sc_0001"


@pytest.mark.anyio("asyncio")
async def test_draft_generation_fracture_diagnostics_are_non_blocking(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_fracture_diag"
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

    assert result.response["units"]
    diagnostics_payload = result.response["diagnostics"]["fractures"]
    assert diagnostics_payload["exposure"] == "advisory_unstable_v1"
    assert diagnostics_payload["diagnostics_only"] is True
    assert diagnostics_payload["advisory"] is True
    assert diagnostics_payload["non_blocking"] is True
    assert diagnostics_payload["reports"]
    diagnostics_dir = project_root / "history" / "diagnostics"
    fracture_logs = sorted(diagnostics_dir.glob("*_fracture*.json"))
    assert fracture_logs, "expected advisory fracture diagnostics log to be emitted"
    payload = json.loads(fracture_logs[-1].read_text(encoding="utf-8"))
    report = payload["details"]["report"]
    assert report["diagnostics_only"] is True
    assert report["advisory"] is True
    assert report["non_blocking"] is True


@pytest.mark.anyio("asyncio")
async def test_draft_generation_canon_court_is_advisory_and_non_blocking(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_canon_court"
    _write_project_budget(project_root)
    (project_root / "locked_facts.json").write_text(
        json.dumps({"facts": ["Mara carries the rusted key"]}, indent=2),
        encoding="utf-8",
    )
    locked_before = (project_root / "locked_facts.json").read_text(encoding="utf-8")
    service = _build_service(
        tmp_path,
        _StubAdapter(
            text=(
                "Mara carries the rusted key as she enters the hall. "
                "She trembles and says she is not Mara carries the rusted key while the walls pulse in warning. "
                "The bulb flickers and dust stings her throat as footsteps echo behind her, and the stairwell "
                "shudders as a cold draft curls around her wrists and the iron door rattles again."
            )
        ),
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

    assert result.response["units"]
    rulings_dir = project_root / ".blackskies" / "canon_court" / "candidate_rulings"
    ruling_files = sorted(rulings_dir.glob("*.json"))
    assert ruling_files, "expected Canon Court candidate ruling to be persisted"
    ruling_payload = json.loads(ruling_files[-1].read_text(encoding="utf-8"))
    assert ruling_payload["diagnostics_only"] is True
    assert ruling_payload["advisory"] is True
    assert ruling_payload["non_blocking"] is True
    assert ruling_payload["contradiction_type"] == "locked_fact_contradiction"
    assert ruling_payload["severity"] in {"low", "medium", "high"}
    assert ruling_payload["evidence"]["summary"]
    assert ruling_payload["evidence"]["source_origins"]

    diagnostics_dir = project_root / "history" / "diagnostics"
    canon_court_logs = sorted(diagnostics_dir.glob("*_canon_court*.json"))
    assert canon_court_logs, "expected CANON_COURT diagnostics log entry"

    # Canon Court must not mutate canonical locked facts in v1.
    assert (project_root / "locked_facts.json").read_text(encoding="utf-8") == locked_before


@pytest.mark.anyio("asyncio")
async def test_draft_generation_logs_provider_phase_order(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_provider_logs"
    _write_project_budget(project_root)
    order: list[str] = []

    class _LoggingAdapter(_StubAdapter):
        def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
            order.append("adapter")
            return super().generate_draft(payload)

    service = _build_service(
        tmp_path,
        _LoggingAdapter(text="Mara steadied her breath as the corridor held still."),
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

    import blackskies.services.operations.draft_generation as dg_module

    monkeypatch.setattr(
        dg_module.LOGGER,
        "info",
        lambda *args, **_kwargs: order.append(_render_log_call(args)),
    )

    result = await service.generate(request, scenes, project_root=project_root)

    assert result.response["units"]
    provider_start_index = next(
        index for index, entry in enumerate(order) if "draft-generate:provider-start" in entry
    )
    adapter_index = order.index("adapter")
    provider_response_index = next(
        index for index, entry in enumerate(order) if "draft-generate:provider-response" in entry
    )
    assert provider_start_index < adapter_index < provider_response_index


@pytest.mark.anyio("asyncio")
async def test_draft_generation_logs_provider_timeout_error(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_provider_timeout"
    _write_project_budget(project_root)
    messages: list[str] = []

    class _TimeoutAdapter(_StubAdapter):
        def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
            messages.append("adapter")
            raise AdapterError("Provider request timed out.")

    service = _build_service(
        tmp_path,
        _TimeoutAdapter(),
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

    import blackskies.services.operations.draft_generation as dg_module

    monkeypatch.setattr(
        dg_module.LOGGER,
        "info",
        lambda *args, **_kwargs: messages.append(_render_log_call(args)),
    )

    with pytest.raises(DraftGenerationProviderTimeoutError):
        await service.generate(request, scenes, project_root=project_root)

    assert any("draft-generate:provider-error" in entry for entry in messages)
    assert any("draft-generate:provider-timeout" in entry for entry in messages)


@pytest.mark.anyio("asyncio")
async def test_draft_generation_raises_provider_timeout_on_hung_adapter(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "proj_provider_hang"
    _write_project_budget(project_root)
    service = _build_service(
        tmp_path,
        _SlowAdapter(),
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

    with pytest.raises(DraftGenerationProviderTimeoutError):
        await service.generate(request, scenes, project_root=project_root)
