"""Tests for the template renderer tool adapter."""

from __future__ import annotations

import pytest

from black_skies import storage
from black_skies.tools import TemplateRendererTool

pytestmark = pytest.mark.unit


def _store_template(template_id: str, body: str) -> None:
    path = storage.path_for("template", template_id)
    path.unlink(missing_ok=True)
    storage.save({"kind": "template", "id": template_id, "body": body})


def test_render_success() -> None:
    template_id = "greeting"
    _store_template(template_id, "Hello $name!")

    tool = TemplateRendererTool()
    context = tool.context(trace_id="trace-1")

    result = tool.render(context, template_id, {"name": "Skywalker"})
    assert result.ok
    assert result.value == "Hello Skywalker!"
    assert result.metadata["length"] == len(result.value)
    storage.path_for("template", template_id).unlink(missing_ok=True)


def test_render_rejects_missing_template_id() -> None:
    tool = TemplateRendererTool()
    context = tool.context()
    with pytest.raises(ValueError):
        tool.render(context, "", {})


def test_render_missing_template_file() -> None:
    template_id = "does-not-exist"
    tool = TemplateRendererTool()
    context = tool.context()
    with pytest.raises(FileNotFoundError):
        tool.render(context, template_id, {})


def test_render_missing_variable_raises_value_error() -> None:
    template_id = "farewell"
    _store_template(template_id, "Goodbye $name")

    tool = TemplateRendererTool()
    context = tool.context()
    with pytest.raises(ValueError):
        tool.render(context, template_id, {})
    storage.path_for("template", template_id).unlink(missing_ok=True)


def test_render_requires_mapping_variables() -> None:
    tool = TemplateRendererTool()
    context = tool.context()
    with pytest.raises(TypeError):
        tool.render(context, "any-template", ["not", "mapping"])  # type: ignore[arg-type]


def test_render_invalid_template_body() -> None:
    template_id = "broken"
    storage.save({"kind": "template", "id": template_id, "body": None})

    tool = TemplateRendererTool()
    context = tool.context()
    with pytest.raises(ValueError):
        tool.render(context, template_id, {})
    storage.path_for("template", template_id).unlink(missing_ok=True)


def test_render_generic_template_error() -> None:
    template_id = "invalid-placeholder"
    _store_template(template_id, "Hello $")

    tool = TemplateRendererTool()
    context = tool.context()
    with pytest.raises(ValueError):
        tool.render(context, template_id, {"name": "Sky"})
    storage.path_for("template", template_id).unlink(missing_ok=True)
