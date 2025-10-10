from __future__ import annotations

from pathlib import Path

import pytest

from blackskies.services import storage
from blackskies.services.tools import TemplateRendererTool

pytestmark = pytest.mark.unit


@pytest.fixture()
def temp_data_dir(tmp_path: Path) -> Path:
    return tmp_path


@pytest.fixture()
def tool(temp_data_dir: Path) -> TemplateRendererTool:
    return TemplateRendererTool(base_dir=temp_data_dir)


def _store_template(temp_data_dir: Path, template_id: str, body: str) -> None:
    path = storage.path_for("template", template_id, base_dir=temp_data_dir)
    path.unlink(missing_ok=True)
    storage.save({"kind": "template", "id": template_id, "body": body}, base_dir=temp_data_dir)


def test_render_success(tool: TemplateRendererTool, temp_data_dir: Path) -> None:
    template_id = "greeting"
    _store_template(temp_data_dir, template_id, "Hello $name!")

    context = tool.context(trace_id="trace-1")

    result = tool.render(context, template_id, {"name": "Skywalker"})
    assert result.ok
    assert result.value == "Hello Skywalker!"
    assert result.metadata["length"] == len(result.value)
    storage.path_for("template", template_id, base_dir=temp_data_dir).unlink(missing_ok=True)


def test_render_rejects_missing_template_id(tool: TemplateRendererTool) -> None:
    context = tool.context()
    with pytest.raises(ValueError):
        tool.render(context, "", {})


def test_render_missing_template_file(tool: TemplateRendererTool) -> None:
    template_id = "does-not-exist"
    context = tool.context()
    with pytest.raises(FileNotFoundError):
        tool.render(context, template_id, {})


def test_render_missing_variable_raises_value_error(
    tool: TemplateRendererTool, temp_data_dir: Path
) -> None:
    template_id = "farewell"
    _store_template(temp_data_dir, template_id, "Goodbye $name")

    context = tool.context()
    with pytest.raises(ValueError):
        tool.render(context, template_id, {})
    storage.path_for("template", template_id, base_dir=temp_data_dir).unlink(missing_ok=True)


def test_render_requires_mapping_variables(tool: TemplateRendererTool) -> None:
    context = tool.context()
    with pytest.raises(TypeError):
        tool.render(context, "any-template", ["not", "mapping"])  # type: ignore[arg-type]


def test_render_invalid_template_body(
    tool: TemplateRendererTool, temp_data_dir: Path
) -> None:
    template_id = "broken"
    storage.save({"kind": "template", "id": template_id, "body": None}, base_dir=temp_data_dir)

    context = tool.context()
    with pytest.raises(ValueError):
        tool.render(context, template_id, {})
    storage.path_for("template", template_id, base_dir=temp_data_dir).unlink(missing_ok=True)


def test_render_generic_template_error(
    tool: TemplateRendererTool, temp_data_dir: Path
) -> None:
    template_id = "invalid-placeholder"
    _store_template(temp_data_dir, template_id, "Hello $")

    context = tool.context()
    with pytest.raises(ValueError):
        tool.render(context, template_id, {"name": "Sky"})
    storage.path_for("template", template_id, base_dir=temp_data_dir).unlink(missing_ok=True)
