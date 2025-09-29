"""FastAPI entrypoint for the Black Skies service surface."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, FastAPI, status

from . import __version__
from . import schemas
from . import storage

app = FastAPI(title="Black Skies API", version=__version__)


@app.get("/healthz", status_code=status.HTTP_200_OK)
def healthz() -> dict[str, str]:
    """Basic liveness probe."""

    return {"status": "ok", "version": __version__}


outline_router = APIRouter(prefix="/outline", tags=["outline"])

draft_router = APIRouter(prefix="/draft", tags=["draft"])

rewrite_router = APIRouter(prefix="/rewrite", tags=["rewrite"])

critique_router = APIRouter(prefix="/critique", tags=["critique"])


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


@outline_router.post("", response_model=schemas.OutlineResponse, status_code=status.HTTP_201_CREATED)
def create_outline(payload: schemas.OutlineRequest) -> schemas.OutlineResponse:
    outline_id = f"ol_{uuid4().hex[:8]}"
    response = schemas.OutlineResponse(
        outline_id=outline_id,
        project_id=payload.project_id,
        status="queued",
        created_at=_utc_now(),
        metadata=payload.metadata,
    )
    storage.save({
        "kind": "outline",
        "id": outline_id,
        "project_id": payload.project_id,
        "payload": payload.model_dump(),
        "response": response.model_dump(),
    })
    return response


@draft_router.post("", response_model=schemas.DraftResponse, status_code=status.HTTP_201_CREATED)
def generate_draft(payload: schemas.DraftRequest) -> schemas.DraftResponse:
    draft_id = f"dr_{uuid4().hex[:8]}"
    units = [
        schemas.DraftUnit(unit_id=unit_id, title=f"Scene {index + 1}", text=f"Draft for {unit_id}.")
        for index, unit_id in enumerate(payload.unit_ids or ["sc_0001"])
    ]
    response = schemas.DraftResponse(
        draft_id=draft_id,
        project_id=payload.project_id,
        generated_at=_utc_now(),
        units=units,
    )
    storage.save({
        "kind": "draft",
        "id": draft_id,
        "project_id": payload.project_id,
        "payload": payload.model_dump(),
        "response": response.model_dump(),
    })
    return response


@rewrite_router.post("", response_model=schemas.RewriteResponse, status_code=status.HTTP_200_OK)
def accept_rewrite(payload: schemas.RewriteRequest) -> schemas.RewriteResponse:
    response = schemas.RewriteResponse(
        project_id=payload.project_id,
        unit_id=payload.unit_id,
        accepted_text=payload.proposed_text,
        previous_text=None,
        accepted_at=_utc_now(),
    )
    storage.save({
        "kind": "rewrite",
        "id": f"rw_{uuid4().hex[:8]}",
        "project_id": payload.project_id,
        "payload": payload.model_dump(),
        "response": response.model_dump(),
    })
    return response


@critique_router.post("", response_model=schemas.CritiqueResponse, status_code=status.HTTP_200_OK)
def create_critique(payload: schemas.CritiqueRequest) -> schemas.CritiqueResponse:
    response = schemas.CritiqueResponse(
        project_id=payload.project_id,
        unit_id=payload.unit_id,
        summary="Stub critique generated.",
        severity="medium",
        recommendations=["Tighten pacing", "Clarify character motivation"],
        generated_at=_utc_now(),
    )
    storage.save({
        "kind": "critique",
        "id": f"cq_{uuid4().hex[:8]}",
        "project_id": payload.project_id,
        "payload": payload.model_dump(),
        "response": response.model_dump(),
    })
    return response


app.include_router(outline_router)
app.include_router(draft_router)
app.include_router(rewrite_router)
app.include_router(critique_router)


__all__ = ["app"]
