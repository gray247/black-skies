Status: Active policy
Version: 1.0.0
Last Reviewed: 2026-04-19
Owner: Services Team

# Deferred Feature Containment Policy

Purpose: keep deferred features from influencing active architecture unless a deliberate, accountable runtime seam exists.

## Containment Rules

1. A deferred feature may influence active architecture only when at least one seam type exists:
- stable runtime adapter
- typed interface stub
- explicit disabled integration seam
- tested intentional seam

2. If a deferred feature has a live seam, that seam must be represented in `build/runtime_truth.json` under `deferred_docs`.

3. Every deferred feature doc must declare:
- live runtime dependency: yes/no
- seam owner: file/module/path (required when dependency is yes)
- seam state: non-baseline status (`disabled`, `internal`, `partial`, `experimental`, or `off`) when dependency is yes; `none` when dependency is no
- seam type: one of the allowed seam types above; `none` when dependency is no

4. Deferred features must not create GUI placeholders or runtime implication unless a declared seam exists.

5. Planning language does not override runtime truth. Runtime authority remains:
- `build/runtime_truth.json`
- `docs/specs/current_state.md`
- `docs/specs/memory_runtime.md`
- `docs/specs/model_runtime.md`

## Audited Deferred Features (Current Scope)

- voice notes / transcription
- smart merge
- accessibility toggles

Plugin execution is product-adjacent but currently tracked as an optional operational surface, not as a deferred feature in this policy.

## Enforcement

Enforcement is lightweight and rule-based:
- `tools/runtime_truth/validate_deferred_feature_containment.py`
- `tests/test_deferred_feature_containment.py`

The check validates that:
- deferred docs contain required declarations
- deferred docs and runtime ledger agree on seam presence/absence
- docs claiming a live deferred seam map to a ledger deferred entry with seam metadata
