# Phase 13 Handoff Pass 2 - Authority and Deferred Work Ledger

## Purpose

This artifact is the canonical unresolved-work inventory after Handoff Pass 1.

It does not implement fixes. It aggregates the open authority seams, contradictions, deferred work, harness distortions, operator pain points, stale assumptions, and migration blockers that Phase 13 exposed but did not resolve.

This is the debt ledger for the Phase 13 to Phase 14 transition boundary.

## Evidence Basis

Inspected sources:

- [phase13_handoff_pass1_current_state.md](C:/Dev/black-skies/docs/handoffs/phase13_handoff_pass1_current_state.md)
- [pass26_snapshot_authority_map_and_todo_inventory.md](C:/Dev/black-skies/docs/audits/phase13/pass26_snapshot_authority_map_and_todo_inventory.md)
- [BLACK_SKIES_FIX_TRACKER.md](C:/Dev/black-skies/docs/BLACK_SKIES_FIX_TRACKER.md)
- [phase13_audit_trust_validation_plan.md](C:/Dev/black-skies/docs/phases/phase13_audit_trust_validation_plan.md)
- existing Phase 13 audit artifacts under `docs/audits/phase13/`
- [current_state.md](C:/Dev/black-skies/docs/specs/current_state.md)
- [workflow_spine.md](C:/Dev/black-skies/docs/specs/workflow_spine.md)
- [error_visibility.md](C:/Dev/black-skies/docs/specs/error_visibility.md)
- repo searches for `TODO`, `FIXME`, `deferred`, `stub`, `mock`, `synthetic`, `snapshot`, `manifest`, `restore`, `backup`, `verification`, `last_verification`, `authority`, `alias`, `fixture`, `materialize`, `teardown`, `workflow`, `Playwright`, `truth lane`, `degraded`, `stale`, `orphan`, `report`, and `browse`

Evidence classes used in this ledger:

- `repo-discovered`
- `doc-discovered`
- `operator-observed from chat screenshots`
- `inferred architecture debt`
- `needs verification`

## Severity Model

- `S0 Blocker`
- `S1 Closure-critical`
- `S2 High-value stabilization`
- `S3 Future improvement`
- `S4 Parking lot`

## Ownership Areas

- `Backend`
- `Electron/preload`
- `Renderer/UI`
- `Playwright/harness`
- `Snapshots/recovery`
- `Truth lane/runtime truth`
- `Docs/roadmap`
- `CI/GitHub Actions`
- `Operator workflow`

## Canonical Ledger

| ID | Title | Severity | Ownership | Evidence/source | Current symptom | Why it matters | Proposed destination phase/pass | Blocker status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P2-SNAP-001 | Snapshot authority ontology is overloaded | S0 Blocker | Snapshots/recovery | Pass 26, Pass 1, Passes 14-18, operator-observed screenshots | A snapshot can be called verified while manifest, directory, integrity, and action safety disagree | This is the root contradiction behind multiple user-visible failures | Phase 14 - Authority Reconciliation / Pass 1 | blocker | Collapses: verified snapshot but missing manifest; verified snapshot but missing physical directory; UI says verified while integrity unavailable; historical verification treated as current integrity |
| P2-ALIAS-001 | Alias drift between `Esther_Estate` and `proj_esther_estate` | S0 Blocker | Electron/preload | Pass 19, Pass 21, Pass 26, tracker entries, fixture materializer docs | The renderer can load one alias while report or snapshot files live under another | Loaded-root mismatch breaks report availability, detail resolution, and trust claims | Phase 14 - Authority Reconciliation / Pass 1 | blocker | Collapses alias-root drift, loaded-root authority rule, fixture alias duplication |
| P2-REPORT-001 | Report freshness and report semantics are undefined | S0 Blocker | Snapshots/recovery | Pass 21, Pass 26, preload/report docs, tracker | `last_verification.json` can exist while the current artifact tree is stale, partial, missing, or mirrored | Historical verification is being treated as current integrity in some surfaces | Phase 14 - Authority Reconciliation / Pass 2 | blocker | Collapses stale report freshness undefined, orphaned verification records, report availability semantics |
| P2-RESTORE-001 | Restore availability and restore validity diverge | S1 Closure-critical | Backend | Pass 26, Pass 5, Pass 24, operator-observed screenshots | The UI can imply the latest ZIP or snapshot is restorable, but backend validation rejects the action | Restore is an operational safety claim, not just a visible button state | Phase 15 - Backup / Restore Authority Hardening / Pass 1 | blocker | Collapses restore advertised but restore invalid, restore latest ZIP validation clarity, backup/restore authority mapping |
| P2-BROWSE-001 | Browseable is being confused with safe or restorable | S1 Closure-critical | Operator workflow | Pass 16, Pass 20, Pass 26, Pass 1 | Local browsing can remain available while the artifact is missing, degraded, or not restorable | Operators can mistake file-open availability for verified or recoverable state | Phase 15 - Backup / Restore Authority Hardening / Pass 2 | blocker | Collapses browseable vs restorable ambiguity, local browsing vs verified browsing distinction |
| P2-DEGRADE-001 | Degraded-state semantics are inconsistent | S1 Closure-critical | Renderer/UI | Passes 14-18, Pass 26, error-visibility contract, operator-observed screenshots | Users can see `Integrity: Unavailable`, `Files: 0`, `Total size: 0 B`, report-unavailable, and directory-unavailable states without a unified explanation | Without consistent degraded semantics, the UI cannot communicate what is stale, missing, unreadable, or unverifiable | Phase 17 - GUI Authority Simplification / Pass 1 | blocker | Collapses degraded-state semantics unclear, missing manifest behavior, missing snapshot directory behavior |
| P2-TRUTH-001 | Truth lane scope is narrower than its consumers may assume | S1 Closure-critical | Truth lane/runtime truth | Pass 21, Pass 19, Pass 1, tracker | Truth lane proves backend report persistence and reread freshness, not complete GUI/runtime/restore coherence | Planning can overstate confidence if truth-lane coverage is treated as full product proof | Phase 16 - Test Harness / Fixture Governance / Pass 2 | blocker | Required seam: truth lane authority scope |
| P2-HARNESS-001 | Fixture and harness contract governance is incomplete | S1 Closure-critical | Playwright/harness | Pass 19, Pass 26, tracker harness follow-ups, test integrity audit | Synthetic fixtures can satisfy tests while hiding real project-root and artifact-authority drift | Harness confidence can outrun runtime truth unless its limits are explicitly governed | Phase 16 - Test Harness / Fixture Governance / Pass 1 | blocker | Collapses fixture/test contract governance, fixture materialization witness limits |
| P2-SYNTH-001 | Synthetic mode has authority limits that are not closure-safe | S2 High-value stabilization | Playwright/harness | Pass 19, Pass 25 load audit, test integrity audit | Synthetic mode can validate wiring and timing behavior but cannot prove real backend or filesystem semantics | Synthetic success cannot be mistaken for real-service closure | Phase 16 - Test Harness / Fixture Governance / Pass 3 | high | Required seam: synthetic-mode authority limits |
| P2-TEARDOWN-001 | Playwright teardown governance is fixed in behavior but still a governance seam | S2 High-value stabilization | Playwright/harness | Pass 19 addendum, tracker follow-ups 3-10 | Worker teardown is stable now, but the harness still contains high-value ownership rules that must remain explicit | Future harness changes can easily reintroduce false-red or false-green conditions | Phase 16 - Test Harness / Fixture Governance / Pass 3 | high | Required seam: Playwright teardown governance |
| P2-WORKFLOW-001 | Workflow trigger clarity and docs-only branch expectations need to stay explicit | S2 High-value stabilization | CI/GitHub Actions | Pass 0, Pass 3, Pass 1 | Audit-only branches do not auto-run the same workflow matrix as the integration branch | Planning and verification expectations drift if branch-trigger rules are forgotten | Phase 19 - Roadmap / Deferred Ledger Reconciliation / Pass 1 | medium | Collapses workflow trigger clarity and docs-only workflow expectations |
| P2-DOCS-001 | One referenced Phase 13 artifact path is missing | S2 High-value stabilization | Docs/roadmap | Handoff Pass 1, `rg --files docs/audits/phase13` | `docs/audits/phase13/pass6_gui_authority_and_verification_surface_audit.md` is referenced in prompts but does not exist at that path | Missing audit references weaken traceability and can lead to invented context in later handoffs | Phase 19 - Roadmap / Deferred Ledger Reconciliation / Pass 1 | medium | Required seam: missing Pass 6 artifact path |
| P2-EVID-001 | Human-verification screenshots are not committed repo artifacts | S2 High-value stabilization | Operator workflow | Pass 1, Pass 26, operator-observed screenshots | The strongest current runtime contradictions are partly preserved only in chat screenshots and operator notes | Evidence exists, but it is not yet repo-native and therefore remains weaker for future audit continuity | Phase 19 - Roadmap / Deferred Ledger Reconciliation / Pass 1 | medium | Required seam: human screenshots not committed as repo artifacts |
| P2-GUI-001 | Snapshot control surface is still overloaded | S3 Future improvement | Renderer/UI | Pass 15, Pass 17, Pass 26 | Snapshot, verify, refresh, reveal, manifest, report, details, restore, and backup controls remain distributed across a broad surface | The broader the surface, the more ways authority semantics can drift | Phase 17 - GUI Authority Simplification / Pass 2 | non-blocking | Duplicate normalization: includes focus-button migration note as a secondary GUI-authority concern |
| P2-REF-001 | Shared authority logic still has deferred refactor pressure | S3 Future improvement | Renderer/UI | Pass 22, Pass 26, tracker | Path resolution, report semantics, detail semantics, and refresh logic remain split across renderer, preload, and backend | Continued duplication raises the odds of future drift even after semantics are reconciled | Phase 14 - Authority Reconciliation / Pass 4 | non-blocking | Refactor only after semantic decisions; do not start in Phase 13 |
| P2-MIGRATE-001 | New GUI migration requires an explicit authority gate | S1 Closure-critical | Docs/roadmap | Pass 26, Pass 1, Pass 17 | Future GUI promotion can magnify unresolved authority contradictions if it ships before a stable model exists | Migration without a gate would spread the same ontology problem into a larger surface | Phase 18 - New GUI Migration Gate / Pass 1 | blocker | Includes future Focus deprecation/migration note |
| P2-ROADMAP-001 | Deferred-work normalization is incomplete until the trilogy is finished | S2 High-value stabilization | Docs/roadmap | Phase 13 plan, Pass 1, Pass 26, tracker | The unresolved work is now mapped, but final sequencing and phase allocation are not yet locked | Without Pass 3, the ledger is informative but not yet a full handoff program | Phase 19 - Roadmap / Deferred Ledger Reconciliation / Pass 2 | medium | Pass 3 owns final sequencing, not this document |

## Duplicate Normalization

This ledger intentionally collapses several repeated findings into root items instead of repeating symptom-level entries.

- `P2-SNAP-001` absorbs:
  - verified snapshot but missing manifest
  - verified snapshot but missing physical directory
  - UI says verified while integrity unavailable
  - historical verification treated as current integrity
- `P2-REPORT-001` absorbs:
  - stale report freshness undefined
  - orphaned verification records
  - report availability semantics
- `P2-RESTORE-001` absorbs:
  - restore advertised but restore invalid
  - restore latest ZIP validation clarity
  - backup/restore authority mapping
- `P2-BROWSE-001` absorbs:
  - browseable vs restorable ambiguity
  - local browsing vs verified browsing distinction
- `P2-DEGRADE-001` absorbs:
  - degraded-state semantics unclear
  - missing manifest behavior
  - missing snapshot directory behavior
- `P2-HARNESS-001` absorbs:
  - fixture/test contract governance
  - materialized-fixture witness limits

## Phase Destination Recommendations

- `Phase 14 - Authority Reconciliation`
  - `P2-SNAP-001`
  - `P2-ALIAS-001`
  - `P2-REPORT-001`
  - `P2-REF-001`
- `Phase 15 - Backup / Restore Authority Hardening`
  - `P2-RESTORE-001`
  - `P2-BROWSE-001`
- `Phase 16 - Test Harness / Fixture Governance`
  - `P2-TRUTH-001`
  - `P2-HARNESS-001`
  - `P2-SYNTH-001`
  - `P2-TEARDOWN-001`
- `Phase 17 - GUI Authority Simplification`
  - `P2-DEGRADE-001`
  - `P2-GUI-001`
- `Phase 18 - New GUI Migration Gate`
  - `P2-MIGRATE-001`
- `Phase 19 - Roadmap / Deferred Ledger Reconciliation`
  - `P2-WORKFLOW-001`
  - `P2-DOCS-001`
  - `P2-EVID-001`
  - `P2-ROADMAP-001`
- `Phase 20+ - Future research / feature gates`
  - no new runtime feature gates are allocated here yet; this remains intentionally deferred until sequencing is finalized in Pass 3

## Blocker Summary

### Closure blockers

- `P2-SNAP-001` snapshot authority ontology overload
- `P2-ALIAS-001` alias drift at the loaded-root boundary
- `P2-REPORT-001` report freshness / report semantics gap
- `P2-RESTORE-001` restore availability versus restore validity divergence
- `P2-BROWSE-001` browseable versus safe/restorable ambiguity
- `P2-DEGRADE-001` inconsistent degraded-state semantics
- `P2-TRUTH-001` truth-lane overreach risk
- `P2-HARNESS-001` fixture/harness governance gap
- `P2-MIGRATE-001` no explicit new-GUI authority gate yet

### Phase 14 entry blockers

- Canonical truth for snapshot existence is still undecided
- Canonical truth for current integrity versus historical verification is still undecided
- Canonical loaded-root authority in alias cases is still undecided

### Human verification blockers

- Operator screenshots are not repo-native artifacts
- Missing/stale/orphaned report and directory semantics remain unresolved
- Restore validation semantics remain unclear from the user’s point of view

### Roadmap blockers

- Final sequencing is intentionally deferred to Pass 3
- One referenced Pass 6 artifact path is missing and should be reconciled before later handoff reuse

### Non-blocking future improvements

- GUI surface simplification
- small helper extraction after semantics settle
- explicit new-GUI migration/deprecation notes

## What Pass 2 Does Not Decide

- This ledger does not implement fixes.
- This ledger does not close Phase 13.
- This ledger does not define final roadmap sequencing.
- That belongs to Handoff Pass 3.

## Recommended Next Step

Recommend Handoff Pass 3 only:

- `docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md`
