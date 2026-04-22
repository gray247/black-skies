# Memory Lab: Phase 6B Operational Policy + Runtime Governance

## Purpose
Define enforceable runtime governance for stable contested-memory operation.

## Scope
In scope:
- default runtime profile publication
- retention policy by event type
- diagnostics SLO definition
- environment-tier enforcement policy
- waiver policy and authority model

Out of scope:
- semantic changes to Phase 5 contracts
- experimental behavior design
- UI productization

## Governance Authority
- Spec owner approves semantic policy changes.
- Runtime operations owner approves non-semantic operational changes.
- Gate waivers require both:
  - spec owner approval
  - documented revisit condition

## Runtime Governance Rules
- hard gate behavior for `memory_lab_enabled` remains unchanged
- resolver purity and orchestrator-owned persistence remain unchanged
- compatibility remains `legacy read / new write only`
- fail-soft behavior remains mandatory for advisory persistence paths

## Required Outputs
- default runtime profile document
- diagnostics SLO document
- environment support matrix document
- retention policy table document with numeric limits per event type
- waiver record template and approval process

## Retention Policy Baseline (Phase 6B)
Required default limits per artifact/scene key:
- reinforcement events: keep latest 200 entries per artifact
- decay events: keep latest 200 entries per artifact
- contested outcome events: keep latest 200 entries per scene

Any deviation requires versioned profile change and gate rerun.

## Required Validation Categories
- config contract tests for defaults and bounds
- retention policy tests by event type
- diagnostics SLO coverage tests
- environment-tier enforcement tests
- waiver policy audit tests (record presence and authority fields)
