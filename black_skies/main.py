"""FastAPI entrypoint for the Black Skies service surface."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import ValidationError

from . import __version__
from . import metrics
from . import schemas
from . import storage
from .logging_config import configure_logging

configure_logging()
logger = logging.getLogger("black_skies.api")
error_logger = logging.getLogger("black_skies.errors")

app = FastAPI(title="Black Skies API", version=__version__)


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _ensure_trace_id(request: Request) -> str:
    trace_id = getattr(request.state, "trace_id", None)
    if not trace_id:
        trace_id = uuid4().hex
        request.state.trace_id = trace_id
    return trace_id


def _error_response(request: Request, *, code: str, detail: object, status_code: int, message: str | None = None) -> JSONResponse:
    trace_id = _ensure_trace_id(request)
    payload = {"code": code, "detail": detail, "trace_id": trace_id}
    if message is not None:
        payload["message"] = message
    headers = {"x-trace-id": trace_id}
    return JSONResponse(status_code=status_code, content=payload, headers=headers)


@app.middleware("http")
async def add_trace_and_logging(request: Request, call_next):
    trace_id = request.headers.get("x-trace-id") or uuid4().hex
    request.state.trace_id = trace_id
    metrics.increment("http_requests_total")
    extra = {"trace_id": trace_id, "method": request.method, "path": request.url.path}
    logger.info("request.start", extra={"extra_payload": extra})
    try:
        response = await call_next(request)
    except Exception:
        error_logger.exception("request.error", extra={"extra_payload": extra})
        raise
    response.headers["x-trace-id"] = trace_id
    logger.info(
        "request.complete",
        extra={"extra_payload": {**extra, "status_code": response.status_code}},
    )
    return response


@app.exception_handler(RequestValidationError)
async def handle_request_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
    error_logger.info(
        "validation_error",
        extra={"extra_payload": {"trace_id": _ensure_trace_id(request), "errors": exc.errors()}},
    )
    return _error_response(
        request,
        code="VALIDATION",
        detail=exc.errors(),
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


@app.exception_handler(ValidationError)
async def handle_validation(request: Request, exc: ValidationError) -> JSONResponse:
    error_logger.info(
        "validation_error",
        extra={"extra_payload": {"trace_id": _ensure_trace_id(request), "errors": exc.errors()}},
    )
    return _error_response(
        request,
        code="VALIDATION",
        detail=exc.errors(),
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


@app.exception_handler(HTTPException)
async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
    return _error_response(
        request,
        code="HTTP_ERROR",
        detail=exc.detail,
        status_code=exc.status_code,
    )


@app.exception_handler(Exception)
async def handle_generic_exception(request: Request, exc: Exception) -> JSONResponse:
    error_logger.exception(
        "unhandled_exception",
        extra={"extra_payload": {"trace_id": _ensure_trace_id(request)}},
    )
    return _error_response(
        request,
        code="INTERNAL",
        detail="Unexpected error occurred.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


@app.get("/healthz", status_code=status.HTTP_200_OK)
def healthz() -> dict[str, str]:
    """Basic liveness probe."""

    return {"status": "ok", "version": __version__}


@app.get("/metrics", response_class=PlainTextResponse)
def metrics_endpoint() -> PlainTextResponse:
    """Expose counters in text format."""

    return PlainTextResponse(metrics.render(), media_type="text/plain")


outline_router = APIRouter(prefix="/outline", tags=["outline"])

draft_router = APIRouter(prefix="/draft", tags=["draft"])

rewrite_router = APIRouter(prefix="/rewrite", tags=["rewrite"])

critique_router = APIRouter(prefix="/critique", tags=["critique"])


@outline_router.post("", response_model=schemas.OutlineResponse, status_code=status.HTTP_201_CREATED)
def create_outline(payload: schemas.OutlineRequest) -> schemas.OutlineResponse:
    metrics.increment("outline_requests_total")
    outline_id = f"ol_{uuid4().hex[:8]}"
    response = schemas.OutlineResponse(
        outline_id=outline_id,
        project_id=payload.project_id,
        status="queued",
        created_at=_utc_now(),
        metadata=payload.metadata,
    )
    storage.save(
        {
            "kind": "outline",
            "id": outline_id,
            "project_id": payload.project_id,
            "payload": payload.model_dump(),
            "response": response.model_dump(),
        }
    )
    return response


@draft_router.post("", response_model=schemas.DraftResponse, status_code=status.HTTP_201_CREATED)
def generate_draft(payload: schemas.DraftRequest) -> schemas.DraftResponse:
    metrics.increment("draft_requests_total")
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
    storage.save(
        {
            "kind": "draft",
            "id": draft_id,
            "project_id": payload.project_id,
            "payload": payload.model_dump(),
            "response": response.model_dump(),
        }
    )
    return response


@rewrite_router.post("", response_model=schemas.RewriteResponse, status_code=status.HTTP_200_OK)
def accept_rewrite(payload: schemas.RewriteRequest) -> schemas.RewriteResponse:
    metrics.increment("rewrite_requests_total")
    response = schemas.RewriteResponse(
        project_id=payload.project_id,
        unit_id=payload.unit_id,
        accepted_text=payload.proposed_text,
        previous_text=None,
        accepted_at=_utc_now(),
    )
    storage.save(
        {
            "kind": "rewrite",
            "id": f"rw_{uuid4().hex[:8]}",
            "project_id": payload.project_id,
            "payload": payload.model_dump(),
            "response": response.model_dump(),
        }
    )
    return response


@critique_router.post("", response_model=schemas.CritiqueResponse, status_code=status.HTTP_200_OK)
def create_critique(payload: schemas.CritiqueRequest) -> schemas.CritiqueResponse:
    metrics.increment("critique_requests_total")
    response = schemas.CritiqueResponse(
        project_id=payload.project_id,
        unit_id=payload.unit_id,
        summary="Stub critique generated.",
        severity="medium",
        recommendations=["Tighten pacing", "Clarify character motivation"],
        generated_at=_utc_now(),
    )
    storage.save(
        {
            "kind": "critique",
            "id": f"cq_{uuid4().hex[:8]}",
            "project_id": payload.project_id,
            "payload": payload.model_dump(),
            "response": response.model_dump(),
        }
    )
    return response


app.include_router(outline_router)
app.include_router(draft_router)
app.include_router(rewrite_router)
app.include_router(critique_router)


__all__ = ["app"]

