from __future__ import annotations

from pathlib import Path

import yaml

from blackskies.services.critique import CritiqueService
from blackskies.services.models.critique import DraftCritiqueRequest


def _write_draft(project_root: Path, heuristics_payload: dict[str, object]) -> tuple[dict[str, object], str]:
    drafts_dir = project_root / "drafts"
    heuristics_dir = project_root / ".blackskies"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    heuristics_dir.mkdir(parents=True, exist_ok=True)

    (heuristics_dir / "heuristics.yaml").write_text(
        yaml.safe_dump(heuristics_payload), encoding="utf-8"
    )

    front_matter = {
        "id": "sc_0001",
        "title": "Storm Arrival",
        "chapter_id": "ch_0001",
        "order": 1,
        "pov": heuristics_payload["povs"][0],
        "goal": heuristics_payload["goals"][0],
        "conflict": heuristics_payload["conflicts"][0]["description"],
        "conflict_type": heuristics_payload["conflicts"][0]["type"],
        "pacing_target": heuristics_payload.get("pacing_target", "steady"),
        "word_target": heuristics_payload["word_target"]["base"],
        "beats": ["inciting"],
    }

    body = (
        f"{front_matter['pov']} enters Storm Arrival to {front_matter['goal']}. "
        "The air is expectant; the scene stays grounded."
    )
    front_lines = [
        f"id: {front_matter['id']}",
        f"title: {front_matter['title']}",
        f"chapter_id: {front_matter['chapter_id']}",
        f"order: {front_matter['order']}",
        f"pov: {front_matter['pov']}",
        f"goal: {front_matter['goal']}",
        f"conflict: {front_matter['conflict']}",
        f"conflict_type: {front_matter['conflict_type']}",
        f"pacing_target: {front_matter['pacing_target']}",
        f"word_target: {front_matter['word_target']}",
        f"beats: [{', '.join(front_matter['beats'])}]",
    ]
    content = f"---\n{''.join(line + '\\n' for line in front_lines)}---\n{body}\n"
    (drafts_dir / "sc_0001.md").write_text(content, encoding="utf-8")
    return front_matter, body


def _run_critique(project_root: Path) -> dict[str, object]:
    service = CritiqueService()
    request = DraftCritiqueRequest(
        draft_id="dr_test",
        unit_id="sc_0001",
        rubric=["Logic"],
    )
    return service.run(request, project_root=project_root, project_id=project_root.name)


def test_heuristics_config_affects_scores(tmp_path):
    project_root = tmp_path / "proj"
    project_root.mkdir(parents=True)

    initial_heuristics = {
        "povs": ["Mara Ibarra"],
        "goals": ["stabilize the perimeter sensors"],
        "conflicts": [{"description": "humidity chews through every circuit", "type": "environmental"}],
        "word_target": {"base": 900, "per_order": 0},
    }
    updated_heuristics = {
        "povs": ["Mara Ibarra"],
        "goals": ["secure the perimeter and the ancestral archive after sunrise"],
        "conflicts": [{"description": "the radio shakes with unknown voices", "type": "cosmic"}],
        "word_target": {"base": 400, "per_order": 0},
    }

    _write_draft(project_root, initial_heuristics)
    payload1 = _run_critique(project_root)

    _write_draft(project_root, updated_heuristics)
    payload2 = _run_critique(project_root)

    assert "heuristics" in payload1
    assert "heuristics" in payload2

    goal_clarity1 = payload1["heuristics"].get("goal_clarity")
    goal_clarity2 = payload2["heuristics"].get("goal_clarity")
    pacing1 = payload1["heuristics"].get("pacing_fit")
    pacing2 = payload2["heuristics"].get("pacing_fit")

    assert set(payload1["heuristics"]) == {"pov_consistency", "goal_clarity", "conflict_clarity", "pacing_fit"}
    assert set(payload2["heuristics"]) == {"pov_consistency", "goal_clarity", "conflict_clarity", "pacing_fit"}
