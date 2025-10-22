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
