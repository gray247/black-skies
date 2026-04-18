# Memory Lab: Phase 6B Environment Support Matrix

## Purpose
Define environment tiers and enforcement behavior for runtime and validation gates.

## Environment Tiers

### Tier 1: Supported Deterministic
Criteria:
- effective advisory lock implementation present
- deterministic replay gates enforced

Enforcement:
- hard deterministic gates required
- drift is blocker
- required for profile approval

### Tier 2: Best-Effort
Criteria:
- lock implementation is non-effective/no-op fallback

Enforcement:
- replay is report-only
- diagnostics and fail-soft guarantees still required
- cannot be used as sole evidence for profile promotion

## Required Runtime Behavior by Tier
- Advisory hard-gating behavior is identical across tiers.
- Compatibility policy is identical across tiers.
- Determinism enforcement differs only for gate severity.

## Required Validation by Tier
- Tier 1:
  - full gate suite required
  - blocker on drift
- Tier 2:
  - suite runs allowed as informational
  - non-blocking determinism drift reports

## Documentation Requirement
All validation reports must include:
- tier
- lock mode
- lock effectiveness
- cache condition labels

