from __future__ import annotations

from pathlib import Path
from typing import Tuple

import pytest

from blackskies.services import storage
from blackskies.services.tools import FileStoreTool, ToolInvocationContext

pytestmark = pytest.mark.unit


@pytest.fixture()
def temp_data_dir(tmp_path: Path) -> Path:
    return tmp_path


@pytest.fixture()
def tool_context(temp_data_dir: Path) -> Tuple[FileStoreTool, ToolInvocationContext]:
    tool = FileStoreTool(base_dir=temp_data_dir)
    context = tool.context(trace_id="test-trace", metadata={"invoker": "unit-test"})
    return tool, context


def test_save_and_load_round_trip(
    tool_context: Tuple[FileStoreTool, ToolInvocationContext], temp_data_dir: Path
) -> None:
    tool, context = tool_context
    payload = {
        "kind": "project",
        "id": "tool-test-project",
        "payload": {"name": "Test Project"},
    }

    result = tool.save(context, payload)
    assert result.ok
    assert isinstance(result.value, Path)
    assert result.value.exists()
    assert result.metadata["relative_path"].parent.name == "projects"
    assert temp_data_dir in result.value.parents

    loaded = tool.load(context, "project", "tool-test-project")
    assert loaded.ok
    assert loaded.value["payload"]["name"] == "Test Project"

    result.value.unlink(missing_ok=True)


def test_save_rejects_invalid_payload(
    tool_context: Tuple[FileStoreTool, ToolInvocationContext],
) -> None:
    tool, context = tool_context
    with pytest.raises(ValueError):
        tool.save(context, {"kind": "", "id": "invalid"})


def test_save_requires_mapping(tool_context: Tuple[FileStoreTool, ToolInvocationContext]) -> None:
    tool, context = tool_context
    with pytest.raises(TypeError):
        tool.save(context, ["not", "a", "mapping"])  # type: ignore[arg-type]


def test_save_propagates_storage_errors(
    tool_context: Tuple[FileStoreTool, ToolInvocationContext], monkeypatch: pytest.MonkeyPatch
) -> None:
    tool, context = tool_context

    def boom(
        _: dict[str, object], *, base_dir: Path | None = None
    ) -> Path:  # type: ignore[override]
        raise RuntimeError("explode")

    monkeypatch.setattr("blackskies.services.tools.file_store.storage.save", boom)

    with pytest.raises(RuntimeError):
        tool.save(context, {"kind": "project", "id": "boom"})


def test_load_propagates_missing_file(
    tool_context: Tuple[FileStoreTool, ToolInvocationContext], temp_data_dir: Path
) -> None:
    tool, context = tool_context
    identifier = "missing-object"
    target = storage.path_for("project", identifier, base_dir=temp_data_dir)
    target.unlink(missing_ok=True)

    with pytest.raises(FileNotFoundError):
        tool.load(context, "project", identifier)


def test_load_requires_identifier(
    tool_context: Tuple[FileStoreTool, ToolInvocationContext],
) -> None:
    tool, context = tool_context
    with pytest.raises(ValueError):
        tool.load(context, "project", "")


def test_load_propagates_storage_errors(
    tool_context: Tuple[FileStoreTool, ToolInvocationContext], monkeypatch: pytest.MonkeyPatch
) -> None:
    tool, context = tool_context

    def boom(
        _: str, __: str, *, base_dir: Path | None = None
    ) -> dict[str, object]:  # type: ignore[override]
        raise RuntimeError("explode")

    monkeypatch.setattr("blackskies.services.tools.file_store.storage.load", boom)

    with pytest.raises(RuntimeError):
        tool.load(context, "project", "boom")
