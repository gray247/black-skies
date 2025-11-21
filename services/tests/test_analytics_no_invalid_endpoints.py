from __future__ import annotations

from fastapi.testclient import TestClient

from blackskies.services.app import create_app


def test_analytics_routes_do_not_accept_budget_requests() -> None:
  app = create_app()
  hits: list[str] = []

  @app.middleware("http")
  async def record_requests(request, call_next):  # type: ignore[override]
    hits.append(request.url.path)
    response = await call_next(request)
    return response

  client = TestClient(app)
  client.get("/api/v1/analytics/summary", params={"projectId": "proj"})
  client.get("/api/v1/analytics/scenes", params={"projectId": "proj"})
  client.get("/api/v1/analytics/relationships", params={"projectId": "proj"})

  unexpected = [path for path in hits if "budget" in path]
  assert not unexpected, f"Unexpected analytics endpoints called: {unexpected}"

  assert hits == [
    "/api/v1/analytics/summary",
    "/api/v1/analytics/scenes",
    "/api/v1/analytics/relationships",
  ]
