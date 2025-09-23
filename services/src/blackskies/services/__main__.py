"""Entry point for running the Black Skies service stack."""

from __future__ import annotations

from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Black Skies Services", version="0.1.0")


@app.get("/health", tags=["health"])
async def healthcheck() -> dict[str, str]:
    """Simple readiness probe for local development."""
    return {"status": "ok"}


def main() -> None:
    """Run the FastAPI service using Uvicorn."""
    uvicorn.run(
        "blackskies.services.__main__:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        factory=False,
    )


if __name__ == "__main__":
    main()
