Status: Prototype / historical reference
Version: 1.0.0
Last Reviewed: 2026-04-18

# Memory Prototype v1 — Prototype Specification

## Purpose
Build a read-only, advisory-only narrative memory prototype that derives structured state from accepted project data for future packet assembly and drift detection, without mutating canonical narrative truth.

## Status
- Prototype
- Backend-only
- Not user-facing
- No public API contract changes
- Fully removable without affecting production runtime
- Implemented on `prototype/memory-v1` through M1-M5 + Revision Pass A + Revision Pass B

## Core Principles
- One authoritative narrative truth
- Accept is the only default narrative-state promotion event
- No hidden state mutation
- All prototype outputs are advisory-only
- Stable IDs across services (no drift)
- Derived state never becomes canonical

Authority: prototype/historical reference. This document does not describe the current runtime memory path. For current runtime truth, use `docs/specs/memory_runtime.md`.

## Critical Clarification
### Rewrite vs Accept Authority
- `/draft/rewrite` may persist working draft text.
- Rewrite persistence is not canonical promotion in memory v1.
- Memory v1 ignores rewrite-only state unless that content later appears in an accepted lineage.

## Canonical vs Derived State
### Canonical State
- Accepted draft state
- Locked fields
- Accepted explicit state updates
- Accepted outline decisions

### Derived State
- Continuity signals
- Deltas
- Packets
- Analytics / critique outputs

### Rule
Derived state may inform but never override canonical state.
Legacy replay/eval lineage remains non-authoritative and must never supersede snapshot-based lineage artifacts.

## Scope
### In Scope
- Canonical state reading
- Scene delta extraction
- Continuity signal normalization
- Task packet assembly
- Advisory storage
- Evaluation fixtures

### Out of Scope
- Canon mutation
- UI work
- API changes
- RAG expansion
- Multi-book memory

## Architecture Components
- `CanonicalStateReader`
- `SceneDeltaExtractor`
- `ContinuitySignalNormalizer`
- `TaskPacketAssembler`
- `NarrativeStateProvider` (read-only seam)

## Canonical Input Mapping
The prototype reads canonical narrative inputs only from these artifacts.
- Canonical reads for memory processing must resolve against one accepted lineage snapshot; do not mix multiple snapshots or partially updated project state.

### Allowed Canonical Inputs
1. Accepted draft state
- `project-root/drafts/<unit_id>.md`
- Eligibility gate: only when processing a successful `/draft/accept` event for that `unit_id`, or when replaying a previously accepted lineage key from prototype artifacts.
- Accepted lineage evidence (v1 rule):
  - Primary: successful accept response context (`project_id`, `unit_id`, `snapshot_id`) at processing time.
  - Replay/backfill: `project-root/history/snapshots/*/metadata.json` plus accepted-source hash checks.
  - Legacy replay/eval compatibility (bounded): if older snapshot metadata does not include `accepted_source_hash`, replay/eval may derive it only when snapshot metadata satisfies all of:
    - `label == "accept"`
    - `includes` contains both `drafts` and `outline.json`
    - matching outline scene front-matter exists for `unit_id`
  - Legacy replay derivation fails closed when required evidence is missing.
  - `project-root/history/recovery/state.json` (`last_snapshot`) is supplemental context only and must not be treated as authoritative per-unit lineage by itself.
- Label text must not be used as the sole accept-lineage signal.
- Accepted draft content is immutable for a lineage key; the prototype must not re-read modified draft files outside that accepted lineage context.

2. Locked fields
- `project-root/locked_facts.json`
- `project-root/.blackskies/locked_facts.json`

3. Accepted outline decisions
- `project-root/outline.json`

4. Accepted explicit state updates
- Current repo state: no separate canonical explicit-state-update artifact is defined.
- v1 rule: this source is unavailable and skipped in precedence resolution unless a dedicated accepted-state-update artifact is defined in a future spec revision.
- This source is reserved for future canonical state update artifacts and is intentionally inactive in v1.

5. Lore/reference records
- `project-root/lore/*.yaml`
- `project-root/lore/*.yml`

### Explicitly Excluded (Advisory / Non-Canonical)
- `project-root/.blackskies/continuity/*`
- `project-root/.blackskies/analytics/*`
- `project-root/.blackskies/memory/*` (prototype output cannot become input)
- `project-root/history/diagnostics/*`
- `project-root/history/critiques/*`
- `project-root/history/rewrites/*` if present
- Any eval/run artifacts under `project-root/history/memory_prototype/*`

### Non-Canonical Reads Allowed for Prototype Bookkeeping Only
- `project-root/.blackskies/memory/*` may be read only for dedup/idempotency bookkeeping.
- These reads must never be treated as canonical narrative source inputs.
- Prototype outputs must never be re-ingested as canonical or derived inputs in later memory passes, except for idempotency bookkeeping.

## Storage Contract
### Structure
```text
.blackskies/
  memory/
    schema_version.json
    ledger/
    deltas/
    packets/
    drift/

history/
  memory_prototype/
    runs/
    diagnostics/
    eval/
    status.json
```

### Rules
- Non-canonical
- Rebuildable
- Never overwrite canonical state
- Prototype memory artifacts are fully rebuildable and must never be treated as authoritative state.

## Source Precedence
Precedence applies per field, not per file.

1. Locked fields
2. Explicit state updates (currently unavailable in v1; skipped)
3. Accepted draft
4. Accepted outline decisions
5. Lore/reference records
6. Derived signals (advisory-only)

### Field-Level Resolution Rules
- Highest-precedence non-empty canonical value wins.
- Lower-precedence canonical sources may fill blanks only.
- If two canonical sources disagree for the same field, emit a structured conflict and keep the higher-precedence value.
- Derived signals never write or override canonical values; they are attached as advisory metadata only.
- Because explicit state updates are unavailable in v1, effective precedence is: locked fields -> accepted draft -> accepted outline decisions -> lore/reference records -> advisory metadata.
- Task packets must be assembled from a single lineage snapshot and must not mix canonical values across lineage boundaries.

## Continuity Signals
Each continuity signal includes:
- `type`
- `entities`
- `scope`
- `severity`
- `confidence`
- `anchor`

## Lineage and Idempotency
### Primary Lineage Key (required)
- `project_id + unit_id + snapshot_id`
- `snapshot_id` is sourced from accepted lineage artifacts.

### Fallback Lineage Key (limited use)
- Allowed only when no `snapshot_id` is available (for historical rebuild/eval cases).
- Fallback key: `project_id + unit_id + accepted_source_hash`.
- `accepted_source_hash` is computed from normalized accepted scene content and accepted front-matter fields.
- Fallback is not allowed during live accept processing when `snapshot_id` is present.
- Fallback lineage keys must never overwrite, merge with, or supersede snapshot-based lineage artifacts.

### Idempotency Rules
- Repeated accepts with the same lineage key must not emit new distinct artifacts.
- If `schema_version` or extractor implementation version changes, artifacts may be re-emitted under the same lineage with updated artifact metadata/version fields.
- Re-emitted artifacts must preserve lineage identity and only change advisory payload/version fields.

## Failure Isolation
- Prototype failures never block canonical accept completion.
- Canonical accept response semantics remain unchanged.
- Prototype failure writes diagnostics to:
  - `project-root/history/memory_prototype/diagnostics/`

### Degraded-State Contract
- Authoritative degraded-state file:
  - `project-root/history/memory_prototype/status.json`
- Minimum payload fields:
  - `status` (`ok` | `degraded`)
  - `updated_at`
  - `last_success_at`
  - `last_error_code`
  - `last_error_message`
  - `consecutive_failures`
  - `retry_after_seconds`
  - `affected_components`
- Retry/backoff expectation for v1:
  - bounded retry attempts
  - bounded backoff
  - no infinite retry loops
- Operator/debug detection path:
  - read `project-root/history/memory_prototype/status.json`
  - inspect `project-root/history/memory_prototype/diagnostics/`
- Degraded prototype state must never alter canonical accept result codes or canonical write outcomes.

## Concurrency
### Same-Scene Parallel Accepts
- Prototype processing runs only for successful accept lineage events.
- Winner policy follows canonical accept ordering as observed from successful accept completion (`snapshot_id` lineage).
- Conflicting or stale accepts that fail canonical checks produce no new memory lineage artifacts.

### Artifact Write Rule
- At most one distinct artifact set per lineage key.
- Concurrent attempts resolving to the same lineage key must deduplicate to one advisory artifact set.
- If two successful accepts produce different lineage keys for the same scene, both lineage versions may exist; precedence for downstream packet reads must select the latest accepted lineage by canonical accept ordering.

### Expected Test Behavior
- Parallel accepts on the same scene result in deterministic lineage artifacts.
- Failed/conflicting accept attempts do not create lineage artifacts.

## Performance Guardrails
- Measure per-accept overhead.
- Cap advisory artifact sizes.
- Degrade gracefully if limits are exceeded.
- Prototype processing must be bounded such that it does not materially delay accept completion under normal project sizes.

## Privacy / Redaction
- Avoid storing full prose where not needed.
- Prefer references and anchors over full-body duplication.
- Prototype artifacts must not store full scene text unless required for evaluation; such storage must be clearly marked and removable.

## Validation Lane
### Existing Gates (currently runnable in repo)
```bash
pnpm test:truth
python scripts/check_roadmap_vs_phase_log.py
python -m pytest services/tests -q
```

### Prototype Lane (implemented on this branch)
```bash
python -m pytest services/tests/prototype/ -q

python scripts/run_memory_prototype_v1_eval.py --project-root <fixture-root> --fixture-manifest services/tests/prototype/fixtures/m5_eval_cases.json
```

## Prototype Test Coverage (implemented)
1. `services/tests/prototype/test_memory_non_mutation.py`
- Proves: advisory-only behavior.
- Must assert: no canonical files are mutated by prototype processing.

2. `services/tests/prototype/test_memory_precedence_conflicts.py`
- Proves: field-level precedence and conflict emission.
- Must assert: higher-precedence values win; lower-precedence only fill blanks; conflicts are emitted.

3. `services/tests/prototype/test_memory_idempotency.py`
- Proves: dedup for repeated same-lineage accept processing.
- Must assert: repeated same-lineage accepts produce no new distinct artifacts.

4. `services/tests/prototype/test_memory_accept_race.py`
- Proves: deterministic behavior under same-scene parallel accepts.
- Must assert: winner follows successful canonical accept ordering (`snapshot_id` lineage), failed/conflicting accepts emit no lineage artifacts, and same-lineage concurrent writes deduplicate.

5. `services/tests/prototype/test_memory_failure_isolation.py`
- Proves: degraded-mode behavior does not block accept.
- Must assert: canonical accept still succeeds; degraded status and diagnostics are written.

6. `services/tests/prototype/test_memory_continuity_conflicts.py`
- Proves: high-value dead/alive contradiction emits a structured advisory conflict signal.
- Must assert: conflict severity/entities/anchor are present and canonical files remain unchanged.

7. `services/tests/prototype/test_memory_legacy_replay.py`
- Proves: legacy replay fallback is bounded in replay/eval only.
- Must assert: bounded legacy marker is present and metadata contract violations fail closed.

## Fixtures
- 2 projects
- 6–10 scenes
- 3 contradiction cases

## Deliverables
- This spec
- Prototype modules
- Tests
- Evaluation report

## Exit Criteria
- No canonical mutation
- Stable IDs
- Valid packet assembly
- Existing gates pass
- Prototype lane passes

## Known Limitation
- The M5 eval runner does not execute the full truth-lane regression suite internally.
- Truth-lane regression checks remain separate and are reported as not evaluated inside the M5 runner.

## Kill Criteria
- Hidden mutation required
- ID instability
- Truth-lane regression
- Outputs unusable

## Branch Strategy
- Branch: `prototype/memory-v1`
- Create after stabilization push
