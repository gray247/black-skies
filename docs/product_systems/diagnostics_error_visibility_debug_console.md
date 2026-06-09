# Diagnostics / Error Visibility / Debug Console

## 1. Status Header

- Dossier name: `Diagnostics / Error Visibility / Debug Console`
- Status: `drafted`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Service Health / Offline / Degraded Mode`
- Feeds into: operators, support surfaces, and later evidence workflows
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `partial`
- Hidden/background: `yes`

## 2. Purpose

Define bounded diagnostics and error visibility so failures can be understood without turning debug views into everyday workflow clutter or exposing protected content carelessly.

## 3. User Problem Solved

The writer and operator need actionable failure visibility without losing writing flow or exposing raw internals unnecessarily.

## 4. What The System Does

- surface errors,
- expose bounded diagnostics,
- support debugging and evidence gathering.

## 5. What The System Does Not Do

- become a primary writing surface,
- expose protected content casually,
- hide serious failures.

## 6. User-Facing Behavior

Visible behavior should scale from simple actionable messages to deeper diagnostic views on demand.

## 7. Hidden/Background Behavior

Background logging may exist, but it must stay bounded and privacy-aware.

## 8. What Appears First

- clear actionable error state,
- safe summary,
- next recovery step when known.

## 9. What Is Summonable

- deeper diagnostics,
- debug console,
- evidence details.

## 10. What Is Hidden Until Needed

- raw logs,
- stack-level detail,
- verbose internals.

## 11. Inputs

- runtime errors,
- service health state,
- job failures,
- operator actions.

## 12. Outputs

- error messages,
- diagnostics views,
- debug traces,
- evidence artifacts.

## 13. Which Other Systems Consume Those Outputs

- operators
- support surfaces

## 14. What Gets Stored

- diagnostic records,
- error summaries,
- evidence markers where needed.

## 15. What Remains Temporary

- transient debug sessions,
- temporary console output,
- unsaved traces.

## 16. Relationship To Narrative Insertion / Assertion

Diagnostics describe runtime state, not narrative truth.

## 17. Relationship To Story Units

No special Story Unit authority exists here.

## 18. Relationship To Prose / Scene Projection

Projection failures may be diagnosed here without changing projection authority.

## 19. Relationship To Writing Surface

Diagnostics should not crowd the Writing Surface by default.

## 20. Relationship To Command Center Surface

The Command Center may expose support-level error visibility when appropriate.

## 21. GUI Placement Principles

Keep routine error visibility actionable and bounded; reserve dense detail for summonable views.

## 22. Local LLM Role

Not required for core diagnostics.

## 23. Paid API Role

Not required for core diagnostics.

## 24. Model Routing Notes And Cost / Budget Impact

Diagnostic systems must not silently create paid work.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Logs and evidence must respect protected-content rules.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Diagnostics must avoid leaking hidden, masked, or excluded content casually.

## 27. Testing Requirements

Prove errors remain visible, actionable, and privacy-aware.

## 28. Governance Rules And Risks

- no hidden failure state,
- no casual protected-data exposure,
- no debug-clutter takeover.

## 29. Failure Modes

If diagnostics fail, visible error summaries should still appear.

## 30. v1 Boundary

Basic error visibility and bounded diagnostic detail.

## 31. v2 Boundary

Richer evidence collection and debug workflows.

## 32. Future-Only Boundary

Deep automated diagnostics interpretation.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, but the raw source was thin and partially ambiguous; most useful intake came from degraded-mode and old-diagnostics questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `1 Fatal`, `3 Critical`, `2 Major`

### Fatal Questions

- Fatal: what diagnostic outputs are too sensitive for normal views, error bundles, or console surfaces because they may expose hidden, masked, excluded, deleted, or credential-bearing material?

### Critical Questions

- Critical: what information must always be visible when work is blocked or failing so the user gets a truthful summary and next safe step even if deeper diagnostics fail?
- Critical: when may diagnostics show source passages, raw logs, or evidence trails versus only protected summaries, and what boundaries stop protected content from leaking into everyday error visibility?
- Critical: what makes a diagnostic artifact a witness or evidence bundle rather than proof or closure, and how do diagnostics avoid silently becoming truth or verification authority?

### Major Questions

- Major: how much diagnostic detail belongs in `Command Center Surface` versus a deeper console versus a support-only export bundle?
- Major: how much bounded failure history should be stored by default, and when should old or resolved diagnostics remain visible as history?

### Minor Questions

- Minor: what user-facing naming best separates error state, diagnostics, evidence bundle, and debug console?

### Answered / Superseded Questions

- The Command Center must not become a junk drawer by default.
- The Command Center must not become a junk drawer by default.
- Diagnostics should not crowd the Writing Surface by default.
- Diagnostics and error visibility are witnesses, not proof.
- Questions better owned elsewhere: exact degraded-mode transition policy belongs primarily to `service_health_offline_degraded_mode.md`, and exact verification claims belong primarily to `testing_harness_evidence_contract.md`.

### Deferred Questions

- Deferred: exact log-retention, evidence-export, and operator-access rules.

## 34. Acceptance Criteria

This dossier is acceptable only if diagnostics stay useful, bounded, and privacy-aware.
