# Splash / Startup Experience

## 1. Status Header

- Dossier name: `Splash / Startup Experience`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-09`
- Depends on: `Writing Surface`, `Command Center Surface`, `Service Health / Offline / Degraded Mode`
- Feeds into: `Writing Surface`, `Command Center Surface`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define application startup and project-opening experience so the writer
can enter work quickly without the startup surface becoming a cluttered
dashboard, a hidden restore owner, or a gate to writing.

## 3. User Problem Solved

The writer needs a fast, clear start path into work, especially when
services are degraded, support systems are unavailable, or prior session
state is uncertain.

## 4. What The System Does

- establish basic application posture,
- distinguish ordinary startup from project opening,
- route the writer quickly into active work,
- restore safe presentation and resume cues quietly when conditions are
  healthy,
- surface recovery-first or degraded entry only when risk, failure, or
  uncertainty justifies it.

## 5. What The System Does Not Do

- become a dashboard junk drawer,
- force detours before writing,
- own workspace state, save truth, workflow truth, or recovery
  artifacts,
- hide degraded-state warnings that matter.

## 6. User-Facing Behavior

Visible behavior should emphasize quick entry, clarity, and bounded
re-entry help without treating every reopen as recovery.

## 7. Hidden/Background Behavior

Background checks may prepare the app, project, and support systems, but
they must not gate direct writing unnecessarily.
Ordinary startup may restore a safe Writing Surface path, selected
project, workspace posture, and bounded re-entry context quietly when
those states are available and trustworthy.
Crash, risk, repair, read-only, safe-mode, or recovery-first posture
must remain separate from ordinary reopen behavior.

## 8. What Appears First

- direct return to the last safe writing path when available,
- project-open choice when no safe direct return exists,
- essential status when relevant,
- clear path to direct writing.

## 9. What Is Summonable

- deeper startup diagnostics,
- recent projects,
- optional support status,
- bounded `Where was I?` or resume explanation when the author asks for
  it.

## 10. What Is Hidden Until Needed

- dense diagnostics,
- full service detail,
- heavy guidance panels,
- recovery review detail when ordinary startup is still safe.

## 11. Inputs

- last-session state,
- project availability,
- service health signals,
- workspace-restoration posture,
- save-risk posture,
- recovery or degraded-entry posture when present.

## 12. Outputs

- startup navigation,
- resume cues,
- ordinary project-opening route,
- bounded re-entry summary when justified,
- degraded-state messaging.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`

## 14. What Gets Stored

- last-opened project state,
- startup preferences,
- bounded resume metadata,
- startup-entry posture markers that remain distinct from save truth and
  recovery artifacts.

## 15. What Remains Temporary

- transient startup warnings,
- current-session prompts,
- generated summaries shown only for the current reopening.

## 16. Relationship To Narrative Insertion / Assertion

Startup experience does not change narrative authority and does not
prove manuscript integrity.

## 17. Relationship To Story Units

Story Unit context may be resumable, but Story Units remain optional.

## 18. Relationship To Prose / Scene Projection

Projection context may be resumed without becoming a startup authority
layer or proof that projected state is current.

## 19. Relationship To Writing Surface

Startup should prefer a fast path into the sovereign Writing Surface.
If prior layout, monitor, or support conditions cannot be restored
safely, startup should fall back to a valid single-monitor posture with
Writing Surface primary rather than forcing a broken arrangement.

## 20. Relationship To Command Center Surface

Startup may expose support status without requiring the Command Center
first.
Command Center remains support review, not a mandatory startup guide.

## 21. GUI Placement Principles

Avoid turning startup into a dashboard or blocker.
Ordinary startup, project opening, workspace restoration, session
re-entry, unsaved-work disclosure, and crash or recovery restoration
must remain visibly distinct lifecycles even when they cooperate.

## 22. Local LLM Role

Not required for core startup behavior.
AI unavailability must not block safe local startup into writing.

## 23. Paid API Role

Not required for core startup behavior.

## 24. Model Routing Notes And Cost / Budget Impact

Startup must not silently trigger paid or heavy work.
Generated summaries, if any, must be visibly summaries rather than
claimed owner truth.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Startup must not expose protected content inadvertently through startup,
resume, summaries, or restore cues.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Private project cues must stay bounded.
Unavailable, excluded, or protected content must degrade to safe
absence, summary, or owner-routed explanation rather than silent
leakage.

## 27. Testing Requirements

Prove startup reaches writing quickly, keeps ordinary reopen distinct
from recovery-first entry, and handles degraded modes safely.

## 28. Governance Rules And Risks

- no startup junk drawer,
- no hidden gating,
- no silent expensive work,
- no recovery-language takeover during ordinary reopen,
- no startup-as-save-authority.

## 29. Failure Modes

If startup preparation fails, the app should degrade to a safe local
entry path.
If project open, workspace restoration, or recovery review cannot
proceed normally, startup must expose the narrower posture honestly
rather than pretending the ordinary reopen path succeeded.

## 30. v1 Boundary

Basic application startup, project-opening distinction, quiet workspace
restoration, bounded re-entry cues, and degraded-state disclosure.

## 31. v2 Boundary

Richer re-entry context, on-demand `Where was I?`, and optional startup
assistance.

## 32. Future-Only Boundary

Complex orchestration or heavily personalized startup flows.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from startup-screen, project-open, safe-mode, and startup-log questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `3 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: what startup state is essential versus clutter, especially recent project access, blocked or degraded status, and direct entry into active writing?
- Critical: what safe startup fallbacks must exist when a project will not open, a subsystem causes a crash loop, or the normal startup path is unavailable?
- Critical: which startup actions are allowed to run automatically at launch, and which must never silently trigger paid, outbound, heavy, or protected-content-sensitive work?

### Major Questions

- Major: how much degraded-state or blocker detail belongs at startup versus later support views such as `Command Center Surface`, degraded-mode views, or diagnostics surfaces?
- Major: what resume state is actually helpful at startup without turning the splash surface into a dashboard, onboarding prison, or project-authority layer?
- Jason decision candidate: should the earliest startup surface be a true splash, a lightweight launcher, or a near-immediate project resume handoff with only bounded status?

### Minor Questions

- Minor: should `Splash`, `Startup`, `Welcome`, or `Open Project` be the writer-facing language?

### Answered / Superseded Questions

- Command Center supports writing and does not gate it.
- Startup must not gate direct writing or silently trigger heavy work.
- Questions better owned elsewhere: exact degraded-mode transitions belong primarily to `service_health_offline_degraded_mode.md`, and deeper startup logging/evidence rules belong primarily to `diagnostics_error_visibility_debug_console.md` and `testing_harness_evidence_contract.md`.

### Deferred Questions

- Deferred: exact startup animation, polish, and first-run copy rules.

## 34. Acceptance Criteria

This dossier is acceptable only if startup remains quick, clear, and non-gating.
