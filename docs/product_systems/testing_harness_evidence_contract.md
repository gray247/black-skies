# Testing / Harness / Evidence Contract

## 1. Status Header

- Dossier name: `Testing / Harness / Evidence Contract`
- Status: `drafted`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: all build-bearing systems
- Feeds into: implementation planning, validation, and operational confidence
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `no`
- Hidden/background: `yes`

## 2. Purpose

Define the testing, harness, and evidence expectations that must exist before runtime behavior can be trusted or marked verified.
This dossier inherits evidence, protection, provenance, and degraded-mode boundaries from `truth_and_state_ownership_matrix.md`, `surface_to_owner_action_handoff_contract.md`, `ai_lifecycle_and_approval_matrix.md`, `protected_content_permission_matrix.md`, `provenance_state_model.md`, `degraded_mode_execution_contract.md`, and `snapshot_protected_recovery_contract.md`.

## 3. User Problem Solved

The project needs proof that critical behavior, boundaries, and recovery rules actually hold rather than being assumed from doctrine alone.

## 4. What The System Does

- define evidence expectations,
- define test harness expectations,
- define verification boundaries.

## 5. What The System Does Not Do

- replace product doctrine,
- mark behavior verified without evidence,
- treat exploratory runtime behavior as accepted law.

## 6. User-Facing Behavior

Mostly non-user-facing; visible impact is higher confidence and clearer failure proof.

## 7. Hidden/Background Behavior

Background harnesses and evidence collection may exist to support validation and regression protection.

## 8. What Appears First

- evidence expectations,
- core verification status,
- failure proof when behavior breaks.

## 9. What Is Summonable

- harness detail,
- test coverage views,
- evidence artifacts.

## 10. What Is Hidden Until Needed

- dense internal harness detail,
- low-level evidence logs.

## 11. Inputs

- doctrine,
- implementation behavior,
- test runs,
- evidence artifacts.

## 12. Outputs

- verification state,
- evidence records,
- regression proof,
- coverage expectations.

## 13. Which Other Systems Consume Those Outputs

- implementation planning
- validation workflows
- operational confidence reporting

## 14. What Gets Stored

- evidence records,
- harness metadata,
- verification history where needed.

## 15. What Remains Temporary

- transient run output,
- scratch evidence during active debugging.

## 16. Relationship To Narrative Insertion / Assertion

Testing proves behavior around narrative systems but does not own narrative truth.

## 17. Relationship To Story Units

Story Unit behavior must be proved, not merely assumed.

## 18. Relationship To Prose / Scene Projection

Projection distinctions must be testable and evidenced.

## 19. Relationship To Writing Surface

Writing Surface sovereignty must be testable and evidenced.

## 20. Relationship To Command Center Surface

Command Center non-gating behavior must be testable and evidenced.

## 21. GUI Placement Principles

Testing support is not a default end-user dashboard.

## 22. Local LLM Role

Any AI-assisted test support remains secondary to actual evidence.

## 23. Paid API Role

Paid tooling is optional and cannot replace real verification.

## 24. Model Routing Notes And Cost / Budget Impact

Any AI-assisted test workflows remain route-governed and optional.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Evidence and harness tooling must respect protected-content boundaries.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Logs, fixtures, and evidence must avoid leaking protected material.

## 27. Testing Requirements

This dossier defines testing requirements; it must require reproducible evidence for verification.

## 28. Governance Rules And Risks

- no claim of verification without evidence,
- no doctrine drift through unproved behavior,
- no hidden protected-data leakage in evidence artifacts.

## 29. Failure Modes

If evidence collection fails, verification claims must stay blocked.

## 30. v1 Boundary

Core evidence contract and minimal harness expectations.

## 31. v2 Boundary

Richer system-level and cross-surface evidence workflows.

## 32. Future-Only Boundary

Large-scale automated evidence platforms.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from `# 33. Testing / Evidence / Harness Questions`, `## Harness / Fixture Authority`, and `## Testing Edge Cases`
- stale placeholder questions removed or superseded: yes
- active question count after merge: 11
- remaining blocker summary: `2 Fatal`, `4 Critical`, `2 Major`
- remaining blocker summary: `0 Fatal`, `4 Critical`, `2 Major`

### Fatal Questions

- None. Reproducible evidence is mandatory, but exact thresholds and allowed fakes remain under active contract work.

### Critical Questions

- Critical: what evidence boundaries apply to privacy, masking, protected material, and truth-mutation behavior?
- Critical: what proof is required for "no API call happened," "no real file delete happened," "AI output stayed advisory," "projection did not become authority," and "Writing Surface remained available"?
- Critical: how must the test environment be prevented from changing live settings, using real API keys, using real project folders, or deleting anything outside temporary test space?
- Critical: how should the project treat green tests when manual app behavior fails, local Windows runs fail, CI passes through harness shortcuts, or fake outputs hide real integration failures?

### Major Questions

- Major: how much harness structure should be standardized across app and services without forcing false uniformity across very different surfaces?
- Major: which old tests, fixtures, or evidence patterns are safe to carry forward, and which create false confidence because they encode old authority or startup assumptions?

### Minor Questions

- Minor: what terminology best distinguishes test, harness, fixture, evidence, verification, and debug proof for writers versus operators?

### Answered / Superseded Questions

- Do not mark an issue verified without reproducible evidence.
- Do not mark an issue verified without reproducible evidence.
- Green tests do not equal closure by themselves.
- Fake outputs must never be easy to confuse with live truth.
- Harness success cannot override governance contracts.
- Test fixtures must not silently become runtime truth.
- Evidence labels must distinguish docs, runtime behavior, fixture behavior, degraded behavior, and live-service behavior.
- Questions better owned elsewhere: exact runtime failure messaging belongs primarily to diagnostics and degraded-mode dossiers.

### Deferred Questions

- Deferred: exact coverage metrics, reporting formats, and CI policy thresholds.

## 34. Acceptance Criteria

This dossier is acceptable only if verification remains evidence-based and bounded.
