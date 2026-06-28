# Stage 9 Persistence, Recovery, Interchange, and Warning Architecture

Status: active, read-only planning pass complete, implementation blocked.

## Purpose

This file defines the Stage 9 experience architecture for save confidence, degraded operation, recovery, import/export/archive, and warning burden.

It is bounded by the approved Stage 9 constitution and surface architecture, and it relies on the existing authority in `Project Persistence / Local Save`, `Save-State And Degraded-Writing Workflow`, `Snapshots / Backup / Restore / History`, `Import Export Document Interchange`, `Service Health / Offline / Degraded Mode`, and `Authorship Provenance AI Visibility`.

The architecture keeps recovery and interchange visible without collapsing them into save truth, manuscript truth, or a universal recovery owner.

## Authority

This file has Stage 9 planning authority only.
It does not replace product-system ownership, create lifecycle states, or authorize implementation.

## Scope

This architecture covers:

- ordinary save confidence
- blocked or degraded persistence
- degraded services versus project failure
- snapshots and history
- backup
- recovery candidates
- inspection
- restore-as-copy
- restore-as-current
- verification
- partial and failed recovery
- publication export
- portable project archive
- import and external editing
- package inclusion and exclusion
- stale or partial packages
- provenance
- warning hierarchy
- safe-next-action presentation
- return to Writing Surface

It does not choose formats, schemas, versioning, algorithms, retry mechanics, restore implementation, APIs, classes, components, layouts, or warning copy.

## Required Distinctions

The following distinctions remain mandatory:

- save is not snapshot
- snapshot is not backup
- backup is not archive
- archive is not publication export
- export is not synchronization
- inspection is not restore
- copying is not parsing
- parsing is not verification
- verification is not complete recovery
- restore-as-copy is not restore-as-current
- partial recovery is not success
- package creation is not package verification
- import is not acceptance
- external editing does not become manuscript truth automatically
- support-service failure is not project-load failure
- degraded capability is not manuscript failure
- export transfers no truth ownership

These are architecture obligations, not interchangeable lifecycle labels.

## Healthy Save-Confidence Principles

When local persistence is healthy, the author should see a calm, low-noise confirmation posture rather than a dashboard-first signal.

Healthy save confidence should:

- stay quiet by default
- confirm current safe work without ceremony
- avoid fake reassurance from snapshot existence, startup resumption, or recovery availability
- keep the current writing location and current editable work visible
- let the author continue direct writing without requiring a support surface

Healthy save confidence is a state of trust, not a license to hide risk.

## Persistence-Risk Escalation

When the current editable work is pending, at risk, blocked, or failed, the presentation should escalate only as much as the risk requires.

Escalation should:

- identify the responsible owner
- identify the affected work
- distinguish pending from failed from at risk
- distinguish local persistence risk from service-health risk
- distinguish recovery availability from recovery verification
- keep direct writing available if local editing is still safe

Escalation should not merge all risk into one generic offline blob.

## Degraded-Mode Presentation

Degraded mode is a support posture, not a manuscript-failure claim.

Degraded presentation must:

- name the affected capability
- keep direct writing available whenever local editing remains safe
- show whether the degradation is local persistence, support service, transfer, or recovery related
- avoid implying that a support failure means project-load failure
- avoid implying that a degraded capability means the manuscript itself failed

Degraded capability should remain honest and bounded.

## Recovery-Source Comparison

Recovery begins with inspection and comparison, not with mutation.

Recovery-source comparison must make visible:

- source type
- source age or currentness
- source owner
- provenance
- comparison with current work
- verification or non-verification status
- whether the source is a candidate, stale, partial, or unreadable

Comparison is informational. It does not mutate current work or accepted truth.

## Restore-Mode Labeling Requirements

Restore labels must distinguish the actual mode the author is choosing.

The architecture must keep separate:

- inspect only
- restore-as-copy
- restore-as-current

Restore-as-copy is non-destructive and does not replace current work.
Restore-as-current may replace current durable project state and therefore requires explicit approval.

Restore labels must make it obvious what is being changed and what is staying intact.

## Destructive-Action Warning Requirements

Any action that may replace current work, expose protected material, or change outbound visibility requires a stronger warning than a reversible inspection or copy path.

Destructive warnings must:

- identify the responsible owner
- identify the current work at risk
- identify the action that is about to occur
- make the approval requirement visible
- preserve the difference between reversible inspection and destructive replacement
- avoid suppressing unresolved risk, privacy approval, or verification failure

Warnings should be proportional, but not weak.

## Verification-Result Presentation

Verification must remain separate from creation, copying, and parsing.

Verification presentation should:

- show success only when verification actually happened
- show failure clearly
- keep unverified copies visibly unverified
- make it clear that verification is not the same as complete recovery

Successful verification is evidence of usability in the verified mode, not proof that every current object was restored or accepted.

## Partial and Failed Recovery Presentation

Partial recovery and failed recovery must stay visible as incomplete or failed outcomes.

The architecture must:

- keep partial recovery from being presented as success
- keep failed recovery from being presented as healthy
- preserve current work or make it recoverable before destructive replacement
- preserve the distinction between restoration failure before mutation and failure after partial mutation
- keep unresolved partial failure visible until the author dismisses or resolves it through the owner path

Partial failure is a real state, not a cosmetic variation of success.

## Safe-Next-Action Requirements

Every meaningful failure or warning should point the author toward a safe next action.

Safe next actions may include:

- continue direct writing if it is still safe
- compare current and recoverable state
- retry through the same owner path
- create a copy instead of replacing current work
- abandon the recovery attempt
- inspect provenance or source detail
- wait for pending persistence or degraded service to clear

The next safe action must name the responsible owner and must not require the author to infer it from generic health noise.

## Publication Export Versus Archive Presentation

Publication export, portable project archive, and application backup must remain visually and conceptually separate.

The architecture must keep clear that:

- publication export is manuscript-focused outward transfer
- portable project archive is a durable escape or inspection package
- application backup is recovery-oriented
- export is not synchronization
- archive is not publication export
- backup is not archive

These distinctions should remain legible even when the same source material contributes to more than one outbound artifact.

## Inclusion, Exclusion, and Sensitive-Material Controls

Transfer and recovery views must preserve what is included and what is excluded.

The architecture must make visible:

- included material
- excluded material
- unavailable material
- unrepresentable material
- sensitive or private material controls
- source revision or source-currentness context where it matters

Sensitive, masked, local-only, never-send, AI-excluded, or otherwise protected material must not leak through package creation, package inspection, or outbound explanations.

## Stale and Partial Package Presentation

Packages can become stale after project changes, and they can be partial if only some material was packaged.

Presentation must keep visible:

- stale package state
- partial package state
- failed package state
- cancelled package state
- conflicting package state
- excluded material state
- unrepresentable material state

Package creation is not package verification, and neither is package acceptance.

## Import and External-Provenance Presentation

Imported or externally edited material must keep its source identity and provenance visible.

The architecture must ensure that:

- import is not acceptance
- external editing does not become manuscript truth automatically
- external provenance remains visible when it matters
- later re-entry through import or archive does not automatically become accepted truth
- owner-controlled routing remains separate from interchange handling

Import and external editing may become inputs to owner workflows, but they do not become truth by display alone.

## Warning Hierarchy

Stage 9 should support a proportional warning hierarchy rather than one undifferentiated alert stream.

The hierarchy should conceptually separate:

- calm status
- contextual detail
- review warning
- degraded capability
- blocking decision
- destructive warning
- unresolved partial failure

Repeated warnings may be grouped when grouping reduces clutter, but grouping must not hide unresolved failure, current work loss, privacy or transmission approval, or verification failure.

## What Interrupts, Waits, Persists, Groups, Dismisses, Or Must Never Be Suppressed

Interrupt:

- destructive restore-as-current
- loss of current work risk
- verification failure
- blocked persistence
- privacy or transmission approval for consequential outbound work

Wait:

- save pending
- recovery verification
- package creation
- import classification
- unresolved degraded service that still permits safe writing

Persist:

- recovery candidates
- stale packages
- partial packages
- failure records
- provenance references

Group:

- repeated non-destructive warnings
- related transfer detail
- related provenance context

Dismiss:

- contextual support detail
- historical package detail once inspected
- non-blocking stale detail after it has been acknowledged

Must never be suppressed:

- destructive-action warnings
- unresolved partial failure
- privacy or transmission approval
- loss of current work
- verification failure
- blocked persistence

## Return-To-Writing Requirements

The author must be able to return to Writing Surface after recovery or transfer review without losing orientation.

Return-to-writing must preserve:

- the current writing location
- the current work context
- any unresolved advisory or recovery material the author has not dismissed
- the distinction between support review and sovereign manuscript work

Writing Surface remains the place for resumed manuscript work, not a subordinate recovery display.

## Keyboard, Focus, Dismissal, And Accessibility Requirements

Keyboard-first action, stable focus, deliberate dismissal, and readable terminology are part of the architecture.

The experience must preserve:

- keyboard access to review and action
- focus continuity across warnings and return paths
- dismissal that does not destroy durable owner state
- readable presentation of risk, provenance, and recovery state

These are architectural requirements, not layout decisions.

## Genuine Author Decisions

The following decisions may still require later approval because they shape burden rather than ownership:

- how much save-risk detail should appear by default
- how strongly pending persistence should differ from at-risk persistence
- how much recovery comparison detail should appear before the author asks for more
- how prominently stale or partial packages should be shown
- how strongly destructive warnings should interrupt ordinary writing
- how much provenance detail should appear during transfer and recovery review
- how to name the visible states without overpromising completion

## Stage 10 Boundaries

Stage 10 owns operational matters, not Stage 9 burden framing.

Stage 10 includes:

- backup format
- restore implementation
- integrity verification
- corruption detection
- retry mechanics
- migration compatibility
- operational rollback or transaction reliability
- security and privacy of backup material
- performance under realistic project size
- fidelity under stress

Stage 9 may describe how these matters feel to the author, but it does not solve the operational work.

## Stage 12 Restored-Copy Identity Deferral

Stage 9 must not decide whether restore-as-copy becomes:

- a separate project
- a recovery candidate
- a temporary inspection object
- another architectural identity

If that identity remains ambiguous after Stage 9 planning, it is deferred to Stage 12, where object identity, ownership, persistence, and lifecycle boundaries can be resolved before implementation planning relies on them.

## Batch 3 Closure Criteria

Batch 3 is complete when this file:

- keeps save distinct from snapshot
- keeps snapshot distinct from backup
- keeps backup distinct from archive
- keeps archive distinct from publication export
- keeps inspection distinct from restore
- keeps copying distinct from parsing
- keeps parsing distinct from verification
- keeps verification distinct from complete recovery
- keeps restore-as-copy distinct from restore-as-current
- keeps partial recovery distinct from success
- keeps package creation distinct from package verification
- keeps import distinct from acceptance
- keeps external editing distinct from automatic manuscript truth
- keeps degraded capability distinct from manuscript failure
- keeps export distinct from synchronization
- preserves provenance and currentness when consequential
- keeps warnings proportional and safe-next-action oriented
- keeps current work protected before destructive action
- keeps return to Writing Surface explicit and safe
- remains implementation-neutral
- does not create a universal recovery, warning, or interchange owner

## Implementation Blocked

This architecture is documentation only.
Implementation remains blocked.
