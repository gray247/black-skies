# False Confidence Reduction Plan

## Purpose
This document converts the current weakness register into a confirmed and ranked cleanup and stabilization plan focused on test truth, architecture integrity, and roadmap reliability.

## Scope of This Plan
This plan covers:
- test lane integrity
- architecture-boundary reliability
- validation trustworthiness
- doc and status authority where it affects validation decisions
- fixture and harness risks that can create misleading green results

This plan does not attempt to solve:
- feature expansion
- UI polish
- output quality tuning
- speculative future architecture beyond what is needed for a stable environment

## Planning Rules
- No weakness becomes implementation-ready without human confirmation.
- Items are ranked by false-confidence risk, not by aesthetics or ease.
- `Blocks Memory Experiment?` materially affects prioritization.
- Truth-lane risks outrank cosmetic debt.
- Cleanup only matters when it reduces confusion or increases validation reliability.

## Source of Truth Review
The repo has multiple documents that claim authority, but their roles are not perfectly aligned.

Most authoritative for current planning:
- `docs/specs/architecture.md` for runtime topology and boundary statements.
- `docs/BUILD_PLAN.md` for the broad implementation map.
- `docs/phases/phase_charter.md` for phase scope and feature boundaries.
- `phase_log.md` for dated status changes and locked decisions.
- `docs/roadmap.md` for the quick status snapshot.
- `docs/ops/repo_hygiene.md` for hygiene enforcement rules.

Derivative, draft, or drift-prone:
- `docs/tests.md` reads like an older phase and test map and should not be treated as the final authority for truth-lane validation.
- `docs/phase_bridge.md` is explicitly draft-like and should be treated as transition guidance, not canonical scope authority.
- `docs/phases/README.md` mixes multiple authority claims and should be read as an index, not a final arbiter.
- `docs/reviews/*` are review artifacts, not implementation authority.
- `docs/deferred/*` and archive material are non-canonical by design.

Status ambiguity that still matters:
- `phase_log.md`, `docs/roadmap.md`, `docs/phases/phase_charter.md`, and `docs/BUILD_PLAN.md` overlap on scope and status language.
- The repo still needs one clearly documented hierarchy for "status ledger", "scope authority", and "implementation map".
- This plan assumes no single doc should be used alone when a truth-lane decision depends on current status or current scope.
- Observed validation failures and blocker clusters are tracked in `docs/reviews/validation_failures_and_blockers.md`; consult that register before treating any lane as stable.

## Weakness Triage Summary

| Weakness ID | Short title | Classification | Current status | Blocks Memory Experiment? | False-confidence risk | Recommended disposition |
| --- | --- | --- | --- | --- | --- | --- |
| WK-001 | Too many special test worlds let real paths rot | fixture-risk | proposed | yes | critical | implement now |
| WK-002 | E2E default path is too forgiving | harness-fragility | proposed | maybe | critical | implement now |
| WK-003 | Status is split across multiple docs | doc-governance | proposed | maybe | medium | confirm first |
| WK-004 | Test harness is fragile to overlay layering | harness-fragility | proposed | maybe | high | confirm first |
| WK-005 | Legacy stub naming remains in active surfaces | legacy-debt | proposed | no | low | cleanup later |
| WK-006 | `docs/tests.md` is behind Phase 10 reality | doc-governance | proposed | maybe | medium | confirm first |
| WK-007 | Worktree hygiene is noisy | repo-hygiene | proposed | maybe | medium | cleanup later |
| WK-008 | Truth lane and UI-only lane are not separated | truth-lane | proposed | yes | critical | implement now |
| WK-009 | Preload test-hook surface is too large | fixture-risk | proposed | yes | critical | implement now |
| WK-010 | Truth tests and presentation tests are mixed | truth-lane | proposed | yes | critical | implement now |
| WK-011 | Fixture management depends on filesystem assumptions | fixture-risk | proposed | maybe | high | implement now |
| WK-012 | Placeholder branding leaks into runtime-facing modules | legacy-debt | proposed | no | low | cleanup later |
| WK-013 | `app/main/preload.ts` exposes fake control globals | fixture-risk | proposed | yes | critical | implement now |
| WK-014 | `editorial-review-workflow.spec.ts` is UI-only, not backend truth | ui-only | proposed | no | low | confirm first |
| WK-015 | `gui.flows.spec.ts` and similar are harness tests, not truth tests | harness-fragility | proposed | maybe | critical | implement now |
| WK-016 | `scripts/e2e-with-backend.mjs` still falls back to smoke behavior | harness-fragility | proposed | maybe | critical | implement now |
| WK-017 | `docs/ops/start_codex_gui_notes.md` describes placeholder launcher behavior | doc-governance | proposed | no | low | confirm first |
| WK-018 | Deferred and archive material can be mistaken for active scope | doc-governance | proposed | maybe | medium | confirm first |

## Confirmed Priority Tiers

### Tier 0 - Must confirm before implementation
| Weakness ID | Title | Why it belongs here | What must be proven or changed | Work type | Before or after memory kickoff |
| --- | --- | --- | --- | --- | --- |
| WK-003 | Status is split across multiple docs | The repo has overlapping status claims, and the team needs a single human-approved hierarchy before any status-driven implementation queue is trusted. | Confirm which document is the status ledger, which is the scope authority, and which are only pointers. | docs | Before |
| WK-004 | Test harness is fragile to overlay layering | The issue is real, but the named failing spec path and selector trail need current repo confirmation before implementation work starts. | Prove the current file path and reproduce the pointer-intercept failure on the live spec. | tests / harness | Before |
| WK-014 | `editorial-review-workflow.spec.ts` is UI-only, not backend truth | The named file is not fully confirmed in the current file inventory, so the path and role need a repo-state check before any planning assumptions harden. | Confirm the current path and confirm that it is presentation-only. | docs / tests | Before |
| WK-017 | `docs/ops/start_codex_gui_notes.md` describes placeholder launcher behavior | The note may already be stale, and the repo needs confirmation of whether it still matches the live launch path. | Confirm whether the placeholder launcher is still current or already superseded. | docs | Before |
| WK-018 | Deferred and archive material can be mistaken for active scope | The active-vs-archived boundary is not clearly enforced in the doc set, so the team needs a human decision on what counts as active authority. | Prove which docs are active scope and which are archive-only commentary. | docs | Before |

### Tier 1 - Must fix to trust validation
| Weakness ID | Title | Why it belongs here | What must be proven or changed | Work type | Before or after memory kickoff |
| --- | --- | --- | --- | --- | --- |
| WK-001 | Too many special test worlds let real paths rot | Tests can pass against injected state instead of the production contract, which is direct truth-lane contamination. | Reduce the preload test surface and keep only the hooks that are truly required. | architecture / fixture cleanup | Before |
| WK-002 | E2E default path is too forgiving | The default launcher can silently narrow coverage, so a green e2e result may not prove the full review surface. | Make the smoke fallback explicit or replace it with an intentionally named smoke entrypoint. | harness cleanup | Before |
| WK-008 | Truth lane and UI-only lane are not separated | Mixed lane behavior makes green UI tests look like proof of real-service correctness. | Split the lane definitions and require truth-lane coverage for architecture claims. | architecture / tests | Before |
| WK-009 | Preload test-hook surface is too large | A large hook surface lets tests bypass production conditions and hide real regressions. | Inventory the exposed globals and narrow them to a documented harness bridge. | architecture / fixture cleanup | Before |
| WK-010 | Truth tests and presentation tests are mixed | A suite that mixes truth and presentation cannot tell reviewers what actually failed. | Split by intent and stop treating presentation checks as truth evidence. | tests | Before |
| WK-011 | Fixture management depends on filesystem assumptions | Tests may pass because the current filesystem layout happens to satisfy hidden assumptions. | Prove the suite on a clean checkout and remove hidden path coupling. | fixture cleanup | Before |
| WK-013 | `app/main/preload.ts` exposes fake control globals | Fake globals can leak harness assumptions into code that looks production-like. | Reduce or fence the globals behind a narrow harness-only bridge. | architecture / fixture cleanup | Before |
| WK-015 | `gui.flows.spec.ts` and similar are harness tests, not truth tests | Harness stability is not proof of real-service correctness. | Label harness suites explicitly and pair them with truth-lane coverage that does not inject service behavior. | tests / harness cleanup | Before |
| WK-016 | `scripts/e2e-with-backend.mjs` still falls back to smoke behavior | A launcher that narrows coverage by default can mislead reviewers about how much is actually tested. | Replace silent smoke fallback with an explicit smoke mode or a clearly named launcher. | harness cleanup | Before |

### Tier 2 - Must fix before roadmap expansion
| Weakness ID | Title | Why it belongs here | What must be proven or changed | Work type | Before or after memory kickoff |
| --- | --- | --- | --- | --- | --- |
| WK-006 | `docs/tests.md` is behind Phase 10 reality | The document is stale enough to misdirect validation work, but it does not directly invalidate the truth lane by itself. | Confirm whether it is canonical guidance or legacy reference material. | docs | Before |
| WK-012 | Placeholder branding leaks into runtime-facing modules | Placeholder wording is mainly interpretive debt, but it still blurs the boundary between real and transitional surfaces. | Move or rename placeholder guidance so runtime-facing modules do not read like scaffolding. | docs / cleanup | After |

### Tier 3 - Cleanup after stabilization
| Weakness ID | Title | Why it belongs here | What must be proven or changed | Work type | Before or after memory kickoff |
| --- | --- | --- | --- | --- | --- |
| WK-005 | Legacy stub naming remains in active surfaces | Once the truth lane is trustworthy, the remaining stub naming can be cleaned or archived without risking lane confusion. | Move backup-style remnants out of active trees or document them as historical only. | cleanup | After |
| WK-007 | Worktree hygiene is noisy | This reduces review noise, but it is not the core false-confidence problem once the tracked cleanup is stable. | Normalize workspace noise and keep transient outputs out of tracked review paths. | repo hygiene | After |

### Tier 4 - Safe to defer
No weaknesses are currently safe to defer without a confirmation or stabilization step. The remaining items all either affect truth-lane confidence directly or still need human confirmation before the queue can be trusted.

## Ranked Implementation Queue

### WP-01
- Title: Confirm canonical authority and lane definitions
- Goal: Remove ambiguity about which docs define current scope, current status, and current validation authority.
- Weaknesses Addressed: WK-003, WK-006, WK-014, WK-017, WK-018
- Why This Comes Now: The repo currently has overlapping claims about authority, and every downstream validation choice depends on knowing which claims are real.
- Risk if Skipped: The team will keep arguing from different documents and may approve the wrong validation path.
- Dependencies: Human review of the active doc hierarchy and current file paths.
- Evidence Needed Before Change: Confirm which doc is the status ledger, which is the scope authority, and which docs are only pointers or archives.
- Planned Output: A narrow canonical hierarchy for scope, status, and validation references.
- Validation Required: Manual doc review plus the current status consistency check.
- Memory Experiment Impact: Before kickoff.
- Notes for Human Review: This package should settle the authority split before any lane-specific implementation work starts.

### WP-02
- Title: Split truth-lane validation from UI-only and harness coverage
- Goal: Make it impossible to mistake harness or presentation tests for real-service truth.
- Weaknesses Addressed: WK-001, WK-002, WK-008, WK-010, WK-011, WK-015, WK-016
- Why This Comes Now: This is the highest false-confidence cluster in the register and the main reason a green result can still be misleading.
- Risk if Skipped: A passing suite can still hide broken production behavior or a broken real-service boundary.
- Dependencies: WP-01 authority confirmation, current file path confirmation for the real-service and UI-only specs, and a clear definition of the truth lane.
- Evidence Needed Before Change: Confirm which suites are truth-bearing, which are UI-only, and which are harness-only.
- Planned Output: A test taxonomy that cleanly separates truth-lane, UI-only, and harness-only validation.
- Validation Required: Truth-lane Playwright, UI-only Playwright, backend contract/state checks, and renderer/unit checks run as distinct commands.
- Memory Experiment Impact: Before kickoff.
- Notes for Human Review: Do not cite smoke-only or harness-only runs as proof of backend or architecture truth.

### WP-03
- Title: Reduce preload and fixture escape hatches
- Goal: Shrink the hidden test-only surface so the production path is exercised more honestly.
- Weaknesses Addressed: WK-001, WK-009, WK-013
- Why This Comes Now: Even with lane separation, a broad preload bridge can still let tests cheat around production behavior.
- Risk if Skipped: The renderer can look stable only because the harness is injecting state and behavior.
- Dependencies: WP-01 and WP-02, plus a complete inventory of the current preload globals.
- Evidence Needed Before Change: Confirm which preload hooks are required for packaging and which are only for Playwright or harness code.
- Planned Output: A smaller, documented harness bridge with the remaining test-only behavior explicitly contained.
- Validation Required: Truth-lane runs without hidden globals, plus targeted harness checks for any retained bridge.
- Memory Experiment Impact: Before kickoff.
- Notes for Human Review: Any retained test-only global should be justified in writing and treated as harness-only.

### WP-04
- Title: Make real-service Playwright deterministic on a clean checkout
- Goal: Remove filesystem coupling and overlay fragility that can produce misleading green results.
- Weaknesses Addressed: WK-004, WK-011
- Why This Comes Now: The review flow must be reliable enough that a pass means the real service and real interaction path were exercised.
- Risk if Skipped: Overlay or path quirks will keep producing pass/fail noise that is hard to trust.
- Dependencies: Exact current spec path confirmation and a clean-checkout reproduction of the observed failure behavior.
- Evidence Needed Before Change: Reproduce the current interaction issue and verify the fixture assumptions on a clean checkout.
- Planned Output: A deterministic real-service Playwright path with any fragile overlay or fixture coupling called out explicitly.
- Validation Required: Real-service Playwright with tracing enabled, plus a clean checkout rerun.
- Memory Experiment Impact: Before kickoff.
- Notes for Human Review: The exact failing selector path must be confirmed before any fix work starts.

### WP-05
- Title: Reconcile documentation drift that affects validation decisions
- Goal: Stop stale or draft docs from redirecting the team toward the wrong test gate or the wrong scope assumption.
- Weaknesses Addressed: WK-006, WK-012, WK-017, WK-018
- Why This Comes Now: Once the truth lane is defined, the docs still need to stop mislabeling what is active versus transitional.
- Risk if Skipped: Reviewers will keep reading outdated instructions as if they were current validation rules.
- Dependencies: WP-01 canonical hierarchy and the doc ownership decision for any placeholder or deferred material.
- Evidence Needed Before Change: Confirm which docs are live guidance and which are archival commentary.
- Planned Output: A tightened doc set with active scope separated from draft or placeholder guidance.
- Validation Required: Manual doc review plus the current status consistency check.
- Memory Experiment Impact: After kickoff.
- Notes for Human Review: Do not let archive material masquerade as active implementation direction.

### WP-06
- Title: Clean legacy naming and non-critical workspace noise
- Goal: Remove the remaining low-risk naming and workspace artifacts that still make the repo look less settled than it is.
- Weaknesses Addressed: WK-005, WK-007
- Why This Comes Now: These items are not the main truth-lane risk, but they still create ambiguity and review noise after the lane work is stable.
- Risk if Skipped: The repo remains harder to read and easier to misclassify during review.
- Dependencies: The truth-lane and authority work above should already be stable.
- Evidence Needed Before Change: Confirm which stub-named files are intentional historical references and which are only leftover noise.
- Planned Output: Cleaner names or explicit archival placement for the remaining legacy surfaces.
- Validation Required: Repo hygiene scan, `git diff --check`, and status review on a clean tree.
- Memory Experiment Impact: After kickoff.
- Notes for Human Review: This is cleanup debt, not a substitute for truth-lane work.

## Validation Strategy by Lane
Truth lane means the run is intended to prove production behavior against the real service boundary, not against injected harness state.

UI-only lane means the run is intended to prove presentation, workflow, or interaction behavior only. It is useful, but it does not prove backend truth.

Backend contract/state checks prove service shapes, response codes, and state transitions in the backend layer. They do not prove that the renderer is using the right path, or that the harness is not cheating.

Renderer/unit tests prove local component and adapter behavior. They do not prove real-service integration, service routing, or lane separation.

Repo hygiene proves the tree is free from tracked junk, diff noise, and ignored/generated artifacts in tracked paths. It does not prove correctness, architecture integrity, or service truth.

None of these lanes alone prove memory/intelligence experiment readiness. That only happens when the truth lane is explicit, the authority docs are aligned, and the harness cannot quietly stand in for production behavior.

Cleaned validation command list:
Commands that name specific Playwright specs assume WP-01 has already confirmed the current file paths.

| Lane | What it proves | Commands |
| --- | --- | --- |
| Truth lane | Real-service review behavior under the canonical review gate | `cmd /c pnpm phase10:review` |
| Truth lane | Real-service Playwright on the confirmed truth path | `pnpm --dir app exec playwright test tests/e2e/project-home.real-service.spec.ts tests/e2e/phase10.review.spec.ts --project=electron --workers=1` |
| UI-only lane | Presentation-only review workflow and harness behavior | `pnpm --dir app exec playwright test tests/e2e/editorial-review-workflow.spec.ts --project=electron --workers=1` |
| Backend contract/state | API contract and service state behavior | `python -m pytest services/tests/test_analytics_endpoints.py -q` |
| Backend contract/state | Wider backend contract and regression coverage | `python -m pytest services/tests -q` |
| Renderer/unit | Renderer component and adapter behavior | `pnpm --filter app test` |
| Repo hygiene | Tracked-path hygiene and diff cleanliness | `python scripts/check_repo_hygiene.py --tracked`<br>`python scripts/check_repo_hygiene.py --staged`<br>`git diff --check` |
| Hook wiring sanity | Local hook invocation after install | `git hook run pre-commit` |

Warning: smoke-only e2e, harness-only GUI flows, and UI review workflows are not proof of backend truth or architecture readiness.

## Immediate Human Review Questions
1. Which document is the canonical status ledger: `phase_log.md`, `docs/roadmap.md`, `docs/phases/phase_charter.md`, or `docs/BUILD_PLAN.md`?
2. Which doc is the canonical implementation map when `docs/BUILD_PLAN.md` and the phase docs disagree?
3. Are `tests/e2e/project-home.real-service.spec.ts` and `tests/e2e/phase10.review.spec.ts` still the current real-service truth path, or have they been renamed?
4. Is `tests/e2e/editorial-review-workflow.spec.ts` still present, and if so should it stay strictly UI-only?
5. Which preload globals in `app/main/preload.ts` are still required for packaging, and which are only for Playwright or harness use?
6. Is `scripts/e2e-with-backend.mjs` still the canonical review launcher, or is the smoke fallback already obsolete?
7. Are `analytics_stub.py` and any remaining stub-named runtime files intentional active code, historical remnants, or archive candidates?
8. Which fixture directories are intentionally versioned and which are generated per run?

## Recommended Execution Order
1. Confirm the canonical authority hierarchy and current file paths for the truth-lane specs and launcher.
2. Lock the lane taxonomy so truth-lane, UI-only, and harness-only tests cannot be cited interchangeably.
3. Reduce the preload and fixture escape hatches that let tests bypass production behavior.
4. Stabilize the real-service Playwright path and clean-checkout fixture assumptions.
5. Clean up the remaining doc drift and legacy naming after the truth lane is trustworthy.
6. Use the blocker register to decide which validation-stability pass comes next.
7. Re-evaluate memory/intelligence experiment kickoff only after the above is green and documented.

## Exit Criteria for Stable Enough to Proceed
- Truth-lane tests are clearly separated from UI-only and harness-only tests in both docs and command names.
- Validation commands are explicit about what they prove and what they do not prove.
- Preload test hooks are either reduced or formally contained behind a documented harness bridge.
- Fixture assumptions are documented or removed, and the truth-lane run is reproducible on a clean checkout.
- Status and scope docs no longer mislead reviewers about which lane is canonical for a given decision.
- Repo hygiene and `git diff --check` are clean, but they are not being used as a proxy for truth-lane correctness.
- The next roadmap step or memory/intelligence experiment can start only when the truth lane, authority docs, and harness boundaries all agree.
