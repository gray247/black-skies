# Project Persistence / Local Save

## 1. Status Header

- Dossier name: `Project Persistence / Local Save`
- Status: `drafted`
- Class: `System`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-15`
- Depends on: `Writing Surface`, `Narrative Insertion / Narrative Assertion`,
  `Service Health / Offline / Degraded Mode`
- Feeds into: `Writing Surface`, `Workflow Spine / Author Journey`,
  `Splash / Startup Experience`, `Command Center Surface`,
  `Snapshots / Backup / Restore / History`,
  `Service Health / Offline / Degraded Mode`
- Runtime authority: `future`
- Authority level: `operational`
- User-facing: `partial`
- Hidden/background: `yes`

## 2. Purpose

Define the singular product-level owner for durable local current-save
confirmation so Black Skies can truthfully say whether current
author-owned editable work has been durably persisted locally.

This dossier exists to separate local current-save truth from:

- manuscript truth
- `Narrative Assertion` truth
- snapshots and recovery history
- degraded or offline health reporting
- startup or resume posture
- workflow guidance
- diagnostics evidence
- surface display

## 3. User Problem Solved

The writer needs to know whether current work is actually safe locally,
still pending, failed, at risk, or blocked for safe persistence without
being forced to infer that from recovery offers, health warnings, or UI
reassurance.

## 4. What The System Does

`Project Persistence / Local Save`:

- owns the authoritative product claim that current author-owned
  editable work has been durably persisted locally,
- owns the truthful local-save posture when that claim is not yet valid,
- distinguishes `saved`, `pending`, `unsaved`, `failed`, `at risk`, and
  persistence-blocked posture without turning them into truth-class
  changes,
- provides authoritative save-state evidence that other systems may
  display, summarize, or react to,
- supports local-first direct writing even when AI or remote services
  are unavailable.

## 5. What The System Does Not Do

`Project Persistence / Local Save` does not:

- own manuscript truth or canon,
- own `Narrative Assertion` identity,
- own direct editing authority,
- own snapshots, backup, restore, or history,
- own recovery review,
- own synchronization,
- own import or export,
- own service-health state,
- own startup or resume routing,
- own diagnostics,
- own protected-content policy,
- own project navigation,
- own AI routing, budget, or spend.

## 6. User-Facing Behavior

Visible behavior should emphasize:

- quiet confirmed-save behavior during healthy local operation,
- visible `pending` state when materially useful,
- prominent `failed` or `at risk` state when recent work is not safely
  confirmed,
- no fake reassurance from recovery offers, resume cues, or service
  health alone,
- no need for manual-save ritual just to feel safe,
- detail available when wanted without forcing `Companion`.

## 7. Hidden/Background Behavior

Background behavior may later include:

- local-save confirmation,
- bounded pending-write posture,
- unresolved local-save risk posture,
- close-safety confidence for current unresolved work.

Background behavior must not silently:

- widen transfer or export permissions,
- weaken protected, masked, excluded, private, or local-only posture,
- convert recovery availability into save confirmation,
- treat degraded health as proof that a write landed,
- treat diagnostics evidence as proof that persistence succeeded.

## 8. What Appears First

What appears first should usually be minimal:

- calm confirmed-save posture when local persistence is healthy,
- low-noise pending state only when it matters,
- prominent risk posture only when work may not be safe.

## 9. What Is Summonable

Summonable later:

- bounded explanation of why work is `pending`, `failed`, or `at risk`,
- close-safety explanation when unresolved work exists,
- current-save confirmation context for support views.

## 10. What Is Hidden Until Needed

Hidden until needed:

- low-level persistence detail,
- implementation-specific storage mechanics,
- retry and timing detail,
- raw evidence or diagnostics internals.

## 11. Inputs

Possible inputs:

- current author-owned editable work,
- author edit activity,
- local persistence outcome signals,
- protected or excluded content posture that must survive local save,
- health constraints that may affect whether safe local persistence is
  possible,
- close or shutdown intent when unresolved risk exists.

## 12. Outputs

Outputs may include:

- authoritative `saved` confirmation for current editable local work,
- authoritative `pending` or `unsaved` posture,
- authoritative `failed` or `at risk` posture,
- persistence-blocked posture when safe local save cannot proceed,
- close-safety confidence for unresolved work,
- authoritative save-state evidence for consumer systems.

These outputs are operational state, not manuscript truth.

## 13. Which Other Systems Consume Those Outputs

Consumers may include:

- `Writing Surface`
- `Workflow Spine / Author Journey`
- `Splash / Startup Experience`
- `Command Center Surface`
- `Service Health / Offline / Degraded Mode`
- `Snapshots / Backup / Restore / History`
- `Companion`

Consumption does not grant ownership.

## 14. What Gets Stored

Eventually stored:

- durable local current-save confirmation state,
- bounded unresolved local-save risk state,
- close-safety posture where it genuinely matters.

## 15. What Remains Temporary

Temporary or derived:

- transient in-flight confirmation posture,
- ephemeral pending-write cues,
- temporary explanatory views shown to help the writer decide what to do
  next.

## 16. Relationship To Narrative Insertion / Assertion

`Project Persistence / Local Save` may confirm that current editable
author-owned work has been durably persisted locally, but it does not
decide what that work means.

It does not replace `Narrative Insertion / Narrative Assertion` as the
foundation truth owner.
It confirms local persistence of current editable state only.

## 17. Relationship To Story Units

No special Story Unit authority exists here.
Story Units remain optional and do not become a save gate.

## 18. Relationship To Prose / Scene Projection

Projection and scene-compatibility views may consume save-state cues,
but projection does not own local-save confirmation.
Local persistence of projected or compatible views does not make those
views foundational truth.

## 19. Relationship To Writing Surface

`Writing Surface` displays save-state cues and remains the sovereign
direct-writing surface.

`Project Persistence / Local Save` owns whether current work is actually
confirmed saved locally.
`Writing Surface` does not gain that authority by display.

## 20. Relationship To Command Center Surface

Heavier save-risk review and supporting detail may appear in
`Command Center Surface`, but Command Center remains a consumer and
support surface, not the owner.

## 21. GUI Placement Principles

Placement rules:

- keep confirmed-save posture quiet,
- keep pending state visible only when useful,
- make at-risk or failed posture prominent,
- do not turn save-state support into a dashboard,
- do not force the writer through `Companion` or a support surface to
  understand whether work is safe.

## 22. Local LLM Role

No local-model role is required for core local-save authority.

## 23. Paid API Role

No paid-model role is required for core local-save authority.

## 24. Model Routing Notes And Cost / Budget Impact

Local current-save confirmation must not depend on AI routing, provider
availability, or spend posture.

## 25. Explicit-Content / Send-Package Handling, If Applicable

Local persistence must preserve protected, masked, excluded, private,
local-only, and AI-excluded material without weakening those
protections.

Local save does not authorize outbound transfer, summarization,
indexing, memory retention, diagnostics disclosure, or export.

## 26. Privacy / Safety / Censor Behavior, If Applicable

Privacy and safety rules:

- local-save success does not widen visibility permissions,
- local-save success does not make excluded material AI-usable,
- local-save success does not make local-only material outbound-ready,
- save failure or pending state must not cause protected-content
  leakage through support explanations.

## 27. Testing Requirements

Future proof set should include:

- `saved` shown only after durable local confirmation,
- `pending` kept distinct from `saved`,
- `recoverable` kept distinct from `saved`,
- truthful `failed` and `at risk` posture,
- truthful close-with-risk posture,
- protected-content preservation across local save,
- local save remaining independent from AI or remote-service
  availability.

## 28. Governance Rules And Risks

- no fake reassurance,
- no snapshots-as-save-authority,
- no health-as-save-authority,
- no startup-as-save-authority,
- no surface becoming the owner by display,
- no weakening of protected-content posture,
- no silent transfer, export, indexing, or memory-retention authority
  derived from local save.

Key risks:

- conflating `saved` with `recoverable`,
- conflating degraded capability with failed local persistence,
- letting workflow or startup cues masquerade as persistence proof,
- letting implementation convenience decide product authority.

## 29. Failure Modes

Failure modes include:

- save pending longer than normal,
- confirmation delayed,
- local persistence failed,
- local writing still safe but recent work is at risk,
- local editing no longer safe,
- close attempted with unresolved local-save risk.

Containment rules:

- direct writing stays available whenever local editing is still safe,
- `at risk` stays prominent when current work is not durably confirmed,
- blocked-for-safe-persistence posture must not be hidden,
- return to calm confirmed-save posture happens only after the owner can
  truthfully confirm it.

## 30. v1 Boundary

`v1` should include:

- singular ownership of durable local current-save confirmation,
- truthful `pending`, `failed`, `at risk`, and persistence-blocked
  posture,
- authoritative save-state evidence for surfaces and workflows,
- clear separation from snapshots, recovery, health, and truth
  ownership.

## 31. v2 Boundary

`v2` may add:

- richer save-state explanations,
- broader bounded review of unresolved local-save risk,
- finer-grained current-save scope if a later product pass proves it is
  necessary.

## 32. Future-Only Boundary

Future-only items:

- storage-engine design,
- file-format design,
- autosave timing,
- retry algorithms,
- queue behavior,
- database schema,
- cloud sync,
- remote collaboration,
- implementation of Electron or runtime persistence plumbing.

## 33. Pre-Rough Alignment Questionnaire

### Fatal Questions

- None currently. The ownership decision is now approved; remaining
  questions are bounded product-experience and contract-shaping
  questions, not owner-selection questions.

### Critical Questions

- What exact scope counts as current author-owned editable work for the
  first local-save confirmation boundary?
- What exact threshold separates low-noise `pending` posture from
  prominent `at risk` posture?
- What exact conditions make local editing unsafe enough that direct
  editing must stop rather than merely warn?
- How should close-safety posture be expressed without creating fake
  reassurance or excessive interruption?

### Major Questions

- How much save-state explanation belongs in `Writing Surface` versus
  heavier support views?
- What bounded explanatory detail should startup or resume surfaces show
  when unresolved save risk exists?

### Minor Questions

- What final writer-facing terminology best distinguishes `saved`,
  `pending`, `at risk`, `blocked`, and `failed` without false calm?

### Answered / Superseded Questions

- Durable local current-save confirmation now has a singular owner:
  `Project Persistence / Local Save`.
- `Writing Surface` displays state but does not become the owner by
  display.
- `Snapshots / Backup / Restore / History` does not prove current-save
  truth.
- `Service Health / Offline / Degraded Mode` may report degraded
  capability, but health does not prove that a write landed.
- Local current-save confirmation is distinct from manuscript truth,
  recovery, startup, workflow state, diagnostics, synchronization, and
  import or export.

### Deferred Questions

- Exact storage mechanism, file paths, and schema.
- Autosave timing, buffering, and retry behavior.
- Close-warning dialog design.
- Runtime state-machine design.

## 34. Acceptance Criteria

This dossier is acceptable only if it states explicitly that:

- durable local current-save confirmation has one owner,
- `saved` remains narrower than `recoverable`,
- direct writing remains valid whenever local editing is still safe,
- surfaces consume save state without becoming owners,
- snapshots remain recovery and history support rather than current-save
  proof,
- health remains operational visibility rather than persistence proof,
- protected-content posture survives local save without widening access,
- the dossier remains discovery-only and does not become an
  implementation design.
