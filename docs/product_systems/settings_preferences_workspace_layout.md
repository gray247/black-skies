# Settings / Preferences / Workspace Layout

## 1. Status Header

- Dossier name: `Settings / Preferences / Workspace Layout`
- Status: `drafted`
- Class: `Product`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-19`
- Depends on: `Writing Surface`, `Command Center Surface`
- Feeds into: all user-facing systems
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `yes`
- Hidden/background: `partial`

## 2. Purpose

Define how Black Skies stores and presents user settings, preferences,
workspace configuration, and layout choices without letting preference
state become hidden truth authority.

## 3. User Problem Solved

The writer needs persistent control over workspace behavior without losing clarity about what settings affect writing, AI, privacy, or layout.

## 4. What The System Does

- store user preferences,
- manage workspace layout options,
- own workspace configuration and presentation preferences for saved,
  non-owning work environments within primary surfaces,
- allow workspace configuration to reference surface-local scope, open
  views, filters, referenced artifacts, last-viewed source, navigation
  posture, and resumable context where allowed,
- restore safe workspace configuration when a project reopens without
  implying that referenced artifacts, save truth, or workflow state are
  current,
- expose user-controlled behavioral settings.

## 5. What The System Does Not Do

- own narrative truth,
- own workflow progress,
- own save truth,
- own recovery artifacts,
- become owner of opened artifacts merely because a workspace references
  them,
- prove that prior windows, monitors, views, or sources can all be
  reopened exactly as before,
- silently override author approval rules,
- hide risky automation behind obscure settings.

## 6. User-Facing Behavior

Visible behavior should emphasize clear control, bounded defaults, and
safe degradation when prior layout or workspace assumptions no longer
fit the current environment.

## 7. Hidden/Background Behavior

Background persistence may exist, but settings do not create hidden
system authority beyond approved scope.
Workspace restoration may reopen remembered surface-local presentation
and context, but unsafe or impossible prior arrangements must fall back
cleanly instead of being forced.

## 8. What Appears First

- primary workspace preferences,
- writing-relevant settings,
- clear privacy and AI-control options when relevant,
- workspace-restoration controls or reset paths when needed.

## 9. What Is Summonable

- advanced layout choices,
- hotkeys,
- deeper support settings,
- bounded workspace recovery or reset choices when prior layout is not
  usable.

## 10. What Is Hidden Until Needed

- advanced diagnostics settings,
- specialist configuration.

## 11. Inputs

- author choices,
- device context,
- project context where allowed,
- bounded surface-local context references where allowed,
- monitor, view, or source availability where restore is attempted.

## 12. Outputs

- persisted preferences,
- workspace configuration,
- layout state,
- safe restoration posture for remembered workspaces,
- user-visible control behavior.

## 13. Which Other Systems Consume Those Outputs

- all user-facing systems

## 14. What Gets Stored

- preferences,
- workspace configuration and presentation preferences,
- layouts,
- control settings,
- bounded workspace references to selected scope, filters, referenced
  artifacts, last-viewed source, local navigation posture, and resumable
  surface context where allowed,
- privacy and routing preferences where allowed.
Exact storage scope across global, project, and session layers remains
open at the product-definition level.

## 15. What Remains Temporary

- transient workspace states,
- current-session overrides when applicable,
- active focus or display context that remains surface-local rather than
  settings-owned,
- unavailable monitor or view substitutions made only for the current
  reopen.

## 16. Relationship To Narrative Insertion / Assertion

Settings control environment, not story truth.

## 17. Relationship To Story Units

Story Unit behavior may be configurable, but Story Units remain optional.

## 18. Relationship To Prose / Scene Projection

Projection display may be configurable without changing authority.

## 19. Relationship To Writing Surface

Writing Surface preferences must preserve sovereign direct writing.
Workspace configuration may help reopen a Writing Surface workspace, but
it does not own manuscript prose, manuscript order, or the displayed
artifacts inside that workspace.
If prior layout cannot be restored safely, settings should prefer a
valid writing-first fallback over exact but broken reconstruction.

## 20. Relationship To Command Center Surface

Command Center layout preferences must not turn support into a required gate.
Workspace configuration may help reopen a Command Center workspace, but
it does not own the tools, notes, signals, cards, findings, or review
artifacts shown there.
Unavailable support views may degrade to safe absence, alternate view,
or reset posture without claiming that the underlying owner state is
gone.

## 21. GUI Placement Principles

Keep settings understandable and avoid hiding high-risk controls.
Workspace restoration should remain more than geometry alone and less
than a durable domain restore system.

## 22. Local LLM Role

Settings may later govern local-model availability, but models remain separate authorities.

## 23. Paid API Role

Settings may control paid-path availability, but approvals and spend guardrails remain separately governed.

## 24. Model Routing Notes And Cost / Budget Impact

Settings may influence routing preference, not override approval, privacy, or spend rules.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Settings may expose policy choices but must not weaken governing
boundaries silently.
Workspace restoration must not reveal protected or excluded content
through convenience reopen behavior.

## 26. Privacy / Safety / Censor Behavior, If Applicable

High-risk settings require clarity and must not hide protection state.
Missing monitors, stale sources, or unavailable views must degrade to
safe fallback rather than being misrepresented as successfully restored.

## 27. Testing Requirements

Prove settings persist correctly, workspace restoration degrades safely,
and restored configuration does not masquerade as owner truth.

## 28. Governance Rules And Risks

- no hidden unsafe defaults,
- no settings-led authority drift,
- no workspace-definition drift into durable domain ownership,
- no buried approval bypasses,
- no unsafe exact-restore fiction.

## 29. Failure Modes

If settings persistence fails, the app should fall back safely.
If prior workspace configuration is corrupt, impossible, or hostile to
direct writing, settings should allow reset, narrower restore, or
single-monitor fallback without blocking project open.

## 30. v1 Boundary

Core settings, workspace configuration, preferences, and layout
persistence plus safe restoration posture.

## 31. v2 Boundary

Richer workspace customization and per-project options.

## 32. Future-Only Boundary

Complex profile systems and deep automation rules.

## 33. Pre-Rough Alignment Questionnaire

Intake note:
- external question source reviewed: `C:\Dev\plan ideas\continuity\open_questions_register.md`
- old questions merged: yes, mainly from broad settings/preferences and startup-failure questions
- stale placeholder questions removed or superseded: yes
- active question count after merge: 8
- remaining blocker summary: `0 Fatal`, `3 Critical`, `3 Major`

### Fatal Questions

- None yet.

### Critical Questions

- Critical: which settings are global versus project-scoped versus session-only, especially for workspace layout, privacy boundaries, and AI behavior preferences?
- Critical: what recovery path must exist when bad settings corrupt startup, trigger crash loops, or block the user from reaching the controls needed to disable a broken feature?
- Future contract need: which high-risk controls may live in settings at all versus requiring per-action confirmation, especially for routing, spend, privacy, and explicit-content policy?

### Major Questions

- Major: how visible should high-risk AI, privacy, and routing settings be in everyday workflow versus deeper settings surfaces?
- Major: what layout-reset and workspace-recovery behavior is required when saved layout state becomes confusing, corrupt, or hostile to direct writing?
- Jason decision candidate: which startup or onboarding answers may seed settings safely without turning early setup into hidden long-term authority?

### Minor Questions

- Minor: what information architecture best separates layout, behavior, privacy, and AI-control settings without hiding risky choices?

### Answered / Superseded Questions

- Settings do not own narrative truth.
- Workspace is more than geometry alone and less than a durable domain owner.
- Settings / Workspace Layout may own workspace configuration and presentation preferences without owning manuscript, project truth, notes, signals, save truth, recovery artifacts, or workflow progress.
- Lower-priority convenience may not override higher-priority safety and approval rules.
- Superseded by current doctrine: settings may influence behavior but must not silently override approval rules, privacy boundaries, or direct-writing sovereignty.
- Questions better owned elsewhere: exact routing policy, budget policy, import/export sync policy, and explicit-content package policy belong primarily to their owning dossiers.

### Deferred Questions

- Deferred: exact preset taxonomy and naming.
- Deferred: exact cross-device or cross-project settings-sync behavior.

## 34. Acceptance Criteria

This dossier is acceptable only if settings remain clear, bounded, and subordinate to higher governance.
