"""Unit tests for shared HTTP error helpers."""

from __future__ import annotations

import json

from fastapi.exceptions import RequestValidationError

from blackskies.services.http import (
    TRACE_ID_HEADER,
    internal_error_response,
    request_validation_response,
)


def _response_json(response) -> dict[str, object]:
    return json.loads(response.body.decode("utf-8"))


def test_request_validation_response_envelopes_errors() -> None:
    trace_id = "trace-123"
    exc = RequestValidationError(
        [
            {
                "loc": ("body", "field"),
                "msg": "field required",
                "type": "value_error.missing",
            }
        ]
    )

    response = request_validation_response(exc, trace_id)
    payload = _response_json(response)

    assert response.status_code == 400
    assert set(payload.keys()) == {"code", "message", "details", "trace_id"}
    assert payload["code"] == "VALIDATION"
    assert payload["message"] == "Request validation failed."
    expected_errors = json.loads(json.dumps(exc.errors()))
    assert payload["details"] == {"errors": expected_errors}
    assert payload["trace_id"] == trace_id
    assert response.headers[TRACE_ID_HEADER] == trace_id


def test_internal_error_response_has_expected_shape() -> None:
    trace_id = "trace-456"

    response = internal_error_response(trace_id)
    payload = _response_json(response)

    assert response.status_code == 500
    assert set(payload.keys()) == {"code", "message", "details", "trace_id"}
    assert payload["code"] == "INTERNAL"
    assert payload["message"] == "Internal server error."
    assert payload["details"] == {}
    assert payload["trace_id"] == trace_id
    assert response.headers[TRACE_ID_HEADER] == trace_id
