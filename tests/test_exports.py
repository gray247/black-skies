from __future__ import annotations

from pathlib import Path

from blackskies.services.exports import checksum, export_markdown, export_text
from blackskies.services.models import Draft


def _draft() -> Draft:
    return Draft(
        unit_id="sc_0101",
        title="Signal in the Static",
        text="""A thin voice rides the static. Mara tunes the dial until the whisper sharpens.

"Proceed to waypoint seven.""",
        metadata={"chapter": "ch_0004", "pov": "Mara"},
    )


def test_export_markdown_writes_file(tmp_path: Path) -> None:
    draft = _draft()
    destination = export_markdown(draft, directory=tmp_path, filename="test.md")
    assert destination.exists()
    content = destination.read_text(encoding="utf-8")
    assert content.startswith("---")
    assert draft.text.strip() in content


def test_export_text_has_stable_checksum(tmp_path: Path) -> None:
    draft = _draft()
    first = export_text(draft, directory=tmp_path, filename="draft.txt")
    second = export_text(draft, directory=tmp_path, filename="draft.txt")
    # export_text overwrites the same file path; checksum should remain stable
    first_hash = checksum(first)
    second_hash = checksum(second)
    assert first_hash == second_hash


def test_export_markdown_default_directory(tmp_path: Path, monkeypatch: None) -> None:
    draft = _draft()
    path = export_markdown(draft, filename="auto.md")
    try:
        assert path.exists()
    finally:
        if path.exists():
            path.unlink()
