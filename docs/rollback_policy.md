# Phase Rollback Policy (Draft)

When a phase needs to be re-opened after lock:

1. **Trigger:** Identify regression or unmet acceptance criteria. Log it in `docs/phases/phase_log.md` with date and note.
2. **Approval:** Record your maintainer sign-off directly in `docs/phases/phase_log.md` before executing rollback steps.
3. **Rollback steps:**
   - Revert offending change set or feature flag.
   - Restore last known good build tag (see `docs/roadmap.md` milestones).
   - Update charter "Done when" section to reflect outstanding work.
4. **Communication:** Update your planning notes (for example `phase_log.md` or personal tracker) and set a new verification date.
5. **Re-lock:** Once fixes land, rerun associated tests/gates and record completion in `docs/phases/phase_log.md`.

_This draft will evolve once the first rollback scenario is exercised._
