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


class _CritiqueRewriteAdapter(_FakeAdapter):
    def __init__(self, draft_text: str, critique_text: str, rewrite_text: str) -> None:
        super().__init__(draft_text)
        self._critique = critique_text
        self._rewrite = rewrite_text
        self.last_rewrite_payload: dict[str, object] | None = None

    def critique(self, payload: dict[str, object]) -> dict[str, object]:
        return {"text": self._critique}

    def rewrite(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_rewrite_payload = payload
        return {"text": self._rewrite}


class _SequencedCritiqueRewriteAdapter(_FakeAdapter):
    def __init__(self, draft_texts: list[str], critique_text: str, rewrite_texts: list[str]) -> None:
        super().__init__(draft_texts[0])
        self._draft_texts = list(draft_texts)
        self._rewrite_texts = list(rewrite_texts)
        self._critique = critique_text
        self._draft_index = 0
        self._rewrite_index = 0
        self.last_rewrite_payload: dict[str, object] | None = None

    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        index = min(self._draft_index, len(self._draft_texts) - 1)
        self._draft_index += 1
        return {"text": self._draft_texts[index]}

    def critique(self, payload: dict[str, object]) -> dict[str, object]:
        return {"text": self._critique}

    def rewrite(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_rewrite_payload = payload
        index = min(self._rewrite_index, len(self._rewrite_texts) - 1)
        self._rewrite_index += 1
        return {"text": self._rewrite_texts[index]}


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
        "Mara pushed the door while a brass lantern knocked the frame, the chain rasped over the latch, and cold rain and mildew slicked the wood beneath her palm. "
        * 20
        + "\n\n"
        + "Her coat brushed the corridor wall, the key tapped her wrist, and dust lifted from the floorboards with each step through the narrow hall. "
        * 12
    )


def _low_quality_text() -> str:
    return (
        ("It was a thing that happened. " * 30).strip()
        + "\n\n"
        + ("It was a thing and it kept happening. " * 30).strip()
    )


def _borderline_specificity_text() -> str:
    return (
        (
            "Mara crossed the porch while rain ticked off the railing and shadow pooled beneath the steps. "
            * 24
        ).strip()
        + "\n\n"
        + (
            "The hall stayed narrow as rain pressed at the windows and shadow held in the corners behind her. "
            * 20
        ).strip()
    )


def _carryover_anchor_text() -> str:
    return (
        "Clara steadied the cracked brass lantern with one hand and pressed the other against the chained nursery door, "
        "feeling the cold links bite into her palm while the ceramic fox knocked against her pocket. " * 12
        + "\n\n"
        + "Jun's soaked coat dripped onto the runner as he watched the latch and counted each rattle from the other side. "
        "The brass smell of the lantern oil mixed with mildew and wet plaster until the corridor tasted metallic. " * 8
    )


def _weak_continuation_text() -> str:
    return (
        "Her breath caught as she stared down the hallway, and the words hung in the air between them. " * 10
        + "\n\n"
        + "\"We should keep moving,\" Jun said. \"Maybe this is nothing.\" For a moment the house seemed heavy with dread, "
        "and Clara felt a flicker of hope she could not quite name. " * 8
    )


def _strong_continuation_rewrite_text() -> str:
    return (
        "Clara kept the cracked brass lantern high as Jun tugged at the chain across the nursery door, the links rasping over his wet sleeve "
        "while the ceramic fox jabbed her pocket each time she flinched. " * 12
        + "\n\n"
        + "\"Hold the lantern steady,\" Jun said, bracing one shoulder against the frame. Clara planted her palm on the damp wood, "
        "smelling mildew, cold brass, and rainwater as the chained latch shivered under their hands. " * 8
    )


def _mild_generic_but_recovered_rewrite_text() -> str:
    return (
        "Clara kept the cracked brass lantern high while Jun tested the chain across the nursery door, the links scraping his wet cuff as the ceramic fox knocked against her pocket. "
        * 10
        + "\n\n"
        + "\"Hold it there,\" Jun said, leaning into the frame while the corridor smelled of mildew and lamp oil. "
        "The dim hall pressed close for a moment, the words hanging in the air as Clara kept her wrist against the latch and counted each rattle under her palm. "
        "A flicker of resolve steadied her, but the corridor still felt heavy with dread around the nursery door. "
        * 8
    )


def _cosmetic_rewrite_text() -> str:
    return (
        "Her breath caught as Clara looked up, the room pressing close and the words hanging in the air between them. "
        * 12
        + "\n\n"
        + "\"Are you all right?\" Jun asked. Clara gave a thin nod while the lantern sat between their hands for a moment. "
        "A flicker of fear moved through her, and the room felt heavy with dread while she tried to steady her breathing without saying what she feared. "
        * 8
    )


def _adversarial_near_miss_text() -> str:
    return (
        "Clara kept mentioning the lantern and the key while the corridor felt heavy with dread and the shadows closed around them for a moment. "
        * 12
        + "\n\n"
        + "\"Did you hear that?\" Jun asked. Clara glanced at the chained door, but the words hung in the air while the fox stayed in her pocket and a flicker of fear moved through her without changing what they did next. "
        * 8
    )


def _opening_generic_text() -> str:
    return (
        "The sun dipped low on the horizon while the square buzzed with life and Lucas felt apart from all of it. "
        * 12
        + "\n\n"
        + "\"You can't keep doing this,\" Clara said. Lucas looked away while the world around him buzzed with life and he tried not to say what he feared. "
        * 8
    )


def _opening_recovery_text() -> str:
    return (
        "Copper light slid across the cobblestones and caught on the bread racks outside the baker's stall while Lucas gripped the chipped fountain rim to steady his hands. "
        * 10
        + "\n\n"
        + "\"You can't keep doing this,\" Clara said as she stepped into the path of a cart while Lucas gripped the fountain rim, rubbed rain grit from his thumb, and looked at the last market awnings snapping in the wind. "
        "He looked at the wet stone instead of her face, jaw tight, breath shallow. "
        * 8
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
    assert result.chunks[0].acceptance_reason == "quality_pass"
    assert result.chunks[0].attempt_count == 1
    assert result.chunks[0].rewrite_used is False
    assert result.chunks[0].quality_snapshot is not None
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
    assert "CONTINUITY PRESSURE:" in prompt
    assert "CONTINUITY CHECKLIST:" in prompt
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
    assert result.chunks[0].acceptance_reason == "invalid_output"
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
    attempts = payload.get("attempts") or []
    assert attempts
    assert attempts[0].get("extracted_field") is not None
    assert "raw_length" in attempts[0]
    assert "normalized_length" in attempts[0]
    assert "word_count" in attempts[0]["basic_validation"]
    assert "paragraph_count" in attempts[0]["basic_validation"]


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
    assert entry[2].get("reason")


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


def test_long_form_execution_rewrites_after_quality_failure(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_rewrite"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Needs stronger specificity.",
            "weaknesses": ["specificity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Add concrete sensory detail"],
        }
    )
    adapter = _CritiqueRewriteAdapter(_low_quality_text(), critique, _long_text())
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
    chunk = result.chunks[0]
    assert chunk.rewrite_used is True
    assert chunk.attempt_count == 2
    assert chunk.acceptance_reason == "rewrite_pass"
    assert chunk.quality_snapshot is not None
    assert chunk.critique_snapshot is not None
    assert adapter.last_rewrite_payload is not None
    rewrite_prompt = adapter.last_rewrite_payload.get("prompt")
    assert isinstance(rewrite_prompt, str)
    assert "PRIMARY TARGETS:" in rewrite_prompt
    assert "REMOVE:" in rewrite_prompt
    assert "OUTPUT RULES:" in rewrite_prompt

    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    assert payload["validation_decision"] is True
    assert payload.get("attempts")
    assert payload.get("critique_snapshot")


def test_long_form_execution_rewrites_borderline_specificity_chunk(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_borderline_rewrite"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Needs more concrete detail.",
            "weaknesses": ["specificity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Add vivid sensory detail"],
        }
    )
    adapter = _CritiqueRewriteAdapter(_borderline_specificity_text(), critique, _long_text())
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[0]
    assert chunk.rewrite_used is True
    assert chunk.attempt_count == 2
    assert chunk.acceptance_reason == "rewrite_pass"
    assert chunk.quality_snapshot is not None
    assert chunk.quality_snapshot["scores"]["specificity"] == 5


def test_long_form_execution_rewrites_weak_continuation_with_real_carryover_pressure(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_continuity_rewrite"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Continuation is too generic and drops important carryover objects.",
            "weaknesses": ["continuity", "specificity"],
            "continuity_issues": ["Lantern, chain, and fox are not carried forward clearly."],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Re-anchor the scene in the lantern, chain, and fox", "Replace stock filler with concrete action"],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_carryover_anchor_text(), _weak_continuation_text()],
        critique,
        [_strong_continuation_rewrite_text()],
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
        scene_ids=["sc_0001", "sc_0002"],
        chunk_size=1,
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    assert len(result.chunks) == 2
    chunk = result.chunks[1]
    assert chunk.rewrite_used is True
    assert chunk.attempt_count == 2
    assert chunk.acceptance_reason == "rewrite_pass"
    assert chunk.quality_snapshot is not None
    assert chunk.quality_snapshot["scores"]["continuity"] >= 4
    assert chunk.quality_snapshot["scores"]["specificity"] == 5

    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    first_attempt = payload["attempts"][0]
    first_quality = first_attempt["quality_snapshot"]
    assert first_quality["weak_carryover"] is True
    assert first_quality["scores"]["continuity"] <= 2
    assert first_quality["generic_risk"] is True


def test_long_form_execution_accepts_rewrite_with_mild_generic_phrasing_when_recovery_is_strong(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_rewrite_recovery"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Recover the continuation anchors and replace vague filler.",
            "weaknesses": ["continuity", "specificity", "clarity"],
            "continuity_issues": ["The lantern, chain, and fox need to carry over."],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Re-anchor the continuation in carried objects", "Keep the dialogue grounded in the hall and door"],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_carryover_anchor_text(), _weak_continuation_text()],
        critique,
        [_mild_generic_but_recovered_rewrite_text()],
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
        scene_ids=["sc_0001", "sc_0002"],
        chunk_size=1,
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[1]
    assert chunk.rewrite_used is True
    assert chunk.acceptance_reason == "rewrite_pass"
    assert chunk.quality_snapshot is not None
    assert chunk.quality_snapshot["generic_risk"] is True
    assert chunk.quality_snapshot["scores"]["continuity"] >= 4
    assert chunk.quality_snapshot["scores"]["specificity"] >= 3
    assert chunk.quality_snapshot["scores"]["clarity"] >= 3


def test_long_form_execution_rejects_cosmetic_rewrite_without_meaningful_delta(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_cosmetic_rewrite"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "The continuation still needs concrete replacement, not paraphrase.",
            "weaknesses": ["clarity", "specificity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace stock atmosphere with concrete action", "Increase observable detail"],
        }
    )
    adapter = _CritiqueRewriteAdapter(_weak_continuation_text(), critique, _cosmetic_rewrite_text())
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.rewrite_used is True
    assert chunk.acceptance_reason == "quality_failed"
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    rewrite_attempt = payload["attempts"][1]
    assert rewrite_attempt["quality_pass"] is False
    assert rewrite_attempt["rewrite_delta"]["total_delta"] >= 1
    assert rewrite_attempt["quality_snapshot"]["total_score"] < 28
    assert rewrite_attempt["quality_snapshot"]["scores"]["specificity"] <= 2
    assert rewrite_attempt["quality_snapshot"]["scores"]["clarity"] <= 3


def test_long_form_execution_rewrites_adversarial_near_miss_continuation(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_adversarial_nearmiss"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "The continuation name-drops carryover objects but does not use them meaningfully.",
            "weaknesses": [
                "Generic stock atmosphere keeps replacing concrete action.",
                "Dialogue feels low-information even though it is technically grounded.",
                "Vague emotional language outweighs scene-specific detail.",
            ],
            "continuity_issues": [
                "The lantern, chain, and fox are mentioned without changing blocking or decisions."
            ],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": [
                "Make the carryover objects affect action",
                "Replace generic dread lines with concrete detail",
            ],
            "replacement_targets": ["Replace generic corridor dread with visible action at the chained door"],
            "grounding_targets": ["Attach dialogue to handling the lantern, chain, or key"],
            "carryover_targets": ["Use the lantern, chain, or fox in a meaningful action or choice"],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_carryover_anchor_text(), _adversarial_near_miss_text()],
        critique,
        [_strong_continuation_rewrite_text()],
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
        scene_ids=["sc_0001", "sc_0002"],
        chunk_size=1,
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[1]
    assert chunk.rewrite_used is True
    assert chunk.acceptance_reason == "rewrite_pass"
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    first_attempt = payload["attempts"][0]
    assert first_attempt["quality_pass"] is False
    assert first_attempt["quality_snapshot"]["material_carryover"] is False
    assert adapter.last_rewrite_payload is not None
    rewrite_prompt = str(adapter.last_rewrite_payload["prompt"])
    assert "CONTINUATION RULES:" in rewrite_prompt
    assert "Replace every phrase named in GENERIC PHRASE TARGETS" in rewrite_prompt
    assert "Make at least one item from CARRYOVER TARGETS affect a physical action" in rewrite_prompt
    assert "DETECTED CARRYOVER TERMS:" in rewrite_prompt
    assert "lantern" in rewrite_prompt
    rewrite_attempt = payload["attempts"][1]
    assert rewrite_attempt["quality_pass"] is True
    assert rewrite_attempt["rewrite_delta"]["continuity_delta"] >= 1


def test_long_form_execution_accepts_continuation_rewrite_with_material_carryover_hit_gain(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_material_carryover_recovery"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "The continuation needs concrete carryover use instead of repeated atmospheric drift.",
            "weaknesses": [
                "Generic stock atmosphere keeps replacing concrete action.",
                "Vague emotional language outweighs scene-specific detail.",
            ],
            "continuity_issues": [
                "The lantern and chain are mentioned without changing what Clara does next."
            ],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": [
                "Use a carried object in a meaningful action",
                "Replace generic dread lines with concrete sensory detail",
            ],
            "generic_phrase_targets": ["the words hung in the air", "heavy with dread"],
            "detail_targets": ["the latch against Clara's wrist", "lantern glare on wet links"],
            "grounding_targets": ["Attach dialogue to the chain, latch, or lantern"],
            "carryover_targets": ["Use the lantern or chain in a meaningful action or choice"],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_carryover_anchor_text(), _adversarial_near_miss_text()],
        critique,
        [_mild_generic_but_recovered_rewrite_text()],
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
        scene_ids=["sc_0001", "sc_0002"],
        chunk_size=1,
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[1]
    assert chunk.rewrite_used is True
    assert chunk.acceptance_reason == "rewrite_pass"
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    rewrite_attempt = payload["attempts"][1]
    assert rewrite_attempt["quality_pass"] is True
    assert rewrite_attempt["quality_snapshot"]["material_carryover_hits"] > payload["attempts"][0]["quality_snapshot"]["material_carryover_hits"]


def test_quality_passes_allows_recovered_continuation_after_generic_risk_clears(
    tmp_path: Path,
) -> None:
    service = _service(tmp_path, _long_text())
    previous_quality_snapshot = {
        "usable": True,
        "scores": {
            "coherence": 5,
            "continuity": 3,
            "clarity": 2,
            "pacing": 5,
            "specificity": 1,
            "dialogue": 4,
            "meta_free": 5,
        },
        "total_score": 25,
        "generic_risk": True,
        "stock_phrase_hits": 4,
        "material_carryover_hits": 0,
        "material_carryover": False,
        "weak_carryover": False,
        "meta_summary": False,
        "meta_contamination": False,
        "dialogue_present": True,
        "dialogue_grounded": True,
    }
    rewritten_quality_snapshot = {
        "usable": True,
        "scores": {
            "coherence": 5,
            "continuity": 4,
            "clarity": 4,
            "pacing": 5,
            "specificity": 3,
            "dialogue": 4,
            "meta_free": 5,
        },
        "total_score": 30,
        "generic_risk": False,
        "stock_phrase_hits": 1,
        "material_carryover_hits": 0,
        "material_carryover": False,
        "weak_carryover": False,
        "meta_summary": False,
        "meta_contamination": False,
        "dialogue_present": True,
        "dialogue_grounded": True,
    }
    critique_snapshot = {
        "weaknesses": [
            "Overuse of generic phrases and imagery that lack specificity.",
            "Dialogue lacks grounding in physical actions or setting.",
            "Vague descriptions that do not evoke a strong sense of place.",
        ],
        "continuity_issues": [
            "The transition from Nora's internal reflections to her interaction with the man feels abrupt."
        ],
        "replacement_targets": ["Replace generic phrases with more original and specific language."],
        "grounding_targets": ["Ensure that characters' actions are tied to their surroundings to enhance realism."],
        "carryover_targets": ["Eliminate repetitive imagery that does not add depth to the narrative."],
    }

    assert service._quality_passes(
        rewritten_quality_snapshot,
        rewrite_used=True,
        previous_quality_snapshot=previous_quality_snapshot,
        critique_snapshot=critique_snapshot,
        continuation_chunk=True,
    )


def test_parse_critique_accepts_fenced_json(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    critique = """```json
{
  "summary": "Scene summary",
  "weaknesses": ["specificity"],
  "continuity_issues": ["Needs stronger carryover"],
  "pacing_issues": [],
  "meta_contamination": false,
  "rewrite_goals": ["Add concrete detail"],
  "generic_phrase_targets": ["generic phrase"],
  "detail_targets": ["door latch"],
  "dialogue_grounding_targets": ["ground the line with action"],
  "emotional_show_targets": ["show fear through breath"],
  "replacement_targets": ["replace the generic line"],
  "grounding_targets": ["attach dialogue to the latch"],
  "carryover_targets": ["reuse the lantern in action"]
}
```"""

    parsed = service._parse_critique(critique)

    assert parsed["summary"] == "Scene summary"
    assert parsed["weaknesses"] == ["specificity"]
    assert parsed["generic_phrase_targets"] == ["generic phrase"]
    assert parsed["carryover_targets"] == ["reuse the lantern in action"]


def test_long_form_execution_recovers_clean_opening_rewrite_with_concrete_improvement(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_opening_recovery"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "The opening scene stays too generic and does not attach the dialogue to action.",
            "weaknesses": [
                "Vague scene details that do not contribute to character development or plot.",
                "Generic stock phrases that detract from the uniqueness of the writing.",
                "Dialogue that lacks grounding in physical action or setting.",
            ],
            "continuity_issues": [
                "The transition from the environment to the intimate conversation feels disjointed."
            ],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": [
                "Enhance specificity in descriptions to better ground the scene.",
                "Replace generic phrases with more original language.",
                "Ensure dialogue is more closely tied to physical actions and the setting.",
            ],
            "replacement_targets": [
                "Replace generic sunset language with concrete square detail",
                "Replace broad crowd language with specific market activity",
            ],
            "grounding_targets": [
                "Attach Lucas and Clara's dialogue to movement, gesture, or objects in the square"
            ],
            "carryover_targets": [],
        }
    )
    adapter = _CritiqueRewriteAdapter(_opening_generic_text(), critique, _opening_recovery_text())
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[0]
    assert chunk.rewrite_used is True
    assert chunk.acceptance_reason == "rewrite_pass"
    assert chunk.quality_snapshot is not None
    assert chunk.quality_snapshot["scores"]["clarity"] >= 4
    assert chunk.quality_snapshot["scores"]["specificity"] >= 3


def test_long_form_execution_stops_after_max_attempts(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_quality_fail"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Needs stronger specificity.",
            "weaknesses": ["specificity"],
            "rewrite_goals": ["Add concrete sensory detail"],
        }
    )
    adapter = _CritiqueRewriteAdapter(_low_quality_text(), critique, _low_quality_text())
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

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.continuity_snapshot["fallback_reason"] == "quality_failed"
    assert chunk.acceptance_reason == "quality_failed"


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
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{result.chunks[0].chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    attempts = payload.get("attempts") or []
    assert attempts
    assert attempts[0].get("raw_payload_keys")
    assert attempts[0].get("raw_payload_preview")


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
    text = text_path.read_text(encoding="utf-8-sig")
    assert text.startswith("Mara pushed")
