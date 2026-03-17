from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.long_form import ChapterMemoryPacket
from blackskies.services.long_form import score_long_form_quality
from blackskies.services.model_router import ModelRouter, ModelSpec, ModelTask
from blackskies.services.model_routing import ModelRouterConfig, ModelRoutingPolicy
from blackskies.services.model_adapters import AdapterConfig, AdapterError, BaseAdapter
from blackskies.services.operations.long_form_execution import LongFormExecutionService

_REPO_ROOT = Path(__file__).resolve().parents[3]


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


class _TransientThenSuccessAdapter(_FakeAdapter):
    def __init__(self, text: str) -> None:
        super().__init__(text)
        self._count = 0

    def generate_draft(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_payload = payload
        self._count += 1
        if self._count == 1:
            raise AdapterError("Provider request failed: timed out")
        return {"text": self._text}


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
    def __init__(
        self,
        draft_text: str,
        critique_text: str,
        rewrite_text: str,
        recovery_rewrite_text: str | None = None,
    ) -> None:
        super().__init__(draft_text)
        self._critique = critique_text
        self._rewrite = rewrite_text
        self._recovery_rewrite = recovery_rewrite_text or rewrite_text
        self._rewrite_count = 0
        self.last_rewrite_payload: dict[str, object] | None = None

    def critique(self, payload: dict[str, object]) -> dict[str, object]:
        return {"text": self._critique}

    def rewrite(self, payload: dict[str, object]) -> dict[str, object]:
        self.last_rewrite_payload = payload
        self._rewrite_count += 1
        if self._rewrite_count == 1:
            return {"text": self._rewrite}
        return {"text": self._recovery_rewrite}


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


def _opening_partial_rescue_text() -> str:
    return (
        "Copper light slid across the cobblestones while Lucas stood by the chipped fountain and watched the market awnings snap in the wind. "
        * 10
        + "\n\n"
        + "\"You can't keep doing this,\" Clara said. Lucas looked at the wet stone and kept his mouth tight while the square buzzed around them and the last stalls rattled in the wind. "
        "\"Not here,\" he said. The market kept moving while he stared at the fountain rim and tried not to answer her directly. "
        * 8
    )


def _repair_only_generic_scene_text() -> str:
    return (
        "Clara stood in the narrow kitchen while the silence hung in the air and the chipped Formica pressed cold against her palm. "
        "Alex waited by the counter, careful not to crowd her, while the coffee pot ticked on the burner. "
        * 6
        + "\n\n"
        + "\"You don't have to pretend with me,\" Alex said. Clara gave him a thin nod, but the words trailed off while she stared at the cracked mug instead of his face. "
        "\"I'm trying,\" she said, and for a moment she watched the coffee drip instead of answering him fully. "
        * 4
    )


def _repair_only_generic_replaced_text() -> str:
    return (
        "Clara stood in the narrow kitchen while steam from the coffee pot dampened her cheek and the chipped Formica chilled the heel of her hand. "
        "Alex waited by the counter, one thumb hooked on the paper sack, giving her room while the cracked mug tapped the sink and the glass pot clicked on the burner. "
        * 6
        + "\n\n"
        + "\"You don't have to pretend with me,\" Alex said, nudging the burrito bag onto the table while Clara rubbed her thumb across the mug handle and wiped a ring of coffee from the vinyl cloth. "
        "\"I'm trying,\" she said, forcing the words past a tight throat as she watched a line of coffee slide down the glass pot, then she set the cracked mug beside the sack and finally looked up at him. "
        * 4
    )


def _repair_only_collapsed_fragment() -> str:
    return (
        "Clara rubbed the cracked mug and looked at Alex while the coffee pot ticked behind her. "
        "Steam dampened her cheek and the Formica edge pressed into her palm as she tried to answer him.\n\n"
        "\"I'm trying,\" she said, watching the coffee drip into the glass pot while the paper sack sat unopened beside the sink. "
        "Alex stayed by the table, waiting, and she kept her eyes on the mug instead of his face. "
        "The room stayed still except for the burner clicking under the pot. "
        * 2
    )


def _structured_patch_payload(*patches: dict[str, str]) -> str:
    return json.dumps({"patches": list(patches)})


def _artifact_json(relative_path: str) -> dict[str, object]:
    return json.loads((_REPO_ROOT / relative_path).read_text(encoding="utf-8"))


def _artifact_continuation(title: str = "Replay Scene") -> SimpleNamespace:
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=[title],
        beat_refs=[],
    )
    return SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )


def _legacy_targets_to_slots(patch_targets: list[dict[str, object]]) -> list[dict[str, object]]:
    slots: list[dict[str, object]] = []
    for index, target in enumerate(patch_targets, start=1):
        slots.append(
            {
                "slot_id": f"s{index}",
                "unit_type": "sentence",
                "target_type": str(target.get("target_type") or "generic"),
                "original_text": str(target.get("target_text") or ""),
                "target_reason": str(target.get("target_type") or "generic"),
                "target_phrase": str(target.get("target_phrase") or "") or None,
                "context_before": "",
                "context_after": "",
            }
        )
    return slots


def _classify_generation_patch(
    service: LongFormExecutionService,
    *,
    source_text: str,
    target_text: str,
    replacement_text: str,
    continuation,
) -> dict[str, object]:
    target_quality = score_long_form_quality(target_text)
    replacement_quality = score_long_form_quality(replacement_text)
    target_signals = service._generic_specificity_signal_count(target_text)
    replacement_signals = service._generic_specificity_signal_count(replacement_text)
    has_literal_detail = (
        replacement_signals > target_signals
        or int(replacement_quality.get("concrete_hits") or 0) > int(target_quality.get("concrete_hits") or 0)
        or int(replacement_quality.get("sensory_hits") or 0) > int(target_quality.get("sensory_hits") or 0)
    )
    continuation_allowed_names = (
        service._capitalized_terms(source_text)
        | service._capitalized_terms(continuation.prior_summary)
        | service._capitalized_terms(continuation.prior_excerpt)
        | service._capitalized_terms(" ".join(continuation.chapter_memory.scene_titles or []))
    )
    drift = not service._local_patch_fidelity_ok(
        source_text=source_text,
        target_text=target_text,
        replacement_text=replacement_text,
        allowed_names=continuation_allowed_names,
        rescue_contract={"rescue_slots": []},
    )
    result = service._validate_and_apply_patch_response(
        source_text=source_text,
        rescue_slots=[{"slot_id": "s1", "target_type": "generic", "original_text": target_text}],
        patch_response=[{"slot_id": "s1", "replacement_text": replacement_text}],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )
    return {
        "has_literal_detail": has_literal_detail,
        "remains_vague": result.get("failure_class") == "patch_specificity_unresolved",
        "introduces_drift": drift,
        "validator_result": result,
    }


def _patch_rescue_source_text() -> str:
    return (
        "Clara stood in the market-square kitchen annex with her palm flat on the chipped Formica while the coffee pot clicked behind her. "
        "Alex waited by the side table with the paper sack in both hands, giving her room near the sink. "
        "Steam crawled along the window glass and dampened the hair at her temple while carts rattled outside. "
        "She kept staring at the cracked mug instead of the burrito bag or Alex's face. "
        "The burner clicked under the glass pot, and each pop of heat made the spoon on the saucer twitch against the counter edge. "
        "Alex kept his shoulders angled away from her, careful not to block the narrow aisle between the sink and the window. "
        "A bus rolled past the square outside, shaking the loose latch against the annex frame while steam blurred the pane above the sink. "
        "Clara rubbed the pad of her thumb across the mug handle, then set it down and picked it up again when the coffee smell turned bitter.\n\n"
        "\"You don't have to pretend with me,\" Alex said, shifting the paper sack from one hand to the other while he watched the burner light pulse blue beneath the pot. "
        "Clara gave him a thin nod, but the words trailed off while she watched the coffee drip for a moment instead of answering him. "
        "She kept her hip against the counter and listened to the carts grind across the cobbles outside the annex door. "
        "\"I'm trying,\" she said, and the silence hung in the air between them while her thumb stayed hooked around the mug handle. "
        "Alex looked at the cracked mug instead of crowding her, waiting while the spoon tapped once more against the saucer."
    )


def _patch_rescue_weak_source_text() -> str:
    return (
        "Clara stood in the market-square kitchen annex while the room felt heavy and the silence hung in the air around the chipped Formica. "
        "Alex waited by the side table with the paper sack in both hands, but everything about the room felt strangely distant and hard to pin down. "
        "Steam crawled along the window glass while carts rattled outside, and the whole annex felt full of tension that neither of them could name. "
        "She kept staring at the cracked mug instead of the burrito bag or Alex's face, as if the moment might stay suspended forever. "
        "The burner clicked under the glass pot and the sound seemed to echo through the room in a way that made everything feel even more uncertain. "
        "A bus rolled past the square outside, but the noise only made the silence feel heavier.\n\n"
        "\"You don't have to pretend with me,\" Alex said. Clara gave him a thin nod, but the words trailed off while she watched the coffee drip for a moment instead of answering him. "
        "The silence hung in the air between them and made the room feel even more tense. "
        "\"I'm trying,\" she said, and the silence hung in the air between them while her thumb stayed hooked around the mug handle. "
        "Alex waited, and the moment felt distant and unresolved while the spoon tapped once more against the saucer."
    )


def _patch_rescue_success_payload() -> str:
    return _structured_patch_payload(
        {
            "slot_id": "s1",
            "replacement_text": "Clara gave him a thin nod, rubbed her thumb along the hot mug handle, and watched a brown line slide down the glass pot before she looked up to answer him.",
        },
        {
            "slot_id": "s2",
            "replacement_text": "\"I'm trying,\" she said, gripping the mug handle until the ceramic tapped the counter while the burner clicked behind her and steam brushed her cheek.",
        },
    )


def _patch_rescue_generic_fail_payload() -> str:
    return _structured_patch_payload(
        {
            "slot_id": "s1",
            "replacement_text": "Clara gave him a thin nod, but the words trailed off while she watched the coffee drip for a moment instead of answering him.",
        }
    )


def _patch_rescue_specificity_vague_payload() -> str:
    return _structured_patch_payload(
        {
            "slot_id": "s1",
            "replacement_text": "Clara's lips tightened as she moved through them, feeling like an unwelcome shadow in their carefree mood.",
        }
    )


def _patch_rescue_specificity_literal_payload() -> str:
    return _structured_patch_payload(
        {
            "slot_id": "s1",
            "replacement_text": "Clara's lips tightened as she passed the damp wall, catching the scrape of bright jacket sleeves and the slap of laughter off the alley bricks.",
        }
    )


def _patch_rescue_dialogue_fail_payload() -> str:
    return _structured_patch_payload(
        {
            "slot_id": "s2",
            "replacement_text": "\"I'm trying,\" she said, her voice soft and fragile in the silence between them as the moment stayed difficult to name.",
        }
    )


def _patch_rescue_drift_payload() -> str:
    return _structured_patch_payload(
        {
            "slot_id": "s1",
            "replacement_text": "Mara gave him a thin nod, sliding the sealed ledger under her coat while she watched the coffee drip for a moment instead of answering him.",
        }
    )


def _patch_rescue_overlong_payload() -> str:
    return _structured_patch_payload(
        {
            "slot_id": "s1",
            "replacement_text": (_opening_recovery_text() + " " + _opening_recovery_text()),
        }
    )


def _write_outline_context(
    project_root: Path,
    *,
    chapter_id: str = "ch_0001",
    scene_id: str = "sc_0001",
    scene_title: str = "Market Square Argument",
    beat_refs: list[str] | None = None,
    locked_facts: list[str] | None = None,
) -> None:
    (project_root / "outline.json").write_text(
        json.dumps(
            {
                "acts": ["Act I: Gathered Storm"],
                "chapters": [{"id": chapter_id, "title": "Chapter One"}],
                "scenes": [
                    {
                        "id": scene_id,
                        "chapter_id": chapter_id,
                        "title": scene_title,
                        "beat_refs": beat_refs or ["Lucas and Clara argue in the market square."],
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    if locked_facts:
        (project_root / "locked_facts.json").write_text(
            json.dumps({"facts": locked_facts}),
            encoding="utf-8",
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


def test_long_form_execution_recovers_from_transient_adapter_error(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_transient_adapter"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    router.register_provider(_FakeProvider(_TransientThenSuccessAdapter(_long_text())))
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
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{result.chunks[0].chunk_id}.json"
    )
    assert not diag_path.exists()


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


def test_long_form_execution_recovers_borderline_quality_failure_with_single_retry(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_borderline_retry"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "The opening is close, but it still needs stronger scene specificity.",
            "weaknesses": ["clarity", "specificity", "dialogue"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Sharpen the blocking", "Replace the last generic lines with concrete scene action"],
        }
    )
    adapter = _CritiqueRewriteAdapter(
        _patch_rescue_weak_source_text(),
        critique,
        _patch_rescue_weak_source_text(),
        _patch_rescue_success_payload(),
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[0]
    assert chunk.attempt_count == 3
    assert chunk.acceptance_reason == "retry_pass"
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["used"] is True
    assert chunk.retry_snapshot["succeeded"] is True
    assert chunk.retry_snapshot["reason"] == "targeted_editorial_miss_after_rewrite"
    assert chunk.retry_snapshot["stronger_model_used"] is False
    assert chunk.retry_snapshot["rescue_mode_used"] is True
    assert chunk.retry_snapshot["rescue_model_used"] is False
    assert chunk.retry_snapshot["model_snapshot"]["escalated"] is False
    assert chunk.retry_snapshot["conditional_rescue_escalation_used"] is False
    assert chunk.retry_snapshot["conditional_rescue_escalation_trigger"] is None
    assert chunk.retry_snapshot["patch_rescue_success"] is True
    assert chunk.guardrail_snapshot is not None
    assert chunk.guardrail_snapshot["evaluated"] is True
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    assert payload["retry_snapshot"]["used"] is True
    assert payload["retry_snapshot"]["succeeded"] is True
    assert payload["retry_snapshot"]["stronger_model_used"] is False
    assert payload["retry_snapshot"]["rescue_mode_used"] is True
    assert payload["retry_snapshot"]["rescue_model_used"] is False
    assert payload["guardrail_snapshot"]["mode"] == "recovery_retry"
    assert payload["attempts"][2]["mode"] == "recovery_retry"
    assert payload["attempts"][2]["model_snapshot"]["escalated"] is False
    assert "RESCUE SLOTS JSON:" in str(adapter.last_rewrite_payload["prompt"])
    assert "\"patches\"" in str(adapter.last_rewrite_payload["prompt"])


def test_long_form_execution_recovers_targeted_editorial_miss_with_rescue_retry(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_targeted_editorial_retry"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Keep the opening scene, but ground the dialogue and replace vague square detail.",
            "weaknesses": ["dialogue", "specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Ground each spoken beat in action", "Add concrete market-square detail"],
            "dialogue_grounding_targets": ["Attach each spoken line to movement, gesture, or a handled object."],
            "detail_targets": ["Use the fountain rim, cobbles, and stalls as visible anchors."],
        }
    )
    adapter = _CritiqueRewriteAdapter(
        _patch_rescue_weak_source_text(),
        critique,
        _patch_rescue_weak_source_text(),
        _patch_rescue_success_payload(),
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[0]
    assert chunk.acceptance_reason == "retry_pass"
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["reason"] == "targeted_editorial_miss_after_rewrite"
    assert chunk.retry_snapshot["rescue_mode_used"] is True
    assert chunk.retry_snapshot["patch_rescue_success"] is True


def test_long_form_execution_rejects_rescue_that_still_misses_targeted_fix(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_failed_targeted_rescue"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Ground the dialogue without changing the scene.",
            "weaknesses": ["dialogue", "specificity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Ground the dialogue in action."],
            "dialogue_grounding_targets": ["Attach each spoken line to action or the square."],
        }
    )
    adapter = _CritiqueRewriteAdapter(
        _patch_rescue_weak_source_text(),
        critique,
        _patch_rescue_weak_source_text(),
        _patch_rescue_dialogue_fail_payload(),
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["reason"] == "targeted_editorial_miss_after_rewrite"
    assert chunk.retry_snapshot["rescue_failure_class"] in {
        "patch_dialogue_grounding_unresolved",
        "dialogue_grounding_unresolved",
        "patch_specificity_unresolved",
    }
    assert chunk.retry_snapshot["rescue_under_improved"] is True


def test_build_rescue_contract_preserves_dialogue_targets_for_curly_quoted_lines(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Kitchen Annex"],
        beat_refs=["Clara and Alex argue in the annex."],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    original_text = (
        "Steam crawled along the window glass while the burner clicked under the pot.\n\n"
        "“I’m just… appreciating the moment,” she replied, her voice barely above a whisper, as if too loud a sound might fracture the fragile beauty surrounding her. "
        "She kept staring at the cracked mug instead of the burrito bag or Alex's face."
    )

    rescue_contract = service._build_rescue_contract(
        original_text=original_text,
        continuation=continuation,
        critique_snapshot={
            "rewrite_goals": ["Ground the line in the annex."],
            "dialogue_grounding_targets": ["Attach the spoken line to movement, object handling, or the annex."],
            "grounding_targets": ["Keep the line near the mug and burner."],
        },
        quality_snapshot={
            "dialogue_present": True,
            "dialogue_grounded": False,
        },
    )

    assert rescue_contract["dialogue_beats_requiring_grounding"]
    assert "appreciating the moment" in rescue_contract["dialogue_beats_requiring_grounding"][0].lower()
    assert any(target["target_type"] == "dialogue" for target in rescue_contract["rescue_slots"])


def test_patch_validation_accepts_dialogue_grounding_with_local_action_and_setting_cue(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Kitchen Annex"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    source_text = _patch_rescue_weak_source_text()
    target_text = "\"I'm trying,\" she said, and the silence hung in the air between them while her thumb stayed hooked around the mug handle."

    result = service._validate_and_apply_patch_response(
        source_text=source_text,
        rescue_slots=[{"slot_id": "s1", "target_type": "dialogue", "original_text": target_text}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "\"I'm trying,\" she said, gripping the mug handle until the ceramic tapped the counter while the burner clicked behind her.",
            }
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )

    assert result["accepted"] is True
    assert "gripping the mug handle" in result["patched_text"]


def test_patch_validation_rejects_dialogue_paraphrase_without_local_grounding(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Kitchen Annex"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    target_text = "\"I'm trying,\" she said, and the silence hung in the air between them while her thumb stayed hooked around the mug handle."

    result = service._validate_and_apply_patch_response(
        source_text=_patch_rescue_weak_source_text(),
        rescue_slots=[{"slot_id": "s1", "target_type": "dialogue", "original_text": target_text}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "\"I'm trying,\" she said, her voice soft and fragile in the silence between them.",
            }
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )

    assert result["accepted"] is False
    assert result["failure_class"] == "patch_dialogue_grounding_unresolved"


def test_refresh_rescue_contract_keeps_patch_target_after_prior_patch_changes_text(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Forest Path"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    current_text = (
        "She followed, the canopy above thickening, absorbing their footsteps, while the air wrapped around them, dense with the earthy aroma of rain-soaked soil and rotting leaves. "
        "With each step, her heart raced, responding instinctively to the towering trees that loomed above, leaning in as though eager to eavesdrop on their conversation."
    )
    rescue_contract = {
        "lines_to_repair": [
            "She followed, the canopy above thickening, absorbing their footsteps, while the air wrapped around them, heavy with the scent of wet earth and decaying foliage.",
            "With each step, her heart raced, responding instinctively to the towering trees that loomed above, leaning in as though eager to eavesdrop on their conversation.",
        ],
        "generic_phrases_to_replace": ["heavy with", "heart raced"],
        "required_concrete_anchor_terms": ["forest", "above", "pushed"],
        "rescue_slots": [
            {
                "slot_id": "s1",
                "target_type": "generic",
                "original_text": "She followed, the canopy above thickening, absorbing their footsteps, while the air wrapped around them, heavy with the scent of wet earth and decaying foliage.",
                "target_phrase": "heavy with",
            },
            {
                "slot_id": "s2",
                "target_type": "generic",
                "original_text": "With each step, her heart raced, responding instinctively to the towering trees that loomed above, leaning in as though eager to eavesdrop on their conversation.",
                "target_phrase": "heart raced",
            },
        ],
    }

    refreshed = service._refresh_rescue_contract_for_current_text(
        current_text=current_text,
        rescue_contract=rescue_contract,
        continuation=continuation,
        critique_snapshot={"rewrite_goals": ["Replace vague lines with concrete detail."]},
        quality_snapshot={"dialogue_present": False, "dialogue_grounded": True},
    )

    assert refreshed["rescue_slots"]
    assert any("heart raced" in target["original_text"].lower() for target in refreshed["rescue_slots"])


def test_patch_validation_rebinds_stale_target_after_prior_patch_edit(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Tavern Alley"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    source_text = (
        "Come on! Thomas stepped closer, his grin wide and infectious, momentarily pushing the shadows back into the corners of her mind. "
        "You can't stay out here all night. It's freezing! He stepped closer, his body radiating warmth that seeped through her cloak, a gentle balm against the chill that had settled deep in her bones."
    )
    stale_target = "Itâ€™s freezing!â€ The warmth of his presence wrapped around her, a flicker of comfort against the chill that had settled deep in her bones."
    rebound_span = "It's freezing! He stepped closer, his body radiating warmth that seeped through her cloak, a gentle balm against the chill that had settled deep in her bones."

    result = service._validate_and_apply_patch_response(
        source_text=source_text,
        rescue_slots=[{"slot_id": "s1", "target_type": "generic", "original_text": stale_target, "target_phrase": "flicker of"}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "It's freezing! He stepped closer until the tavern light caught the wet edge of her cloak and warmed the cold seam at her shoulder.",
            }
        ],
        continuation=continuation,
        rescue_contract={"required_concrete_anchor_terms": ["tavern", "cloak"]},
        mode="repair_only",
    )

    assert result["accepted"] is True
    assert rebound_span not in result["patched_text"]


def test_patch_validation_accepts_specificity_lift_with_concrete_local_detail(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Alley"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    target_text = "As the siren faded into the night, Clara's heart raced."

    result = service._validate_and_apply_patch_response(
        source_text="As the siren faded into the night, Clara's heart raced. The brick wall pressed cold through her jacket.",
        rescue_slots=[{"slot_id": "s1", "target_type": "generic", "original_text": target_text, "target_phrase": "heart raced"}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "As the siren faded into the night, Clara felt her pulse knock against her ribs while the cold brick wall pressed through her jacket.",
            }
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )

    assert result["accepted"] is True


def test_patch_validation_replaces_by_slot_id_only(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Kitchen Annex"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    source_text = _patch_rescue_weak_source_text()
    result = service._validate_and_apply_patch_response(
        source_text=source_text,
        rescue_slots=[
            {
                "slot_id": "s7",
                "target_type": "generic",
                "original_text": "Clara gave him a thin nod, but the words trailed off while she watched the coffee drip for a moment instead of answering him.",
            }
        ],
        patch_response=[
            {
                "slot_id": "s7",
                "replacement_text": "Clara gave him a thin nod, rubbed the chipped mug handle with her thumb, and watched a dark bead of coffee slide down the glass pot before she answered him.",
            }
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )

    assert result["accepted"] is True
    assert result["patch_snapshots"][0]["slot_id"] == "s7"


def test_patch_validation_accepts_legacy_span_id_as_slot_alias(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Forest Path"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    source_text = (
        "The scent of damp earth and decaying leaves enveloped Clara as she pushed through the underbrush. "
        "He stepped carefully, brushing aside the low-hanging branches as if unveiling a secret. "
        "The bitterness of uncertainty mingled with the fresh, loamy scent of the forest floor, a reminder of her own insecurities."
    )

    result = service._validate_and_apply_patch_response(
        source_text=source_text,
        rescue_slots=[
            {
                "slot_id": "s1",
                "target_type": "generic",
                "original_text": "He stepped carefully, brushing aside the low-hanging branches as if unveiling a secret.",
            },
            {
                "slot_id": "s2",
                "target_type": "generic",
                "original_text": "The bitterness of uncertainty mingled with the fresh, loamy scent of the forest floor, a reminder of her own insecurities.",
            },
        ],
        patch_response=[
            {
                "slot_id": "p1",
                "replacement_text": "He stepped carefully, sweeping aside the low-hanging branches with a gentle push and exposing the narrow path under the wet needles.",
            },
            {
                "slot_id": "p2",
                "replacement_text": "The bitterness of uncertainty mingled with the fresh, earthy aroma of the forest floor, grounding her in the damp loam under her boots.",
            },
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="repair_only",
    )

    assert result["accepted"] is True
    assert result["patch_snapshots"][0]["slot_id"] == "p1"
    assert result["patch_snapshots"][1]["slot_id"] == "p2"


def test_patch_validation_allows_local_concrete_rewording_without_fidelity_drift(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Alley"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    target_text = "The distant rumble of thunder rolled overhead, a low growl that mirrored her growing unease."

    result = service._validate_and_apply_patch_response(
        source_text=target_text + " Jamie pressed her back against the brick wall.",
        rescue_slots=[{"slot_id": "s1", "target_type": "generic", "original_text": target_text}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "Thunder rolled over the alley roof, and the sound rattled against the brick wall behind Jamie like the warning she had been trying not to hear.",
            }
        ],
        continuation=continuation,
        rescue_contract={"required_concrete_anchor_terms": ["brick", "alley", "jamie"]},
        mode="recovery_retry",
    )

    assert result["accepted"] is True


def test_repair_only_prompt_requires_literal_local_specificity_detail(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Rain Street"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )

    prompt = service._build_repair_only_prompt(
        latest_text="Shadows flickered at the edges of her vision.",
        continuation=continuation,
        rescue_contract={
            "min_word_count": 180,
            "max_word_count": 320,
            "repair_min_word_count": 180,
            "repair_max_word_count": 320,
            "min_paragraph_count": 1,
            "max_paragraph_count": 3,
            "lines_to_repair": ["Shadows flickered at the edges of her vision."],
            "rescue_slots": [{"slot_id": "s1", "original_text": "Shadows flickered at the edges of her vision."}],
        },
        rescue_failure_class="patch_specificity_unresolved",
    )

    assert "Metaphor by itself does not count." in prompt
    assert "object, body, surface, movement, or setting cue" in prompt
    assert "context_before/context_after" in prompt
    assert "physically observable on the page" in prompt
    assert "one full sentence, not a clause fragment" in prompt


def test_patch_validation_accepts_sentence_slot_local_variation_with_full_sentence(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    continuation = _artifact_continuation("Sentence Length Replay")
    target_text = "Claire stepped inside, her breath catching as the cool air brushed against her skin, sending a shiver down her spine."
    source_text = (
        "The door creaked open, the sound slicing through the dense silence that enveloped the dimly lit room. "
        + target_text
        + " Dust motes floated lazily in the narrow beam of light that filtered through the grimy windows."
    )

    result = service._validate_and_apply_patch_response(
        source_text=source_text,
        rescue_slots=[{"slot_id": "s1", "unit_type": "sentence", "target_type": "generic", "original_text": target_text}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "Claire stepped inside, the cold brass knob biting her palm while the draft slid under her collar and the door thudded shut behind her.",
            }
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="repair_only",
    )

    assert result["accepted"] is True


def test_rescue_prompt_requires_specificity_slot_to_use_nearby_context_detail(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Rain Street"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )

    prompt = service._build_recovery_retry_prompt(
        original_text="Clara kept moving past the crowd.",
        continuation=continuation,
        critique_snapshot={"rewrite_goals": ["Replace vague line with concrete detail."]},
        quality_snapshot={"scores": {"specificity": 3}, "total_score": 24, "dialogue_present": False, "dialogue_grounded": True},
        failure_classification={"reason": "targeted_editorial_miss_after_rewrite"},
        rescue_contract={
            "min_word_count": 180,
            "max_word_count": 320,
            "minimum_specificity_delta": 1,
            "minimum_clarity_delta": 1,
            "minimum_action_cues_to_add": 1,
            "subject_entities": ["Clara"],
            "scene_anchors": ["alley", "wall"],
            "dialogue_lines": [],
            "dialogue_beats_requiring_grounding": [],
            "generic_phrases_to_replace": ["bubble of youth"],
            "lines_to_repair": ["Clara felt like an uninvited shadow in their vibrant bubble of youth."],
            "required_concrete_anchor_terms": ["wall", "jacket", "voices"],
            "rescue_slots": [
                {
                    "slot_id": "s1",
                    "unit_type": "sentence",
                    "original_text": "Clara felt like an uninvited shadow in their vibrant bubble of youth.",
                    "context_before": "Ahead, a group of teenagers loitered near the damp wall in bright jackets.",
                    "context_after": "Their voices bounced off the alley bricks as she kept walking.",
                    "target_reason": "specificity",
                }
            ],
        },
    )

    assert "context_before/context_after fields" in prompt
    assert "physically observable on the page" in prompt


def test_patch_validation_rejects_specificity_patch_that_stays_vague(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Alley"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    target_text = "As the siren faded into the night, Clara's heart raced."

    result = service._validate_and_apply_patch_response(
        source_text="As the siren faded into the night, Clara's heart raced.",
        rescue_slots=[{"slot_id": "s1", "target_type": "generic", "original_text": target_text, "target_phrase": "heart raced"}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "As the siren faded into the night, Clara felt a stronger sense of dread settle over her.",
            }
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )

    assert result["accepted"] is False
    assert result["failure_class"] == "patch_specificity_unresolved"


def test_patch_validation_still_rejects_local_drift_with_new_story_element(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Kitchen Annex"],
        beat_refs=[],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    target_text = "Clara gave him a thin nod, but the words trailed off while she watched the coffee drip for a moment instead of answering him."

    result = service._validate_and_apply_patch_response(
        source_text=_patch_rescue_weak_source_text(),
        rescue_slots=[{"slot_id": "s1", "target_type": "generic", "original_text": target_text}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "Mara gave him a thin nod, sliding the sealed ledger under her coat while she watched the coffee drip for a moment instead of answering him.",
            }
        ],
        continuation=continuation,
        rescue_contract={"required_concrete_anchor_terms": ["coffee", "coat"]},
        mode="recovery_retry",
    )

    assert result["accepted"] is False
    assert result["failure_class"] == "patch_fidelity_risk"


def test_same_slot_specificity_retry_prompt_requires_literal_retry_without_reselection(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    continuation = _artifact_continuation("Retry Prompt")
    prompt = service._build_same_slot_specificity_retry_prompt(
        latest_text="Clara kept walking past the alley crowd.",
        continuation=continuation,
        rescue_contract={
            "rescue_slots": [
                {
                    "slot_id": "s1",
                    "unit_type": "sentence",
                    "original_text": "Clara felt like an uninvited shadow in their vibrant bubble of youth.",
                    "context_before": "Ahead, teenagers loitered near the damp wall in bright jackets.",
                    "context_after": "Their voices bounced off the alley bricks behind her.",
                    "target_reason": "specificity",
                }
            ]
        },
        retry_mode="recovery_retry",
    )

    assert "Regenerate only the same slot ids" in prompt
    assert "Metaphor alone does not count." in prompt
    assert "Do not reselect" in prompt


def test_frozen_replay_selection_only_detects_slot_selection_divergence_and_stale_target(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    continuation = _artifact_continuation("Forest Replay")
    diagnostic = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_27cb3073.json"
    )
    rewrite_attempt = diagnostic["attempts"][1]
    recovery_attempt = diagnostic["attempts"][2]
    original_text = rewrite_attempt["quality_snapshot"]["text"]
    rescue_contract = service._build_rescue_contract(
        original_text=original_text,
        continuation=continuation,
        critique_snapshot=diagnostic["critique_snapshot"],
        quality_snapshot=rewrite_attempt["quality_snapshot"],
    )

    expected_targets = [
        str(item.get("target_text") or "") for item in recovery_attempt["patch_targets"] if item.get("target_text")
    ]
    selected_texts = [str(slot.get("original_text") or "") for slot in rescue_contract["rescue_slots"]]
    assert not any(target in selected_texts for target in expected_targets)

    patched_text = recovery_attempt["patch_validation"]["patched_text"]
    stale_target = str(recovery_attempt["patch_targets"][0]["target_text"])
    assert stale_target not in patched_text

    refreshed = service._refresh_rescue_contract_for_current_text(
        current_text=patched_text,
        rescue_contract={"rescue_slots": _legacy_targets_to_slots(recovery_attempt["patch_targets"])},
        continuation=continuation,
        critique_snapshot=diagnostic["critique_snapshot"],
        quality_snapshot=score_long_form_quality(patched_text),
    )
    assert refreshed["rescue_slots"]
    assert any(str(slot.get("original_text") or "").strip() != stale_target for slot in refreshed["rescue_slots"])


def test_frozen_replay_generation_only_identifies_vague_specificity_patch(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    continuation = _artifact_continuation("Alley Replay")
    diagnostic = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_3fbe8439.json"
    )
    rewrite_attempt = diagnostic["attempts"][1]
    recovery_attempt = diagnostic["attempts"][2]
    patch = recovery_attempt["patch_response"][0]

    report = _classify_generation_patch(
        service,
        source_text=rewrite_attempt["quality_snapshot"]["text"],
        target_text=str(patch["target_text"]),
        replacement_text=str(patch["replacement_text"]),
        continuation=continuation,
    )

    assert report["has_literal_detail"] is False
    assert report["remains_vague"] is True
    assert report["introduces_drift"] is False


def test_frozen_replay_validator_only_classifies_good_vague_and_drifted_patches(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    continuation = _artifact_continuation("Validator Replay")
    target_text = "Clara's lips tightened involuntarily as she approached, feeling like an uninvited shadow in their vibrant bubble of youth."
    source_text = (
        "Ahead, a group of teenagers loitered near the damp wall in bright jackets. "
        + target_text
        + " Their voices bounced off the alley bricks as she kept walking."
    )

    good = service._validate_and_apply_patch_response(
        source_text=source_text,
        rescue_slots=[{"slot_id": "s1", "target_type": "generic", "original_text": target_text}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "Clara's lips tightened as she passed the damp wall, catching the scrape of bright jacket sleeves and the slap of laughter off the alley bricks.",
            }
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )
    vague = service._validate_and_apply_patch_response(
        source_text=source_text,
        rescue_slots=[{"slot_id": "s1", "target_type": "generic", "original_text": target_text}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "Clara's lips tightened as she moved through the crowd, feeling like an unwelcome shadow in their carefree mood.",
            }
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )
    drift = service._validate_and_apply_patch_response(
        source_text=source_text,
        rescue_slots=[{"slot_id": "s1", "target_type": "generic", "original_text": target_text}],
        patch_response=[
            {
                "slot_id": "s1",
                "replacement_text": "Mara's lips tightened as she palmed the stolen ledger against her coat and slipped past the checkpoint wall.",
            }
        ],
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )

    assert good["accepted"] is True
    assert vague["failure_class"] == "patch_specificity_unresolved"
    assert drift["failure_class"] == "patch_fidelity_risk"


def test_frozen_replay_full_replay_separates_generation_from_binding_bug(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    continuation = _artifact_continuation("Full Replay")
    specificity_diag = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_3fbe8439.json"
    )
    binding_diag = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_27cb3073.json"
    )

    specificity_attempt = specificity_diag["attempts"][2]
    specificity_result = service._validate_and_apply_patch_response(
        source_text=specificity_diag["attempts"][1]["quality_snapshot"]["text"],
        rescue_slots=_legacy_targets_to_slots(specificity_attempt["patch_targets"]),
        patch_response=service._parse_patch_response(json.dumps({"patches": specificity_attempt["patch_response"]})),
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="recovery_retry",
    )
    repair_attempt = binding_diag["attempts"][3]
    binding_result = service._validate_and_apply_patch_response(
        source_text=binding_diag["attempts"][2]["patch_validation"]["patched_text"],
        rescue_slots=_legacy_targets_to_slots(repair_attempt["patch_targets"]),
        patch_response=service._parse_patch_response(json.dumps({"patches": repair_attempt["patch_response"]})),
        continuation=continuation,
        rescue_contract={"rescue_slots": []},
        mode="repair_only",
    )

    report = {
        "specificity_layer": specificity_result.get("failure_class"),
        "binding_layer": "accepted" if binding_result.get("accepted") else binding_result.get("failure_class"),
    }

    assert report["specificity_layer"] == "patch_specificity_unresolved"
    assert report["binding_layer"] == "patch_specificity_unresolved"


def test_frozen_replay_live_dialogue_grounding_terminal_class_matches_artifact(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    continuation = _artifact_continuation("Live Dialogue Replay")
    diagnostic = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_9d2a8bc4.json"
    )
    chunk_payload = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/chunks/lf_9d2a8bc4.json"
    )

    recovery_attempt = diagnostic["attempts"][2]
    repair_attempt = diagnostic["attempts"][3]
    rescue_slots = recovery_attempt["rescue_slots"]
    recovery_response = service._parse_patch_response(json.dumps({"patches": recovery_attempt["patch_response"]}))
    repair_response = service._parse_patch_response(json.dumps({"patches": repair_attempt["patch_response"]}))

    recovery_result = service._validate_and_apply_patch_response(
        source_text=diagnostic["attempts"][1]["quality_snapshot"]["text"],
        rescue_slots=rescue_slots,
        patch_response=recovery_response,
        continuation=continuation,
        rescue_contract={"rescue_slots": rescue_slots},
        mode="recovery_retry",
    )
    repair_result = service._validate_and_apply_patch_response(
        source_text=diagnostic["attempts"][1]["quality_snapshot"]["text"],
        rescue_slots=repair_attempt["rescue_slots"],
        patch_response=repair_response,
        continuation=continuation,
        rescue_contract={"rescue_slots": repair_attempt["rescue_slots"]},
        mode="repair_only",
    )

    assert chunk_payload["chunk_id"] == diagnostic["chunk_id"]
    assert [slot["slot_id"] for slot in rescue_slots] == ["s1", "s2", "s3", "s4"]
    assert all(str(slot.get("target_type") or "") == "dialogue" for slot in rescue_slots)
    assert diagnostic["retry_snapshot"]["same_slot_specificity_retry_used"] is False
    assert recovery_response == recovery_attempt["patch_response"]
    assert repair_response == repair_attempt["patch_response"]
    assert recovery_result["failure_class"] == "patch_dialogue_grounding_unresolved"
    assert repair_result["failure_class"] == "patch_dialogue_grounding_unresolved"
    assert diagnostic["retry_snapshot"]["rescue_failure_class"] == "patch_dialogue_grounding_unresolved"


def test_frozen_replay_live_specificity_terminal_class_matches_artifact_without_rebinding_regression(
    tmp_path: Path,
) -> None:
    service = _service(tmp_path, _long_text())
    continuation = _artifact_continuation("Live Specificity Replay")
    diagnostic = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_b923f724.json"
    )
    chunk_payload = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/chunks/lf_b923f724.json"
    )

    recovery_attempt = diagnostic["attempts"][2]
    repair_attempt = diagnostic["attempts"][3]
    recovery_slots = recovery_attempt["rescue_slots"]
    repair_slots = repair_attempt["rescue_slots"]
    recovery_response = service._parse_patch_response(json.dumps({"patches": recovery_attempt["patch_response"]}))
    repair_response = service._parse_patch_response(json.dumps({"patches": repair_attempt["patch_response"]}))

    recovery_result = service._validate_and_apply_patch_response(
        source_text=diagnostic["attempts"][1]["quality_snapshot"]["text"],
        rescue_slots=recovery_slots,
        patch_response=recovery_response,
        continuation=continuation,
        rescue_contract={"rescue_slots": recovery_slots},
        mode="recovery_retry",
    )
    repair_result = service._validate_and_apply_patch_response(
        source_text=diagnostic["attempts"][1]["quality_snapshot"]["text"],
        rescue_slots=repair_slots,
        patch_response=repair_response,
        continuation=continuation,
        rescue_contract={"rescue_slots": repair_slots},
        mode="repair_only",
    )

    assert chunk_payload["chunk_id"] == diagnostic["chunk_id"]
    assert [slot["slot_id"] for slot in recovery_slots] == ["s1", "s2", "s3", "s4", "s5", "s6"]
    assert [slot["slot_id"] for slot in repair_slots] == ["s1", "s2", "s3", "s4", "s5", "s6"]
    assert diagnostic["retry_snapshot"]["same_slot_specificity_retry_used"] is False
    assert repair_response == repair_attempt["patch_response"]
    assert recovery_result["failure_class"] == "patch_specificity_unresolved"
    assert repair_result["accepted"] is True
    assert repair_result["patch_snapshots"][0]["slot_id"] == "s1"
    assert repair_result["failure_class"] if "failure_class" in repair_result else None is None
    assert diagnostic["retry_snapshot"]["rescue_failure_class"] == "specificity_unresolved"
    assert diagnostic["attempts"][3]["rescue_failure_class"] == "specificity_unresolved"
    assert "patch_target_missing" not in json.dumps(diagnostic["retry_snapshot"])


def test_frozen_replay_followthrough_credits_locally_accepted_specificity_patch(tmp_path: Path) -> None:
    service = _service(tmp_path, _long_text())
    diagnostic = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_b923f724.json"
    )
    repair_attempt = diagnostic["attempts"][3]
    rescue_contract = {
        "rescue_slots": repair_attempt["rescue_slots"],
        "generic_phrases_to_replace": diagnostic["retry_snapshot"]["rescue_targets_summary"]["generic_phrases_to_replace"],
        "accepted_patch_snapshots": repair_attempt["patch_snapshot"],
        "accepted_local_specificity_credit": True,
    }

    targets_satisfied = service._rescue_targets_satisfied(
        previous_quality_snapshot=diagnostic["attempts"][1]["quality_snapshot"],
        rewritten_quality_snapshot=repair_attempt["quality_snapshot"],
        critique_snapshot=diagnostic["critique_snapshot"],
        rescue_contract=rescue_contract,
    )
    quality_pass = service._quality_passes(
        repair_attempt["quality_snapshot"],
        rewrite_used=True,
        previous_quality_snapshot=diagnostic["attempts"][1]["quality_snapshot"],
        critique_snapshot=diagnostic["critique_snapshot"],
        rescue_contract=rescue_contract,
        continuation_chunk=False,
    )
    failure_class = service._classify_rescue_failure(
        previous_quality_snapshot=diagnostic["attempts"][1]["quality_snapshot"],
        rewritten_quality_snapshot=repair_attempt["quality_snapshot"],
        critique_snapshot=diagnostic["critique_snapshot"],
        guardrail_snapshot=repair_attempt["guardrail_snapshot"],
        rescue_contract=rescue_contract,
    )

    assert targets_satisfied is True
    assert quality_pass is True
    assert failure_class not in {"specificity_unresolved", "under_improved"}


def test_frozen_replay_followthrough_specificity_still_fails_when_local_patch_never_clears_validator(
    tmp_path: Path,
) -> None:
    service = _service(tmp_path, _long_text())
    diagnostic = _artifact_json(
        "sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_b923f724.json"
    )
    recovery_attempt = diagnostic["attempts"][2]
    rescue_contract = {
        "rescue_slots": recovery_attempt["rescue_slots"],
        "generic_phrases_to_replace": diagnostic["retry_snapshot"]["rescue_targets_summary"]["generic_phrases_to_replace"],
    }

    targets_satisfied = service._rescue_targets_satisfied(
        previous_quality_snapshot=diagnostic["attempts"][1]["quality_snapshot"],
        rewritten_quality_snapshot=diagnostic["attempts"][1]["quality_snapshot"],
        critique_snapshot=diagnostic["critique_snapshot"],
        rescue_contract=rescue_contract,
    )
    failure_class = service._classify_rescue_failure(
        previous_quality_snapshot=diagnostic["attempts"][1]["quality_snapshot"],
        rewritten_quality_snapshot=diagnostic["attempts"][1]["quality_snapshot"],
        critique_snapshot=diagnostic["critique_snapshot"],
        guardrail_snapshot=diagnostic["guardrail_snapshot"],
        rescue_contract=rescue_contract,
    )

    assert recovery_attempt["patch_validation"]["failure_class"] == "patch_specificity_unresolved"
    assert targets_satisfied is False
    assert failure_class == "generic_replacement_unresolved"


def test_long_form_execution_repair_only_can_fix_dialogue_grounding_after_patch_miss(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_repair_dialogue_rescue"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Ground the dialogue without broadening the annex scene.",
            "weaknesses": ["dialogue", "specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Ground each spoken beat in action or a nearby object."],
            "dialogue_grounding_targets": ["Attach each spoken line to movement, gesture, or the mug and burner."],
            "grounding_targets": ["Keep the dialogue tied to the annex objects."],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_patch_rescue_weak_source_text()],
        critique,
        [
            _patch_rescue_weak_source_text(),
            _patch_rescue_dialogue_fail_payload(),
            _patch_rescue_success_payload(),
        ],
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["repair_only_pass_used"] is True
    assert chunk.retry_snapshot["repair_only_pass_rescued"] is True
    assert chunk.retry_snapshot["stronger_model_used"] is True
    assert chunk.retry_snapshot["rescue_model_used"] is True
    assert chunk.retry_snapshot["conditional_rescue_escalation_used"] is True
    assert chunk.retry_snapshot["conditional_rescue_escalation_trigger"] in {
        "patch_dialogue_grounding_unresolved",
        "patch_specificity_unresolved",
    }
    assert chunk.retry_snapshot["conditional_rescue_escalation_succeeded"] is True
    assert chunk.retry_snapshot["patch_rescue_success"] is True
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    assert payload["retry_snapshot"]["conditional_rescue_escalation_used"] is True
    assert payload["retry_snapshot"]["conditional_rescue_escalation_trigger"] in {
        "patch_dialogue_grounding_unresolved",
        "patch_specificity_unresolved",
    }
    assert payload["attempts"][3]["mode"] == "repair_only"
    assert payload["attempts"][3]["model_snapshot"]["escalated"] is True

def test_long_form_execution_repair_only_pass_can_rescue_fidelity_safe_retry(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_repair_only_rescue"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Ground the dialogue and replace the generic line without changing the scene.",
            "weaknesses": ["dialogue", "specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Ground dialogue in action", "Replace vague square language with concrete blocking"],
            "dialogue_grounding_targets": ["Attach each spoken line to movement, gesture, or an object."],
            "detail_targets": ["Use the mug, burner, and coffee pot."],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_patch_rescue_weak_source_text()],
        critique,
        [
            _patch_rescue_weak_source_text(),
            _patch_rescue_generic_fail_payload(),
            _patch_rescue_success_payload(),
        ],
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[0]
    assert chunk.attempt_count == 4
    assert chunk.acceptance_reason == "retry_pass"
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["repair_only_pass_used"] is True
    assert chunk.retry_snapshot["repair_only_pass_rescued"] is True
    assert chunk.retry_snapshot["rescue_targets_summary"]["dialogue_beats_requiring_grounding"]
    assert chunk.retry_snapshot["patch_rescue_success"] is True
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    assert payload["retry_snapshot"]["repair_only_pass_used"] is True
    assert payload["retry_snapshot"]["repair_only_pass_rescued"] is True
    assert payload["attempts"][3]["mode"] == "repair_only"


def test_long_form_execution_repair_only_rescues_generic_replacement_target(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_repair_generic_rescue"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Replace stock emotional phrasing with concrete kitchen action without changing the scene.",
            "weaknesses": ["specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace generic stock phrases", "Keep the same kitchen scene and dialogue order"],
            "detail_targets": ["Use the chipped Formica, cracked mug, and coffee pot."],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_patch_rescue_weak_source_text()],
        critique,
        [
            _patch_rescue_weak_source_text(),
            _patch_rescue_generic_fail_payload(),
            _patch_rescue_specificity_literal_payload(),
            _patch_rescue_success_payload(),
            _patch_rescue_success_payload(),
        ],
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
        target_words_per_chunk=500,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["repair_only_pass_used"] is True
    assert chunk.retry_snapshot["repair_only_pass_rescued"] is True
    assert chunk.retry_snapshot["rescue_targets_summary"]["generic_phrases_to_replace"]
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    assert payload["attempts"][3]["repair_local_snapshot"]["accepted"] is True


def test_long_form_execution_repair_only_rejects_length_collapse(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_repair_length_collapse"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Replace stock emotional phrasing with concrete kitchen action without changing the scene.",
            "weaknesses": ["specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace generic stock phrases", "Keep the same kitchen scene and dialogue order"],
            "detail_targets": ["Use the chipped Formica, cracked mug, and coffee pot."],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_patch_rescue_weak_source_text()],
        critique,
        [
            _patch_rescue_weak_source_text(),
            _patch_rescue_generic_fail_payload(),
            _patch_rescue_generic_fail_payload(),
            _structured_patch_payload(
                {
                    "slot_id": "s1",
                    "replacement_text": _repair_only_collapsed_fragment(),
                }
            ),
        ],
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
        target_words_per_chunk=500,
    )

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["rescue_failure_class"] == "patch_length_distortion"
    assert chunk.retry_snapshot["conditional_rescue_escalation_used"] is True
    assert chunk.retry_snapshot["conditional_rescue_escalation_trigger"] == "patch_specificity_unresolved"
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    assert payload["attempts"][-1]["patch_validation"]["failure_class"] == "patch_length_distortion"
    assert payload["retry_snapshot"]["conditional_rescue_escalation_used"] is True


def test_long_form_execution_repair_only_still_fails_when_generic_target_remains(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_repair_generic_still_fails"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Replace stock emotional phrasing with concrete kitchen action without changing the scene.",
            "weaknesses": ["specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace generic stock phrases", "Keep the same kitchen scene and dialogue order"],
            "detail_targets": ["Use the chipped Formica, cracked mug, and coffee pot."],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_patch_rescue_weak_source_text()],
        critique,
        [
            _patch_rescue_weak_source_text(),
            _patch_rescue_generic_fail_payload(),
            _patch_rescue_generic_fail_payload(),
            _patch_rescue_generic_fail_payload(),
        ],
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
        target_words_per_chunk=500,
    )

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["rescue_failure_class"] in {
        "patch_generic_replacement_unresolved",
        "generic_replacement_unresolved",
        "patch_specificity_unresolved",
    }


def test_long_form_execution_builds_bounded_rescue_slot_for_clean_vague_line(
    tmp_path: Path,
) -> None:
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )
    rewritten_text = (
        "Anna stood under the streetlamp while rain slid down her coat and pooled around her shoes. "
        "Tom came through the rain with a grin that felt out of place against the empty street. "
        "\"Maybe a bit of both,\" she replied, forcing a smile that felt like a mask over her unease. "
        "The water kept ticking against the curb while she held herself still beside the stop sign.\n\n"
        "Rainwater threaded off the bus shelter in thin ropes and snapped against the bench slats. "
        "Anna kept one hand in her pocket and the other around her sleeve while traffic hissed past the corner. "
        "Tom lingered near the pole with his soaked hair plastered flat, waiting for her to say more. "
        "She watched the gutter carry wrappers toward the drain instead of meeting his eyes.\n\n"
        "A truck rolled through the intersection and threw pale light over the puddles around their shoes. "
        "Anna shifted her weight against the signpost and felt the metal buzz faintly under her palm. "
        "Tom's grin softened when he saw her jaw tighten, but he stayed where she had left room for him. "
        "The rain kept needling her collar and tracing a cold line along her neck.\n\n"
        "\"Maybe a bit of both,\" she replied, forcing a smile that felt like a mask over her unease. "
        "The bus schedule flapped once behind her shoulder while the stoplight clicked over to red. "
        "Tom tipped his chin toward the curb, his sneakers half-submerged in the runoff. "
        "Anna rubbed her thumb across the seam of her sleeve and listened to the water tick against the signpost. "
    )
    critique = json.dumps(
        {
            "summary": "Replace vague emotional phrasing with observable action.",
            "weaknesses": ["specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace vague emotional language with visible behavior."],
            "emotional_show_targets": ["Show Anna's discomfort through action instead of abstract emotion."],
        }
    )
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context="Chapter One",
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Rain Stop"],
        beat_refs=["Anna stalls at the bus stop while Tom approaches."],
    )
    continuation = SimpleNamespace(
        prior_summary=None,
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    rescue_contract = service._build_rescue_contract(
        original_text=rewritten_text,
        continuation=continuation,
        critique_snapshot=json.loads(critique),
        quality_snapshot=score_long_form_quality(rewritten_text),
    )
    target_slot = next(
        slot
        for slot in rescue_contract["rescue_slots"]
        if "Tom came through the rain with a grin that felt out of place against the empty street." in slot["original_text"]
    )
    assert rescue_contract["rescue_slots"]
    assert target_slot["target_type"] == "generic"
    assert target_slot["unit_type"] in {"sentence", "sentence_window"}
    assert target_slot["context_before"]


def test_long_form_execution_patch_specificity_accepts_concrete_local_detail(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_patch_specificity_concrete"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Replace stock emotional phrasing with concrete kitchen action without changing the scene.",
            "weaknesses": ["specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace generic stock phrases", "Keep the same kitchen scene and dialogue order"],
            "detail_targets": ["Use the chipped Formica, cracked mug, and coffee pot."],
        }
    )
    concrete_patch = _structured_patch_payload(
        {
            "slot_id": "s1",
            "replacement_text": "Clara gave him a thin nod, rubbed the chipped mug handle with her thumb, and watched a dark bead of coffee slide down the glass pot before she answered him.",
        }
    )
    adapter = _CritiqueRewriteAdapter(
        _patch_rescue_weak_source_text(),
        critique,
        _patch_rescue_weak_source_text(),
        concrete_patch,
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    assert result.chunks[0].retry_snapshot["patch_rescue_success"] is True


def test_long_form_execution_patch_specificity_still_fails_when_replacement_stays_vague(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_patch_specificity_vague"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Replace the generic line with concrete scene detail.",
            "weaknesses": ["specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace generic stock phrases", "Keep the same kitchen scene and dialogue order"],
        }
    )
    vague_patch = _structured_patch_payload(
        {
            "slot_id": "s1",
            "replacement_text": "Clara gave him a thin nod, pausing there while the feeling lingered and the moment stayed difficult to name.",
        }
    )
    adapter = _CritiqueRewriteAdapter(
        _patch_rescue_weak_source_text(),
        critique,
        _patch_rescue_weak_source_text(),
        vague_patch,
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["rescue_failure_class"] == "patch_specificity_unresolved"


def test_long_form_execution_same_slot_specificity_retry_can_rescue_vague_first_patch(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_same_slot_specificity_retry"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Replace the vague social line with concrete local detail.",
            "weaknesses": ["specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace vague social language with local physical detail."],
            "replacement_targets": ["bubble of youth"],
            "detail_targets": ["damp wall", "jackets", "alley bricks"],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_patch_rescue_weak_source_text()],
        critique,
        [
            _patch_rescue_weak_source_text(),
            _patch_rescue_specificity_vague_payload(),
            _patch_rescue_specificity_literal_payload(),
            _patch_rescue_success_payload(),
        ],
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason is None
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["same_slot_specificity_retry_used"] is True
    assert chunk.retry_snapshot["patch_rescue_success"] is True
    assert chunk.retry_snapshot["repair_only_pass_used"] is True


def test_long_form_execution_same_slot_specificity_retry_still_fails_when_second_attempt_stays_vague(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_same_slot_specificity_retry_fails"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Replace the vague social line with concrete local detail.",
            "weaknesses": ["specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace vague social language with local physical detail."],
            "replacement_targets": ["bubble of youth"],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_patch_rescue_weak_source_text()],
        critique,
        [
            _patch_rescue_weak_source_text(),
            _patch_rescue_specificity_vague_payload(),
            _patch_rescue_specificity_vague_payload(),
            _patch_rescue_specificity_vague_payload(),
        ],
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["same_slot_specificity_retry_used"] is True
    assert chunk.retry_snapshot["rescue_failure_class"] == "patch_specificity_unresolved"


def test_long_form_execution_same_slot_specificity_retry_does_not_fire_for_fidelity_risk(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_same_slot_specificity_retry_no_fidelity"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Replace the generic line with concrete local detail.",
            "weaknesses": ["specificity", "clarity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Replace generic stock phrases", "Keep the same kitchen scene and dialogue order"],
        }
    )
    adapter = _CritiqueRewriteAdapter(
        _patch_rescue_weak_source_text(),
        critique,
        _patch_rescue_weak_source_text(),
        _patch_rescue_drift_payload(),
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot.get("same_slot_specificity_retry_used") is not True
    assert chunk.retry_snapshot["rescue_failure_class"] == "patch_fidelity_risk"


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


def test_long_form_execution_does_not_retry_hard_carryover_failure(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "proj_hard_failure_retry_guard"
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
            "summary": "The continuation name-drops prior objects without using them meaningfully.",
            "weaknesses": ["continuity", "specificity"],
            "continuity_issues": ["Carryover remains decorative instead of causal."],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Use the carried objects in a real action"],
        }
    )
    adapter = _SequencedCritiqueRewriteAdapter(
        [_carryover_anchor_text(), _adversarial_near_miss_text()],
        critique,
        [_adversarial_near_miss_text()],
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

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[1]
    assert chunk.attempt_count == 2
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["used"] is False
    assert chunk.retry_snapshot["reason"] == "material_carryover_missing"
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    assert payload["retry_snapshot"]["used"] is False
    assert payload["retry_snapshot"]["eligible"] is False


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


def test_long_form_execution_rejects_outline_drift_in_rewrite(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_outline_guardrail"
    project_root.mkdir(parents=True, exist_ok=True)
    _write_outline_context(
        project_root,
        locked_facts=[
            "Lucas and Clara are in the market square.",
            "Only Lucas and Clara appear in this scene.",
        ],
    )
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
            "summary": "Ground the opening in concrete square detail.",
            "weaknesses": ["clarity", "specificity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Sharpen the market-square blocking"],
        }
    )
    adapter = _CritiqueRewriteAdapter(_opening_generic_text(), critique, _long_text())
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

    assert result.stopped_reason == "rewrite_guardrail_failed"
    chunk = result.chunks[0]
    assert chunk.guardrail_snapshot is not None
    assert chunk.guardrail_snapshot["failure_reason"] == "outline_drift_detected"
    assert "mara" in chunk.guardrail_snapshot["blocking_new_story_elements"]
    diag_path = (
        project_root
        / ".blackskies"
        / "long_form"
        / "diagnostics"
        / f"{chunk.chunk_id}.json"
    )
    payload = json.loads(diag_path.read_text(encoding="utf-8"))
    assert payload["guardrail_snapshot"]["authoritative_name_check"] is True
    assert "mara" in payload["guardrail_snapshot"]["blocking_new_story_elements"]


def test_long_form_execution_ignores_sentence_opener_false_positive_in_guardrail(tmp_path: Path) -> None:
    settings = ServiceSettings(project_base_dir=tmp_path, long_form_provider_enabled=True)
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=router,
        enabled=True,
    )
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0002"],
        chapter_context="Chapter One",
        locked_facts=[
            "Elara is alone in the alley.",
            "Only Elara and the stranger appear in this scene.",
        ],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
        scene_titles=["Night Alley"],
        beat_refs=["Elara confronts a stranger in the alley."],
    )
    continuation = SimpleNamespace(
        prior_summary="Elara enters the alley and confronts a stranger.",
        prior_excerpt=None,
        chapter_memory=chapter_memory,
        chapter_id="ch_0001",
    )
    original_text = (
        "Elara pulled her coat tighter as the alley wind shoved at her shoulder. "
        "The stranger watched from the brick wall, saying nothing yet. Loose paper scraped across the stones "
        "and caught at her boots while the sign above the alley mouth knocked against its rusted bracket. "
        "She tasted damp metal in the air and kept her back clear of the wall.\n\n"
        "\"Who are you?\" Elara asked, keeping one hand near the seam of her coat while the wind worried the hem."
    )
    rewritten_text = (
        "Yet the alley wind shoved harder at Elara's coat, rattling the loose sign above her shoulder. "
        "The stranger stayed against the brick wall, silent but intent, while paper scratched along the wet stones "
        "and the alley mouth breathed out a damp metallic chill. She kept her boots planted and her back clear of the brick.\n\n"
        "\"Who are you?\" Elara asked, pressing her thumb into the coat seam while the sign clacked overhead. "
        "Yet she held her ground instead of backing away, eyes fixed on the stranger's hands."
    )

    guardrail = service._evaluate_rewrite_guardrails(
        original_text=original_text,
        fallback_original_text=None,
        rewritten_text=rewritten_text,
        continuation=continuation,
        chapter_memory=chapter_memory,
        quality_snapshot={"total_score": 31},
        mode="rewrite",
    )

    assert guardrail["accepted"] is True
    assert guardrail["failure_reason"] is None
    assert "yet" not in guardrail["blocking_new_story_elements"]


def test_long_form_execution_rejects_length_band_violation_in_rewrite(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_length_guardrail"
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
            "summary": "Ground the opening in concrete square detail.",
            "weaknesses": ["clarity", "specificity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Sharpen the market-square blocking"],
        }
    )
    overlong_rewrite = _opening_recovery_text() + "\n\n" + _opening_recovery_text()
    adapter = _CritiqueRewriteAdapter(_opening_generic_text(), critique, overlong_rewrite)
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

    assert result.stopped_reason == "rewrite_guardrail_failed"
    chunk = result.chunks[0]
    assert chunk.guardrail_snapshot is not None
    assert chunk.guardrail_snapshot["failure_reason"] == "length_band_failed"
    assert chunk.guardrail_snapshot["within_length_band"] is False


def test_long_form_execution_rejects_outline_drift_in_rescue_retry(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_rescue_outline_guardrail"
    project_root.mkdir(parents=True, exist_ok=True)
    _write_outline_context(
        project_root,
        locked_facts=[
            "Lucas and Clara are in the market square.",
            "Only Lucas and Clara appear in this scene.",
        ],
    )
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Sharpen the opening with concrete market-square detail.",
            "weaknesses": ["clarity", "specificity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Keep Lucas and Clara in the square while improving blocking."],
            "dialogue_grounding_targets": ["Attach the spoken lines to the square and fountain."],
        }
    )
    adapter = _CritiqueRewriteAdapter(
        _patch_rescue_weak_source_text(),
        critique,
        _patch_rescue_weak_source_text(),
        _patch_rescue_drift_payload(),
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["rescue_failure_class"] == "patch_fidelity_risk"
    assert chunk.retry_snapshot["rescue_fidelity_risk"] is True
    assert chunk.retry_snapshot["conditional_rescue_escalation_used"] is False
    assert chunk.retry_snapshot["conditional_rescue_escalation_trigger"] is None


def test_long_form_execution_rejects_length_band_violation_in_rescue_retry(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_rescue_length_guardrail"
    project_root.mkdir(parents=True, exist_ok=True)
    settings = ServiceSettings(
        project_base_dir=tmp_path,
        long_form_provider_enabled=True,
        local_llm_rewrite_retry_model="qwen3:14b",
    )
    diagnostics = DiagnosticLogger()
    router = ModelRouter(
        config=ModelRouterConfig(
            policy=ModelRoutingPolicy.LOCAL_ONLY,
            provider_calls_enabled=True,
        )
    )
    critique = json.dumps(
        {
            "summary": "Sharpen the opening with concrete market-square detail.",
            "weaknesses": ["clarity", "specificity"],
            "continuity_issues": [],
            "pacing_issues": [],
            "meta_contamination": False,
            "rewrite_goals": ["Keep the same opening but make it more concrete."],
        }
    )
    overlong_recovery = _opening_recovery_text() + "\n\n" + _opening_recovery_text()
    adapter = _CritiqueRewriteAdapter(
        _patch_rescue_weak_source_text(),
        critique,
        _patch_rescue_weak_source_text(),
        _patch_rescue_overlong_payload(),
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
        target_words_per_chunk=400,
    )

    assert result.stopped_reason == "quality_failed"
    chunk = result.chunks[0]
    assert chunk.retry_snapshot is not None
    assert chunk.retry_snapshot["rescue_failure_class"] == "patch_length_distortion"


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
