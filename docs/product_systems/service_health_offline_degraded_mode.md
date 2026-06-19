# Service Health / Offline / Degraded Mode

## 1. Status Header

- Dossier name: `Service Health / Offline / Degraded Mode`
- Status: `drafted`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-10`
- Depends on: `Writing Surface`, `Command Center Surface`, `Async Job Queue / Task Runner`
- Feeds into: all runtime-dependent systems
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `partial`
- Hidden/background: `yes`

## 2. Purpose

Define how Black Skies behaves when services are healthy, offline, degraded, refused, or partially unavailable without blocking direct writing.
This dossier inherits degraded-mode and failure-state boundaries from `truth_and_state_ownership_matrix.md`, `surface_to_owner_action_handoff_contract.md`, `ai_lifecycle_and_approval_matrix.md`, `protected_content_permission_matrix.md`, `provenance_state_model.md`, `degraded_mode_execution_contract.md`, and `snapshot_protected_recovery_contract.md`.

## 3. User Problem Solved

The writer needs the app to fail clearly and safely without losing access to local writing or misrepresenting unavailable AI or support features.

## 4. What The System Does

- detect health state,
- surface degraded or offline status,
- constrain unavailable operations safely.

## 5. What The System Does Not Do

- hide critical failures,
- pretend unavailable services are working,
- block direct writing unnecessarily.

## 6. User-Facing Behavior

Visible behavior should emphasize clear status, honest save-state cues, fallback paths, and continued local writing.
Degraded support state should identify the affected capability and
available fallback without overstating project or manuscript failure.

## 7. Hidden/Background Behavior

Background checks may track service state, but health monitoring does not create product authority.

## 8. What Appears First

- relevant availability state,
- direct writing path,
- actionable fallback cues when needed.
Ordinary healthy service state should remain quiet or invisible.

## 9. What Is Summonable

- deeper health detail,
- failure history,
- retry paths,
- diagnostics detail when the author asks for deeper support evidence.

## 10. What Is Hidden Until Needed

- dense diagnostics,
- low-level service internals,
- non-relevant service detail during ordinary writing.

## 11. Inputs

- service state,
- routing state,
- local capability state,
- approval and budget blockers.

## 12. Outputs

- health status,
- degraded-mode cues,
- blocked or fallback state,
- bounded labels for affected capability, owner, and fallback posture.

## 13. Which Other Systems Consume Those Outputs

- all runtime-dependent systems

## 14. What Gets Stored

- recent health state,
- bounded failure history,
- availability markers.

## 15. What Remains Temporary

- current outage state,
- transient retry conditions.

## 16. Relationship To Narrative Insertion / Assertion

Health state affects support availability, not truth ownership.

## 17. Relationship To Story Units

No special Story Unit authority exists here.

## 18. Relationship To Prose / Scene Projection

Projection support may degrade, but accepted text remains distinct.

## 19. Relationship To Writing Surface

Direct writing must remain available during degraded or offline modes when local editing is possible.
This dossier should help show whether writing is saved, pending, degraded, recoverable, or at risk without confusing those states with Google Docs sync or cloud availability.
`Project Persistence / Local Save` owns whether the current editable
work is actually confirmed saved locally; health consumes that state but
does not create it.

## 20. Relationship To Command Center Surface

The Command Center may host deeper availability or blocker views without becoming mandatory for writing.
Those views should clarify what capability is affected, whether writing
itself is blocked, and what fallback remains.

## 21. GUI Placement Principles

Keep availability state visible when relevant, not as permanent clutter.
Generic `offline` language must not swallow route refusal, approval
denial, blocked outbound work, or support-only degradation.

## 22. Local LLM Role

Local AI availability is one health dimension.

## 23. Paid API Role

Paid-path availability is another health dimension and must reflect approval and spend blockers accurately.

## 24. Model Routing Notes And Cost / Budget Impact

Health state must align with routing, budget, and `no-ai-route-available` doctrine.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Degraded state must not bypass explicit-content restrictions.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Fallback behavior must preserve privacy and protection boundaries.
Health notices, degraded summaries, and fallback explanations must not
leak protected source contents.

## 27. Testing Requirements

Prove offline and degraded states stay accurate and preserve direct writing.

## 28. Governance Rules And Risks

- no false-healthy state,
- no writing gate through service failure,
- no unsafe fallback,
- no support failure presented as manuscript failure.

## 29. Failure Modes

If health reporting fails, the app should prefer safe local assumptions and preserve writing.
Health ambiguity must not hide when recent writing is still pending or recovery-first.

## 30. v1 Boundary

Basic healthy, offline, degraded, and blocked-state handling.

## 31. v2 Boundary

Richer fallback and recovery guidance.

## 32. Future-Only Boundary

Deep predictive health orchestration.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from `## Degraded Mode` and failure-edge-case questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 10
- remaining blocker summary: `0 Fatal`, `0 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

### Major Questions

- Major: how much health detail belongs in primary surfaces by default versus deeper diagnostics or blocker views?
- Major: should degraded mode explain exactly what broke, remain intentionally calm, and offer recovery steps in one place, and how much of that belongs in the Command Center versus a lighter status cue?
- Major: when should degraded mode create diagnostic bundles or bounded failure history automatically versus only on explicit author action?

### Minor Questions

- Minor: what wording best distinguishes offline, blocked, refused, degraded, unavailable, and read-only fallback?

### Answered / Superseded Questions

- Direct writing must remain available when local editing is still possible.
- Route failure, approval denial, budget block, service outage, refused execution, and degraded capability are distinct states governed by the degraded-mode execution contract rather than a single generic offline blob.
- Degraded mode may keep direct writing, read-only open, safe copy, snapshot creation, backup export, and project repair available when the owning contracts permit it.
- Destructive, truth-mutating, or recovery-worsening actions remain forbidden in degraded mode unless a separate governing contract explicitly allows them.
- Superseded by current doctrine: degraded operation must not bypass explicit-content restrictions, privacy boundaries, or approval rules.
- Health reporting must not create false-healthy state.
- Google Docs-like instant-save expectation belongs to local persistence and recovery posture, not to cloud-sync success claims.
- `Project Persistence / Local Save` owns durable local current-save
  confirmation; health state may report degraded capability or blocked
  persistence but does not prove that a write landed.

### Deferred Questions

- Future contract need: what safe-mode or startup-bypass paths are required when bad settings, bad projects, or broken subsystems cause crash loops or prevent normal recovery?
- Future contract need: what exact saved, pending, degraded, recoverable, and at-risk state vocabulary should appear during offline or degraded writing so local persistence risk is honest without implying cloud or sync guarantees?
- Deferred: exact telemetry, heartbeat, and alert thresholds.

## 34. Acceptance Criteria

This dossier is acceptable only if degraded operation remains truthful, safe, and non-gating.
