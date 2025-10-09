"""Entry point for running the Black Skies service stack."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import Final

import uvicorn


def _ensure_src_path() -> None:
    """Ensure the repository ``src`` directory is importable when run in-place."""

    package_root = Path(__file__).resolve().parents[2]
    candidate = package_root
    if not (candidate / "blackskies").exists():
        return

    candidate_str = str(candidate)
    if candidate_str not in sys.path:
        sys.path.insert(0, candidate_str)


_ensure_src_path()

LOGGER = logging.getLogger(__name__)

DEFAULT_HOST: Final[str] = "127.0.0.1"
MIN_PORT: Final[int] = 43750
MAX_PORT: Final[int] = 43850


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the Black Skies FastAPI services.")
    parser.add_argument(
        "--host",
        default=DEFAULT_HOST,
        help="Host interface to bind (default: 127.0.0.1).",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=MIN_PORT,
        help=f"TCP port to bind (range {MIN_PORT}-{MAX_PORT}).",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable Uvicorn autoreload. Development use only.",
    )
    return parser


def main() -> None:
    """Run the FastAPI service using Uvicorn."""
    parser = _build_parser()
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)sZ %(levelname)s %(name)s %(message)s",
        stream=sys.stdout,
    )

    if not (MIN_PORT <= args.port <= MAX_PORT):
        parser.error(f"Port must be between {MIN_PORT} and {MAX_PORT}.")

    LOGGER.info("Starting services on %s:%s", args.host, args.port)
    uvicorn.run(
        "blackskies.services.app:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        factory=False,
    )


if __name__ == "__main__":
    main()
