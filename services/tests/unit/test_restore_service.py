import zipfile
from pathlib import Path

from blackskies.services.restore_service import (
    evaluate_restore_as_copy_eligibility,
    restore_from_zip,
)


def test_restore_from_zip_creates_unique_subfolder(tmp_path: Path) -> None:
    project_root = tmp_path / "demo_project"
    project_root.mkdir()
    exports_dir = project_root / "exports"
    exports_dir.mkdir()

    zip_path = exports_dir / "demo_export.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr("project.json", '{"project_id": "demo_project"}')
        archive.writestr("outline.json", '{"schema_version": "OutlineSchema v1"}')

    result = restore_from_zip(project_root, "demo_export.zip")
    assert result["status"] == "ok"
    restored_path = Path(result["restored_path"])
    assert restored_path.exists()
    assert restored_path.parent == project_root.parent
    assert restored_path.name.startswith("demo_project_restored_")
    assert (restored_path / "project.json").exists()
    assert (restored_path / "outline.json").exists()
    assert result["operation"]["source_kind"] == "export-zip"
    assert result["operation"]["completion_status"] == "materialized"
    assert result["operation"]["validation_status"] == "not-run"
    assert result["operation"]["destination_path"] == restored_path.as_posix()
    assert result["eligibility_decision"]["source_family"] == "export-zip"
    assert result["eligibility_decision"]["selection_mode"] == "named"
    assert result["eligibility_decision"]["source_label"] == "named-zip"
    assert result["eligibility_decision"]["authority_state"] == "eligible"
    assert result["eligibility_decision"]["target_semantics"] == "unique-sibling-copy"


def test_restore_copy_eligibility_blocks_unsafe_copy_paths(tmp_path: Path) -> None:
    current_root = tmp_path / "demo_project"
    current_root.mkdir()
    destination = current_root

    decision = evaluate_restore_as_copy_eligibility(
        source_kind=None,
        source_family="export-zip",
        selection_mode="named",
        source_name="demo_export.zip",
        restore_as_new=False,
        current_project_root=str(current_root),
        destination_path=str(destination),
        source_exists=False,
        source_readable=False,
        source_project_id="other_project",
        expected_project_id="demo_project",
        manifest_present=False,
        manifest_valid=False,
        checksum_state="unavailable",
        checksum_required=True,
        destination_exists=True,
        destination_parent_exists=True,
        source_scope="project-exports",
        policy_blocked_reason="policy_blocked",
    )

    assert decision["eligible"] is False
    assert decision["blocked_reasons"] == [
        "ambiguous_source_kind",
        "overwrite_not_allowed",
        "missing_source",
        "unreadable_source",
        "missing_manifest",
        "checksum_unavailable",
        "scope_mismatch",
        "destination_exists",
        "policy_blocked",
    ]
    assert decision["checks"]["current_root_safe"] is False
    assert decision["source_family"] == "export-zip"
    assert decision["selection_mode"] == "named"
    assert decision["source_label"] == "named-zip"
    assert decision["authority_state"] == "blocked"
