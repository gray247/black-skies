# Known Weaknesses Register

## Purpose
This is a staging document for review, not implementation approval. It collects currently known weaknesses so humans can confirm whether each item is real, well-evidenced, and relevant before any fix work begins.

## Review Rules
- No item is implementation-approved until a human marks it `confirmed`.
- Codex must not act on this document automatically.
- This document is allowed to be wrong and must be challenged.

## Classification Legend
- `truth-lane` - weaknesses in the real-service path or the architecture boundary that must stay faithful to production behavior.
- `ui-only` - weaknesses that only affect the renderer presentation surface and are not meant to validate backend truth.
- `harness-fragility` - weaknesses in Playwright, fixtures, launchers, or automation glue that can produce misleading green/red results.
- `doc-governance` - drift, ambiguity, or conflicting scope across documentation and status artifacts.
- `repo-hygiene` - generated artifacts, stray outputs, deleted files, or workspace noise that reduce trust in the repository state.
- `legacy-debt` - stale naming, placeholder modules, or old scaffolding that still leaks into current code or docs.
- `fixture-risk` - over-broad test hooks, stub surfaces, or environment assumptions that weaken test fidelity.

## Severity Legend
- `critical`
- `high`
- `medium`
- `low`

## Status Legend
- `proposed`
- `confirmed`
- `disputed`
- `deferred`
- `resolved`

## Memory Experiment Impact Legend
- `yes` - blocks or corrupts upcoming memory/intelligence experiments.
- `maybe` - could interfere depending on implementation.
- `no` - safe to ignore for now.

## Summary of Known Weakness Themes
- Test and preload hooks are broad enough that green UI tests can still miss real-service regressions.
- Documentation and phase-status artifacts still disagree about what is active, deferred, or canonical.
- Several modules and test assets still carry stub or placeholder naming, which blurs the line between temporary scaffolding and production behavior.
- Repo hygiene remains noisy enough that generated outputs and deleted artifacts can distract from the actual review signal.

## Weakness Entries

### WK-001
- Title: Too many special test worlds let real paths rot
- Classification: fixture-risk
- Severity: high
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): yes
- Area: Electron test hooks and environment overrides
- Evidence: `app/main/preload.ts` exposes multiple test-only flags and state shims (`__testEnv`, `__testEnvFlatMode`, `__testEnvFullMode`, `__testEnvRecoveryMode`, `__testEnvStableDock`, `__testEnvStableHome`, `__testEnvVisualStable`, `__testEnvActiveFlow`, `__dev`, `__testInsights`). `app/tests/e2e/gui.flows.spec.ts` and `app/tests/e2e/_electron.fixture.ts` rely on those hooks plus service stubs.
- Why It Matters: A test-only path can stay green even when the real production path breaks, which is especially dangerous if the memory/intelligence work will depend on the same runtime boundaries.
- Affected Files / Surfaces: `app/main/preload.ts`; `app/tests/e2e/_electron.fixture.ts`; `app/tests/e2e/gui.flows.spec.ts`
- False-Confidence Risk: High. Tests can pass against injected state rather than the production contract.
- Recommended Validation: Audit every exposed test flag, identify which are still needed for true end-to-end coverage, and rerun real-service Playwright without the stubbed branches.
- Suggested Fix Direction: Reduce the preload test surface and isolate any remaining test hooks behind a narrow, explicit harness API.
- Related Items: WK-008, WK-009, WK-010, WK-013, WK-015
- Human Review Notes: Needs code confirmation on which hooks are required for packaging versus only for Playwright.

### WK-002
- Title: E2E default path is too forgiving
- Classification: harness-fragility
- Severity: medium
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): maybe
- Area: E2E launcher and Playwright selection
- Evidence: `scripts/e2e-with-backend.mjs` uses a smoke fallback when no explicit test files are passed: it applies `--grep smoke_` unless `FULL_ANALYTICS_E2E=1` or custom tests are provided.
- Why It Matters: The launcher can mask non-smoke regressions by default, so a passing e2e command does not necessarily mean the full surface is healthy.
- Affected Files / Surfaces: `scripts/e2e-with-backend.mjs`; `app/tests/e2e/*.spec.ts`
- False-Confidence Risk: Medium to high. Reviewers may believe the default e2e run covers more than it actually does.
- Recommended Validation: Compare smoke-only versus full-suite failures and confirm whether the default launch path is still acceptable for Phase 10 and memory-layer validation.
- Suggested Fix Direction: Make the default explicit, or require an intentional flag for smoke-only fallback.
- Related Items: WK-004, WK-015, WK-016
- Human Review Notes: Needs repo-state confirmation if this launcher is still the canonical entrypoint for review gates.

### WK-003
- Title: Status is split across multiple docs
- Classification: doc-governance
- Severity: medium
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): maybe
- Area: phase planning and status documents
- Evidence: `docs/phases/phase_log.md`, `docs/roadmap.md`, and `docs/phase_bridge.md` all describe scope and status, but they do not use the same role or level of authority. `docs/tests.md` also carries its own phase gate language.
- Why It Matters: Conflicting status sources make it easy to misread what is locked, planned, or deferred, which can send review effort to the wrong place.
- Affected Files / Surfaces: `docs/phases/phase_log.md`; `docs/roadmap.md`; `docs/phase_bridge.md`; `docs/tests.md`
- False-Confidence Risk: Medium. A reviewer can believe a phase is settled when the docs are only partially aligned.
- Recommended Validation: Run the repo status consistency check and compare the result against the phase charter and review register.
- Suggested Fix Direction: Assign one canonical status source and convert the others into thin pointers.
- Related Items: WK-006, WK-018
- Human Review Notes: Needs code confirmation only if a code-path decision depends on which doc is authoritative.

### WK-004
- Title: Test harness is fragile to overlay layering
- Classification: harness-fragility
- Severity: high
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): maybe
- Area: Phase 10 Playwright review surface
- Evidence: Observed failure history: `app/test-results/phase10.review-*` contains trace and boot artifacts for the Phase 10 review runs, and the rendered UI surface includes overlapping pane, overlay, and toolbar controls. The seed issue specifically names a pointer-intercept failure in `phase10.review.spec.ts`, but the exact failing selector path needs code confirmation.
- Why It Matters: If overlay layering remains fragile, the same type of interaction bug can invalidate experiments that depend on the intelligence or memory surfaces staying reachable.
- Affected Files / Surfaces: `app/test-results/phase10.review-*`; `app/playwright-report/data/*`; `app/tests/e2e/*` review and dock flows
- False-Confidence Risk: High. A visually correct screen can still be functionally blocked by an overlay or pointer-capture issue.
- Recommended Validation: Reproduce the Phase 10 review flow with tracing enabled and verify all interactions under the exact z-order and focus conditions used by the truth-lane tests.
- Suggested Fix Direction: Reduce overlay overlap, tighten z-index rules, and add direct regression checks for pointer interception.
- Related Items: WK-014, WK-015
- Human Review Notes: Needs code confirmation for the precise failure line if the named spec exists under a renamed path.

### WK-005
- Title: Legacy stub naming remains in active surfaces
- Classification: legacy-debt
- Severity: low
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): no
- Area: service helpers and backup files
- Evidence: `services/src/blackskies/services/analytics_stub.py` still exists, alongside backup files such as `services/src/blackskies/services/analytics_stub.py.bak`, `.bak2`, and `.bak3`. Similar `.bak` files also exist in the test tree.
- Why It Matters: Stub naming signals temporary behavior, but if those files are still present in active trees they can confuse reviewers about what is real versus transitional.
- Affected Files / Surfaces: `services/src/blackskies/services/analytics_stub.py`; `services/src/blackskies/services/analytics_stub.py.bak*`; `app/tests/e2e/*.bak`
- False-Confidence Risk: Low to medium. The code may be correct while the names still imply incompleteness.
- Recommended Validation: Confirm whether each stub or backup file is intentionally retained for provenance or should be archived out of the active tree.
- Suggested Fix Direction: Replace backup naming with explicit archive placement or documented deprecation markers.
- Related Items: WK-012, WK-017
- Human Review Notes: Needs repo-state confirmation if any `.bak` files are meant to remain as active references.

### WK-006
- Title: `docs/tests.md` is behind Phase 10 reality
- Classification: doc-governance
- Severity: medium
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): maybe
- Area: test strategy documentation
- Evidence: `docs/tests.md` still frames phases and commands in a way that predates the current Phase 10 and Phase 11 planning language in `docs/roadmap.md` and `docs/phases/phase_log.md`.
- Why It Matters: Outdated test guidance causes reviewers to trust old gates, which can hide gaps in the truth lane and the memory-experiment validation path.
- Affected Files / Surfaces: `docs/tests.md`; `docs/roadmap.md`; `docs/phases/phase_log.md`
- False-Confidence Risk: Medium. The doc can look authoritative while describing an older release state.
- Recommended Validation: Reconcile the test-strategy doc against the current phase log and roadmap, then re-check the listed commands for current relevance.
- Suggested Fix Direction: Refresh the document or convert it to a narrow pointer into the canonical phase and testing docs.
- Related Items: WK-003, WK-018
- Human Review Notes: Needs code confirmation only if teams rely on this doc to choose validation commands.

### WK-007
- Title: Worktree hygiene is noisy
- Classification: repo-hygiene
- Severity: medium
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): maybe
- Area: repository state and generated outputs
- Evidence: `git status` previously showed a large set of tracked deletions and many untracked artifacts, including generated Playwright reports, test-result folders, hypothesis constants, and stray sample-project outputs. The review surface also shows directories that were permission-sensitive or transient.
- Why It Matters: A noisy tree makes it harder to tell which artifacts are intentional, which are generated, and which changes are part of the actual architecture step.
- Affected Files / Surfaces: `.hypothesis/constants/*`; `app/playwright-report/*`; `app/test-results/*`; `sample_project/*`; transient `.tmp` and cache directories
- False-Confidence Risk: Medium. Reviewers can mistake generated artifacts for intentional source changes.
- Recommended Validation: Run a read-only status review and a dry-run clean check, then separate source changes from generated output in the register.
- Suggested Fix Direction: Keep generated artifacts out of the review surface or quarantine them in clearly documented locations.
- Related Items: WK-005, WK-011
- Human Review Notes: Needs repo-state confirmation because the tree has changed since the initial status snapshot.

### WK-008
- Title: Truth lane and UI-only lane are not separated
- Classification: truth-lane
- Severity: high
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): yes
- Area: architecture boundary and review methodology
- Evidence: `app/tests/e2e/_electron.fixture.ts` always starts service stubs before launch, while `app/tests/e2e/gui.flows.spec.ts` mixes harness bootstrapping, fake service overrides, and UI assertions. The presence of `__dev.overrideServices` in `app/main/preload.ts` deepens the mix.
- Why It Matters: If the truth lane is not distinct from the UI-only lane, a passing UI test can be mistaken for a real-service truth result and contaminate any memory/intelligence experiment built on top of it.
- Affected Files / Surfaces: `app/tests/e2e/_electron.fixture.ts`; `app/tests/e2e/gui.flows.spec.ts`; `app/main/preload.ts`
- False-Confidence Risk: High. The same test can validate presentation, harness behavior, and service logic at once, which hides which layer actually failed.
- Recommended Validation: Split the existing tests into explicit truth-lane and UI-only suites, then require the truth lane for any architecture decision.
- Suggested Fix Direction: Establish named lanes with hard boundaries and separate launchers or fixture stacks for each lane.
- Related Items: WK-009, WK-010, WK-014, WK-015
- Human Review Notes: Needs code confirmation for which current tests are intended to be truth-bearing.

### WK-009
- Title: Preload test-hook surface is too large
- Classification: fixture-risk
- Severity: high
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): yes
- Area: Electron preload bridge
- Evidence: `app/main/preload.ts` exposes a wide set of test flags and behavior toggles, including Playwright-aware state, offline/online forcing, stable-dock and stable-home flags, visual-stability flags, active-flow flags, and debug logging.
- Why It Matters: A large hook surface makes it easy for tests to bypass production conditions and easy for new code to lean on test-only assumptions.
- Affected Files / Surfaces: `app/main/preload.ts`
- False-Confidence Risk: High. The renderer can appear stable while only the test-conditioned path is actually exercised.
- Recommended Validation: Inventory every preload-exposed hook, annotate its owner and purpose, and prove that each hook is still needed for a truth-lane run.
- Suggested Fix Direction: Collapse test-only state into a smaller, documented harness contract.
- Related Items: WK-001, WK-013
- Human Review Notes: Needs code confirmation on whether the current preload contract is still intentionally broad.

### WK-010
- Title: Truth tests and presentation tests are mixed
- Classification: truth-lane
- Severity: high
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): yes
- Area: test taxonomy and review discipline
- Evidence: `app/tests/e2e/gui.flows.spec.ts` covers smoke flows, budget guardrails, snapshot restore, and service-port failure states in the same file. The test tree also includes visual and smoke suites that are presentation-heavy by design.
- Why It Matters: If truth checks and presentation checks are mixed, the result set cannot reliably tell reviewers whether the architecture is truly correct or only visually acceptable.
- Affected Files / Surfaces: `app/tests/e2e/gui.flows.spec.ts`; `app/tests/e2e/visual.home.spec.ts`; `app/tests/e2e/gui.smoke.spec.ts`; `app/tests/e2e/gui.snapshot_verification_flow.spec.ts`
- False-Confidence Risk: High. The suite may pass while the real-service contract is still unproven.
- Recommended Validation: Classify each e2e test by intent, then require truth-lane cases to use real-service contracts and no presentation-only shortcuts.
- Suggested Fix Direction: Split the suites by intent and gate truth-lane claims on the truth suite only.
- Related Items: WK-008, WK-014, WK-015
- Human Review Notes: Needs code confirmation on the intended role of each suite before any rename or split is proposed.

### WK-011
- Title: Fixture management depends on filesystem assumptions
- Classification: fixture-risk
- Severity: medium
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): maybe
- Area: sample-project fixtures and launcher assumptions
- Evidence: The test fixture loads sample projects from disk, the repository contains many generated sample-project variants, and `app/tests/e2e/_electron.fixture.ts` depends on `dist-electron`, `dist`, and `main/main.ts` availability at runtime. The current repo state also shows many sample-project outputs and generated folders.
- Why It Matters: Subtle path assumptions can make tests pass only on one developer layout or one generated state, which is fragile for future memory-layer experiments.
- Affected Files / Surfaces: `app/tests/e2e/_electron.fixture.ts`; `app/tests/e2e/utils/sampleProject.ts`; `sample_project/*`
- False-Confidence Risk: Medium. The test can be passing because the expected files happen to exist in the local layout.
- Recommended Validation: Verify the test setup against a clean checkout and confirm that the launcher does not depend on hidden generated state.
- Suggested Fix Direction: Reduce filesystem coupling and document the minimum required fixture layout explicitly.
- Related Items: WK-007, WK-016
- Human Review Notes: Needs repo-state confirmation because sample-project directories are generated and may vary between runs.

### WK-012
- Title: Placeholder branding leaks into runtime-facing modules
- Classification: legacy-debt
- Severity: low
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): no
- Area: runtime-facing docs and service helpers
- Evidence: `docs/ops/start_codex_gui_notes.md` documents that the renderer launch path uses a placeholder Electron task and that the placeholder does not spawn a native window. `services/src/blackskies/services/analytics_stub.py` also carries stub branding in a service-adjacent module.
- Why It Matters: Placeholder branding is fine during transition, but if it remains in active runtime surfaces it blurs what is real, temporary, or deprecated.
- Affected Files / Surfaces: `docs/ops/start_codex_gui_notes.md`; `services/src/blackskies/services/analytics_stub.py`
- False-Confidence Risk: Low. The main risk is interpretive confusion, not direct functional breakage.
- Recommended Validation: Confirm whether the placeholder wording is still current or should be moved to archival guidance.
- Suggested Fix Direction: Rename or relocate transitional branding so runtime-facing paths do not read like scaffolding.
- Related Items: WK-005, WK-017
- Human Review Notes: Needs repo-state confirmation if the placeholder launcher is still the live guidance for `pnpm dev`.

### WK-013
- Title: `app/main/preload.ts` exposes fake control globals
- Classification: fixture-risk
- Severity: high
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): yes
- Area: Electron preload / renderer control surface
- Evidence: `app/main/preload.ts` exposes `__testEnv`, `__dev`, `__test`, and `__testInsights`, plus several `__testEnv*` globals that directly alter renderer behavior. It also writes test-only state such as `__dockReady` and `__stableDockHandleReady` in Playwright mode.
- Why It Matters: Fake control globals can leak harness assumptions into code that looks production-like, which is the kind of contamination that can later distort memory or intelligence experiments.
- Affected Files / Surfaces: `app/main/preload.ts`
- False-Confidence Risk: High. A code path can appear to be production-safe while still being driven by test globals.
- Recommended Validation: Enumerate every exposed global, tag which are harness-only, and test that production paths work when those globals are absent.
- Suggested Fix Direction: Minimize global test controls and replace them with a narrow, explicit bridge used only by harness code.
- Related Items: WK-001, WK-009
- Human Review Notes: Needs code confirmation before any globals are removed or collapsed.

### WK-014
- Title: `editorial-review-workflow.spec.ts` is UI-only, not backend truth
- Classification: ui-only
- Severity: low
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): no
- Area: GUI review workflows
- Evidence: The seed issue identifies `editorial-review-workflow.spec.ts` as a UI-only surface. The current file inventory does not show that exact path, so the name needs repo-state confirmation before it is treated as a live file.
- Why It Matters: UI-only tests are useful, but they must not be mistaken for evidence that the backend truth lane is correct.
- Affected Files / Surfaces: `app/tests/e2e/editorial-review-workflow.spec.ts` if present; related GUI review flows
- False-Confidence Risk: Medium. A reviewer can overread a passing UI workflow as proof of system truth.
- Recommended Validation: Confirm the current path or rename, then label the suite as UI-only in the test taxonomy.
- Suggested Fix Direction: Keep the workflow as presentation coverage only and stop using it as backend evidence.
- Related Items: WK-010, WK-015
- Human Review Notes: Needs repo-state confirmation because the named file is not visible in the current test inventory.

### WK-015
- Title: `gui.flows.spec.ts` and similar are harness tests, not truth tests
- Classification: harness-fragility
- Severity: medium
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): maybe
- Area: GUI smoke and flow tests
- Evidence: `app/tests/e2e/gui.flows.spec.ts` uses `installServiceStubs`, `bootstrapHarness`, and injected overrides via `window.__dev.overrideServices`, while the sibling `app/tests/e2e/gui.smoke.spec.ts` and `app/tests/e2e/dock-workspace.spec.ts` follow the same harness-heavy pattern.
- Why It Matters: Harness tests are valuable, but they are not sufficient evidence that the real service or memory-intelligence boundary behaves correctly.
- Affected Files / Surfaces: `app/tests/e2e/gui.flows.spec.ts`; `app/tests/e2e/gui.smoke.spec.ts`; `app/tests/e2e/dock-workspace.spec.ts`
- False-Confidence Risk: Medium. The harness can be stable while the actual integrated path is broken.
- Recommended Validation: Mark these tests explicitly as harness coverage and pair them with truth-lane coverage that does not inject service behavior.
- Suggested Fix Direction: Keep the harness, but stop treating it as proof of end-to-end truth.
- Related Items: WK-008, WK-010, WK-014, WK-016
- Human Review Notes: Needs code confirmation on which suite names should be considered harness-only in the docs.

### WK-016
- Title: `scripts/e2e-with-backend.mjs` still falls back to smoke behavior
- Classification: harness-fragility
- Severity: medium
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): maybe
- Area: backend-driven Playwright launcher
- Evidence: The launcher defaults to `gui.flows.spec.ts` and `dock-workspace.spec.ts`, then applies `--grep smoke_` unless full analytics e2e is enabled or explicit tests are passed. That means the launcher can silently narrow its scope.
- Why It Matters: A default that narrows coverage can hide failures exactly when reviewers think they are running a broad system check.
- Affected Files / Surfaces: `scripts/e2e-with-backend.mjs`
- False-Confidence Risk: Medium. The launcher can look like a full system check while actually running only smoke paths.
- Recommended Validation: Compare launcher output with actual test selection and require the narrowing behavior to be explicit in the command name or flags.
- Suggested Fix Direction: Replace silent smoke fallback with an opt-in smoke mode or a clearly named launcher.
- Related Items: WK-002, WK-015
- Human Review Notes: Needs code confirmation if the launcher is meant to remain the canonical review path.

### WK-017
- Title: `docs/ops/start_codex_gui_notes.md` describes placeholder launcher behavior
- Classification: doc-governance
- Severity: low
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): no
- Area: operational docs
- Evidence: The document explicitly says the `pnpm dev` path uses a placeholder Electron task and that the placeholder does not spawn a native window. It also frames manual launch steps around that behavior.
- Why It Matters: The doc is honest about the placeholder, but it also risks becoming stale if the real launcher is introduced without updating the note.
- Affected Files / Surfaces: `docs/ops/start_codex_gui_notes.md`; `scripts/electron-dev-placeholder.mjs` if still current
- False-Confidence Risk: Low. The main danger is stale guidance, not a hidden code defect.
- Recommended Validation: Confirm whether the placeholder launcher is still the current dev entrypoint and update the note only after that is verified.
- Suggested Fix Direction: Point the doc at the real launcher once it exists, or move the placeholder guidance into archive material.
- Related Items: WK-012, WK-018
- Human Review Notes: Needs repo-state confirmation because the launcher implementation may have changed since the note was written.

### WK-018
- Title: Deferred and archive material can be mistaken for active scope
- Classification: doc-governance
- Severity: medium
- Status: proposed
- Blocks Memory Experiment? (yes / no / maybe): maybe
- Area: planning, archive, and deferred docs
- Evidence: `docs/roadmap.md` lists deferred features, while archive review docs and the phase bridge still describe overlapping future work. The current doc set makes it easy to confuse archive commentary with active scope.
- Why It Matters: If deferred material is mistaken for active scope, reviewers may approve work or validation steps that are not actually part of the current architecture step.
- Affected Files / Surfaces: `docs/roadmap.md`; `docs/phase_bridge.md`; `docs/archive/reviews/*`; `docs/deferred/*`
- False-Confidence Risk: Medium. Old planning language can read like current direction.
- Recommended Validation: Separate active scope from archival commentary in the review register and confirm which docs are authoritative for Phase 10 and the memory layer.
- Suggested Fix Direction: Mark archive and deferred material as non-canonical in the live docs and keep the active scope reference small.
- Related Items: WK-003, WK-006, WK-017
- Human Review Notes: Needs code confirmation only if a live feature decision still points to archived material.

## Suggested Validation Lanes
- Must-run truth lane: `cmd /c pnpm phase10:review`
- Status / doc consistency: `python scripts/check_roadmap_vs_phase_log.py`
- Backend contract/state: `python -m pytest services/tests/test_analytics_endpoints.py -q`
- Backend contract/state: `python -m pytest services/tests -q`
- Renderer/unit: `pnpm --filter app test`
- Real-service Playwright (truth): `pnpm --dir app exec playwright test tests/e2e/project-home.real-service.spec.ts tests/e2e/phase10.review.spec.ts --project=electron --workers=1`
- UI-only control lane: `pnpm --dir app exec playwright test tests/e2e/editorial-review-workflow.spec.ts --project=electron --workers=1`
- Build sanity: `pnpm --dir app run build:production`
- Repo hygiene checks: `git status`
- Repo hygiene checks: `git clean -n` only, never the destructive form

## Open Review Questions
- Which hooks in `app/main/preload.ts` are still required for a real truth-lane run, and which are only for Playwright?
- Which document is the canonical authority for active phase status: `phase_log.md`, `roadmap.md`, or `phase_bridge.md`?
- Are the named real-service specs (`phase10.review.spec.ts`, `project-home.real-service.spec.ts`) still present under the same paths, or have they been renamed?
- Which tests are intentionally UI-only or harness-only, and where should that be documented so reviewers do not overread them?
- Are `analytics_stub.py` and the `.bak` files intentional historical artifacts, or are they accidental remnants that should be archived later?
- Is the placeholder launcher note still current, or is it already describing a superseded workflow?

## Initial Prioritization Proposal

### Fix before continuing Phase 10 validation
- WK-002
- WK-004
- WK-008
- WK-009
- WK-010
- WK-011
- WK-013
- WK-015
- WK-016

### Fix before memory experiment begins
- WK-001
- WK-008
- WK-009
- WK-010
- WK-013

### Fix after truth-lane stability
- WK-003
- WK-006
- WK-012
- WK-017
- WK-018

### Cleanup / cosmetic / defer
- WK-007
- WK-014
- WK-005

## Review Stance
This register is intentionally conservative. Items should remain in `proposed` until a human confirms that the weakness is real, correctly classified, and relevant to the next architecture step.
