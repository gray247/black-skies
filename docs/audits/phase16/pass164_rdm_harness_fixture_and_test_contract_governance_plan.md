# Pass 164 - RDM-HARNESS-001 Fixture and Test Contract Governance Plan

## 1. Files Inspected
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase16/pass163_post_phase15_roadmap_status_and_next_lane_selection.md`
- `docs/roadmap/master_phase_allocation_plan.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/roadmap/authority_reconciliation_strategy.md`
- `docs/phases/phase_charter.md`
- `docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md`
- `docs/handoffs/phase13_handoff_pass3_future_roadmap_and_phase_allocation.md`
- `docs/audits/phase14/wrapper_launcher_cwd_audit.md`
- `docs/audits/phase14/recovery_load_project_switch_continuity_audit.md`

## 2. RDM-HARNESS-001 Scope
- Govern fixture materialization, harness witness limits, and test contracts so green lanes do not overstate runtime truth.
- Define what the harness proves, what it only suggests, and what it cannot prove.
- Keep fixture-backed witness behavior separate from real filesystem, backend, and operator truth.

## 3. Problem This Lane Solves
- Prevent fake-green harness drift.
- Prevent fixture completeness from being mistaken for runtime correctness.
- Prevent negative-toast, teardown, and synthetic success from being read as full operational safety.
- Make fixture roots, alias roots, and seeded project state explicit enough that harness evidence stays bounded.

## 4. What This Lane Must Not Solve
- It must not implement runtime behavior changes.
- It must not fix backup / restore authority again.
- It must not reopen restore-as-copy.
- It must not reopen `sc_0001` scene authority.
- It must not start GUI cleanup, wrapper/launcher work, or truth-lane work.
- It must not promote fixture evidence into real project proof.

## 5. Known Risks From Prior Phases
- Alias-root drift can make harness fixtures look healthier than live runtime.
- Harness-only startup or service overrides can hide missing live continuity.
- Synthetic mode can look like real service truth if its limits are not explicit.
- Teardown stability can regress into false-red or false-green conditions.
- Green UI lanes can still overstate filesystem or restore safety.

## 6. Existing Evidence Sources / Test Witnesses
- Tracker history for alias drift, harness drift, restore authority, and continuity caveats.
- Phase 13 handoff trilogy for original fixture and harness assumptions.
- `wrapper_launcher_cwd_audit.md` for wrapper/CWD distortion risk.
- `recovery_load_project_switch_continuity_audit.md` for stale-state and cross-project continuity risk.
- Existing Playwright and Vitest lanes that already act as witnesses, not proof by default.

## 7. Test Contracts That Need Explicit Governance
- Fixture materialization must agree on project identity, outline identity, and required snapshot directories/files.
- HARNESS_ONLY Playwright lanes must state that they prove harness-scoped behavior only.
- Truth-lane results must not be overstated as full runtime proof.
- Synthetic-mode lanes must explicitly declare when they are synthetic-only.
- Teardown lanes must preserve negative-toast visibility and deterministic cleanup.

## 8. Fixture Authority Questions
- Which root is authoritative for a given harness run?
- Which alias mapping is canonical for the seeded project?
- Which files are required for the fixture to count as complete?
- Which state belongs to the fixture and which state must come from live runtime?
- When does fixture completeness stop being enough and require human or runtime validation?

## 9. Out-of-Scope Domains
- Phase 15 backup / restore authority
- Restore-as-copy
- `sc_0001` scene-authority cleanup
- GUI redesign
- Launcher / splash / workflow work
- Wrapper / launcher / CWD remediation itself
- Truth-lane implementation
- Export / packaging
- Memory Lab

## 10. Proposed Next Implementation Pass Boundaries
- Narrow to fixture contract fields, harness witness rules, and explicit evidence labels.
- Update only the minimum test / fixture docs and any mapping docs needed to express the contract.
- Do not broaden into runtime fixes or UI polish.
- Preserve existing harness green paths while clarifying what they do not prove.

## 11. Agent Mode Usefulness
- Yes.
- Agent mode would be useful for the implementation pass because this lane will likely touch multiple harness and contract files and benefit from tighter coordination.

## 12. Human Spot-check Requirement
- Not before implementation starts.
- A focused human spot-check is recommended after implementation because the lane is about proof boundaries, and the closure should confirm the new contract language matches observed harness behavior.

## 13. Final Recommendation
- Proceed with `RDM-HARNESS-001` as a planning-guided implementation lane.
- Keep it narrow, evidence-driven, and harness-scoped.
- Do not conflate harness completeness with runtime authority.
