from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from blackskies.services.middleware import BodySizeLimitMiddleware


def test_body_size_limit_middleware_rejects_large_payload() -> None:
    app = FastAPI()
    app.add_middleware(BodySizeLimitMiddleware, limit=128)

    @app.post("/echo")
    async def echo(payload: dict[str, str]) -> dict[str, str]:  # pragma: no cover - request should fail
        return payload

    client = TestClient(app)
    response = client.post("/echo", json={"text": "x" * 512})

    assert response.status_code == 413
    assert response.json()["code"] == "PAYLOAD_TOO_LARGE"


def test_body_size_limit_middleware_allows_small_payload() -> None:
    app = FastAPI()
    app.add_middleware(BodySizeLimitMiddleware, limit=1024)

    @app.post("/echo")
    async def echo(payload: dict[str, str]) -> dict[str, str]:
        return payload

    client = TestClient(app)
    response = client.post("/echo", json={"text": "ok"})

    assert response.status_code == 200
    assert response.json() == {"text": "ok"}
