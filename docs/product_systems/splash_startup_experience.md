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

Define startup and opening experience so the writer can enter work quickly without the startup surface becoming a cluttered dashboard or a gate to writing.

## 3. User Problem Solved

The writer needs a fast, clear start path into work, especially when services are degraded or support systems are unavailable.

## 4. What The System Does

- open the app cleanly,
- expose safe startup status,
- route the writer quickly into active work.

## 5. What The System Does Not Do

- become a dashboard junk drawer,
- force detours before writing,
- hide degraded-state warnings that matter.

## 6. User-Facing Behavior

Visible behavior should emphasize quick entry, clarity, and recovery from interruptions.

## 7. Hidden/Background Behavior

Background checks may prepare the app, but they must not gate direct writing unnecessarily.

## 8. What Appears First

- resume or open-work options,
- essential status when relevant,
- clear path to direct writing.

## 9. What Is Summonable

- deeper startup diagnostics,
- recent projects,
- optional support status.

## 10. What Is Hidden Until Needed

- dense diagnostics,
- full service detail,
- heavy guidance panels.

## 11. Inputs

- last-session state,
- project availability,
- service health signals.

## 12. Outputs

- startup navigation,
- resume cues,
- degraded-state messaging.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`

## 14. What Gets Stored

- last-opened project state,
- startup preferences,
- bounded resume metadata.

## 15. What Remains Temporary

- transient startup warnings,
- current-session prompts.

## 16. Relationship To Narrative Insertion / Assertion

Startup experience does not change narrative authority.

## 17. Relationship To Story Units

Story Unit context may be resumable, but Story Units remain optional.

## 18. Relationship To Prose / Scene Projection

Projection context may be resumed without becoming a startup authority layer.

## 19. Relationship To Writing Surface

Startup should prefer a fast path into the sovereign Writing Surface.

## 20. Relationship To Command Center Surface

Startup may expose support status without requiring the Command Center first.

## 21. GUI Placement Principles

Avoid turning startup into a dashboard or blocker.

## 22. Local LLM Role

Not required for core startup behavior.

## 23. Paid API Role

Not required for core startup behavior.

## 24. Model Routing Notes And Cost / Budget Impact

Startup must not silently trigger paid or heavy work.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Startup must not expose protected content inadvertently.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Private project cues must stay bounded.

## 27. Testing Requirements

Prove startup reaches writing quickly and handles degraded modes safely.

## 28. Governance Rules And Risks

- no startup junk drawer,
- no hidden gating,
- no silent expensive work.

## 29. Failure Modes

If startup preparation fails, the app should degrade to a safe local entry path.

## 30. v1 Boundary

Basic open, resume, and degraded-state cues.

## 31. v2 Boundary

Richer resume context and optional startup assistance.

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
