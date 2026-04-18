# Memory Lab: Prompt Contract

## Purpose
Define deterministic prompt surfacing behavior for contested memory.

## Winner/Alternate Contract (Phase 5)
- Winner is always surfaced.
- Alternate is surfaced only if:
  - runner-up exists, and
  - `winner_score - runner_up_score <= alternate_threshold`
  - threshold evaluated on final post-multiplier total score.
- Max one alternate per slot.
- No hidden extra alternates.

## Budget Precedence Contract
If alternate qualifies but token budget is exceeded:
- Drop alternate first.
- Never drop/truncate winner.
- No nondeterministic truncation behavior.

If multiple slots each have a qualifying alternate and budget pressure requires dropping alternates:
- Drop alternates in deterministic order:
  1. highest `score_delta` first
  2. tie-break by `slot_type` ascending
  3. final tie-break by winner `artifact_id` ascending

## Token Estimation Authority
- Canonical estimator:
  - `memory_lab_token_estimator_whitespace_v1` (runtime whitespace-token approximation, `len(text.split())`-style).
- Enforcement point:
  - prompt assembly before final prompt emission.

## Compactness Requirement
- Contested pressure must remain compact and intelligible.
- Prompt growth from alternate surfacing target: <= 20% (see `metric-definitions.md`).
