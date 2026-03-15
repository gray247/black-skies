from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.model_router import ModelRouter, ModelSpec, ModelTask
from blackskies.services.model_routing import ModelRouterConfig, ModelRoutingPolicy
from blackskies.services.model_adapters import AdapterConfig, AdapterError, BaseAdapter
from blackskies.services.operations.long_form_execution import LongFormExecutionService


class _RecordingDiagnostics:
    def __init__(self) -> None:
        self.entries: list[tuple[str, str, dict[str, object] | None]] = []

    def log(self, _project_root: Path, *, code: str, message: str, details=None):
        self.entries.append((code, message, details))


class _FakeAdapter(BaseAdapter):
    provider_name = "ollama"

    def __init__(self, text: str) -> None:
        super().__init__(AdapterConfig(base_url="http://fake", model="fake"))
        self._text = text
        self.last_payload: dict[str, object] | None = None

    def health_check(self) -> bool:
        return True

    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        return {"text": self._text}

    def critique(self, payload: dict[str, object]) -> dict[str, object]:
        return {"text": self._text}

    def rewrite(self, payload: dict[str, object]) -> dict[str, object]:
        return {"text": self._text}


class _ErrorAdapter(_FakeAdapter):
    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        raise AdapterError("adapter failed")


class _RawOnlyAdapter(_FakeAdapter):
    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        return {"raw": {"response": self._text}}


class _RawTopLevelAdapter(_FakeAdapter):
    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        return {"response": self._text}


class _RawMessageAdapter(_FakeAdapter):
    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        return {"raw": {"message": {"content": self._text}}}


class _RawNestedDataAdapter(_FakeAdapter):
    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        return {"raw": {"data": {"response": self._text}}}


class _RawUnknownShapeAdapter(_FakeAdapter):
    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        return {"raw": {"data": {"note": "missing text"}}}


class _RawChoicesAdapter(_FakeAdapter):
    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        return {"raw": {"choices": [{"message": {"content": self._text}}]}}


class _RawThinkingAdapter(_FakeAdapter):
    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        return {"raw": {"response": "", "thinking": self._text}}


class _RetryAdapter(_FakeAdapter):
    def __init__(self, first_text: str, second_text: str) -> None:
        super().__init__(first_text)
        self._second = second_text
        self._count = 0

    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        self._count += 1
        if self._count == 1:
            return {"raw": {"response": self._text}}
        return {"raw": {"response": self._second}}


class _ApiAdapter(_FakeAdapter):
    provider_name = "openai"


class _FakeProvider:
    name = "local_llm"

    def __init__(self, adapter: BaseAdapter) -> None:
        self._adapter = adapter

    def is_available(self, config: ModelRouterConfig) -> bool:
        return True

    def select_model(self, task: ModelTask, config: ModelRouterConfig) -> ModelSpec:  # noqa: ARG002
        return ModelSpec(name="qwen3:4b", provider=self._adapter.provider_name)

    def supports(self, task: ModelTask) -> bool:
        return task is ModelTask.DRAFT

    def adapter(self) -> BaseAdapter | None:
        return self._adapter


class _ApiProvider(_FakeProvider):
    name = "openai"


def _service(tmp_path: Path, adapter_text: str) -> LongFormExecutionService:
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_FakeAdapter(adapter_text)))
    return LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )


def _long_text() -> str:
    return (
        "Mara pushed the door, and the hinges groaned. " * 20
        + "\n\n"
        + "The hallway breathed cold air around her boots. " * 12
    )


def test_long_form_execution_persists_chunks(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_exec"
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "outline.json").write_text(
        json.dumps(
            {
                "acts": ["Act I: Gathered Storm"],
                "chapters": [{"id": "ch_0001", "title": "Chapter One"}],
            }
        ),
        encoding="utf-8",
    )
    adapter_text = _long_text()
    service = _service(tmp_path, adapter_text)

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001", "sc_0002"],
        chunk_size=1,
        target_words_per_chunk=900,
    )

    assert result.stopped_reason is None
    assert len(result.chunks) == 2
    chunk_dir = project_root / ".blackskies" / "long_form" / "chunks"
    text_dir = project_root / ".blackskies" / "long_form" / "texts"
    assert (chunk_dir / f"{result.chunks[0].chunk_id}.json").exists()
    assert (text_dir / f"{result.chunks[0].chunk_id}.md").exists()
    assert result.budget_summary["chunk_count"] == 2

    provider = service._model_router.providers["local_llm"]
    adapter = provider.adapter()
    assert adapter.last_payload is not None
    assert "prompt" in adapter.last_payload
    assert adapter.last_payload.get("system")
    assert "options" in adapter.last_payload
    assert adapter.last_payload.get("options", {}).get("num_ctx") == 2048
    assert adapter.last_payload.get("options", {}).get("num_predict") == 200
    prompt = adapter.last_payload["prompt"]
    assert "ROLE:" in prompt
    assert "OUTPUT CONTRACT:" in prompt
    assert "CHAPTER CONTINUITY:" in prompt
    assert "WRITE ONLY THE STORY." in prompt
    assert "BEGIN WITH NARRATIVE ON LINE 1." in prompt
    assert "PRIOR EXCERPT:" in prompt
    prior_line = next(line for line in prompt.splitlines() if line.startswith("PRIOR EXCERPT:"))
    assert len(prior_line) <= 620
    assert adapter.last_payload.get("options", {}).get("reasoning") is False


def test_long_form_execution_stops_on_invalid_output(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_invalid"
    project_root.mkdir(parents=True, exist_ok=True)
    adapter_text = "Summary: The scene will introduce the conflict."
    service = _service(tmp_path, adapter_text)

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001", "sc_0002"],
        chunk_size=1,
        target_words_per_chunk=900,
    )

    assert result.stopped_reason == "invalid_output"
    assert len(result.chunks) == 1
    assert result.chunks[0].continuity_snapshot["fallback_reason"] == "invalid_output"
    diagnostic_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{result.chunks[0].chunk_id}.json"
    )
    assert diagnostic_path.exists()
    payload = json.loads(diagnostic_path.read_text(encoding="utf-8"))
    assert payload.get("reason")
    assert payload.get("extracted_field") is not None
    assert "raw_length" in payload
    assert "normalized_length" in payload
    assert "word_count" in payload
    assert "paragraph_count" in payload


def test_long_form_invalid_output_logs_excerpt(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_invalid_log"
    project_root.mkdir(parents=True, exist_ok=True)
    adapter_text = "Summary: The scene will introduce the conflict."
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = _RecordingDiagnostics()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_FakeAdapter(adapter_text)))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason == "invalid_output"
    assert any(entry[0] == "VALIDATION" for entry in diagnostics.entries)
    entry = next(entry for entry in diagnostics.entries if entry[0] == "VALIDATION")
    assert entry[2] is not None
    assert entry[2].get("raw_excerpt")


def test_long_form_execution_disabled_toggle(tmp_path: Path) -> None:
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=False)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_FakeAdapter("Mara moved through the hall. " * 10)))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=tmp_path,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
    )

    assert result.stopped_reason == "disabled"
    assert result.chunks == []


def test_long_form_execution_adapter_error_fallback(tmp_path: Path) -> None:
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_ErrorAdapter("unused")))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=tmp_path,
        chapter_id="ch_0001",
        scene_ids=["sc_0001", "sc_0002"],
        chunk_size=1,
        target_words_per_chunk=900,
    )

    assert result.stopped_reason == "adapter_error"
    assert len(result.chunks) == 1
    assert result.chunks[0].continuity_snapshot["fallback_reason"] == "adapter_error"


def test_long_form_execution_extracts_raw_response(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_raw"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_RawOnlyAdapter(_long_text())))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason is None
    assert result.chunks[0].continuity_snapshot["fallback_reason"] is None


def test_long_form_execution_extracts_top_level_response(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_raw_top"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_RawTopLevelAdapter(_long_text())))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason is None
    assert result.chunks[0].continuity_snapshot["fallback_reason"] is None


def test_long_form_execution_extracts_message_content(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_raw_message"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_RawMessageAdapter(_long_text())))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason is None
    assert result.chunks[0].continuity_snapshot["fallback_reason"] is None


def test_long_form_execution_extracts_nested_data_response(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_raw_data"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_RawNestedDataAdapter(_long_text())))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason is None
    assert result.chunks[0].continuity_snapshot["fallback_reason"] is None


def test_long_form_execution_extracts_choices_message_content(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_raw_choices"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_RawChoicesAdapter(_long_text())))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason is None
    assert result.chunks[0].continuity_snapshot["fallback_reason"] is None


def test_long_form_execution_retries_after_planning_output(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_retry"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    adapter = _RetryAdapter(
        "The user wants me to write an immersive scene. No headings or meta commentary.",
        _long_text(),
    )
    router.register_provider(_FakeProvider(adapter))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason is None
    assert result.chunks[0].continuity_snapshot["fallback_reason"] is None
    assert adapter._count == 2


def test_long_form_execution_prefers_api_when_enabled(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_api"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        long_form_prefer_api=True,
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_FakeAdapter(_long_text())))
    router.register_provider(_ApiProvider(_ApiAdapter(_long_text())))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason is None
    assert result.chunks[0].provider == "openai"


def test_long_form_invalid_output_logs_raw_payload(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_raw_diag"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = _RecordingDiagnostics()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_RawUnknownShapeAdapter("unused")))
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason == "invalid_output"
    entry = next(entry for entry in diagnostics.entries if entry[0] == "VALIDATION")
    assert entry[2] is not None
    assert "raw_payload_keys" in entry[2]
    assert entry[2].get("raw_payload_preview")


def test_long_form_execution_extracts_thinking_when_response_empty(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_raw_thinking"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = _RecordingDiagnostics()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(
        _FakeProvider(
            _RawThinkingAdapter(
                "Okay, I will write a scene.\n\n" + _long_text()
            )
        )
    )
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )

    result = service.execute(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chunk_size=1,
        target_words_per_chunk=300,
    )

    assert result.stopped_reason is None
    assert result.chunks[0].continuity_snapshot["fallback_reason"] is None
    entry = next(entry for entry in diagnostics.entries if entry[0] == "ADAPTER")
    assert entry[2] is not None
    assert entry[2].get("thinking_fallback") is True
    text_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "texts"
        / f"{result.chunks[0].chunk_id}.md"
    )
    text = text_path.read_text(encoding="utf-8")
    assert text.startswith("Mara pushed")
