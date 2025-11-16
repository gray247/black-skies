Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# P8 Security Sweep Checklist

This document records the baseline dependency and configuration audit completed for Phase 8.

## Dependency inventory

- `python scripts/security_sweep.py` now emits a consolidated JSON summary covering dependency locks, environment keys, and license metadata.
- Generated a lock snapshot with `python scripts/dependency_report.py` (aggregates `requirements.lock` and `requirements.dev.lock`).
- Output artefact lists 50 pinned dependencies; attach this JSON to release/security reviews.
- All runtime packages are already constrained by `constraints.txt`; no duplicate pins observed.

## Configuration hygiene

- `.env.example` documents every `ServiceSettings` key, including the new `BLACKSKIES_MAX_REQUEST_BODY_BYTES`.
- Service settings forbid unknown fields, reducing risk of silently ignored misconfigurations.
- FastAPI app installs `BodySizeLimitMiddleware` to reject payloads exceeding the configured cap before they reach request handlers.

## Logging & diagnostics

- Structured logs now flow through the existing redactor (`postflight_scrub`) ensuring emails, API keys, and tokens are masked before emission.
- Request schemas (`DraftGenerateRequest`, `DraftAcceptRequest`, `DraftCritiqueRequest`) set `extra="forbid"` to block untrusted fields.

## Operational follow-ups

- Capture dependency-report artefacts on every release train.
- Integrate `scripts/check_slo.py <run.json>` in CI to guarantee SLO breaches fail the pipeline.
- Automated security sweeps now run both `pip-audit --strict` and `safety check` in CI, with JSON artefacts retained for each scheduled run.
- Add `python scripts/security_sweep.py --output security-sweep.json` to the release train to confirm env coverage and collect license snapshots.
