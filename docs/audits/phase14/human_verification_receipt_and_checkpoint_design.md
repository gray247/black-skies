# Human Verification Receipt and Checkpoint Design

Status: Produced
Canonical role: Planning artifact for the receipt template and checkpoint model that future operator-observed verification must use.
Scope: Define a reusable manual-verification receipt, checkpoint types, and stop rules for continuity-sensitive, authority-sensitive, and closure-sensitive work.
Owns: Receipt-template structure and checkpoint planning discipline for future human verification.
Does not own: Verification execution, runtime implementation, Playwright coverage, or proof doctrine.
Last reviewed: Not yet reviewed.
Acceptance record: No operator acceptance recorded yet.

## Purpose

Human verification is already required for several continuity-sensitive and authority-sensitive claims. That requirement is not useful unless the project records those checks consistently.

This artifact defines:

- the receipt template
- the checkpoint model
- the stop rules for future implementation `/goals`

It does not execute verification.

## Receipt Template

```text
Verification ID:
Date/Time:
Operator:
Branch:
Commit hash:
Worktree state:
Shell:
Repo root:
Project root:
Fixture or real project:
localStorage/session state:
Synthetic/harness hooks present:
Flow tested:
Verification source: Current runtime run | Persisted report read | Renderer witness | Mixed
Authority layers observed:
Expected result:
Actual result:
Screenshots/logs attached?:
Outcome: Pass | Fail | Blocked
Notes:
Follow-up RDM IDs:
```

## Checkpoint Model

### Pre-implementation

Used when a future implementation pass depends on operator confidence before changing behavior broadly.

### Post-implementation

Used after scoped implementation work changes continuity-sensitive, authority-sensitive, or stale-state-sensitive behavior.

### Pre-closure

Used before a pass or phase claims closure-grade confidence where operator-visible trust is part of the claim.

### Post-restore and post-recovery

Used when restore, recovery, restart, or continuity rebinding can only be trusted after operator observation.

### Continuity-sensitive

Used for project load, project switch, reload, reopen, pane rebind, and stale-state reset flows.

### Authority-sensitive

Used when the operator-visible claim depends on the difference between renderer witness, persisted records, backend truth, and filesystem truth.

This checkpoint must record whether the observed claim came from a current runtime verification run, a persisted verification record read, a renderer-only witness state, or a mixed surface.

## Stop Rules

Future implementation `/goals` must stop before a human-verification checkpoint when the next claim requires operator evidence.

That includes:

- project-switch cleanliness
- stale-state reset outcomes
- floating-pane reload and rebind correctness
- restore-latest visible trust behavior
- continuity after restart, reload, or recovery
- any claim where current runtime evidence, persisted verification records, and renderer presentation could be mistaken for one another

Autonomous work may prepare the checkpoint, but it must not claim closure or runtime trust for those flows without operator observation.

## Relationship To Phases

### Phase 14B

Use this receipt model for any behavior-alignment work that changes freshness, degraded-state interpretation, or current-vs-historical authority presentation.

After `14B.2` and `14B.3`, any future manual receipt in this area should explicitly name whether the observed evidence came from:

- a current runtime verification run
- a persisted verification record read
- renderer presentation only

### Phase 15

Use this receipt model heavily for continuity, recovery, project-switch, and restore-latest checkpoints.

### Phase 16

Use this receipt model to mark where harness realism stops and operator-observed continuity must begin.

### Phase 17

Use this receipt model for GUI authority simplification where the visible claim itself is part of the contract.

### Phase 20+

Use this receipt model as a gate before memory, longform, intelligence, or orchestration work is treated as runtime-trusted.
