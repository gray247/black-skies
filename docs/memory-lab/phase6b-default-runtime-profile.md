# Memory Lab: Phase 6B Default Runtime Profile

## Purpose
Define the stable default runtime profile after Phase 6A tuning.

## Profile Structure
Required profile fields:
- `profile_name`
- `version`
- `alternate_threshold`
- `max_candidates`
- `max_unresolved`
- `decay_enabled`
- `reinforcement_enabled`
- `suppressed_fallback_enabled`
- `low_confidence_fallback_threshold`
- `diagnostics_level`
- `retention_limits_by_event_type`

## Runtime Profile Precedence (Implemented)
`ServiceSettings.memory_lab_runtime_options()` applies values in this order:
1. selected runtime profile value
2. explicit config override only when the config value differs from that field's declared default
3. field default (used only to detect explicitness; not as final winner over profile)

### Equal-to-Default Caveat
If a config value is explicitly set but equals the field default, it is treated as implicit and the selected profile value still applies.
Example:
- `memory_lab_decay_suppressed_fallback_enabled=True` (equal to default) with `stable_conservative_fallback` still resolves to `False` from profile.

## Required Profiles
- `stable_default`
- `stable_conservative_fallback`

Both profiles must be derived from Phase 6A sweep outputs.

## Acceptance Rules
- profile values must be explicitly documented
- each value must include a rationale line
- each profile must pass:
  - deterministic replay checks in supported environments
  - prompt-contract enforcement checks
  - no canon mutation checks

## Required Retention Defaults in Profile
Both required profiles must explicitly include:
- reinforcement events: 200
- decay events: 200
- contested outcome events: 200

## Change Control
Profile changes after publication require:
- version increment
- update to policy rationale
- corresponding test baseline updates
