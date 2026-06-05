# Pass 180 - RDM-WRAPPER-001 Command Guidance Alignment

## Files Inspected
- `docs/contracts/wrapper_launcher_cwd_authority_contract.md`
- `docs/tests.md`
- `docs/runbooks/ci_playwright_diagnostic_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase16/pass178_rdm_wrapper_launcher_cwd_authority_planning.md`
- `docs/audits/phase16/pass179_rdm_wrapper_launcher_cwd_authority_contract.md`
- `package.json`
- `app/package.json`
- `scripts/dev-runner.mjs`
- `scripts/electron-dev.mjs`
- `scripts/e2e-with-backend.mjs`
- `scripts/truth-with-backend.mjs`
- `scripts/run-dev-backend.ps1`

## Files Changed
- `docs/tests.md`
- `docs/runbooks/ci_playwright_diagnostic_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/audits/phase16/pass180_rdm_wrapper_command_guidance_alignment.md`

## Command Categories Aligned
- Local dev launch
- Local backend-only launch
- Harness smoke
- Truth lane
- Service truth
- Synthetic / load harness
- CI validation
- Packaged launch

## CWD Assumptions Documented
- Repo-root commands are explicitly separated from app-root launch behavior.
- Packaged launch is explicitly separated from dev launch.
- CI launch is explicitly separated from local Windows launch.
- Smoke/harness/truth/synthetic command paths are explicitly bounded by their own evidence classes.

## What Each Command Proves / Does Not Prove
- Local dev launch proves local dev boot and repo-root bootstrap only; it does not prove packaged launch, CI parity, or runtime truth.
- Local backend-only launch proves backend service bring-up only; it does not prove renderer launch or wrapper authority.
- Harness smoke proves fixture and interaction sanity only; it does not prove truth-lane closure or real backend performance.
- Truth lane proves scoped receipt-producing truth evidence only; it does not prove generic harness behavior or product readiness.
- Service truth proves backend/service contract behavior only; it does not prove renderer or packaged behavior.
- Synthetic / load harness proves synthetic wiring and load-harness behavior only; it does not prove real backend performance or restore safety.
- CI validation proves CI launch and artifact expectations only; it does not prove local Windows launch determinism.
- Packaged launch proves packaged build / entrypoint behavior only; it does not prove dev launch determinism.

## Remaining Implementation Risk
- The lane still needs execution evidence on the intended platform before closure.
- Command guidance is aligned, but runtime launch behavior itself is unchanged in this pass.
- `RDM-WRAPPER-001` remains open until a focused human spot-check confirms the documented command paths behave as described.

## Human Spot-Check Checklist
PowerShell, from `C:\Dev\black-skies`:
1. `Get-Location`
2. `pnpm dev`
3. Confirm the app opens from the documented path without wrong-CWD errors.
4. Capture the backend port from the launcher output.
5. `Invoke-WebRequest "http://127.0.0.1:<reported-port>/api/v1/healthz"`
6. Confirm the command guidance used for the launch matches `docs/tests.md`.

## Validation Results
- `git diff --check` passed, with only the existing CRLF normalization warning on `docs/BLACK_SKIES_FIX_TRACKER.md`
- `pnpm lint:docs` passed

## Recommended Next Pass
- Keep `RDM-WRAPPER-001` open for a focused human spot-check using the checklist above.
- If the spot-check exposes a contradiction, use the smallest runtime/script follow-up needed to resolve that specific ambiguity.

