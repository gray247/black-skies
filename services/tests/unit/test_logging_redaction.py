from __future__ import annotations

import json
import logging

from blackskies.services.logging_config import JsonFormatter


def _format(record_kwargs: dict[str, object]) -> dict[str, object]:
    formatter = JsonFormatter()
    record = logging.makeLogRecord({"msg": "message", **record_kwargs})
    formatted = formatter.format(record)
    return json.loads(formatted)


def test_json_formatter_redacts_sensitive_fields() -> None:
    payload = {
        "user": "writer@example.com",
        "api_key": "sk-secret-ABCDEFGHIJKLMNOPQRSTUV",
        "token": "ABCD1234EFGH5678IJKL9012MNOP3456",
    }

    record = _format({"extra_payload": payload})

    assert record["user"] == "[REDACTED_EMAIL]"
    assert record["api_key"] == "[REDACTED]"
    assert record["token"] in {"[REDACTED_SECRET]", "[REDACTED]"}


def test_json_formatter_redacts_nested_sensitive_content() -> None:
    payload = {
        "headers": {"Authorization": "Bearer sk-secret-nested"},
        "recipients": ["alpha@example.com", "beta@example.com"],
        "notes": [
            {"token": "sk-1234567890ABCDEFGHIJKLMNOP"},
            "Forward to gamma@example.com",
        ],
    }

    record = _format({"extra_payload": payload})

    assert record["headers"]["Authorization"] == "[REDACTED]"
    assert record["recipients"] == ["[REDACTED_EMAIL]", "[REDACTED_EMAIL]"]
    assert record["notes"][0]["token"] in {"[REDACTED_SECRET]", "[REDACTED]"}
    assert "[REDACTED_EMAIL]" in record["notes"][1]
