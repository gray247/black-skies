# Stage 14 PKG-C C2 Necessity Assessment

## 1. Purpose

Determine whether Mutation C2 is necessary and safe for PKG-C.

Candidate C2 topic:
- isolated-input verification seam for `scripts/check_e2e_fixture_contract.mjs`

This assessment is read-only. No validator, test, fixture, snapshot, sample-project, runtime, or retained-evidence mutation is authorized by this record.

## 2. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- HEAD: `50f39d2 test(e2e): clarify missing fixture receipt diagnostics`

## 3. Controlling facts preserved

- Mutation C1 is complete and establishes only:
  - explicit missing-receipt diagnostics
  - visible alias-parity non-execution
  - preserved hard failure
  - preserved read-only behavior
- The fixture-contract witness still fails because both retained sample roots lack `.snapshots/last_verification.json`.
- The passing IPC witness remains separate and does not prove fixture-contract behavior.
- C2 remains unauthorized.

## 4. Current proof state

Current executable proof:

- Failing fixture witness:
  - `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
  - proves the validator checks both alias roots read-only and fails non-zero when canonical verification receipts are missing
  - does not prove alias parity execution or successful snapshot acceptance

- Passing IPC witness:
  - `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
  - proves the separate renderer IPC guard lane only
  - does not prove fixture-contract behavior

Historical and producer evidence:

- `scripts/materialize_e2e_fixture.mjs`
- `app/tests/e2e/utils/sampleProject.ts`
- `app/tests/e2e/utils/serviceStubs.ts`

These sources show the expected positive fixture shape, including:
- `project.json`
- `outline.json`
- `drafts/`
- `.snapshots/last_verification.json`
- `.snapshots/snapshot-current/{metadata.json,manifest.json,snapshot.json}`
- `.snapshots/pw-wizard-final/{metadata.json,manifest.json,snapshot.json}`

They support the receipt lifecycle and canonical structure, but they do not provide a current read-only positive validator run against isolated temp roots.

## 5. Validator constraints that matter for C2

Current validator behavior in `scripts/check_e2e_fixture_contract.mjs`:

- accepted CLI:
  - `--project-id`
  - `--project-root`
  - `--root`
  - `--base-url`
- harness root:
  - `args.projectRoot ?? sample_project/proj_esther_estate`
- truth root:
  - fixed to `sample_project/Esther_Estate`
- extra `--root` inputs do not replace the required `harness` or `truth` labels used by alias parity
- `REPO_ROOT` is derived from the script path, not the working directory
- importing the script executes `main()` today, so the script is not directly importable as a pure test helper

Implication:

- the current CLI can isolate the harness root only
- the current CLI cannot isolate the truth root without code change
- a temporary working-directory strategy is insufficient
- a positive isolated validator proof cannot be produced with the current CLI alone

## 6. Candidate approaches evaluated

| Option | Exact files that would change | Behavior introduced | Proof strength | Positive-case feasibility | Negative-case feasibility | CLI surface effect | Canonical topology effect | Rollback boundary | Maintenance burden | Public-contract risk | Cross-package risk | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A. Add `--truth-project-root` to the validator | `scripts/check_e2e_fixture_contract.mjs`, likely one new targeted test file | explicit second root override | strong if paired with positive and negative temp proofs | yes | yes | expands public CLI | medium risk of becoming de facto topology contract | small, but production CLI change | medium | medium | low to medium | Not preferred first |
| B. Add a narrower test-only isolated-input seam | `scripts/check_e2e_fixture_contract.mjs`, likely one targeted test file | hidden or test-limited root injection | strong | yes | yes | lower than A if truly test-only | lower than A | small to medium | medium | low to medium | low | Safer than A, but still new seam architecture |
| C. Add a targeted automated test using temporary directories only | new targeted test file only, unless import barriers force script change | temp-root proof around current validator | weak to medium with current script shape | no, not with fixed truth root | partial only | none | none | medium because current script is not import-friendly | medium | low | low | Not sufficient alone |
| D. Refactor a pure validator helper and test it directly | `scripts/check_e2e_fixture_contract.mjs`, one helper module or exported helper, one targeted test file | importable pure validation path for temp-root tests | strongest and most durable | yes | yes | can preserve existing CLI unchanged | none if helper stays internal | medium, but reviewable | medium | low | low | Best validator-proof shape if later needed |
| E. Use current CLI and construct compatible temporary roots without interface changes | none, or unsafe filesystem tricks | no code change | insufficient | no | partial only | none | none | none | low | none | low | Not feasible safely |
| F. Do not implement C2 yet; assess witness production or stale-evidence treatment first | none in this pass | defer validator seam work | adequate for current diagnosis | n/a | n/a | none | none | none | lowest | none | lowest | Recommended now |

## 7. Temporary positive-proof feasibility

A valid positive fixture-contract case can be created entirely under `$env:TEMP`, but not through the current CLI alone.

Minimum required structure for each temp root:

- `project.json`
  - must exist
  - must contain `project_id: "proj_esther_estate"` for both harness and truth
- `outline.json`
  - must exist
  - must contain valid `outline_id` matching `^out_\d{3}$`
  - must contain a `scenes` array
  - every scene must carry a valid `chapter_id` matching `^ch_\d{4}$`
- `drafts/`
  - must exist
  - current validator checks directory existence only
- `.snapshots/last_verification.json`
  - must exist
  - must parse as JSON
  - must contain a non-empty `snapshots` array
- `.snapshots/snapshot-current/`
  - `metadata.json`
  - `manifest.json`
  - `snapshot.json`
- `.snapshots/pw-wizard-final/`
  - `metadata.json`
  - `manifest.json`
  - `snapshot.json`

Alias-parity positive conditions:

- harness and truth `project_id` must match
- harness and truth `outline_id` must match
- harness and truth `scene_count` must match
- harness and truth required snapshot-directory and required-file shapes must match

Future positive proof could demonstrate all of the following if a safe isolated-input mechanism exists:

- both roots validate
- receipts are accepted
- alias parity executes
- alias parity passes
- command exits `0`
- repository-controlled evidence remains unchanged

## 8. Temporary negative-proof feasibility

Two isolated negative cases are feasible entirely under `$env:TEMP` if a safe isolated-input mechanism exists.

Negative case 1: missing verification receipt

- temporary input change:
  - remove `.snapshots/last_verification.json` from one or both temp roots
- expected diagnostic:
  - explicit missing receipt for the affected root
  - explicit both-missing summary if both are removed
- expected exit code:
  - `1`
- exact claim proved:
  - validator still fails closed on missing canonical receipts
- cleanup requirement:
  - delete temp roots only
- repository impact:
  - none

Negative case 2: alias mismatch after valid receipts

- temporary input change:
  - keep both temp roots snapshot-valid
  - change truth-side `outline_id`, `project_id`, or scene count so alias parity actually executes and fails
- expected diagnostic:
  - alias fixture parity failed
- expected exit code:
  - `1`
- exact claim proved:
  - alias parity branch executes only after prerequisite validation passes
- cleanup requirement:
  - delete temp roots only
- repository impact:
  - none

Alternative negative case 2:

- malformed `last_verification.json` in one temp root
- expected result:
  - non-zero exit
  - invalid-JSON diagnostic

## 9. CLI-seam assessment

If `--truth-project-root` were considered:

- it would be general validator functionality, not merely documentation
- normal default behavior could remain unchanged
- but the option would create a second explicit root-selection contract in production CLI
- downstream scripts could begin depending on it because the validator is already used by wrappers and governance flows
- malformed and missing values would require new parsing and rejection rules
- relative and absolute path behavior would need specification
- the option would not need to change project identity semantics directly, but it would widen how canonical alias inputs can be supplied

Conclusion:

- `--truth-project-root` is technically viable
- it is not the smallest safe next move
- it creates more public surface than PKG-C currently needs

## 10. Test-only approach assessment

Current script importability:

- `scripts/check_e2e_fixture_contract.mjs` executes `main()` on import
- there is no existing pure exported helper for direct temp-root testing

Assessment:

- a targeted automated test would be a safer proof contract than a public CLI option
- however, a test alone is not enough today because the fixed truth-root derivation prevents full isolated positive proof
- the cleanest validator-proof route, if later needed, is a small pure-helper extraction plus a targeted temp-directory test
- that would preserve the CLI surface and keep isolated-input mechanics out of normal validator operation

This remains diagnostic/test infrastructure work inside PKG-C, but it is broader than the completed C1 mutation.

## 11. Necessity decision

Answers to the core questions:

- Is C2 required to close PKG-C?
  - No, not by itself
- Is C2 required only for stronger proof?
  - Yes
- Can PKG-C close without C2?
  - Potentially yes, if witness-production ownership, stale retained-evidence treatment, and closure criteria are resolved without demanding a new isolated validator proof lane
- Is the real remaining issue stale retained evidence rather than validator testability?
  - Yes
- Would C2 create more architecture than it protects?
  - A public CLI seam would
- What is the smallest safe next mutation, if any?
  - No validator mutation is recommended yet; witness-production or stale-evidence scope should be assessed first

Selected recommendation rule:

- `5. C2 premature; witness-production or stale-evidence scope must be assessed first`

## 12. Recommended next action

No C2 implementation is recommended in this pass.

Recommended next action:

- perform a bounded witness-production or stale-retained-evidence assessment first

Reason:

- the current failing witness is caused by stale repository evidence, not by uncertainty about whether the validator can ever accept valid input
- producer and stub sources already define the expected positive receipt shape
- a new isolated-input seam would strengthen validator proof, but it would not resolve the retained sample-root failure or determine whether those retained roots should be refreshed, reclassified, or left historical

If validator-proof work is reopened later, the preferred technical shape is:

- pure-helper extraction plus targeted temp-directory tests

Preferred over:

- a public `--truth-project-root` CLI option

## 13. Exact proposed boundaries

No implementation is authorized by this assessment.

If validator-proof work is reopened later, provisional preferred mutation boundary:

- authorized files:
  - `scripts/check_e2e_fixture_contract.mjs`
  - one new targeted validator test file
  - one helper file only if extraction is necessary
- prohibited files:
  - all sample-project roots
  - `scripts/materialize_e2e_fixture.mjs`
  - `scripts/truth-with-backend.mjs`
  - `scripts/e2e-with-backend.mjs`
  - `app/tests/e2e/utils/sampleProject.ts`
  - `app/tests/e2e/utils/serviceStubs.ts`
  - retained evidence roots
  - runtime code
  - package configuration

Provisional proof targets for any later validator-proof mutation:

- positive proof:
  - isolated temp harness root plus isolated temp truth root
  - expected exit `0`
- negative proof 1:
  - missing receipt
  - expected exit `1`
- negative proof 2:
  - alias mismatch after valid receipts
  - expected exit `1`

Stop conditions for any later validator-proof mutation:

- any production CLI expansion becomes necessary without a strong reason
- any sample-project or retained-evidence mutation becomes necessary
- helper extraction broadens into unrelated refactor

## 14. PKG-C closure impact

If witness-production or stale-evidence assessment happens next, remaining PKG-C work becomes clearer in the correct order:

- passing fixture-contract witness
- retained-evidence treatment
- witness-production proof
- regression audit
- closure record

Expected impact of C2 on remaining PKG-C work:

- C2 would reduce uncertainty about validator acceptance and alias-parity behavior on isolated inputs
- C2 would not resolve the current failing retained sample roots
- C2 would likely increase short-term PKG-C scope if done before the stale-evidence decision

## 15. Stage 12 and package split assessment

Stage 12 reopening required: No

Reason:

- receipt ownership is visible
- producer and validator contracts do not conflict
- alias topology is defined
- isolated testing does not require changing project identity semantics

Package split required: No

Reason:

- validator-proof work can still remain independently reviewable if reopened later
- witness production and validator testability do not yet require simultaneous mutation

## 16. Explicit verdict

Assessment verdict: `Witness-production assessment required first`
