# Workflow Spine / Author Journey

## 1. Status Header

- Dossier name: `Workflow Spine / Author Journey`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-19`
- Depends on: `Writing Surface`, `Command Center Surface`, `Narrative Insertion / Narrative Assertion`
- Feeds into: `Writing Surface`, `Command Center Surface`, `Companion`
- Runtime authority: `future`
- Authority level: `advisory`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define the workflow spine as a writer-guidance layer that organizes
movement through drafting, review, revision, re-entry, and support
actions without becoming a gate or a truth owner.

This dossier inherits its authority and handoff limits from `truth_and_state_ownership_matrix.md`, `surface_to_owner_action_handoff_contract.md`, `ai_lifecycle_and_approval_matrix.md`, `protected_content_permission_matrix.md`, `shared_output_vocabulary_contract.md`, `provenance_state_model.md`, and `degraded_mode_execution_contract.md`.

## 3. User Problem Solved

The writer needs coherent workflow guidance without being forced through rigid setup, dashboard ceremony, or hidden authority systems.

## 4. What The System Does

- organize likely writing and revision paths,
- suggest next useful actions,
- coordinate handoffs among support systems,
- retain broader re-entry, return-path, and cross-surface handoff
  posture without owning workspace configuration,
- provide bounded session re-entry help and on-demand `Where was I?`
  posture using owner-labeled state,
- summarize editorial progress without owning notes, signals, rewrite candidates, or accepted prose,
- retain workflow and journey support state only, including re-entry posture, next-step guidance, approval checkpoints, and owner-labeled summaries.

## 5. What The System Does Not Do

- gate direct writing,
- own manuscript truth,
- own accepted project truth,
- maintain a competing authoritative copy of `Author Intent / Story Setup`,
- convert workflow completion into project-truth acceptance,
- infer project intent and store it as accepted,
- prove current-save integrity, recovery safety, or workspace
  restorability,
- silently trigger heavy, paid, outbound, or destructive actions.

## 6. User-Facing Behavior

Visible behavior should stay lightweight, writer-first, optional, and free of manual-save ritual demands before writing can continue.
It may reference active surface workspaces and recent handoffs, but
workflow posture remains distinct from workspace configuration.
Known stored facts, surface view state, temporary session context, and
generated summaries must remain distinguishable when workflow guidance
helps the author resume.

## 7. Hidden/Background Behavior

Background behavior may assemble workflow suggestions and bounded
re-entry summaries, but those suggestions remain advisory and do not
silently mutate owner state.

## 8. What Appears First

- current writing path,
- current blocker or next action when relevant,
- confidence that the author can resume writing without hunting for hidden save steps,
- last safe return posture when known,
- clear return to direct writing.

## 9. What Is Summonable

- workflow history,
- suggested next steps,
- support-system entry points,
- on-demand `Where was I?` using saved state, recent handoffs, and
  owner-labeled summaries.

## 10. What Is Hidden Until Needed

- heavy review state,
- dense workflow history,
- deep automation choices.

## 11. Inputs

- current writing state,
- accepted doctrine,
- support-system status,
- author actions,
- surface handoff markers,
- owner-provided save and recovery posture,
- active workspace references where available.

## 12. Outputs

- workflow suggestions,
- bounded status views,
- action handoffs,
- return-to-writing posture,
- labeled re-entry summaries that distinguish stored state from
  generated explanation,
- bounded references or summaries of owner-controlled project truth with source owner and freshness posture preserved.

## 13. Which Other Systems Consume Those Outputs

- `Writing Surface`
- `Command Center Surface`
- `Companion`

## 14. What Gets Stored

- workflow preferences,
- bounded progress state,
- author-approved workflow markers,
- editorial progress summaries that point back to note, signal, or producer owners rather than replacing them,
- references to active or last-used surface workspaces where useful for
  re-entry without owning their configuration,
- references to `Author Intent / Story Setup`,
- bounded re-entry posture such as last safe writing route, recent
  support handoff, and whether a summary was generated versus directly
  stored,
- non-authoritative project-intent summaries that preserve source owner, freshness, and whether the referenced owner state is current, stale, missing, or under review.

## 15. What Remains Temporary

- transient suggestions,
- current-session prompts,
- temporary next-step candidates,
- ephemeral recent-inspection context that should not become durable
  truth.

## 16. Relationship To Narrative Insertion / Assertion

The workflow spine may guide work around narrative actions, but it does not replace narrative foundation authority.

## 16A. Relationship To Author Intent / Story Setup

The old Wizard concept is now treated as a historical seed for Author Intent / Story Setup rather than as a rigid startup gate.
Author Intent / Story Setup now exists as its own dossier.
Accepted project truth belongs to `Author Intent / Story Setup` only.
The workflow spine may invite, surface, summarize, or route into that profile, but it does not own it.
Story Setup values may be known now, unknown, ask-later, tentative, confirmed by the author, or changed over time.
They may supply guidance to Outline, Critique, Companion, Draft Generation, Routing, and related systems, but they must not block direct writing.
Workflow completion, stage progression, and setup-step completion remain distinct from project-truth acceptance or project-truth change.
The workflow spine may mark an intent-setting step complete because the author skipped, deferred, or reviewed it without creating accepted project truth.
When workflow summaries and `Author Intent / Story Setup` disagree, `Author Intent / Story Setup` is authoritative.

## 17. Relationship To Story Units

Story Unit use remains optional.

## 18. Relationship To Prose / Scene Projection

Projection may support workflow context, but projection is not workflow authority.

## 19. Relationship To Writing Surface

The workflow spine must support the sovereign Writing Surface without gating direct writing.
It should reinforce a continuously saved feel for direct writing and
safe resume or recovery entry after interruption without turning
workflow status into save-state authority.
`Project Persistence / Local Save` owns current-save confirmation; the
workflow spine only consumes and summarizes that state.
It may retain handoff and return posture that helps the author get back
to the prior Writing Surface workspace or location, but it does not own
the underlying workspace configuration, manuscript anchor mechanism, or
displayed artifact state.
Restored location and workflow confidence must not be framed as proof
that the latest edits were durably saved.
It may summarize editorial posture such as `needs review`, `revision
underway`, or `ready for re-evaluation`, but those durable concerns
remain owned by `Feedback Notes / Revision Resolution` or
`Signal Architecture`.

## 20. Relationship To Command Center Surface

The Command Center may host heavier workflow review without becoming mandatory.
Cross-surface handoffs may contribute to journey posture and later
resume guidance, but those handoffs do not create truth, do not own the
surfaces they connect, and do not turn workflow state into layout
authority.
Workflow may reference `Command Center` review context during re-entry
or `Where was I?`, but it must preserve the distinction between support
inspection and the prior writing position.

## 21. GUI Placement Principles

Do not turn workflow support into a dashboard junk drawer.
Ordinary session re-entry, on-demand orientation, and recovery-first
entry must remain distinct even if workflow guidance contributes to all
three.

## 22. Local LLM Role

Local models may later help with suggestions only.

## 23. Paid API Role

Paid help, if later used, remains approval-governed.

## 24. Model Routing Notes And Cost / Budget Impact

Routing and spend remain governed outside this dossier.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Workflow guidance must respect masking and package rules.
Generated re-entry summaries must not leak protected or excluded content
that the current surface or owner would not expose directly.

## 26. Privacy / Safety / Censor Behavior, If Applicable

No hidden workflow path may bypass privacy or safety rules.
Missing, stale, blocked, or uncertain source state must be labeled as
such rather than quietly normalized into a confident resume story.

## 27. Testing Requirements

Prove that direct writing remains available, workflow guidance stays
advisory, and re-entry summaries remain visibly distinct from owner
truth.

## 28. Governance Rules And Risks

- no shadow workflow authority,
- no silent truth mutation,
- no hidden action gating,
- no workflow-as-save-proof,
- no summary-as-memory drift.

## 29. Failure Modes

If workflow guidance fails, the writer still writes directly.
Failure of `Where was I?`, re-entry summary, or handoff history must not
block project open, workspace restore, or safe local writing.

## 30. v1 Boundary

Minimal optional workflow guidance, support handoffs, re-entry posture,
and on-demand orientation.

## 31. v2 Boundary

Richer author-controlled workflow views, re-entry history, and bounded
summary controls.

## 32. Future-Only Boundary

Deep automation, full orchestration, or auto-run workflows.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from `# 8. Workflow Spine / Author Journey Questions`
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `4 Critical`, `2 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Future contract need: which project starting points must reach direct writing without required setup, and which may pass through optional support setup first?
- Future contract need: what workflow state is durable versus session-only, especially for resume, last-used context, and workflow-progress markers?
- Jason decision candidate: should workflow modes remain explicit user-chosen modes, lightweight context filters, or mostly invisible posture changes, and which visible tool changes are allowed when they switch?
- Future contract need: how should workflow guidance expose, revisit, or defer Author Intent / Story Setup without turning that profile into startup ceremony or hidden workflow authority?
- Future contract need: what exact resume and interruption contract should exist after crash, restart, degraded save state, or recovery-first entry so the author can continue writing without turning workflow markers into hidden canon or save authority?

### Major Questions

- Major: how much workflow guidance belongs in `Writing Surface` versus `Command Center Surface` versus optional startup or entry flows?
- Major: what are the bounded "happy path" and "chaos path" workflows for blank-page, fragmented, imported-manuscript, and revision-first writers without turning workflow support into a gate?

### Minor Questions

- Minor: what naming best fits writer-facing workflow cues, next steps, and mode language without implying hidden authority?

### Answered / Superseded Questions

- Direct writing must remain available.
- Workflow support does not own truth.
- `Author Intent / Story Setup` owns accepted project truth; workflow support may only reference or summarize it.
- Superseded by current doctrine: workflow support must not block typing or gate writing behind required setup.
- Save confidence and resume confidence should come from
  `Project Persistence / Local Save` plus recovery support, not from
  manual-save ritual or Google Docs sync assumptions.
- Workflow Spine may reference active workspaces and handoff state for re-entry posture, but workspace configuration remains separate from workflow ownership.
- Questions better owned elsewhere: model-routing preferences, budget preferences, explicit-content send rules, and Google Docs entry flows belong primarily to routing, settings, or import/export dossiers.
- Old Wizard is preserved only as a historical seed for Author Intent / Story Setup plus workflow guidance; it is not a required startup gate.

### Deferred Questions

- Deferred: exact workflow analytics and personalization rules.
- Deferred: whether a setup wizard survives as a separate product concept or dissolves into other systems after later workflow and startup tightening.

## 34. Acceptance Criteria

This dossier is acceptable only if workflow support remains optional, non-gating, and non-authoritative.
