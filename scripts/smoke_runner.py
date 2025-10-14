"""Utility helpers for the Black Skies smoke test flows."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Sequence

import httpx

from blackskies.services.routers.draft import _compute_sha256
from blackskies.services.scene_docs import DraftRequestError, read_scene_document

LOGGER = logging.getLogger("blackskies.smoke")

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 43750
DEFAULT_TIMEOUT = 60.0
DEFAULT_PROJECT_ID = "proj_esther_estate"

_SMOKE_WIZARD_STEPS: tuple[str, ...] = (
    "input_scope",
    "framing",
    "structure",
    "scenes",
    "characters",
    "conflict",
)


@dataclass(frozen=True)
class SmokeTestConfig:
    """Runtime configuration for the smoke runner."""

    host: str
    port: int
    project_id: str
    project_base_dir: Path
    cycles: int
    timeout: float = DEFAULT_TIMEOUT
    wizard_steps: Sequence[str] = _SMOKE_WIZARD_STEPS
    scene_ids: Sequence[str] | None = None

    @property
    def base_url(self) -> str:
        return f"http://{self.host}:{self.port}"

    @property
    def project_root(self) -> Path:
        return self.project_base_dir / self.project_id


def configure_logging(level: int = logging.INFO) -> None:
    """Configure structured logging for smoke execution."""

    logging.basicConfig(
        level=level,
        format="[smoke] %(message)s",
    )


def load_scene_ids(project_root: Path, limit: int) -> list[str]:
    """Return the first ``limit`` scene identifiers from the outline artifact."""

    outline_path = project_root / "outline.json"
    if not outline_path.exists():
        msg = f"Outline artifact not found at {outline_path}."
        raise FileNotFoundError(msg)

    outline = json.loads(outline_path.read_text(encoding="utf-8"))
    scenes = outline.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        raise ValueError("Outline artifact is missing scene definitions.")

    scene_ids: list[str] = []
    for entry in scenes:
        if not isinstance(entry, dict):
            continue
        scene_id = entry.get("id")
        if isinstance(scene_id, str):
            scene_ids.append(scene_id)
        if len(scene_ids) >= limit:
            break

    if not scene_ids:
        raise ValueError("Outline contains no scenes to generate.")

    if len(scene_ids) >= limit:
        return scene_ids[:limit]

    cycled: list[str] = []
    while len(cycled) < limit:
        for scene_id in scene_ids:
            cycled.append(scene_id)
            if len(cycled) == limit:
                break
    return cycled


def compute_scene_sha(project_root: Path, scene_id: str) -> str:
    """Compute the digest for the existing scene markdown body."""

    try:
        _, _, body = read_scene_document(project_root, scene_id)
    except DraftRequestError as exc:  # pragma: no cover - defensive, bubble up
        raise FileNotFoundError(exc.details.get("unit_id", scene_id)) from exc
    return _compute_sha256(body)


def build_accept_payload(
    *,
    project_id: str,
    draft_id: str,
    unit: dict[str, Any],
    previous_sha: str,
    message: str,
    estimated_cost: float | None,
) -> dict[str, Any]:
    """Construct the payload submitted to ``/api/v1/draft/accept``."""

    unit_id = unit.get("id")
    if not isinstance(unit_id, str):
        raise ValueError("Draft unit payload is missing an id.")

    return {
        "project_id": project_id,
        "draft_id": draft_id,
        "unit_id": unit_id,
        "unit": {
            "id": unit_id,
            "previous_sha256": previous_sha,
            "text": unit.get("text", ""),
            "meta": unit.get("meta", {}),
            "estimated_cost_usd": estimated_cost,
        },
        "message": message,
        "snapshot_label": f"accept-{unit_id}",
    }


async def wait_for_service(base_url: str, timeout: float) -> None:
    """Poll the health endpoint until it responds or timeout expires."""

    loop = asyncio.get_running_loop()
    deadline = loop.time() + timeout
    async with httpx.AsyncClient(base_url=base_url, timeout=5.0) as client:
        endpoints = ("/api/v1/healthz",)
        while True:
            for path in endpoints:
                try:
                    response = await client.get(path)
                except httpx.HTTPError:
                    continue
                if response.status_code == httpx.codes.OK:
                    LOGGER.info("Service healthy at %s%s", base_url, path)
                    return

            if loop.time() >= deadline:
                raise TimeoutError(
                    f"Service at {base_url} did not become ready within {timeout} seconds."
                )
            await asyncio.sleep(0.5)


async def _post_json(
    client: httpx.AsyncClient,
    path: str,
    payload: dict[str, Any],
    expected: Iterable[int] = (httpx.codes.OK,),
) -> httpx.Response:
    response = await client.post(path, json=payload)
    if response.status_code not in expected:
        LOGGER.error("Request to %s failed: %s", path, response.text)
        response.raise_for_status()
    return response


async def run_cycles(config: SmokeTestConfig) -> None:
    """Execute the smoke test cycles using the provided configuration."""

    project_root = config.project_root
    if not project_root.exists():
        msg = f"Project root does not exist: {project_root}"
        raise FileNotFoundError(msg)

    scene_ids = list(config.scene_ids or load_scene_ids(project_root, config.cycles))
    wizard_steps = list(config.wizard_steps)
    if not wizard_steps:
        raise ValueError("At least one wizard step must be provided.")

    LOGGER.info("Running %s smoke cycle(s) against %s", config.cycles, config.project_id)

    async with httpx.AsyncClient(
        base_url=config.base_url,
        timeout=httpx.Timeout(config.timeout, connect=10.0),
    ) as client:
        await wait_for_service(config.base_url, config.timeout)

        for index, scene_id in enumerate(scene_ids):
            step = wizard_steps[index % len(wizard_steps)]
            label = f"smoke-{index + 1:02d}-{scene_id}"
            LOGGER.info("[%s] Locking wizard step '%s'", scene_id, step)
            await _post_json(
                client,
                "/api/v1/draft/wizard/lock",
                {
                    "project_id": config.project_id,
                    "step": step,
                    "label": label,
                },
            )

            LOGGER.info("[%s] Generating draft", scene_id)
            generate_payload = {
                "project_id": config.project_id,
                "unit_scope": "scene",
                "unit_ids": [scene_id],
                "seed": 42 + index,
                "overrides": {},
            }
            generate_response = await _post_json(client, "/api/v1/draft/generate", generate_payload)
            generate_json = generate_response.json()
            units = generate_json.get("units", [])
            if not units:
                raise RuntimeError("Draft generation returned no units.")
            unit = next((item for item in units if item.get("id") == scene_id), units[0])
            raw_draft_id = str(generate_json.get("draft_id"))
            if isinstance(raw_draft_id, str) and raw_draft_id.startswith("dr_") and raw_draft_id[3:].isdigit():
                draft_id = raw_draft_id
            else:
                draft_id = f"dr_{index + 1:03d}"
            estimated_cost = (
                float(generate_json.get("budget", {}).get("estimated_usd", 0.0))
                if isinstance(generate_json.get("budget"), dict)
                else 0.0
            )

            LOGGER.info("[%s] Requesting critique", scene_id)
            critique_payload = {
                "project_id": config.project_id,
                "draft_id": draft_id,
                "unit_id": scene_id,
                "rubric": ["Logic", "Continuity", "Character"],
                "unit": {
                    "id": scene_id,
                    "text": unit.get("text", ""),
                },
            }
            await _post_json(client, "/api/v1/draft/critique", critique_payload)

            previous_sha = compute_scene_sha(project_root, scene_id)
            accept_payload = build_accept_payload(
                project_id=config.project_id,
                draft_id=draft_id,
                unit=unit,
                previous_sha=previous_sha,
                message=f"Smoke accept cycle {index + 1}",
                estimated_cost=estimated_cost,
            )

            LOGGER.info("[%s] Accepting draft", scene_id)
            await _post_json(client, "/api/v1/draft/accept", accept_payload)

    LOGGER.info("Completed %s smoke cycle(s).", config.cycles)


def resolve_project_base_dir(explicit: str | None) -> Path:
    """Resolve the project base directory, honoring env overrides."""

    if explicit:
        base_dir = Path(explicit)
    else:
        env_value = os.environ.get("BLACKSKIES_PROJECT_BASE_DIR")
        if env_value:
            base_dir = Path(env_value)
        else:
            base_dir = Path.cwd() / "sample_project"
    return base_dir.resolve()


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Black Skies smoke cycles.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--project-id", default=DEFAULT_PROJECT_ID)
    parser.add_argument("--project-base-dir")
    parser.add_argument("--cycles", type=int, default=3)
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT)
    parser.add_argument(
        "--wizard-steps",
        nargs="*",
        help="Optional custom wizard steps to iterate over.",
    )
    parser.add_argument(
        "--scene-ids",
        nargs="*",
        help="Explicit scene identifiers to target instead of reading the outline.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    configure_logging(getattr(logging, str(args.log_level).upper(), logging.INFO))

    project_base_dir = resolve_project_base_dir(args.project_base_dir)
    config = SmokeTestConfig(
        host=args.host,
        port=args.port,
        project_id=args.project_id,
        project_base_dir=project_base_dir,
        cycles=args.cycles,
        timeout=args.timeout,
        wizard_steps=tuple(args.wizard_steps) if args.wizard_steps else _SMOKE_WIZARD_STEPS,
        scene_ids=tuple(args.scene_ids) if args.scene_ids else None,
    )

    try:
        asyncio.run(run_cycles(config))
    except Exception as exc:  # pragma: no cover - CLI surface
        LOGGER.error("Smoke run failed: %s", exc)
        return 1
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main())
