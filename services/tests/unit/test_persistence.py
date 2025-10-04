"""Unit tests for persistence helpers."""

from __future__ import annotations

from blackskies.services.persistence import DraftPersistence


def test_safe_dump_falls_back_to_json(monkeypatch) -> None:
    from blackskies.services.utils import yaml as yaml_utils

    monkeypatch.setattr(yaml_utils, "_yaml", None)

    payload = {"message": "héllo", "count": 2}
    rendered = yaml_utils.safe_dump(payload, sort_keys=True, allow_unicode=True, indent=2)

    assert rendered.startswith("{\n")
    assert '"count": 2' in rendered.splitlines()[1]
    assert rendered.endswith("\n")


def test_render_preserves_unknown_meta() -> None:
    front_matter = {
        "id": "scene-1",
        "title": "A Stormy Night",
        "scene_mood": "brooding",
        "zeta": 2,
        "alpha": True,
    }
    body = "The rain fell without end."

    rendered = DraftPersistence._render(front_matter, body)
    lines = rendered.splitlines()

    assert lines[0] == "---"
    assert "id: scene-1" == lines[1]
    assert "title: A Stormy Night" == lines[2]
    assert "alpha: true" == lines[3]
    assert "scene_mood: brooding" == lines[4]
    assert "zeta: 2" == lines[5]
    assert lines[6] == "---"
    assert "The rain fell without end." == lines[7]
    assert rendered.endswith("\n")
