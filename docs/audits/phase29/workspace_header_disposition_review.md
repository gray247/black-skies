# Phase 29 Pass 5 Workspace Header Disposition Review

Status: Draft governance review
Date: 2026-05-22
Phase: 29 - Issue / Risk / Error Reconciliation
Pass: 5 - Disposition Matrix and Governance Classification

## Purpose

This review classifies the authority overload concentrated in the current Workspace Header.
It does not design a replacement layout.

## Related IDs

- `P29-SURF-002`
- `P29-BOUND-002`
- `P29-CTRL-003`
- `P29-CTRL-004`
- `P29-CTRL-005`
- `P29-CTRL-006`
- `P29-CTRL-007`
- `P29-CTRL-008`
- `P29-CTRL-009`
- `P29-CTRL-010`
- `P29-INTEL-009`
- `P29-INTEL-010`

## Control Groups

### Writing and generation

- related IDs: `P29-CTRL-003`; `P29-CTRL-004`
- likely classification: primary-visible survival
- reason: generation is a deliberate authoring action closely tied to the current Writing Surface

### Critique and rewrite entry

- related IDs: `P29-CTRL-005`
- likely classification: validate_first
- reason: critique is useful, but the nearby rewrite/apply mutation path creates concentrated trust risk

### Export

- related IDs: `P29-CTRL-006`
- likely classification: advanced-only
- reason: export is important but not part of the most immediate authoring authority stack

### Companion and intelligence entry

- related IDs: `P29-CTRL-007`
- likely classification: contextual or validate_first
- reason: companion entry currently amplifies visible intelligence authority without proven need to remain primary

### Snapshot and recovery-adjacent actions

- related IDs: `P29-CTRL-008`; `P29-CTRL-009`; `P29-CTRL-010`
- likely classification: contextual/support-only
- reason: snapshot, verification, and support tooling should not read as normal writing controls

### Budget and service status

- related IDs: `P29-INTEL-009`; `P29-INTEL-010`
- likely classification: contextual or backgrounded
- reason: both are honest status signals, but their current proximity to authoring and intelligence actions inflates header authority density

## Controls Likely Remaining Primary-Visible

- `P29-CTRL-003`
- `P29-CTRL-004`

## Controls Likely Moving Contextual, Background, or Support-Only

- `P29-CTRL-007`
- `P29-CTRL-008`
- `P29-CTRL-009`
- `P29-CTRL-010`
- `P29-INTEL-009`
- `P29-INTEL-010`

## Controls Likely Requiring Advanced-Only Handling

- `P29-CTRL-006`

## Controls Likely Requiring Phase 30 Workflow Review

- `P29-SURF-002`
- `P29-CTRL-003`
- `P29-CTRL-004`
- `P29-CTRL-006`
- `P29-CTRL-007`
- `P29-INTEL-009`
- `P29-INTEL-010`

## Controls Likely Requiring Validate-First Handling

- `P29-CTRL-005`
- `P29-CTRL-007`

## Mutation-Risk Concentration

- Generation mutates authoring state directly.
- Critique entry leads to the highest trust-risk mutation flow through rewrite/apply.
- Snapshot creation and snapshot-panel access lead toward restore-capable support flows.

## Intelligence-Authority Concentration

- Companion entry, service status, and budget status share a small visual zone with generation and critique.
- This creates avoidable pressure for the header to read as an orchestration console rather than a narrow authoring control strip.

## Support vs Diagnostics Overlap

- Service/offline status is legitimate support UX.
- The current header still sits too close to diagnostics-flavored state concepts because service status also participates in test and bridge status evidence elsewhere.

## Carry-Forward Decision

The Workspace Header should not survive as a single mixed-authority bucket.
Its controls should be governed by narrower authority classes before any future workflow or GUI policy is approved.
