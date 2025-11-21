"""Custom ASGI middleware components used by the Black Skies service."""

from __future__ import annotations

import json
from fastapi import status
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .http import TRACE_ID_HEADER, build_error_payload, ensure_trace_id

# Prefer the newer constant when available to avoid deprecation warnings while
# remaining compatible with older Starlette versions (such as the one bundled
# with FastAPI 0.110).
HTTP_STATUS_PAYLOAD_TOO_LARGE = getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413)


class BodySizeLimitMiddleware:
    """Reject requests whose bodies exceed a configured byte threshold."""

    def __init__(self, app: ASGIApp, *, limit: int) -> None:
        if limit <= 0:
            raise ValueError("limit must be greater than zero.")
        self.app = app
        self._limit = limit

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = {key.decode("latin-1"): value.decode("latin-1") for key, value in scope["headers"]}
        content_length_header = headers.get("content-length")
        if content_length_header:
            content_length = self._parse_content_length(content_length_header)
            if content_length is not None and content_length > self._limit:
                await self._reject(send)
                return

        consumed = 0

        async def limited_receive() -> Message:
            nonlocal consumed
            message = await receive()
            if message["type"] == "http.request":
                body = message.get("body", b"")
                consumed += len(body)
                if consumed > self._limit:
                    await self._reject(send)
                    return {"type": "http.disconnect"}
            return message

        await self.app(scope, limited_receive, send)

    async def _reject(self, send: Send) -> None:
        trace_id = ensure_trace_id()
        payload = build_error_payload(
            code="PAYLOAD_TOO_LARGE",
            message="Request payload exceeds allowed size.",
            details={"limit_bytes": self._limit},
            trace_id=trace_id,
        )
        await _send_json_response(
            send,
            status_code=HTTP_STATUS_PAYLOAD_TOO_LARGE,
            content=payload.model_dump(),
            trace_id=trace_id,
        )

    @staticmethod
    def _parse_content_length(value: str) -> int | None:
        try:
            return int(value)
        except ValueError:
            return None


async def _send_json_response(
    send: Send,
    *,
    status_code: int,
    content: dict[str, object],
    trace_id: str,
) -> None:
    """Utility to send a minimal JSON response without creating a FastAPI response."""

    body = json.dumps(content, ensure_ascii=False).encode("utf-8")
    headers = [
        (b"content-type", b"application/json"),
        (b"content-length", str(len(body)).encode("latin-1")),
        (TRACE_ID_HEADER.encode("latin-1"), trace_id.encode("latin-1")),
    ]
    await send(
        {
            "type": "http.response.start",
            "status": status_code,
            "headers": headers,
        }
    )
    await send({"type": "http.response.body", "body": body, "more_body": False})
