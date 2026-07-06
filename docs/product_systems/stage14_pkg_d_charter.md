# Stage 14 PKG-D Charter

## 1. Package Identity

- Stage 14 package name: PKG-D
- Current predecessor state: PKG-C closed, PKG-A closed
- PKG-D is eligible, but it is opened only by this charter
- Stage 15 remains blocked

## 2. Package Purpose

PKG-D exists to evaluate persistence, recovery, restore, and write-target identity safety after the PKG-A renderer identity repairs.

The likely concern area is whether current runtime persistence, recovery, restore, and write-target behavior bind operations to canonical project identity and the correct project root after PKG-A identity repairs.

Final witness lanes for PKG-D must be grounded in accepted evidence, not in PKG-A deferrals alone.

## 3. Authority Boundary

PKG-D may:

- inspect read-only evidence about persistence, recovery, restore, and write-target identity behavior
- inspect read-only request formation on the renderer side
- inspect read-only IPC request formation for persistence and recovery paths
- inspect read-only backend handling of write-target identity
- inspect project-loader identity and path handoff only as context for persistence or recovery questions
- use existing tests and fixtures as read-only evidence

PKG-D may later witness:

- whether persistence requests bind to the canonical project identity
- whether recovery and restore requests bind to the correct project root and identity
- whether write-target selection remains safe under PKG-A identity repairs

PKG-D may not mutate any of those areas without a later scope record.

## 4. Protected Evidence Boundary

The following protected evidence must not be touched by this charter:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

## 5. Inherited Accepted Facts From PKG-A

PKG-D inherits the following accepted facts from PKG-A:

- A1 fixed App missing-ID activation
- ProjectHome hygiene fixed missing-ID remembered paths
- ProjectHome divergence visibility fixed canonical-ID details visibility
- explicit metadata-ID preservation is proved
- missing-ID loader tolerance remains, but it is contained
- destination safety remains unproved, not contradicted

## 6. Relevant PKG-A Deferrals PKG-D May Carry

PKG-D may carry forward the following PKG-A deferrals when the evidence supports them:

- persistence / recovery destination safety
- draft save/edit identity behavior
- project picker behavior, but only if write-target selection depends on it

## 7. Deferrals PKG-D Must Not Automatically Absorb

PKG-D must not automatically absorb:

- recents identity visibility
- divergence warning behavior
- App UI outside ProjectHome details
- general UX polish
- loader diagnostics unless persistence evidence requires it

## 8. Allowed Read-Only Evidence Seams

Possible read-only seams include, if confirmed by records or source:

- renderer write request formation
- persistence IPC request formation
- recovery status and restore request formation
- backend write-target handling
- project loader identity / path handoff only as context
- existing tests and fixtures as read-only evidence

These seams are not final by this charter unless the inspected records support them.

## 9. Forbidden Opening Actions

PKG-D does not authorize:

- runtime mutation
- test mutation
- backend mutation
- recovery execution
- restore execution
- fixture materialization
- receipt creation
- snapshot update
- protected evidence regeneration
- Stage 15 work

## 10. Conditions for Later Witness Work

A later PKG-D witness plan may be created only after this charter is reviewed.

Any later witness work must remain read-only or tightly scoped and must stay inside the accepted authority boundary.

## 11. Conditions for Mutation

Mutation requires all of the following:

- accepted witness proving a contradiction or unsafe gap
- bounded scope record
- named files
- protected evidence posture
- rollback boundary
- post-mutation reassessment

## 12. Deferral Rules

Unresolved evidence must be classified as one of the following:

- resolved
- contained
- unresolved but not contradicted
- deferred to a named home
- blocker only if accepted evidence proves a current contradiction

## 13. Closure Threshold

PKG-D can close only when:

- accepted PKG-D evidence has been reviewed
- any authorized mutations are reassessed
- unresolved residuals have named deferral homes
- no accepted evidence shows an active PKG-D blocker
- closure preparation and closure review records are created later

PZ_CONTINUE: PKG-D charter ready for review
