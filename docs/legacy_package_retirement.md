# Legacy `black_skies` Package Migration Summary

The standalone `black_skies/` package has been removed in favour of the canonical FastAPI service hosted under
`services/src/blackskies/services/`. All orchestration helpers, tools, and agents previously referenced via the legacy package
now live inside the `blackskies.services` namespace.

## Completed Work
- Ported orchestration helpers (agents, tools, cache, exports, critique, eval harness) into `blackskies.services`.
- Updated test suite, scripts, and docs to reference the new namespace.
- Adjusted packaging metadata (`pyproject.toml`) to package only `blackskies.services`.
- Retired the legacy FastAPI entrypoint; `uvicorn blackskies.services.app:create_app --factory` is now the supported launcher.

## Follow-up Guidelines
- When backporting historical fixes, use the archival `v1.0.0-phase1` tag if the legacy layout is required.
- New modules should be placed under `services/src/blackskies/services/…` and tested via `pytest`.
- Replace any lingering references to `black_skies.*` in downstream repos or deployment scripts with the new namespace.

The repository now contains a single Python source tree, simplifying contributor onboarding and reducing duplicate maintenance.
