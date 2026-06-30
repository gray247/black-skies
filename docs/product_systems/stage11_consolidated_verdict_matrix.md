# Stage 11 Cross-Batch Consolidated Verdict Matrix Contract

Status: contract/schema only. No Batch 1, Batch 2, Batch 3, Batch 4, or Batch 5 question rows are populated in this pass.

Current stage: Stage 11 Fatal Question Review. Stage 12 has not begun. Implementation remains blocked. Release remains unauthorized.

## Purpose

The Stage 11 Cross-Batch Consolidated Verdict Matrix is a cross-batch index and normalization record for Stage 11 Fatal Question Review outcomes.

It does not replace current doctrine, authority records, or the detailed Stage 11 batch records. Its function is to preserve one normalized cross-batch view of primary verdicts, Stage 12 dependencies, secondary dependencies, later implementation-proof obligations, non-primary author policy, reopening triggers, consequences, and source references.

## Authority Order

Use this authority order:

1. current controlling doctrine and authority records
2. detailed Stage 11 batch records
3. consolidated verdict matrix as the controlling cross-batch index

If a matrix row conflicts with its source batch, work stops until the discrepancy is resolved.

## Batch 5 Control Rule

Within Batch 5, the consolidated section controls final totals and routing, but detailed Q1-Q80 records remain authoritative for question-specific nuance and evidence.

## Row Rule

- One controlling row per primary Stage 11 question.
- No duplicate primary rows for secondary dependencies.
- Normalization is additive, never substitutive.
- Preserve source verdict and source dependency wording.
- Normalize only in additional fields.

## Required Fields

Each populated matrix row must include these fields:

- batch
- question ID
- concise question
- domain
- primary verdict
- severity
- original source verdict wording
- direct doctrine
- synthesis basis
- contradiction status
- primary Stage 12 dependency
- original source dependency wording
- normalized Stage 12 contract family
- secondary dependencies
- primary later implementation proof
- supplemental implementation proof
- non-primary author policy
- receiving stage
- required output
- reopening trigger
- consequence if unresolved
- source-file path
- source section or line reference
- notes

## Controlled Primary Verdict Vocabulary

Use only these primary verdict values:

- Ruled Out — Direct Doctrine
- Ruled Out — Cross-Document Synthesis
- Stage 12 Architecture Dependency
- Later Implementation-Proof Obligation
- Genuine Author Decision
- Unresolved Stage 11 Correction
- Confirmed Structural Contradiction

## Dependency Representation

Secondary dependencies must preserve:

- source batch
- carried contract
- reason secondary
- consequence

Secondary dependencies do not alter primary verdict counts.

## Proof Representation

The matrix must separate:

- primary later implementation proof
- supplemental implementation proof attached to a ruled-out question

Each proof item must preserve:

- behavior to prove
- evidence class
- revision/build scope
- environment
- failure condition
- reopening trigger
- consequence

## Non-Primary Author Policy

Zero primary author decisions does not mean no author policy decisions exist.

Non-primary author policy examples include retention duration, retry limits, hardware support floor, spend caps, signing strategy, support breadth, warning/refusal posture, and future waiver policy.

Non-primary author policy must not weaken mandatory safety floors and must not inflate primary author-decision counts.

## Provisional Stage 12 Contract Families

The matrix may use these provisional Stage 12 contract families:

- Migration and restored-copy identity
- Approval persistence, inheritance, and revocation
- Package, payload, and hidden-context identity
- Provider-policy drift and external assurance
- Telemetry and generic-cache governance
- Queue attempt identity, retry, cancellation, and retained state
- Cost accounting and budget persistence
- Hardware qualification and resource-pressure protection
- Model qualification and lifecycle
- Project identity transition and binding propagation
- Evidence retention and last-witness protection
- Deployment versioning, portable boundary, and multi-install ownership
- Possible release evidence ownership and artifact traceability family, only if Q73/Q74 ownership or structural contract is missing

## Q73/Q74 Watch Rule

For Batch 5 Q73/Q74:

- owner present + contract present + tooling absent = later implementation proof
- owner absent or contract absent = reopen during Stage 11 and route to Stage 12

Do not defer this classification check until Stage 12.

## Validation Rules

Later matrix validation must confirm:

- all Stage 11 questions included
- no duplicate primary rows
- batch counts reconcile
- every Stage 12 dependency appears
- every secondary dependency appears
- every primary later-proof item appears
- supplemental proof notes are sampled
- every deferral names a receiving stage
- every reopening trigger has a consequence
- Q73/Q74 owner assumption is tested
- no primary author-decision count is inflated by non-primary policy
- implementation remains blocked
- release remains unauthorized

## Row Population Status

No question rows are populated in this pass.

The next matrix pass must populate rows only after validating source batch records, preserving source wording, and applying this contract.
