# docs/p7_status.md — Phase 7 RC Deliverable Audit

The table below records the completion state of the P7 (RC packaging + smoke) deliverables. Each entry links to the source files that fulfill the requirement so QA and release engineering can confirm readiness without re-scanning the entire tree.

| Deliverable | Status | Evidence |
| --- | --- | --- |
| Freeze public API + schemas and cut `v1.0.0-rc1` | ✅ Complete | Service metadata exposes `SERVICE_VERSION = "1.0.0-rc1"` and the FastAPI manifest advertises the frozen version.【F:services/src/blackskies/services/app.py†L42-L97】 Package manifests (`pyproject.toml`, root `package.json`, and `app/package.json`) all publish `1.0.0-rc1` for parity with the tag.【F:pyproject.toml†L1-L39】【F:package.json†L1-L19】【F:app/package.json†L1-L58】 The changelog logs the RC freeze.【F:CHANGELOG.md†L3-L8】|
| Produce installable packages (`pip install .`, reproducible Node build) | ✅ Complete | `pyproject.toml` uses `setuptools` with `packages.find` pointing at `services/src`, ensuring `pip install .` works without extra flags.【F:pyproject.toml†L1-L47】 `docs/packaging.md` details the offline-friendly Electron build, including deterministic `pnpm --filter app` commands and artifact expectations.【F:docs/packaging.md†L1-L63】|
| Ship smoke scripts exercising three happy paths | ✅ Complete | Cross-platform smoke runners live in `scripts/smoke.sh` and `scripts/smoke.ps1`; they create/refresh the venv, boot the API, and drive three Wizard → Draft → Critique → Accept cycles via `scripts/smoke_runner` before exiting 0.【F:scripts/smoke.sh†L1-L77】【F:scripts/smoke.ps1†L1-L73】|
| Publish user quickstart covering `.env` config + known issues | ✅ Complete | `docs/quickstart.md` introduces the RC target, enumerates environment prerequisites, documents `.env` keys, and includes a troubleshooting matrix of known issues for QA.【F:docs/quickstart.md†L1-L153】|
| Provide offline-friendly mode (cached wheels, no remote model calls) | ✅ Complete | `scripts/freeze_wheels.sh` captures locked dependencies for offline machines, and `scripts/setup` prefers `vendor/wheels/` before falling back to PyPI.【F:scripts/setup†L1-L115】 Service defaults keep `BLACK_SKIES_BLACK_SKIES_MODE=offline` unless overridden so no remote providers are contacted in RC builds, and legacy `.env` files using `BLACK_SKIES_MODE` emit a rename warning while still loading.【F:services/src/blackskies/services/settings.py†L1-L119】|

---

**Release traceability**

- `docs/phase_log.md` marks P7 as complete with a `v1.0.0-rc1` entry, aligning the documentation timeline with the code freeze.【F:docs/phase_log.md†L1-L11】
- `CHANGELOG.md` summarizes the RC readiness work so the release tag has an auditable change note.【F:CHANGELOG.md†L3-L8】
