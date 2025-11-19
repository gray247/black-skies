"""Standardized logger factory for backend routers."""

from __future__ import annotations

import logging

from .logging_config import configure_logging

_LOGGING_CONFIGURED = False


def get_logger(name: str) -> logging.Logger:
    """Return a logger ensuring the JSON logging config has been applied once."""

    global _LOGGING_CONFIGURED
    if not _LOGGING_CONFIGURED:
        configure_logging()
        _LOGGING_CONFIGURED = True
    return logging.getLogger(name)


__all__ = ["get_logger"]
