"""Pytest configuration for the services test suite."""

from __future__ import annotations

import sys
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from blackskies.services.app import create_app


def _ensure_src_on_path() -> None:
    """Add the services src directory to ``sys.path`` for imports."""

    src_dir = Path(__file__).resolve().parent.parent / "src"
    src_path = str(src_dir)
    if src_dir.is_dir() and src_path not in sys.path:
        sys.path.insert(0, src_path)


_ensure_src_on_path()


@pytest.fixture()
def service_app(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> FastAPI:
    """Provide the FastAPI application with a temporary project root."""

    monkeypatch.setenv("BLACKSKIES_PROJECT_BASE_DIR", str(tmp_path))
    app = create_app()
    yield app
    app.dependency_overrides.clear()


@pytest.fixture()
def test_client(service_app: FastAPI) -> Iterator[TestClient]:
    """Yield a test client bound to the shared FastAPI application."""

    with TestClient(service_app) as client:
        client.app = service_app  # type: ignore[attr-defined]
        yield client
