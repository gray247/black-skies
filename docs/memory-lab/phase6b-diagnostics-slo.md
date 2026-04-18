# Memory Lab: Phase 6B Diagnostics SLO

## Purpose
Define measurable diagnostics quality targets for stable operation.

## SLO Targets
Targets apply to supported deterministic environments and stable profiles.

1. Decision Explainability Coverage
- Target: >= 99.0% of contested slot decisions include:
  - winner artifact id
  - runner-up artifact id (or null with explicit reason)
  - score delta (or null with explicit reason)
  - fallback-used flag
  - tie-break tuple/rationale

2. Availability Reason-Code Coverage
- Target: 100% of advisory unavailable outcomes include a reason code.

3. Failure Visibility Coverage
- Target: 100% of fail-soft advisory write/load/resolve failures generate a diagnostic entry.

4. Corruption Visibility Coverage
- Target: 100% of unreadable/non-list event-file detections produce corruption diagnostics.

## SLO Validation Window
- evaluate over test corpus and replay validation runs
- include both warm and cold-cache labeled runs

## SLO Test Categories
- diagnostics completeness tests
- failure-path diagnostics tests
- advisory unavailability reason-code tests
- corruption-visibility tests

## Failure Policy
If any SLO target is missed:
- classify as gate failure
- block progression to the next phase
- require remediation and rerun

