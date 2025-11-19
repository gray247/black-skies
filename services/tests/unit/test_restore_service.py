import zipfile
from pathlib import Path

from blackskies.services.restore_service import restore_from_zip


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
