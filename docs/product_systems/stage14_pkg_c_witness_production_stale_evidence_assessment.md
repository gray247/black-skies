# Stage 14 PKG-C Witness Production and Stale Retained Evidence Assessment

## 1. Purpose

Determine the correct treatment of the retained sample-project roots that currently lack `.snapshots/last_verification.json`, and decide whether PKG-C requires any further mutation before regression and closure work.

## 2. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- HEAD: `519abf3 docs(product): assess PKG-C isolated witness seam`

## 3. Current established facts

- Mutation C1 is complete.
- The validator now explicitly reports missing receipts.
- The fixture-contract witness still exits `1`.
- Both retained sample roots lack `.snapshots/last_verification.json`.
- No receipt was created or regenerated in PKG-C.
- The two sample roots remain dependency-only.
- The passing IPC witness is separate and does not prove fixture-contract validity.
- C2 remains deferred and unauthorized.
- Producer and validator sources agree that `last_verification.json` belongs to the verification-receipt lifecycle.

## 4. Root-role classification

### `sample_project/proj_esther_estate/**`

- Primary classification:
  - mixed-role artifact
- Secondary roles evidenced by current usage:
  - dependency-only test input
  - executable test fixture root for harness-side validation
  - retained historical evidence container
- tracked or untracked status:
  - untracked/generated in the current repository state
- producer:
  - `scripts/materialize_e2e_fixture.mjs`
  - `app/tests/e2e/utils/sampleProject.ts` for synthetic local fixture fallback
  - `app/tests/e2e/utils/serviceStubs.ts` for verification-report writes
- consumer:
  - `scripts/check_e2e_fixture_contract.mjs`
  - `scripts/e2e-with-backend.mjs`
  - `scripts/truth-with-backend.mjs`
  - renderer/test harness flows that load the canonical project id
- expected lifecycle:
  - stable repository input for dependency-side tests, but mutating workflows can rewrite snapshot/receipt state
- whether regeneration is routine or exceptional:
  - routine inside supported E2E/truth workflows
- whether current contents are historical evidence:
  - yes
- whether current absence of receipts is expected:
  - yes, if the mutating materialization/verification writers have not been run since the current retained snapshot state was committed or preserved
- tracking-status clarification:
  - functional role may be mixed even when Git status is fully untracked/generated
  - untracked/generated does not mean safe to replace
  - tracking status and evidence authority are separate properties
- whether the root is safe to replace:
  - no
- whether the root can be authoritative for product truth:
  - no

### `sample_project/Esther_Estate/**`

- Primary classification:
  - alias or compatibility projection
- Secondary roles evidenced by current usage:
  - dependency-only test input
  - retained historical evidence container
  - truth-side comparison root for validator parity
- tracked or untracked status:
  - untracked/generated in the current repository state
- producer:
  - `scripts/materialize_e2e_fixture.mjs`
  - `app/tests/e2e/utils/serviceStubs.ts`
- consumer:
  - `scripts/check_e2e_fixture_contract.mjs`
  - `scripts/truth-with-backend.mjs`
  - `scripts/e2e-with-backend.mjs`
  - renderer and project-loading tests that still reference `Esther_Estate`
- expected lifecycle:
  - compatibility/truth-side alias root that can be rewritten by supported harness workflows
- whether regeneration is routine or exceptional:
  - routine inside supported E2E/truth workflows
- whether current contents are historical evidence:
  - yes
- whether current absence of receipts is expected:
  - yes, under the same conditions as the harness root
- tracking-status clarification:
  - functional role may be compatibility/parity-oriented even when Git status is fully untracked/generated
  - untracked/generated does not mean safe to replace
  - tracking status and evidence authority are separate properties
- whether the root is safe to replace:
  - no
- whether the root can be authoritative for product truth:
  - no

Conclusion:

- the two roots do not have identical roles
- `proj_esther_estate` is the canonical harness-side sample root
- `Esther_Estate` is the retained alias/compatibility projection
- both are dependency-only and neither is authoritative for product truth

## 5. Materialization lifecycle

`scripts/materialize_e2e_fixture.mjs` is an explicit prerequisite in supported harness workflows.

Evidence:

- `package.json`
  - `test:e2e` -> `node ./scripts/e2e-with-backend.mjs`
  - `test:truth` -> `node ./scripts/truth-with-backend.mjs`
- `scripts/e2e-with-backend.mjs`
  - invokes `materialize_e2e_fixture.mjs` first, then runs `check_e2e_fixture_contract.mjs`
- `scripts/truth-with-backend.mjs`
  - invokes the materializer and then the contract validator inside the truth lane
- `.github/workflows/eval.yml`
  - contains explicit `node scripts/materialize_e2e_fixture.mjs`
  - then `node scripts/check_e2e_fixture_contract.mjs`
- `docs/audits/phase16/phase16_closure_review.md` and the current scope record
  - identify materialize-then-validate as the green authoritative workflow

Answers:

- Is materialization an explicit prerequisite?
  - yes
- Is it automatically invoked by any supported workflow?
  - yes
- Is it expected before every E2E run?
  - yes, in supported wrapper/CI workflows
- Does it overwrite retained roots?
  - yes
- Does it create receipts from current runtime behavior?
  - no; it writes synthetic fixture and receipt content directly
- Does it preserve old evidence?
  - no
- Does it create a new witness or replace an old witness?
  - it replaces repository-side fixture/receipt state with a newly materialized synthetic witness
- Does it require backend/runtime state?
  - no
- Is it deterministic?
  - only partially; it embeds a fresh timestamp in `verified_at`
- Can it silently normalize stale evidence?
  - yes
- Is it safe for PKG-C to invoke?
  - no, not under the charter
- Is it currently prohibited by the charter?
  - yes, as a mutating dependency-side tool outside bounded read-only proof

## 6. Producer ownership map

### Producer 1

- file:
  - `scripts/materialize_e2e_fixture.mjs`
- function or command:
  - `materializeProjectRoot`
  - `main`
- trigger:
  - explicit command and supported wrapper/CI invocation
- input source:
  - hardcoded synthetic fixture data in the script
- output path:
  - `sample_project/proj_esther_estate/**`
  - `sample_project/Esther_Estate/**`
- receipt fields written:
  - `project_id`
  - `status`
  - `message`
  - `verified_at`
  - `snapshots`
- overwrite behavior:
  - overwrite
- whether output is retained:
  - yes
- whether output is tracked:
  - not reliably for receipt material
- whether output depends on runtime truth:
  - no
- whether output is already tested:
  - only indirectly through workflow usage and validator expectations
- whether producer correctness is independently proved:
  - partially

### Producer 2

- file:
  - `app/tests/e2e/utils/sampleProject.ts`
- function or command:
  - `materializeSyntheticProjectFixture`
- trigger:
  - fallback when the expected direct root lacks the needed project/snapshot structure
- input source:
  - synthetic local fixture data in the helper
- output path:
  - direct project root chosen by `resolveSampleProjectRoot`
- receipt fields written:
  - `project_id`
  - `status`
  - `message`
  - `verified_at`
  - `snapshots`
- overwrite behavior:
  - overwrite/create
- whether output is retained:
  - locally, yes
- whether output is tracked:
  - no guarantee
- whether output depends on runtime truth:
  - no
- whether output is already tested:
  - partially, through consumer tests
- whether producer correctness is independently proved:
  - partially

### Producer 3

- file:
  - `app/tests/e2e/utils/serviceStubs.ts`
- function or command:
  - `buildVerificationReport`
  - `persistVerificationReport`
  - `seedVerificationReport`
  - backup-verifier stub path
- trigger:
  - harness startup and service-stub flows
- input source:
  - loaded sample project plus in-memory snapshot summary state
- output path:
  - `sample_project/Esther_Estate/.snapshots/last_verification.json`
  - `sample_project/proj_esther_estate/.snapshots/last_verification.json`
  - current loaded project path `.snapshots/last_verification.json`
- receipt fields written:
  - `project_id`
  - `status`
  - `message`
  - `verified_at`
  - `snapshots`
- overwrite behavior:
  - overwrite
- whether output is retained:
  - during test execution yes, but cleanup later removes it
- whether output is tracked:
  - no
- whether output depends on runtime truth:
  - no, it depends on stubbed fixture state
- whether output is already tested:
  - yes, partially through `ServiceStubsVerification.test.ts`
- whether producer correctness is independently proved:
  - partially

### Producer 4

- file:
  - `scripts/truth-with-backend.mjs`
- function or command:
  - none direct in the script itself; it invokes the materializer and later validates persisted reports produced by the backend/bridge workflow
- trigger:
  - truth workflow
- input source:
  - runtime-backed truth lane
- output path:
  - indirect; it expects report persistence at the truth project path and validates reread semantics
- receipt fields written:
  - not written directly here
- overwrite behavior:
  - n/a
- whether output is retained:
  - yes, in truth-lane artifacts and report paths
- whether output is tracked:
  - mixed
- whether output depends on runtime truth:
  - yes
- whether output is already tested:
  - partially via truth workflow
- whether producer correctness is independently proved:
  - partially

Producer authority conclusion:

- there is not one single canonical producer
- there are separate production roles
  - synthetic fixture materializer
  - synthetic fallback helper
  - stubbed verification reporter
  - runtime-backed persistence lane
- these roles are not contradictory
- producer authority is resolved enough to avoid Stage 12 reopening

## 7. Receipt contract

Minimum production contract evidenced by producers:

- required fields commonly written:
  - `project_id`
  - `status`
  - `message`
  - `verified_at`
  - `snapshots`
- receipt status:
  - `ok`
- identity fields:
  - `project_id`
  - snapshot-level `snapshot_id`
- timestamps:
  - `verified_at`
  - producer-specific snapshot timestamps in snapshot metadata/snapshot files, not necessarily in the validator receipt payload itself
- hashes or fingerprints:
  - not required by the validator
- source paths:
  - not required by the validator
- aliases:
  - not encoded as explicit alias fields in the receipt itself
- environment-specific values:
  - `verified_at` is environment/time specific and makes strict deterministic comparison difficult

Validation contract actually enforced by `scripts/check_e2e_fixture_contract.mjs`:

- existence of `.snapshots/last_verification.json`
- valid JSON
- `verification.snapshots` exists and is non-empty
- existence of snapshot directories:
  - `snapshot-current`
  - `pw-wizard-final`
- existence of required files inside each:
  - `metadata.json`
  - `manifest.json`
  - `snapshot.json`
- alias parity checks are based on:
  - `project_id`
  - `outline_id`
  - `scene_count`
  - required snapshot directory/file shape

Distinctions:

- production contract:
  - broader than the validator’s minimum checks
- validation contract:
  - much narrower and mostly structural
- historical evidence content:
  - may include older `ss_*` directories and other retained snapshot material not required by the current validator
- current runtime-derived content:
  - not required for validator success

## 8. Stale-evidence analysis

Best classification for the current retained roots:

- retained historical evidence that must remain untouched
- incomplete generated artifacts relative to the current validator contract
- dependency-only test inputs
- intentionally useful failing regression witnesses

`stale retained evidence` remains accurate.

What is stale:

- the retained repository-side sample-root snapshot state is stale relative to the current fixture materialization and verification-receipt contract

Stale relative to which contract or checkpoint:

- relative to the current producer/validator receipt lifecycle documented by:
  - `scripts/materialize_e2e_fixture.mjs`
  - `app/tests/e2e/utils/serviceStubs.ts`
  - `scripts/check_e2e_fixture_contract.mjs`
  - Phase 16 materialize-then-validate workflows

Was the evidence once valid:

- not proved conclusively

Is there proof it previously contained receipts:

- not direct proof in the current worktree
- there is indirect historical evidence in tracker notes and supported workflows that verified report copies were expected in prior harness states

Could the receipts have been intentionally excluded:

- yes
- because receipt material appears to be generated, overwritten, and in some flows cleaned up

Are the roots incomplete because generated files are not tracked:

- partly yes

Does untracked/generated status explain the current absence:

- partly yes, but not fully; it explains why current repository state can lack receipts while producers still expect them

Would regeneration destroy useful historical evidence:

- yes

Would leaving the roots unchanged preserve a meaningful failing witness:

- yes

Would closure with this failure be honest and useful:

- yes, if the failure remains explicit, bounded, and documented as dependency-only stale retained evidence rather than as a product/runtime defect

## 9. Historical-evidence value

The missing-receipt state has evidentiary value, but only bounded value.

It proves:

- the two retained repository roots currently lack `.snapshots/last_verification.json`
- the current retained repository-side fixture state does not satisfy the present validator contract
- supported workflows rely on ephemeral or mutating receipt generation before validation

It does not prove by itself:

- the exact commit when receipts disappeared
- that the roots definitely once contained valid receipts
- that fixture production is defective

Preservation requirement:

- preserve the current known failing witness exactly as historical evidence
- do not overwrite retained roots during PKG-C closure work

## 10. Passing-witness requirement

Closure models evaluated:

### Model A. Passing fixture-contract witness required

- doctrinal fit:
  - weak
- proof value:
  - high
- risk of false closure:
  - low
- risk of unnecessary evidence mutation:
  - high
- impact on later packages:
  - pulls mutating witness-production work forward
- maintenance burden:
  - medium
- charter fit:
  - not required explicitly

### Model B. Known failing fixture witness may remain if explicit and understood

- doctrinal fit:
  - strong
- proof value:
  - adequate for PKG-C
- risk of false closure:
  - low if failure is preserved and bounded
- risk of unnecessary evidence mutation:
  - low
- impact on later packages:
  - keeps repair/regeneration deferred
- maintenance burden:
  - low
- charter fit:
  - consistent

### Model C. Passing witness required only against isolated temporary inputs

- doctrinal fit:
  - medium
- proof value:
  - strong validator-only proof
- risk of false closure:
  - low
- risk of unnecessary evidence mutation:
  - low
- impact on later packages:
  - adds validator-proof scope before closure
- maintenance burden:
  - medium
- charter fit:
  - possible, but not currently required

### Model D. Passing witness belongs to a later package or integration stage

- doctrinal fit:
  - medium to strong
- proof value:
  - depends on later scope
- risk of false closure:
  - acceptable if failure ownership is recorded
- risk of unnecessary evidence mutation:
  - low
- impact on later packages:
  - defers integration burden
- maintenance burden:
  - low
- charter fit:
  - plausible

### Model E. Fixture-contract lane is non-controlling for PKG-C closure

- doctrinal fit:
  - too weak
- proof value:
  - low
- risk of false closure:
  - higher than Model B
- risk of unnecessary evidence mutation:
  - low
- impact on later packages:
  - pushes ambiguity downstream
- maintenance burden:
  - low
- charter fit:
  - not preferred

Conclusion:

- PKG-C closure does not require a passing fixture-contract witness on the retained repository roots
- Model B is the best fit

## 11. Producer-proof sufficiency

Producer proof classification:

- partially sufficient

Existing proof sources:

- script inspection of the materializer and validator
- wrapper and CI declarations that materialize before validation
- `ServiceStubsVerification.test.ts`
  - proves both sample-project alias paths are seeded
  - proves verification report shape at a basic level
- historical workflow/audit evidence showing materialize-then-validate as the supported green path

Why not fully sufficient:

- no bounded producer proof was captured in PKG-C against isolated temp roots
- no current read-only passing fixture-contract witness exists on retained roots
- producer correctness is inferred from multiple workflows and partial tests rather than one narrowly bounded authoritative producer-proof artifact

Smallest additional safe proof if later required:

- targeted producer-proof test without touching retained roots

## 12. Closure models evaluated

Evaluated practical options:

1. Preserve failing witness and proceed toward PKG-C closure
2. Add producer-proof test without touching retained roots
3. Add isolated temporary generation proof
4. Materialize retained roots
5. Regenerate and commit receipts
6. Document materialization prerequisite only
7. Defer fixture repair to a later package
8. Reopen Stage 12
9. Split PKG-C

## 13. Options considered

| Option | Exact files affected | Evidence mutated | Proof gained | Proof lost | Rollback boundary | Cross-package impact | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Preserve failing witness and proceed toward PKG-C closure | docs/closure records only | none | honest bounded negative witness preserved | no new positive fixture proof | small | low | Preferred |
| Add producer-proof test without touching retained roots | one producer-proof test file plus small helper only if needed | none | stronger proof that writer behavior is correct | none | still reviewable | low to medium | Optional later |
| Add isolated temporary generation proof | validator/test helper surface plus test file | temp-only outside repo | stronger positive/negative proof | none | reviewable | low to medium | Optional later |
| Materialize retained roots | sample-project roots and receipts | high | green retained-root validator run | destroys current failing witness | coupled and unsafe | medium | Reject |
| Regenerate and commit receipts | sample-project roots and possibly snapshots | high | green retained-root validator run | destroys current failing witness and rewrites retained evidence | coupled and unsafe | medium | Reject |
| Document materialization prerequisite only | docs only | none | clarifies workflow | no extra producer proof | small | low | Too weak alone |
| Defer fixture repair to a later package | none now | none | preserves package boundary | no immediate new proof | none | medium | Acceptable only as deferred ownership note |
| Reopen Stage 12 | docs/governance only | none | none unless contradiction exists | none | n/a | high | Reject |
| Split PKG-C | planning/docs only | none | none by itself | none | n/a | medium | Reject |

## 14. Selected recommendation

Selected recommendation:

- `Preserve known failing witness and proceed to PKG-C regression/closure`

Reason:

- the current failing witness is explicit, bounded, and preserved
- the cause is understood as stale retained evidence relative to a mutating materialization/verification lifecycle
- PKG-C does not need to mutate dependency-only sample roots to make an honest closure claim
- producer proof is partially sufficient and no contradiction requires Stage 12 reopening
- forcing a green retained-root fixture witness now would mutate preserved evidence and weaken last-witness protection

## 15. Mutation boundary, if any

No mutation is recommended by this assessment.

No-mutation rationale:

- current proof is enough for PKG-C to continue toward regression and closure work
- the known failure remains a preserved dependency-only stale-evidence witness
- any repair or regeneration remains deferred until ownership is explicitly assigned

## 16. Known failure to preserve

Preserve this known failure:

- `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
- expected result:
  - exit `1`
  - both retained roots lack `.snapshots/last_verification.json`
  - alias parity is not reached because prerequisite receipt validation fails first
  - no repository mutation

How it must be recorded in closure:

- as a known failing dependency-only stale-retained-evidence witness
- not as a runtime truth defect
- not as a product identity defect
- not as proof that producer logic is broken

## 17. Later-stage ownership, if applicable

Later ownership for any repair, regeneration, or replacement of the retained sample roots is currently unresolved.

PKG-C does not authorize repair or regeneration.

This deferral is not considered fully assigned yet.

Ownership must be assigned before any repair or regeneration work begins.

The first safe assignment point is the Stage 14 cross-package integration and closure review.

That review must either:

- assign the work to a named later stage/package
- preserve it as an explicit unresolved item for Stage 15 current-versus-historical separation

Stage 15 is not automatic repair authority. It may classify current versus historical state, but any repair still requires explicit authorization.

## 18. PKG-C remaining work

Remaining work after this assessment:

1. assessment correction review and commit
2. combined PKG-C regression and invalidation audit
3. PKG-C closure record
4. closure review
5. commit and push
6. handoff

No further PKG-C mutation is required by this assessment.

## 19. Package split assessment

Package split required: No

Reason:

- there is an independently reviewable next step
- producer proof and stale-evidence treatment do not need to mutate together for closure
- no unrelated evidence system must be coupled into the same rollback boundary now

## 20. Stage 12 reopening assessment

Stage 12 reopening required: No

Reason:

- receipt ownership is not contradictory
- producer and validator agree on required structure
- a retained-receipt lifecycle exists, even though the retained repository roots do not currently satisfy it
- witness mutation is not required to define current authority boundaries
- alias-root ownership is defined enough for PKG-C

## 21. Explicit verdict

Assessment verdict: `Preserve failing witness and proceed toward closure`
