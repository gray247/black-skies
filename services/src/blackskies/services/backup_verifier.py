"""Background daemon that verifies project backups and snapshots."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import random
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Iterable, Literal, Sequence, cast

try:  # pragma: no cover - optional dependency
    import yaml  # type: ignore[import-not-found]
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    yaml = cast("Any", None)

from .config import ServiceSettings
from .diagnostics import DiagnosticLogger
from .feature_flags import voice_notes_enabled
from .io import atomic_write_json, read_json
from .snapshots import SNAPSHOT_DIR_NAME, list_snapshots

LOGGER = logging.getLogger(__name__)

UTC = timezone.utc

BackupStatus = Literal["ok", "warning", "error"]


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _isoformat(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except ValueError:
        LOGGER.warning("Unable to parse datetime value: %s", value)
        return None


def _parse_manifest_text(text: str) -> dict[str, Any]:
    """Parse a snapshot manifest using YAML when available, falling back to JSON."""

    if yaml is not None:
        try:
            loaded = yaml.safe_load(text) or {}
            if isinstance(loaded, dict):
                return loaded
        except yaml.YAMLError as exc:  # type: ignore[attr-defined]
            raise ValueError(str(exc)) from exc
    try:
        loaded_json = json.loads(text)
        if isinstance(loaded_json, dict):
            return loaded_json
    except json.JSONDecodeError as exc:
        raise ValueError(str(exc)) from exc
    raise ValueError("manifest is not a mapping structure")


def _normalise_include_entries(values: Any) -> tuple[set[str], list[str]]:
    """Normalise include path entries for consistent comparison and validation."""

    if not values:
        return set(), []

    normalised: set[str] = set()
    invalid: list[str] = []
    for entry in values:
        raw: str | None
        if isinstance(entry, Path):
            raw = entry.as_posix()
        elif isinstance(entry, str):
            raw = entry.strip()
        else:
            raw = None

        if not raw:
            continue

        candidate = raw.replace("\\", "/")
        pure = PurePosixPath(candidate)
        if pure.is_absolute() or any(part == ".." for part in pure.parts):
            invalid.append(raw)
            continue

        resolved = pure.as_posix()
        if resolved and resolved != ".":
            normalised.add(resolved)

    return normalised, invalid

@dataclass(slots=True)
class BackupIssue:
    """Represents a single verification failure for a snapshot or voice note."""

    project_id: str
    snapshot_id: str | None
    reason: str
    details: dict[str, Any] | None = None

    def as_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "project_id": self.project_id,
            "reason": self.reason,
        }
        if self.snapshot_id is not None:
            payload["snapshot_id"] = self.snapshot_id
        if self.details:
            payload["details"] = self.details
        return payload


@dataclass(slots=True)
class SnapshotVerificationResult:
    """Verification outcome for a single snapshot directory."""

    project_id: str
    snapshot_id: str
    path: Path
    checksum: str | None
    previous_checksum: str | None
    checked_files: int
    missing_entries: list[str]
    sample_file: str | None
    issues: list[BackupIssue]
    retried: bool = False

    @property
    def status(self) -> BackupStatus:
        return "error" if self.issues else "ok"

    def as_dict(self) -> dict[str, Any]:
        return {
            "project_id": self.project_id,
            "snapshot_id": self.snapshot_id,
            "path": str(self.path),
            "checksum": self.checksum,
            "previous_checksum": self.previous_checksum,
            "checked_files": self.checked_files,
            "missing_entries": list(self.missing_entries),
            "sample_file": self.sample_file,
            "status": self.status,
            "retried": self.retried,
            "issues": [issue.as_dict() for issue in self.issues],
        }


@dataclass(slots=True)
class ProjectVerificationReport:
    """Summarises verification results for a single project."""

    project_id: str
    snapshots: list[SnapshotVerificationResult] = field(default_factory=list)
    issues: list[BackupIssue] = field(default_factory=list)
    voice_notes_checked: int = 0
    voice_note_issues: int = 0

    @property
    def checked_snapshots(self) -> int:
        return len(self.snapshots)

    @property
    def failed_snapshots(self) -> int:
        return sum(1 for snapshot in self.snapshots if snapshot.issues)

    @property
    def status(self) -> BackupStatus:
        if self.issues:
            return "error"
        if self.checked_snapshots == 0 and self.voice_notes_checked == 0:
            return "warning"
        return "ok"

    def as_dict(self) -> dict[str, Any]:
        return {
            "project_id": self.project_id,
            "checked_snapshots": self.checked_snapshots,
            "failed_snapshots": self.failed_snapshots,
            "status": self.status,
            "voice_notes_checked": self.voice_notes_checked,
            "voice_note_issues": self.voice_note_issues,
            "issues": [issue.as_dict() for issue in self.issues],
            "snapshots": [snapshot.as_dict() for snapshot in self.snapshots],
        }


@dataclass(slots=True)
class BackupVerificationReport:
    """Aggregated verification outcome across all projects."""

    started_at: datetime
    finished_at: datetime
    projects: list[ProjectVerificationReport]
    checked_snapshots: int
    failed_snapshots: int
    voice_notes_checked: int
    voice_note_issues: int
    status: BackupStatus
    message: str
    idle: bool

    def as_dict(self) -> dict[str, Any]:
        return {
            "started_at": _isoformat(self.started_at),
            "finished_at": _isoformat(self.finished_at),
            "checked_snapshots": self.checked_snapshots,
            "failed_snapshots": self.failed_snapshots,
            "voice_notes_checked": self.voice_notes_checked,
            "voice_note_issues": self.voice_note_issues,
            "status": self.status,
            "message": self.message,
            "idle": self.idle,
            "projects": [project.as_dict() for project in self.projects],
        }


@dataclass
class BackupVerifierState:
    """Mutable state exposed to health endpoints and persisted to disk."""

    enabled: bool
    status: BackupStatus = "warning"
    last_run: datetime | None = None
    last_success: datetime | None = None
    last_error: str | None = None
    message: str | None = None
    checked_snapshots: int = 0
    failed_snapshots: int = 0
    voice_notes_checked: int = 0
    voice_note_issues: int = 0
    projects: list[dict[str, Any]] = field(default_factory=list)

    def summary(self) -> dict[str, Any]:
        """Compact representation used by the health endpoint."""

        return {
            "enabled": self.enabled,
            "status": self.status,
            "message": self.message,
            "last_run": _isoformat(self.last_run),
            "last_success": _isoformat(self.last_success),
            "last_error": self.last_error,
            "checked_snapshots": self.checked_snapshots,
            "failed_snapshots": self.failed_snapshots,
            "voice_notes_checked": self.voice_notes_checked,
            "voice_note_issues": self.voice_note_issues,
        }

    def as_dict(self) -> dict[str, Any]:
        """Full payload persisted to disk."""

        payload = self.summary()
        payload["projects"] = self.projects
        return payload


class BackupVerificationDaemon:
    """Periodic verifier that audits snapshot archives and emits diagnostics."""

    def __init__(
        self,
        *,
        settings: ServiceSettings,
        diagnostics: DiagnosticLogger,
        state_dir: Path | None = None,
    ) -> None:
        self._settings = settings
        self._diagnostics = diagnostics
        self._state_dir = state_dir or (settings.project_base_dir / "service_state" / "backup_verifier")
        self._state_dir.mkdir(parents=True, exist_ok=True)
        self._state_path = self._state_dir / "backup_verifier_state.json"
        self._state = BackupVerifierState(
            enabled=True,
            status="warning",
            message="Backup verifier initialised; waiting for first run.",
        )
        self._state_lock = asyncio.Lock()
        self._task: asyncio.Task[None] | None = None
        self._stop_event = asyncio.Event()
        self._previous_checksums: dict[tuple[str, str], str] = {}

        base_interval = int(settings.backup_verifier_interval_seconds)
        self._base_interval = max(1, base_interval)
        max_interval = int(settings.backup_verifier_backoff_max_seconds)
        self._max_interval = max(self._base_interval, max_interval)
        self._current_interval = self._base_interval

        self._load_previous_state()

    @property
    def state(self) -> BackupVerifierState:
        return self._state

    @property
    def state_path(self) -> Path:
        return self._state_path

    async def start(self) -> None:
        """Launch the verification loop if not already running."""

        if self._task is not None:
            return
        self._stop_event.clear()
        self._task = asyncio.create_task(self._run_loop(), name="backup-verifier")

    async def stop(self) -> None:
        """Signal the verification loop to terminate."""

        if self._task is None:
            return
        self._stop_event.set()
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        finally:
            self._task = None

    async def run_cycle(self) -> BackupVerificationReport:
        """Execute a single verification cycle."""

        started_at = _now()
        reports: list[ProjectVerificationReport] = []
        for project_id, project_root in self._discover_projects():
            reports.append(self._verify_project(project_id, project_root))
        finished_at = _now()

        checked_total = sum(report.checked_snapshots for report in reports)
        failed_total = sum(report.failed_snapshots for report in reports)
        voice_notes_checked = sum(report.voice_notes_checked for report in reports)
        voice_note_issues = sum(report.voice_note_issues for report in reports)
        any_errors = any(report.status == "error" for report in reports)
        idle = checked_total == 0 and voice_notes_checked == 0

        if any_errors:
            components: list[str] = []
            if failed_total:
                components.append(f"{failed_total} snapshot issue(s)")
            if voice_note_issues:
                components.append(f"{voice_note_issues} voice note issue(s)")
            issue_summary = " and ".join(components) or "Verification issues"
            status: BackupStatus = "error"
            message = f"{issue_summary} detected across {len(reports)} project(s)."
        elif idle:
            status = "warning"
            message = "No snapshots or voice notes discovered for verification."
        else:
            status = "ok"
            message = (
                f"Verified {checked_total} snapshot(s) and {voice_notes_checked} voice note(s) with no issues."
            )

        report = BackupVerificationReport(
            started_at=started_at,
            finished_at=finished_at,
            projects=reports,
            checked_snapshots=checked_total,
            failed_snapshots=failed_total,
            voice_notes_checked=voice_notes_checked,
            voice_note_issues=voice_note_issues,
            status=status,
            message=message,
            idle=idle,
        )

        await self._record_report(report)
        self._emit_project_diagnostics(report.projects, report)
        self._adjust_interval(report)

        return report

    def _adjust_interval(self, report: BackupVerificationReport) -> None:
        """Adjust the sleep interval based on whether work was performed."""

        if report.idle:
            next_interval = min(self._current_interval * 2, self._max_interval)
            self._current_interval = max(self._base_interval, next_interval)
        else:
            self._current_interval = self._base_interval

    async def _run_loop(self) -> None:
        """Background loop that executes verification cycles."""

        try:
            while not self._stop_event.is_set():
                await self.run_cycle()
                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=self._current_interval)
                except asyncio.TimeoutError:
                    continue
        except asyncio.CancelledError:
            raise

    def _load_previous_state(self) -> None:
        """Hydrate the in-memory state and checksum cache from disk."""

        if not self._state_path.exists():
            return
        try:
            payload = read_json(self._state_path)
        except (OSError, json.JSONDecodeError) as exc:  # pragma: no branch - guard
            LOGGER.warning("Failed to load backup verifier state: %s", exc)
            return

        self._state.status = payload.get("status", self._state.status)
        self._state.message = payload.get("message", self._state.message)
        self._state.last_run = _parse_datetime(payload.get("last_run"))
        self._state.last_success = _parse_datetime(payload.get("last_success"))
        self._state.last_error = payload.get("last_error")
        self._state.checked_snapshots = int(payload.get("checked_snapshots", 0))
        self._state.failed_snapshots = int(payload.get("failed_snapshots", 0))
        self._state.voice_notes_checked = int(payload.get("voice_notes_checked", 0))
        self._state.voice_note_issues = int(payload.get("voice_note_issues", 0))
        self._state.projects = payload.get("projects", [])

        for project in self._state.projects:
            project_id = project.get("project_id")
            for snapshot in project.get("snapshots", []):
                snapshot_id = snapshot.get("snapshot_id")
                checksum = snapshot.get("checksum")
                if project_id and snapshot_id and checksum:
                    self._previous_checksums[(project_id, snapshot_id)] = checksum

    async def _record_report(self, report: BackupVerificationReport) -> None:
        """Persist state to disk and update in-memory summary."""

        async with self._state_lock:
            self._state.last_run = report.finished_at
            self._state.status = report.status
            self._state.message = report.message
            self._state.checked_snapshots = report.checked_snapshots
            self._state.failed_snapshots = report.failed_snapshots
            self._state.voice_notes_checked = report.voice_notes_checked
            self._state.voice_note_issues = report.voice_note_issues
            self._state.projects = [project.as_dict() for project in report.projects]
            if report.status == "ok":
                self._state.last_success = report.finished_at
                self._state.last_error = None
            elif report.failed_snapshots or report.voice_note_issues:
                self._state.last_error = report.message
            else:
                self._state.last_error = None

            payload = self._state.as_dict()
            self._state_dir.mkdir(parents=True, exist_ok=True)
            atomic_write_json(self._state_path, payload)

        # Update checksum cache outside of the lock to avoid holding it unnecessarily.
        for project in report.projects:
            for snapshot in project.snapshots:
                if snapshot.checksum:
                    self._previous_checksums[(project.project_id, snapshot.snapshot_id)] = snapshot.checksum

    def _emit_project_diagnostics(
        self,
        projects: Sequence[ProjectVerificationReport],
        report: BackupVerificationReport,
    ) -> None:
        """Emit structured diagnostics into each project's history folder."""

        completed_at = _isoformat(report.finished_at)
        for project in projects:
            project_root = self._settings.project_base_dir / project.project_id
            if not project_root.exists():
                continue

            if project.status == "error":
                code = "BACKUP_VERIFIER_ERROR"
                message = (
                    f"{project.failed_snapshots} snapshot issue(s) and "
                    f"{project.voice_note_issues} voice note issue(s) detected."
                )
            elif project.checked_snapshots or project.voice_notes_checked:
                code = "BACKUP_VERIFIER_OK"
                message = (
                    f"Verified {project.checked_snapshots} snapshot(s) and "
                    f"{project.voice_notes_checked} voice note(s) with no issues."
                )
            else:
                code = "BACKUP_VERIFIER_IDLE"
                message = "No snapshots or voice notes available to verify."

            details = {
                "project_id": project.project_id,
                "checked_snapshots": project.checked_snapshots,
                "failed_snapshots": project.failed_snapshots,
                "voice_notes_checked": project.voice_notes_checked,
                "voice_note_issues": project.voice_note_issues,
                "issues": [issue.as_dict() for issue in project.issues],
                "snapshots": [snapshot.as_dict() for snapshot in project.snapshots],
                "completed_at": completed_at,
            }
            self._diagnostics.log(project_root, code=code, message=message, details=details)

    def _discover_projects(self) -> Iterable[tuple[str, Path]]:
        """Yield candidate projects containing history archives."""

        base_dir = self._settings.project_base_dir
        if not base_dir.exists():
            return []
        return [
            (path.name, path)
            for path in sorted(base_dir.iterdir(), key=lambda candidate: candidate.name)
            if path.is_dir() and (path / "history").is_dir()
        ]

    def _verify_project(self, project_id: str, project_root: Path) -> ProjectVerificationReport:
        """Run verification checks for a single project root."""

        report = ProjectVerificationReport(project_id=project_id)
        snapshots_dir = project_root / "history" / "snapshots"
        if snapshots_dir.exists():
            for snapshot_dir in sorted(snapshots_dir.iterdir(), key=lambda candidate: candidate.name):
                if not snapshot_dir.is_dir():
                    continue
                snapshot_report = self._verify_snapshot(project_id, project_root, snapshot_dir)
                report.snapshots.append(snapshot_report)
                if snapshot_report.issues:
                    report.issues.extend(snapshot_report.issues)

        voice_notes_checked, voice_note_issues = self._verify_voice_notes(project_id, project_root)
        report.voice_notes_checked = voice_notes_checked
        report.voice_note_issues = len(voice_note_issues)
        report.issues.extend(voice_note_issues)

        return report

    def _verify_snapshot(
        self,
        project_id: str,
        project_root: Path,
        snapshot_dir: Path,
    ) -> SnapshotVerificationResult:
        """Verify a snapshot, retrying once if issues are detected."""

        first_pass = self._verify_snapshot_once(project_id, project_root, snapshot_dir)
        if not first_pass.issues:
            return first_pass

        retry_pass = self._verify_snapshot_once(
            project_id,
            project_root,
            snapshot_dir,
        )
        retry_pass.retried = True
        return retry_pass

    def _verify_snapshot_once(
        self,
        project_id: str,
        project_root: Path,
        snapshot_dir: Path,
    ) -> SnapshotVerificationResult:
        snapshot_id = snapshot_dir.name.split("_", 1)[0]
        issues: list[BackupIssue] = []
        missing_entries: set[str] = set()
        checksum: str | None = None
        sample_file: str | None = None
        checked_files = 0
        previous_checksum = self._previous_checksums.get((project_id, snapshot_id))

        metadata_path = snapshot_dir / "metadata.json"
        manifest_path = snapshot_dir / "snapshot.yaml"
        metadata: dict[str, Any] | None = None
        manifest: dict[str, Any] | None = None

        if not metadata_path.exists():
            issues.append(
                BackupIssue(
                    project_id=project_id,
                    snapshot_id=snapshot_id,
                    reason="metadata.json missing",
                )
            )
        else:
            try:
                with metadata_path.open("r", encoding="utf-8") as handle:
                    metadata = json.load(handle)
            except (OSError, json.JSONDecodeError) as exc:
                issues.append(
                    BackupIssue(
                        project_id=project_id,
                        snapshot_id=snapshot_id,
                        reason="metadata.json unreadable",
                        details={"error": str(exc)},
                    )
                )

        if metadata:
            expected_snapshot_id = metadata.get("snapshot_id")
            if expected_snapshot_id and expected_snapshot_id != snapshot_id:
                issues.append(
                    BackupIssue(
                        project_id=project_id,
                        snapshot_id=snapshot_id,
                        reason="snapshot_id mismatch between directory and metadata",
                        details={
                            "metadata_snapshot_id": expected_snapshot_id,
                        },
                    )
                )

        if not manifest_path.exists():
            issues.append(
                BackupIssue(
                    project_id=project_id,
                    snapshot_id=snapshot_id,
                    reason="snapshot.yaml missing",
                )
            )
        else:
            try:
                text = manifest_path.read_text(encoding="utf-8")
                manifest = _parse_manifest_text(text)
            except (OSError, ValueError) as exc:
                issues.append(
                    BackupIssue(
                        project_id=project_id,
                        snapshot_id=snapshot_id,
                        reason="snapshot.yaml unreadable",
                        details={"error": str(exc)},
                    )
                )

        metadata_includes: set[str] = set()
        metadata_invalid: list[str] = []
        if metadata:
            metadata_includes, metadata_invalid = _normalise_include_entries(metadata.get("includes"))

        manifest_includes: set[str] = set()
        manifest_invalid: list[str] = []
        if manifest:
            manifest_includes, manifest_invalid = _normalise_include_entries(manifest.get("includes"))

        if metadata_invalid:
            issues.append(
                BackupIssue(
                    project_id=project_id,
                    snapshot_id=snapshot_id,
                    reason="metadata includes contain invalid paths",
                    details={"entries": sorted(metadata_invalid)},
                )
            )

        if manifest_invalid:
            issues.append(
                BackupIssue(
                    project_id=project_id,
                    snapshot_id=snapshot_id,
                    reason="manifest includes contain invalid paths",
                    details={"entries": sorted(manifest_invalid)},
                )
            )

        if metadata and manifest:
            manifest_snapshot_id = manifest.get("snapshot_id")
            if manifest_snapshot_id and manifest_snapshot_id != snapshot_id:
                issues.append(
                    BackupIssue(
                        project_id=project_id,
                        snapshot_id=snapshot_id,
                        reason="snapshot_id mismatch between directory and manifest",
                        details={
                            "manifest_snapshot_id": manifest_snapshot_id,
                        },
                    )
                )

            if metadata_includes != manifest_includes:
                issues.append(
                    BackupIssue(
                        project_id=project_id,
                        snapshot_id=snapshot_id,
                        reason="metadata includes do not match manifest includes",
                        details={
                            "metadata_only": sorted(metadata_includes - manifest_includes),
                            "manifest_only": sorted(manifest_includes - metadata_includes),
                        },
                    )
                )

        snapshot_root = snapshot_dir.resolve()

        for include in metadata_includes:
            include_path = (snapshot_dir / include).resolve()
            if not include_path.is_relative_to(snapshot_root):
                issues.append(
                    BackupIssue(
                        project_id=project_id,
                        snapshot_id=snapshot_id,
                        reason="include path escapes snapshot directory",
                        details={"path": include},
                    )
                )
                continue
            if not include_path.exists():
                missing_entries.add(include)

        if manifest:
            drafts = manifest.get("drafts") or []
            for entry in drafts:
                if not isinstance(entry, dict):
                    continue
                draft_path = entry.get("path")
                if not draft_path:
                    continue
                path = (snapshot_dir / str(draft_path)).resolve()
                if not path.is_relative_to(snapshot_root) or not path.exists():
                    issues.append(
                        BackupIssue(
                            project_id=project_id,
                            snapshot_id=snapshot_id,
                            reason="draft path missing",
                            details={"path": str(draft_path)},
                        )
                    )

        for entry in sorted(missing_entries):
            issues.append(
                BackupIssue(
                    project_id=project_id,
                    snapshot_id=snapshot_id,
                    reason="include path missing",
                    details={"path": entry},
                )
            )

        files: list[Path] = []
        if snapshot_dir.exists():
            files = [
                path
                for path in sorted(snapshot_dir.rglob("*"))
                if path.is_file()
            ]
            checked_files = len(files)

        if files:
            aggregate = hashlib.sha256()
            for file_path in files:
                try:
                    digest = _hash_file(file_path)
                except OSError as exc:
                    issues.append(
                        BackupIssue(
                            project_id=project_id,
                            snapshot_id=snapshot_id,
                            reason="failed to read file for checksum",
                            details={"path": str(file_path.relative_to(snapshot_dir)), "error": str(exc)},
                        )
                    )
                    continue
                relative = str(file_path.relative_to(snapshot_dir)).replace("\\", "/")
                aggregate.update(relative.encode("utf-8"))
                aggregate.update(digest.encode("utf-8"))
            checksum = aggregate.hexdigest()

            rng = random.Random(f"{snapshot_id}:{checked_files}")
            sample = files[rng.randrange(len(files))]
            sample_file = str(sample.relative_to(snapshot_dir)).replace("\\", "/")
            try:
                with sample.open("rb") as handle:
                    handle.read(4096)
            except OSError as exc:
                issues.append(
                    BackupIssue(
                        project_id=project_id,
                        snapshot_id=snapshot_id,
                        reason="failed to read sample file",
                        details={"path": sample_file, "error": str(exc)},
                    )
                )

        if previous_checksum and checksum and checksum != previous_checksum:
            issues.append(
                BackupIssue(
                    project_id=project_id,
                    snapshot_id=snapshot_id,
                    reason="checksum mismatch compared to previous run",
                    details={
                        "previous_checksum": previous_checksum,
                        "current_checksum": checksum,
                    },
                )
            )

        return SnapshotVerificationResult(
            project_id=project_id,
            snapshot_id=snapshot_id,
            path=snapshot_dir,
            checksum=checksum,
            previous_checksum=previous_checksum,
            checked_files=checked_files,
            missing_entries=sorted(missing_entries),
            sample_file=sample_file,
            issues=issues,
        )

    def _verify_voice_notes(
        self,
        project_id: str,
        project_root: Path,
    ) -> tuple[int, list[BackupIssue]]:
        """Validate voice note audio and transcript pairs."""

        if not voice_notes_enabled():
            return 0, []

        voice_notes_dir = project_root / "history" / "voice_notes"
        if not voice_notes_dir.exists():
            return 0, []

        notes: dict[str, dict[str, list[Path]]] = {}
        audio_extensions = {".wav", ".mp3", ".ogg", ".m4a"}

        for path in voice_notes_dir.rglob("*"):
            if not path.is_file():
                continue

            try:
                relative = path.relative_to(voice_notes_dir)
            except ValueError:
                continue

            # Skip shared metadata files such as index.json
            if relative.parts == ("index.json",):
                continue

            note_id = relative.parts[0] if len(relative.parts) > 1 else path.stem
            entry = notes.setdefault(note_id, {"transcripts": [], "audio": []})

            suffix = path.suffix.lower()
            if suffix == ".json":
                entry["transcripts"].append(path)
            elif suffix in audio_extensions:
                entry["audio"].append(path)

        note_ids = sorted(notes)
        issues: list[BackupIssue] = []

        for note_id in note_ids:
            entry = notes[note_id]
            transcripts = entry["transcripts"]
            audios = entry["audio"]
            snapshot_key = f"voice_note:{note_id}"

            transcript_path = transcripts[0] if transcripts else None
            audio_path = audios[0] if audios else None

            if transcript_path is None:
                issues.append(
                    BackupIssue(
                        project_id=project_id,
                        snapshot_id=snapshot_key,
                        reason="transcript missing for voice note",
                    )
                )
            else:
                try:
                    with transcript_path.open("r", encoding="utf-8") as handle:
                        payload = json.load(handle)
                    if not isinstance(payload, dict):
                        raise ValueError("transcript payload is not an object")
                    transcript_text = payload.get("transcript")
                    if not transcript_text or not isinstance(transcript_text, str):
                        raise ValueError("transcript field missing or not a string")
                except (OSError, json.JSONDecodeError, ValueError) as exc:
                    issues.append(
                        BackupIssue(
                            project_id=project_id,
                            snapshot_id=snapshot_key,
                            reason="transcript invalid",
                            details={"error": str(exc)},
                        )
                    )

            if audio_path is None:
                issues.append(
                    BackupIssue(
                        project_id=project_id,
                        snapshot_id=snapshot_key,
                        reason="audio file missing for voice note",
                    )
                )
            else:
                try:
                    with audio_path.open("rb") as handle:
                        handle.read(4096)
                except OSError as exc:
                    issues.append(
                        BackupIssue(
                            project_id=project_id,
                            snapshot_id=snapshot_key,
                            reason="audio file unreadable",
                            details={"path": str(audio_path), "error": str(exc)},
                        )
                    )

        return len(note_ids), issues


def _hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run_verification(project_root: Path, *, latest_only: bool = False) -> dict[str, Any]:
    """Inspect backups/snapshots and report missing or corrupted files."""

    snapshots = list_snapshots(project_root)
    if latest_only and snapshots:
        snapshots = snapshots[:1]

    results: list[dict[str, Any]] = []
    for snapshot in snapshots:
        snapshot_id = snapshot.get("snapshot_id") or snapshot["path"].split("/")[-1]
        snapshot_dir = project_root / SNAPSHOT_DIR_NAME / snapshot_id
        manifest_path = snapshot_dir / "manifest.json"
        errors: list[str] = []

        if not manifest_path.exists():
            errors.append("manifest missing")
            results.append({"snapshot_id": snapshot_id, "status": "errors", "errors": errors})
            continue

        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            errors.append("manifest invalid")
            results.append({"snapshot_id": snapshot_id, "status": "errors", "errors": errors})
            continue

        for entry in manifest.get("files_included", []):
            relative = entry.get("path")
            if not relative:
                continue
            candidate = snapshot_dir / relative
            if not candidate.exists():
                errors.append(f"missing {relative}")
                continue
            checksum = entry.get("checksum")
            if checksum:
                actual = _hash_file(candidate)
                if actual != checksum:
                    errors.append(f"checksum mismatch {relative}")

        status = "ok" if not errors else "errors"
        results.append({"snapshot_id": snapshot_id, "status": status, "errors": errors})

    return {"project_id": project_root.name, "snapshots": results}


__all__ = [
    "BackupVerificationDaemon",
    "BackupVerificationReport",
    "BackupVerifierState",
    "BackupIssue",
    "ProjectVerificationReport",
    "SnapshotVerificationResult",
    "run_verification",
]
