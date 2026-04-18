from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.locking import LockState
from blackskies.services.memory_lab.options import MemoryLabRuntimeOptions
from blackskies.services.memory_lab.orchestrator import orchestrate_memory_resolution
import blackskies.services.memory_lab.orchestrator as orchestrator_module
from blackskies.services.memory_lab.schemas import MemoryArtifact, MemoryLedgerEntry
from blackskies.services.memory_lab.storage import (
    load_contested_outcome_events,
    load_ledger_entry,
    load_reinforcement_events,
    write_ledger_entry,
)


def _options(*, enabled: bool = True) -> MemoryLabRuntimeOptions:
    return MemoryLabRuntimeOptions(
        enabled=enabled,
        max_candidates=8,
        max_unresolved=3,
        alternate_interpretation_threshold=0.08,
        weight_max=2.0,
        reinforcement_enabled=True,
        anchor_enabled=True,
        anchor_auto_threshold=3,
        decay_enabled=True,
        decay_base_rate=0.03,
        decay_min_weight=0.05,
        decay_fading_threshold=0.40,
        decay_suppressed_threshold=0.20,
        decay_archived_threshold=0.10,
        decay_log_anchor_protection=False,
        decay_allow_revival=True,
        decay_suppressed_fallback_enabled=True,
        decay_low_confidence_fallback_threshold=0.35,
        reinforcement_event_retention_limit=200,
        decay_event_retention_limit=200,
        debug_logging=False,
    )


def _entry(scene_id: str, artifact: MemoryArtifact) -> MemoryLedgerEntry:
    return MemoryLedgerEntry(
        scene_id=scene_id,
        chapter_id="ch_0001",
        schema_version=MEMORY_LAB_SCHEMA_VERSION,
        artifacts=[artifact],
        source_summary=None,
        source_unresolved=[],
        source_emotional_carryover=None,
        source_location_state=None,
    )


def test_orchestrator_acquires_project_lock_around_mutation_flow(tmp_path: Path, monkeypatch) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="art_lock",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="locked flow",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))

    state = {"locked": False}

    class _LockCtx:
        def __enter__(self):
            state["locked"] = True
            return LockState(
                lock_acquired=True,
                lock_is_effective=True,
                lock_mode="test_lock",
            )

        def __exit__(self, exc_type, exc, tb):
            state["locked"] = False
            return False

    def _stub_lock(_project_root: Path):
        return _LockCtx()

    original_load = orchestrator_module.load_entries_compat

    def _assert_locked_load(path: Path):
        assert state["locked"] is True
        return original_load(path)

    monkeypatch.setattr(
        "blackskies.services.memory_lab.orchestrator.acquire_project_lock",
        _stub_lock,
    )
    monkeypatch.setattr(
        "blackskies.services.memory_lab.orchestrator.load_entries_compat",
        _assert_locked_load,
    )

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=_options(enabled=True),
        now_iso="2026-04-13T10:00:00Z",
    )

    assert packet is not None
    assert diagnostics.lock_acquired is True
    assert state["locked"] is False


def test_orchestrator_reports_noop_lock_fallback(tmp_path: Path, monkeypatch) -> None:
    project_root = tmp_path / "project"

    class _NoopLockCtx:
        def __enter__(self):
            return LockState(
                lock_acquired=True,
                lock_is_effective=False,
                lock_mode="no_op_fallback",
            )

        def __exit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr(
        "blackskies.services.memory_lab.orchestrator.acquire_project_lock",
        lambda _project_root: _NoopLockCtx(),
    )

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=_options(enabled=True),
        now_iso="2026-04-13T10:00:00Z",
    )

    assert packet is None
    assert any("lock_not_effective" in note for note in diagnostics.notes)


def test_orchestrator_load_failure_is_fail_soft(tmp_path: Path, monkeypatch) -> None:
    project_root = tmp_path / "project"

    def _raise_load(*_args, **_kwargs):  # type: ignore[no-untyped-def]
        raise OSError("simulated load failure")

    monkeypatch.setattr(orchestrator_module, "load_entries_compat", _raise_load)

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=_options(enabled=True),
        now_iso="2026-04-13T10:00:00Z",
    )

    assert packet is None
    assert any("operation=load_entries_compat" in note for note in diagnostics.notes)


def test_orchestrator_resolve_failure_is_fail_soft(tmp_path: Path, monkeypatch) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="art_resolve_fail",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="resolver target",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))

    def _raise_resolve(*_args, **_kwargs):  # type: ignore[no-untyped-def]
        raise RuntimeError("simulated resolve failure")

    monkeypatch.setattr(orchestrator_module, "resolve_memory_packet", _raise_resolve)

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=_options(enabled=True),
        now_iso="2026-04-13T10:00:00Z",
    )

    assert packet is None
    assert any("operation=resolve_memory_packet" in note for note in diagnostics.notes)


def test_orchestrator_writes_reinforcement_event_when_enabled(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="art_re",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="reinforced",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=_options(enabled=True),
        now_iso="2026-04-13T10:00:00Z",
    )

    assert packet is not None
    assert diagnostics.reinforcement_events_written >= 1
    events = load_reinforcement_events(project_root, "art_re")
    assert events


def test_runtime_diagnostics_include_required_fields_for_enabled_path(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="art_diag",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="diagnostics target",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
        status="active",
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))
    options = _options(enabled=True)
    options = replace(options, decay_enabled=False)

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=7,
        options=options,
        now_iso="2026-04-13T11:00:00Z",
    )

    assert packet is not None
    assert diagnostics.memory_lab_enabled is True
    assert diagnostics.used_legacy_continuity_only is False
    assert diagnostics.current_scene_order == 7
    assert diagnostics.resolver_decisions
    first_decision = diagnostics.resolver_decisions[0]
    assert isinstance(first_decision.status_multiplier_used, float)
    assert isinstance(first_decision.suppressed_fallback_used, bool)
    assert isinstance(first_decision.tie_break_tuple, tuple)
    assert first_decision.tie_break_rationale
    assert isinstance(first_decision.selected, bool)
    assert diagnostics.decay_diagnostics
    assert diagnostics.decay_diagnostics[0].decay_skipped is True
    assert diagnostics.decay_diagnostics[0].decay_skip_reason == "decay_disabled"
    assert diagnostics.slot_selection_diagnostics


def test_runtime_diagnostics_include_disabled_mode_flags(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=4,
        options=_options(enabled=False),
    )

    assert packet is None
    assert diagnostics.memory_lab_enabled is False
    assert diagnostics.used_legacy_continuity_only is True
    assert diagnostics.current_scene_order == 4


def test_runtime_flow_auto_promotes_anchor_when_threshold_met(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="art_anchor_auto",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="anchor candidate",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
        reinforcement_count=1,
        selection_count=1,
        is_anchor=False,
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))
    options = replace(
        _options(enabled=True),
        anchor_enabled=True,
        anchor_auto_threshold=2,
    )

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=options,
        now_iso="2026-04-13T12:00:00Z",
    )

    assert packet is not None
    assert diagnostics.anchor_promotions == 1
    assert len(diagnostics.anchor_promotion_diagnostics) == 1
    promotion = diagnostics.anchor_promotion_diagnostics[0]
    assert promotion.artifact_id == "art_anchor_auto"
    assert promotion.threshold_used == 2

    updated_entry = load_ledger_entry(project_root, "sc_0001")
    assert updated_entry is not None
    updated = updated_entry.artifacts[0]
    assert updated.is_anchor is True
    assert updated.anchor_reason is not None


def test_max_candidates_option_changes_runtime_selection_pool(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    summary_artifact = MemoryArtifact(
        artifact_id="art_summary",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="summary candidate",
        weight=1.0,
        confidence=1.0,
        recency_order=10,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    emotional_artifact = MemoryArtifact(
        artifact_id="art_emotion",
        schema_version="memory_artifact_v2",
        artifact_type="emotional_state",
        scene_id="sc_0002",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="emotional candidate",
        weight=1.0,
        confidence=1.0,
        recency_order=9,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_0001", summary_artifact))
    write_ledger_entry(project_root, _entry("sc_0002", emotional_artifact))

    options = replace(_options(enabled=True), decay_enabled=False, max_candidates=1)
    packet, _diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0003",
        current_chapter_id="ch_0001",
        current_scene_order=3,
        options=options,
        now_iso="2026-04-13T13:00:00Z",
    )

    assert packet is not None
    assert packet.selected_summary == "summary candidate"
    assert packet.selected_emotional_carryover is None


def test_weight_max_option_clamps_reinforcement_gain(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="art_weight_cap",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="weight capped",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))
    options = replace(_options(enabled=True), decay_enabled=False, weight_max=1.01)

    packet, _diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=options,
        now_iso="2026-04-13T13:30:00Z",
    )

    assert packet is not None
    updated_entry = load_ledger_entry(project_root, "sc_0001")
    assert updated_entry is not None
    assert updated_entry.artifacts[0].weight == 1.01


def test_reinforcement_is_idempotent_per_scene(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="art_idempotent",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="idempotent reinforcement",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))

    options = replace(_options(enabled=True), decay_enabled=False)

    packet_one, _diagnostics_one = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=9,
        options=options,
        now_iso="2026-04-13T12:00:00Z",
    )
    packet_two, _diagnostics_two = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=9,
        options=options,
        now_iso="2026-04-13T12:00:01Z",
    )

    assert packet_one is not None
    assert packet_two is not None
    updated_entry = load_ledger_entry(project_root, "sc_0001")
    assert updated_entry is not None
    updated = updated_entry.artifacts[0]
    assert updated.last_reinforced_scene_order == 9
    assert updated.reinforcement_count == 1
    assert updated.selection_count == 1
    assert updated.weight == 1.03
    events = load_reinforcement_events(project_root, "art_idempotent")
    assert len(events) == 1


def test_orchestrator_write_failures_are_fail_soft_and_observable(tmp_path: Path, monkeypatch) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="art_fail_soft",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="fail soft writes",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))

    def _raise_write(*_args, **_kwargs):  # type: ignore[no-untyped-def]
        raise OSError("simulated write failure")

    monkeypatch.setattr(orchestrator_module, "write_entry_current", _raise_write)
    monkeypatch.setattr(orchestrator_module, "append_decay_event_current", _raise_write)
    monkeypatch.setattr(orchestrator_module, "append_reinforcement_event_current", _raise_write)

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=_options(enabled=True),
        now_iso="2026-04-13T12:00:00Z",
    )

    assert packet is not None
    assert packet.selected_summary == "fail soft writes"
    assert diagnostics.notes
    assert any("write_entry_failed" in note for note in diagnostics.notes)
    assert any("append_decay_event_failed" in note or "append_reinforcement_event_failed" in note for note in diagnostics.notes)


def test_decay_prepass_skips_current_scene_artifacts(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    current_scene_artifact = MemoryArtifact(
        artifact_id="art_current",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_current",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="current scene summary",
        weight=1.0,
        confidence=1.0,
        recency_order=5,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    prior_scene_artifact = MemoryArtifact(
        artifact_id="art_prior",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_prior",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="prior scene summary",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_current", current_scene_artifact))
    write_ledger_entry(project_root, _entry("sc_prior", prior_scene_artifact))

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_current",
        current_chapter_id="ch_0001",
        current_scene_order=9,
        options=_options(enabled=True),
        now_iso="2026-04-13T12:00:00Z",
    )

    assert packet is not None
    updated_current = load_ledger_entry(project_root, "sc_current")
    updated_prior = load_ledger_entry(project_root, "sc_prior")
    assert updated_current is not None
    assert updated_prior is not None
    assert updated_current.artifacts[0].last_decay_scene_order is None
    assert updated_prior.artifacts[0].last_decay_scene_order == 9
    current_diag = next(item for item in diagnostics.decay_diagnostics if item.artifact_id == "art_current")
    assert current_diag.decay_skip_reason == "current_scene_excluded"


def test_orchestrator_surfaces_event_file_corruption_note(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    corrupt_target = project_root / ".blackskies" / "memory_lab" / "decay_events" / "art_corrupt.json"
    corrupt_target.parent.mkdir(parents=True, exist_ok=True)
    corrupt_target.write_text("{bad json", encoding="utf-8")

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=_options(enabled=True),
        now_iso="2026-04-13T12:00:00Z",
    )

    assert packet is None
    assert any("event_file_corruption" in note for note in diagnostics.notes)


def test_contested_outcome_event_appended_per_slot_decision(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    a = MemoryArtifact(
        artifact_id="sum_ca",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="contested A",
        weight=1.0,
        confidence=1.0,
        recency_order=2,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
        interpretation_group_id="grp-1",
        interpretation_label="protective",
        source_kind="scene",
        source_ref="sc_0001",
    )
    b = replace(
        a,
        artifact_id="sum_cb",
        scene_id="sc_0002",
        content="contested B",
        interpretation_label="controlling",
    )
    write_ledger_entry(project_root, _entry("sc_0001", a))
    write_ledger_entry(project_root, _entry("sc_0002", b))

    packet, _diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0003",
        current_chapter_id="ch_0001",
        current_scene_order=3,
        options=replace(_options(enabled=True), decay_enabled=False),
        now_iso="2026-04-13T12:00:00Z",
    )
    assert packet is not None
    events = load_contested_outcome_events(project_root, "sc_0003")
    assert events
    assert all(event.slot_type for event in events)


def test_revival_sets_one_scene_grace_and_prevents_immediate_resuppress(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="art_revive",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="revive target",
        weight=0.25,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
        status="suppressed",
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))
    opts = _options(enabled=True)

    packet1, _diag1 = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=opts,
        now_iso="2026-04-13T12:00:00Z",
    )
    assert packet1 is not None
    updated = load_ledger_entry(project_root, "sc_0001")
    assert updated is not None
    revived = updated.artifacts[0]
    assert revived.last_revived_scene_order == 2
    assert revived.revival_grace_until_scene_order == 3

    packet2, _diag2 = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0003",
        current_chapter_id="ch_0001",
        current_scene_order=3,
        options=opts,
        now_iso="2026-04-13T12:01:00Z",
    )
    assert packet2 is not None
    updated2 = load_ledger_entry(project_root, "sc_0001")
    assert updated2 is not None
    assert updated2.artifacts[0].status != "suppressed"


def test_no_canon_mutation_from_orchestrator_runtime_flow(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    accepted_scene = project_root / "accepted_scenes" / "sc_0001.md"
    accepted_scene.parent.mkdir(parents=True, exist_ok=True)
    accepted_scene.write_text("canon stays intact", encoding="utf-8")
    locked_facts = project_root / "locked_facts.json"
    locked_facts.write_text('["fact"]', encoding="utf-8")
    outline = project_root / "outline.json"
    outline.write_text('{"chapters":[],"scenes":[]}', encoding="utf-8")

    artifact = MemoryArtifact(
        artifact_id="art_canon_guard",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0000",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="guard",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_0000", artifact))
    before = (
        accepted_scene.read_text(encoding="utf-8"),
        locked_facts.read_text(encoding="utf-8"),
        outline.read_text(encoding="utf-8"),
    )
    _packet, _diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0001",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=replace(_options(enabled=True), decay_enabled=False),
        now_iso="2026-04-13T12:00:00Z",
    )
    after = (
        accepted_scene.read_text(encoding="utf-8"),
        locked_facts.read_text(encoding="utf-8"),
        outline.read_text(encoding="utf-8"),
    )
    assert before == after
