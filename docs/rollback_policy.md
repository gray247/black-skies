# Phase Rollback Policy (Draft)

When a phase needs to be re-opened after lock:

1. **Trigger:** Identify regression or unmet acceptance criteria. Log it in `docs/phase_log.md` with date & owner.
2. **Approval:** Secure sign-off from phase owner + release engineering (see `docs/roles.md`).
3. **Rollback steps:**
   - Revert offending change set or feature flag.
   - Restore last known good build tag (see `docs/roadmap.md` milestones).
   - Update charter “Done when” section to reflect outstanding work.
4. **Communication:** Post update in #phase-updates, assign follow-up tickets, and set new verification date.
5. **Re-lock:** Once fixes land, rerun associated tests/gates and record completion in `docs/phase_log.md`.

_This draft will evolve once the first rollback scenario is exercised._
