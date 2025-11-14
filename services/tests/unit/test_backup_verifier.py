"""Unit tests for the backup verification daemon."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import pytest


@pytest.fixture(autouse=True)
def _enable_voice_notes(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("BLACKSKIES_ENABLE_VOICE_NOTES", "1")

from blackskies.services.backup_verifier import BackupVerificationDaemon
from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger


def _create_snapshot(
    project_root: Path,
    snapshot_id: str,
    metadata: dict[str, str],
    includes: Iterable[str] | None = None,
) -> Path:
    snapshots_dir = project_root / "history" / "snapshots"
    snapshot_dir = snapshots_dir / f"{snapshot_id}_accept"
    snapshot_dir.mkdir(parents=True, exist_ok=True)

    includes = list(includes or ["outline.json", "drafts"])

    outline_path = snapshot_dir / "outline.json"
    outline_path.write_text(
        json.dumps({"scenes": [{"id": "sc_0001"}]}, indent=2),
        encoding="utf-8",
    )
    drafts_dir = snapshot_dir / "drafts"
    drafts_dir.mkdir(exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text(
        "---\n{}\n---\nScene body\n",
        encoding="utf-8",
    )

    snapshot_metadata = dict(metadata)
    snapshot_metadata.setdefault("includes", includes)
    metadata_path = snapshot_dir / "metadata.json"
    with metadata_path.open("w", encoding="utf-8") as handle:
        json.dump(snapshot_metadata, handle)

    manifest = {
        "schema_version": "SnapshotManifest v1",
        "snapshot_id": snapshot_id,
        "project_id": snapshot_metadata.get("project_id"),
        "label": snapshot_metadata.get("label", "accept"),
        "created_at": snapshot_metadata.get("created_at"),
        "includes": includes,
        "drafts": [{"path": "drafts/sc_0001.md"}],
    }

    manifest_path = snapshot_dir / "snapshot.yaml"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return snapshot_dir


def _create_voice_note(
    project_root: Path,
    note_id: str,
    with_audio: bool = True,
    with_transcript: bool = True,
    *,
    nested: bool = False,
) -> None:
    voice_notes_dir = project_root / "history" / "voice_notes"
    note_dir = voice_notes_dir / note_id
    note_dir.mkdir(parents=True, exist_ok=True)
    if with_transcript:
        transcript_path = note_dir / "transcript.json"
        if nested:
            transcript_path = note_dir / "transcripts" / "transcript.json"
            transcript_path.parent.mkdir(parents=True, exist_ok=True)
        transcript_path.write_text(
            json.dumps({"note_id": note_id, "transcript": "Sample note"}, indent=2),
            encoding="utf-8",
        )
    if with_audio:
        audio_path = note_dir / "audio.wav"
        if nested:
            audio_path = note_dir / "audio" / "clip.wav"
            audio_path.parent.mkdir(parents=True, exist_ok=True)
        audio_path.write_bytes(b"\x00" * 1024)


@pytest.mark.asyncio()
async def test_backup_verifier_success_updates_state(tmp_path: Path) -> None:
    """A successful verification updates state, diagnostics, and persisted payload."""

    project_id = "proj_success"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    snapshot_id = "20251028T000000Z"
    snapshot_dir = _create_snapshot(
        project_root,
        snapshot_id,
        {
            "snapshot_id": snapshot_id,
            "project_id": project_id,
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        },
    )
    _create_voice_note(project_root, "note-001")

    settings = ServiceSettings(
        project_base_dir=tmp_path,
        backup_verifier_enabled=True,
        backup_verifier_interval_seconds=60,
        backup_verifier_backoff_max_seconds=120,
    )
    daemon = BackupVerificationDaemon(settings=settings, diagnostics=DiagnosticLogger())

    report = await daemon.run_cycle()

    assert report.status == "ok"
    assert report.checked_snapshots == 1
    assert not report.failed_snapshots
    assert report.voice_notes_checked == 1
    assert report.voice_note_issues == 0

    state = daemon.state
    assert state.status == "ok"
    assert state.checked_snapshots == 1
    assert state.failed_snapshots == 0
    assert state.voice_notes_checked == 1
    assert state.voice_note_issues == 0

    state_path = daemon.state_path
    assert state_path.exists()
    assert "service_state" in str(state_path)
    persisted = json.loads(state_path.read_text(encoding="utf-8"))
    assert persisted["status"] == "ok"
    assert persisted["checked_snapshots"] == 1
    assert persisted["voice_notes_checked"] == 1
    assert persisted["projects"][0]["snapshots"][0]["checksum"]

    diagnostics_dir = project_root / "history" / "diagnostics"
    files = list(diagnostics_dir.glob("*.json"))
    assert files, "expected a diagnostic payload to be written"


@pytest.mark.asyncio()
async def test_backup_verifier_detects_missing_metadata(tmp_path: Path) -> None:
    """Missing metadata surfaces as an error with recorded issues."""

    project_id = "proj_failure"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    snapshots_dir = project_root / "history" / "snapshots"
    snapshot_dir = snapshots_dir / "20251028T010101Z_accept"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "snapshot.yaml").write_text("files: []\n", encoding="utf-8")
    _create_voice_note(project_root, "note-002", with_audio=False)

    settings = ServiceSettings(
        project_base_dir=tmp_path,
        backup_verifier_enabled=True,
        backup_verifier_interval_seconds=60,
        backup_verifier_backoff_max_seconds=120,
    )
    daemon = BackupVerificationDaemon(settings=settings, diagnostics=DiagnosticLogger())

    report = await daemon.run_cycle()

    assert report.status == "error"
    assert report.failed_snapshots == 1
    reasons = [issue.reason for issue in report.projects[0].issues]
    assert any("metadata.json missing" in reason for reason in reasons)
    assert any("audio file missing" in reason for reason in reasons)

    state = daemon.state
    assert state.status == "error"
    assert state.failed_snapshots == 1
    assert state.voice_note_issues >= 1

    diagnostics_dir = project_root / "history" / "diagnostics"
    files = list(diagnostics_dir.glob("*.json"))
    assert files, "expected a diagnostic payload to be written for the failure"


@pytest.mark.asyncio()
async def test_backup_verifier_detects_checksum_mismatch(tmp_path: Path) -> None:
    """Checksum mismatches between runs surface as errors."""

    project_id = "proj_checksum"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    snapshot_id = "20251028T020202Z"
    snapshot_dir = _create_snapshot(
        project_root,
        snapshot_id,
        {
            "snapshot_id": snapshot_id,
            "project_id": project_id,
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        },
    )

    settings = ServiceSettings(
        project_base_dir=tmp_path,
        backup_verifier_enabled=True,
        backup_verifier_interval_seconds=60,
        backup_verifier_backoff_max_seconds=120,
    )
    daemon = BackupVerificationDaemon(settings=settings, diagnostics=DiagnosticLogger())
    first_report = await daemon.run_cycle()
    assert first_report.status == "ok"

    draft_path = snapshot_dir / "drafts" / "sc_0001.md"
    draft_path.write_text("---\n{}\n---\nCorrupted body\n", encoding="utf-8")

    # Rehydrate a fresh daemon to ensure state reload works.
    daemon = BackupVerificationDaemon(settings=settings, diagnostics=DiagnosticLogger())
    report = await daemon.run_cycle()

    assert report.status == "error"
    snapshot_report = report.projects[0].snapshots[0]
    reasons = [issue.reason for issue in snapshot_report.issues]
    assert any("checksum mismatch" in reason for reason in reasons)
    assert snapshot_report.checksum != snapshot_report.previous_checksum

    state = daemon.state
    assert state.status == "error"
    assert state.failed_snapshots == 1


@pytest.mark.asyncio()
async def test_backup_verifier_normalises_snapshot_includes(tmp_path: Path) -> None:
    """Include paths are normalised before comparing metadata and manifest values."""

    project_id = "proj_includes_normalised"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    snapshot_id = "20251028T031515Z"
    snapshot_dir = _create_snapshot(
        project_root,
        snapshot_id,
        {
            "snapshot_id": snapshot_id,
            "project_id": project_id,
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        },
    )

    metadata_path = snapshot_dir / "metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    metadata["includes"] = [" ./outline.json ", "drafts\\", "drafts\\sc_0001.md  "]
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    manifest_path = snapshot_dir / "snapshot.yaml"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["includes"] = ["outline.json", "drafts", "drafts/sc_0001.md"]
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    settings = ServiceSettings(
        project_base_dir=tmp_path,
        backup_verifier_enabled=True,
        backup_verifier_interval_seconds=60,
        backup_verifier_backoff_max_seconds=120,
    )
    daemon = BackupVerificationDaemon(settings=settings, diagnostics=DiagnosticLogger())

    report = await daemon.run_cycle()

    assert report.status == "ok"
    snapshot_report = report.projects[0].snapshots[0]
    assert snapshot_report.missing_entries == []
    reasons = [issue.reason for issue in snapshot_report.issues]
    assert all("metadata includes" not in reason for reason in reasons)


@pytest.mark.asyncio()
async def test_backup_verifier_rejects_out_of_tree_include(tmp_path: Path) -> None:
    """Includes that attempt to escape the snapshot directory are reported."""

    project_id = "proj_includes_invalid"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    snapshot_id = "20251028T032020Z"
    snapshot_dir = _create_snapshot(
        project_root,
        snapshot_id,
        {
            "snapshot_id": snapshot_id,
            "project_id": project_id,
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        },
    )

    metadata_path = snapshot_dir / "metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    metadata["includes"] = ["../secrets.txt"]
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    manifest_path = snapshot_dir / "snapshot.yaml"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["includes"] = ["../secrets.txt"]
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    settings = ServiceSettings(
        project_base_dir=tmp_path,
        backup_verifier_enabled=True,
        backup_verifier_interval_seconds=60,
        backup_verifier_backoff_max_seconds=120,
    )
    daemon = BackupVerificationDaemon(settings=settings, diagnostics=DiagnosticLogger())

    report = await daemon.run_cycle()

    assert report.status == "error"
    snapshot_report = report.projects[0].snapshots[0]
    reasons = [issue.reason for issue in snapshot_report.issues]
    assert "metadata includes contain invalid paths" in reasons
@pytest.mark.asyncio()
async def test_backup_verifier_voice_note_gap(tmp_path: Path) -> None:
    """Voice note validation reports missing transcripts or audio files."""

    project_id = "proj_voice_note"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    snapshot_id = "20251028T030303Z"
    _create_snapshot(
        project_root,
        snapshot_id,
        {
            "snapshot_id": snapshot_id,
            "project_id": project_id,
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        },
    )
    _create_voice_note(project_root, "note-003", with_audio=True, with_transcript=False)

    settings = ServiceSettings(
        project_base_dir=tmp_path,
        backup_verifier_enabled=True,
        backup_verifier_interval_seconds=60,
        backup_verifier_backoff_max_seconds=120,
    )
    daemon = BackupVerificationDaemon(settings=settings, diagnostics=DiagnosticLogger())

    report = await daemon.run_cycle()

    assert report.status == "error"
    project_report = report.projects[0]
    assert project_report.voice_notes_checked == 1
    assert project_report.voice_note_issues == 1
    reasons = [issue.reason for issue in project_report.issues]
    assert any("transcript missing" in reason for reason in reasons)

    state = daemon.state
    assert state.status == "error"
    assert state.voice_note_issues == 1


@pytest.mark.asyncio()
async def test_backup_verifier_nested_voice_note_directories(tmp_path: Path) -> None:
    """Voice notes stored in nested directories are still validated as a single note."""

    project_id = "proj_voice_nested"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    snapshot_id = "20251028T040404Z"
    _create_snapshot(
        project_root,
        snapshot_id,
        {
            "snapshot_id": snapshot_id,
            "project_id": project_id,
            "created_at": datetime.now(tz=timezone.utc).isoformat(),
        },
    )
    _create_voice_note(project_root, "session-001/note-004", nested=True)

    settings = ServiceSettings(
        project_base_dir=tmp_path,
        backup_verifier_enabled=True,
        backup_verifier_interval_seconds=60,
        backup_verifier_backoff_max_seconds=120,
    )
    daemon = BackupVerificationDaemon(settings=settings, diagnostics=DiagnosticLogger())

    report = await daemon.run_cycle()

    assert report.status == "ok"
    project_report = report.projects[0]
    assert project_report.voice_notes_checked == 1
    assert project_report.voice_note_issues == 0
