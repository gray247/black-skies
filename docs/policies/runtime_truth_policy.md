Status: Active policy
Version: 1.0.0
Last Reviewed: 2026-04-19
Owner: Services Team

# Runtime Truth Documentation Policy

Purpose: keep runtime claims in docs anchored to runtime truth sources instead of informal drift.

## Scope

This policy applies to runtime-facing spec docs, planning docs, and deferred docs that can be mistaken for runtime authority.

Current enforcement covers these high-signal docs:
- `docs/specs/current_state.md`
- `docs/specs/memory_runtime.md`
- `docs/specs/model_runtime.md`
- `docs/specs/feature_maturity_migration.md`
- `docs/specs/agents_and_services.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/phases/phase_charter.md`
- `docs/deferred/voice_notes_transcription.md`
- `docs/deferred/smart_merge_tool.md`
- `docs/gui/accessibility_toggles.md`

## Runtime Truth Rules

1. Docs that claim current runtime availability must cite at least one allowed source:
- `build/runtime_truth.json`
- `docs/specs/current_state.md`
- `docs/specs/memory_runtime.md`
- `docs/specs/model_runtime.md`

2. Canon runtime docs may summarize the ledger but must not contradict it.

3. Planning docs are not runtime authority and must explicitly say so.

4. Deferred docs must include:
- runtime dependency status (`none` is valid)
- seam owner when a runtime seam exists

## Doc Classes

Canon runtime docs:
- `docs/specs/current_state.md`
- `docs/specs/memory_runtime.md`
- `docs/specs/model_runtime.md`

Planning docs:
- `docs/BLACK_SKIES_FIX_TRACKER.md` for current operational status
- `docs/roadmap/master_phase_allocation_plan.md` for phase sequencing
- `docs/roadmap/deferred_work_matrix.md` for deferred allocation
- `docs/roadmap/authority_reconciliation_strategy.md` for authority doctrine
- `docs/roadmap.md` as a legacy planning snapshot
- `docs/phases/phase_charter.md`

Deferred/planned feature docs:
- `docs/deferred/voice_notes_transcription.md`
- `docs/deferred/smart_merge_tool.md`
- `docs/gui/accessibility_toggles.md`

## Enforcement

Enforcement is implemented by:
- `tools/runtime_truth/validate_runtime_docs.py`
- `tests/test_runtime_docs_policy.py`

The check is intentionally lightweight and rule-based:
- flags runtime-availability wording without runtime-truth anchors
- requires planning-doc authority disclaimers
- requires deferred dependency + seam-owner declarations

This policy is part of normal validation through standard `pytest` runs.
