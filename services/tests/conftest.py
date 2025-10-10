"""Pytest configuration for the services test suite."""

from __future__ import annotations

import sys
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import pytest

try:
    import httpx
except ModuleNotFoundError:  # pragma: no cover - optional dependency for async tests
    httpx = None
try:
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
except ModuleNotFoundError:  # pragma: no cover - optional dependency for API tests
    FastAPI = None  # type: ignore[assignment]
    TestClient = None  # type: ignore[assignment]


def _ensure_src_on_path() -> None:
    """Add the services src directory to ``sys.path`` for imports."""

    src_dir = Path(__file__).resolve().parent.parent / "src"
    src_path = str(src_dir)
    if src_dir.is_dir() and src_path not in sys.path:
        sys.path.insert(0, src_path)


_ensure_src_on_path()


@pytest.fixture()
def service_app(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> "FastAPI":
    """Provide the FastAPI application with a temporary project root."""

    if FastAPI is None:
        pytest.skip("FastAPI is not installed")
    from blackskies.services.app import create_app

    monkeypatch.setenv("BLACKSKIES_PROJECT_BASE_DIR", str(tmp_path))
    app = create_app()
    yield app
    app.dependency_overrides.clear()


@pytest.fixture()
def test_client(service_app: "FastAPI") -> Iterator["TestClient"]:
    """Yield a test client bound to the shared FastAPI application."""

    if TestClient is None:
        pytest.skip("FastAPI test client is not installed")
    with TestClient(service_app) as client:
        client.app = service_app  # type: ignore[attr-defined]
        yield client


@pytest.fixture()
async def async_client(service_app: FastAPI) -> AsyncIterator["httpx.AsyncClient"]:
    """Provide an HTTPX async client bound to the FastAPI application."""

    if httpx is None:
        pytest.skip("httpx is not installed")
    transport = httpx.ASGITransport(app=service_app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
