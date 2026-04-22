# Memory Lab: Event Contract

## Scope
Defines advisory event behavior for reinforcement, decay, and contested outcome records.

## Core Rules
- Events are advisory only.
- Event writes are fail-soft.
- Event history must not be silently truncated due to parse failures.
- Legacy read / new write policy is required (see `compatibility.md`).

## Contested Outcome Event (Phase 5)
One lightweight contested outcome event is appended per slot decision.

### Minimum Required Fields
- `event_id`
- `schema_version`
- `created_at`
- `scene_order`
- `chapter_id`
- `slot_type`
- `contested_key`
- `winner_artifact_id`
- `winner_score`
- `runner_up_artifact_id` (nullable)
- `runner_up_score` (nullable)
- `score_delta` (nullable)
- `alternate_included` (bool)
- `alternate_threshold`
- `fallback_used` (bool)
- `tie_break_applied` (bool)
- `tie_break_basis` (nullable string/tuple representation)

## Failure-Class Behavior
- Unreadable event file:
  - unavailable for this run only
  - log corruption
  - never overwrite or truncate corrupt file
- Partial parse:
  - retain valid entries
  - skip malformed entries
  - do not rewrite history because of malformed items
- Persistence failure:
  - fail-soft and log diagnostic
  - request continues

## Write Rate Contract
- Max 1 contested event per slot per scene decision.

