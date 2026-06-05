# Pass 179 - RDM-WRAPPER-001 Wrapper / Launcher / CWD Authority Contract

## Files Inspected
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/roadmap/deferred_work_matrix.md`
- `docs/audits/phase16/pass177_phase16_closure_and_next_lane_selection_review.md`
- `docs/audits/phase16/pass178_rdm_wrapper_launcher_cwd_authority_planning.md`
- `package.json`
- `app/package.json`
- `app/main/main.ts`
- `app/main/preload.ts`
- `app/playwright.config.ts`
- `scripts/dev-runner.mjs`
- `scripts/electron-dev.mjs`
- `scripts/e2e-with-backend.mjs`
- `scripts/truth-with-backend.mjs`
- `scripts/test_e2e_launcher_args.mjs`
- `scripts/run-dev-backend.ps1`
- `scripts/load.py`
- `scripts/smoke_runner.py`
- `scripts/smoke.sh`
- `scripts/smoke.ps1`
- `.github/workflows/eval.yml`
- `docs/tests.md`
- `docs/runbooks/ci_playwright_diagnostic_plan.md`
- wrapper / launcher / CWD references in docs and audits

## Files Changed
- `docs/contracts/wrapper_launcher_cwd_authority_contract.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase16/pass179_rdm_wrapper_launcher_cwd_authority_contract.md`

## Contract Summary
- The new wrapper / launcher / CWD authority contract defines canonical command authority, repo-root versus app-root boundaries, dev versus packaged boundaries, backend spawn and port ownership boundaries, and the difference between CI, smoke, harness, truth, and synthetic launch evidence.
- It also blocks command-doc overclaiming by requiring explicit execution evidence for closure-grade claims.

## Launcher Surfaces Classified
- `pnpm dev` and `scripts/dev-runner.mjs`: local dev launch authority only.
- `scripts/electron-dev.mjs`: app-root Electron launch boundary only.
- `pnpm test:e2e` and `scripts/e2e-with-backend.mjs`: harness/smoke evidence only.
- `pnpm test:truth` and `scripts/truth-with-backend.mjs`: authoritative truth-lane evidence only.
- `pnpm test:service-truth` and `scripts/run_service_truth.py`: backend/service truth only.
- `scripts/load.py` and `scripts/smoke_runner.py`: synthetic/load or smoke helper evidence only.
- `scripts/run-dev-backend.ps1`: local Windows helper guidance only.
- `app/main/main.ts`: main-process backend spawn and dev/packaged CWD resolution authority.
- `app/main/preload.ts`: bridge port and timeout resolution authority.
- `app/playwright.config.ts`: Playwright harness config authority.
- `.github/workflows/eval.yml`: CI launch and artifact authority.

## CWD / Port / Process Boundary Summary
- Repo-root commands are not interchangeable with app-root commands.
- Dev launch, packaged launch, CI launch, smoke launch, and truth launch each own different authority boundaries.
- Port ownership can be local, external, or reused healthy-backend ownership; those states must not be conflated.
- A healthy backend port alone does not prove wrapper correctness or launch correctness.

## Overclaim Language Blocked
- CI green proves local launch determinism.
- Smoke launch proves packaged launch.
- Packaged launch proves dev launch.
- Synthetic/load launch proves real backend performance.
- UI opens once proves wrapper authority.
- Backend health alone proves full launch correctness.
- Command docs prove runtime behavior without execution evidence.

## Implementation Boundary
- Next implementation pass should stay narrow to wrapper / launcher / CWD authority and canonical command guidance.
- Prefer existing launch scripts and docs.
- Only change runtime/scripting behavior if a specific contradiction or unsafe ambiguity is identified by the contract.
- Do not expand into GUI cleanup, critique repair, continuity repair, restore, Memory Lab, export, packaging, or `sc_0001`.

## Human Spot-Check Decision
- Required after implementation.
- This lane affects operator-visible launch behavior and canonical command guidance, so the next runtime-facing pass needs a focused local launch spot-check before closure.

## Validation Results
- `git diff --check` passed, with only the existing CRLF normalization warning on `docs/BLACK_SKIES_FIX_TRACKER.md`
- `pnpm lint:docs` passed

## Recommended Next Pass
- `Pass 180 - RDM-WRAPPER-001 Command Guidance Alignment`
- Goal: align the operator-facing launcher guidance to the contract and only then decide whether any runtime script changes are necessary.

