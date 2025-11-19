"""Structured logging helpers for Black Skies services."""

from __future__ import annotations

import json
import logging
import logging.config
from datetime import datetime, timezone
from typing import Any, Dict

from .tools.safety import postflight_scrub


class JsonFormatter(logging.Formatter):
    """Simple JSON formatter for structured logs."""

    def format(self, record: logging.LogRecord) -> str:  # type: ignore[override]
        payload: Dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        extra = getattr(record, "extra_payload", None)
        if isinstance(extra, dict):
            payload.update(postflight_scrub(extra))
        return json.dumps(payload, ensure_ascii=False)


LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "blackskies.services.logging_config.JsonFormatter",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        }
    },
    "loggers": {
        "uvicorn.access": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "uvicorn.error": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "blackskies.services": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}


def configure_logging() -> None:
    """Apply the structured logging configuration."""

    logging.config.dictConfig(LOGGING_CONFIG)


__all__ = ["configure_logging"]
