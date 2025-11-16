Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# docs/ops/security.md — Security Posture Summary
**Status:** Active · 2025-10-28  
**Scope:** Consolidates the security artefacts, automation hooks, and open follow-ups referenced in the Phase 8/9 plan.

## Core Artefacts
- [`SECURITY.md`](../SECURITY.md) — public vulnerability disclosure policy.
- [`docs/ops/security_sweep.md`](./security_sweep.md) — Phase 8 dependency and configuration audit log.
- [`scripts/security_sweep.py`](../scripts/security_sweep.py) — automation entry point for generating licence and secret coverage reports.
- [`docs/policies.md`](./policies.md#security--licensing) — source of truth for platform/network restrictions and licensing requirements.
- [`phase_log.md`](../phase_log.md) — track open security items in the “Open items snapshot” table and record completed audits.

## Runtime & Build Guarantees
- **Secrets redaction:** `postflight_scrub` masks API keys, tokens, and emails in all structured logs before they leave the process.
- **Strict settings:** `ServiceSettings` forbids unknown fields and defaults to offline-safe values; `.env.example` documents every key.
- **Request limits:** API routes enforce explicit size caps via `BodySizeLimitMiddleware` and reject unknown schema fields (`extra="forbid"`).
- **Packaging hygiene:** Windows builds bundle only pinned dependencies (`requirements.lock`, `requirements.dev.lock`) and the offline sample project.
- **Offline installs:** `scripts/setup` prefers local wheels, keeping CI and smoke runs deterministic even without network access.

## Release Checklist
Run these commands before cutting a release or responding to a security review:

```powershell
python scripts/security_sweep.py --output build/security-sweep.json
python scripts/dependency_report.py --output build/dependency-report.json
scripts/smoke.ps1 -ProjectId proj_esther_estate -Cycles 3 -SkipInstall
bash scripts/smoke.sh --project proj_esther_estate --cycles 3
```

Retain the generated JSON artefacts (`security-sweep.json`, `dependency-report.json`) alongside the release notes.

## Open Follow-ups
- Consult `phase_log.md` for current security-related TODOs before sign-off.
- Ensure vulnerability scanner outputs (pip-audit, safety) remain green in CI; update this document if new tools or gates are added.
- Capture any manual review notes from security sweeps in `docs/ops/security_sweep.md` so future audits see the full context.
