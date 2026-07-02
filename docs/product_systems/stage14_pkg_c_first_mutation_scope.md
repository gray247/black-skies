# Stage 14 PKG-C First Mutation Scope

## 1. Purpose
This record defines the exact first bounded PKG-C mutation without performing it.

The scope converts the approved baselines into one concrete, reviewable mutation proposal that hardens witness validation semantics without mutating dependency-only sample-project evidence, runtime behavior, packaging, queue/provider/model behavior, or surface ownership.

## 2. Repository checkpoint
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Upstream: `origin/salvage/minimal-two-surface-shell`
- HEAD: `4ffd8b8`
- Current checkpoint: `4ffd8b8 docs(product): capture PKG-C passing witness baseline`
- Worktree posture during scope definition: clean synchronized worktree
- Pre-mutation checkpoint for the first bounded change: `4ffd8b8`

## 3. Controlling baseline facts
Preserved facts:

- Failing witness:
  - command: `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
  - observed result: exit `1`
  - real validation executed
  - both sample-project roots lacked `.snapshots/last_verification.json`
  - alias parity was not reached
  - worktree remained unchanged

- Passing witness:
  - command: `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
  - observed result: exit `0`
  - `1` test file passed
  - `3` tests passed
  - real Vitest executed
  - worktree remained unchanged
  - proof is limited to the targeted renderer / IPC contract lane

## 4. Files and declarations inspected
- `docs/product_systems/stage14_pkg_c_evidence_lane_witness_protection_charter.md`
- `docs/product_systems/stage14_pkg_c_read_only_baseline.md`
- `docs/product_systems/stage14_pkg_c_executable_baseline.md`
- `docs/product_systems/stage14_pkg_c_passing_witness_baseline.md`
- `docs/product_systems/stage14_salvage_execution_program.md`
- `docs/product_systems/stage12_evidence_retention_last_witness_contract.md`
- `scripts/check_e2e_fixture_contract.mjs`
- `scripts/materialize_e2e_fixture.mjs`
- `scripts/truth-with-backend.mjs`
- `scripts/e2e-with-backend.mjs`
- `app/tests/e2e/utils/sampleProject.ts`
- `app/tests/e2e/utils/serviceStubs.ts`
- `docs/audits/phase16/phase16_closure_review.md`
- read-only path inspection of:
  - `sample_project/proj_esther_estate/.snapshots/**`
  - `sample_project/Esther_Estate/.snapshots/**`

## 5. Missing-receipt lifecycle analysis
Classification: `stale retained evidence`

Reasoning:
- `scripts/check_e2e_fixture_contract.mjs` consumes `last_verification.json` and current snapshot directories under both aliases as part of the canonical snapshot-structure witness.
- `scripts/materialize_e2e_fixture.mjs` is the explicit producer for that receipt and for `snapshot-current` / `pw-wizard-final` under both aliases.
- `app/tests/e2e/utils/sampleProject.ts` also synthesizes `last_verification.json` when it has to materialize a synthetic project fixture.
- `app/tests/e2e/utils/serviceStubs.ts` persists verification reports back into both alias roots and the current project path.
- `scripts/truth-with-backend.mjs` treats `last_verification.json` as a persisted verification report path and verifies reread semantics.
- `docs/audits/phase16/phase16_closure_review.md` shows the green authoritative validation path as `node scripts/materialize_e2e_fixture.mjs` followed by `node scripts/check_e2e_fixture_contract.mjs`.

Observed root state does not match the producer contract:
- `sample_project/proj_esther_estate/.snapshots/` exists but contains only retained `ss_*` directories and no `last_verification.json`
- `sample_project/Esther_Estate/.snapshots/` contains `snapshot-current` and `pw-wizard-final` plus retained `ss_*` directories, but no `last_verification.json`

Conclusion:
- the validator and producer do not disagree on canonical structure
- the receipt absence is not best explained by a path mismatch
- the receipt absence is not evidence that the producer is wrong
- the retained sample roots are stale relative to the current producer/consumer contract
- because those roots are dependency-only evidence, the first mutation must not repair them directly

## 6. Candidate mutation classes
Evaluated classes:
1. validator-only clarification or hardening
2. witness-production script correction
3. isolated test or fixture-contract test addition
4. path or alias contract correction
5. documentation-only correction
6. no mutation yet because another baseline is required

## 7. Candidate comparison
| Candidate | Exact files that would change | Exact behavior that would change | Protected evidence affected | Witness command before mutation | Witness command after mutation | Negative check | Rollback boundary | Cross-package risk | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Validator-only clarification or hardening | `scripts/check_e2e_fixture_contract.mjs` | keep failure non-zero, but classify missing verification receipts explicitly as stale retained evidence and report alias parity as not reached because prerequisite receipt validation failed | none of the protected roots would be mutated | failing fixture-contract validator exits `1` with generic invalid snapshot-fixture wording | same validator still exits `1`, but reports explicit missing-receipt classification and alias-parity-not-reached state | original failing witness remains non-zero with explicit root-specific diagnostics | one script file, one commit | low | Accepted as Mutation C1 |
| Witness-production script correction | `scripts/materialize_e2e_fixture.mjs` | alter producer output or materialization contract | would implicitly redefine protected dependency-only sample-project evidence | failing validator | possibly green after producer rerun | would require regenerating evidence to prove | producer + evidence coupling is a larger rollback boundary | medium | Rejected: no evidence the producer is defective; greening the lane this way would rely on rewriting dependency-only evidence |
| Isolated test or fixture-contract test addition | new test file plus likely `scripts/check_e2e_fixture_contract.mjs` | add automated test harness for validator behavior | none directly, but widens mutable test scope on the first change | failing validator and passing IPC test | same witnesses plus new test lane | temp-dir contract test | more than one file/family | low to medium | Rejected for first mutation: wider than necessary before validator semantics are clarified |
| Path or alias contract correction | `scripts/check_e2e_fixture_contract.mjs`, and possibly producer/alias declarations | relax or redirect alias expectations | risks changing what counts as canonical witness provenance | failing validator | could shift alias interpretation | temp alias mismatch check | crosses producer/consumer boundary | medium | Rejected: producer, stubs, and truth/e2e declarations consistently use both aliases and the same receipt name |
| Documentation-only correction | docs only | classify the failing witness more carefully without changing executable behavior | none | failing validator generic output remains unchanged | same generic output remains unchanged | none executable | docs-only commit | low | Rejected: too weak; leaves the executable witness semantics ambiguous |
| No mutation yet | none | defer all changes | none | current witnesses unchanged | unchanged | none | no commit | low | Rejected: a bounded one-file validator hardening exists and is smaller than a split |

## 8. Selected first mutation
Selected mutation: `Diagnostic hardening of missing verification-receipt failure reporting in scripts/check_e2e_fixture_contract.mjs.`

Exact behavior change:
- preserve the current non-zero failure when verification receipts are missing
- replace the current generic `invalid sample snapshot fixtures` failure framing with explicit classification that the canonical verification receipt is missing from retained sample-project roots
- report that alias parity was not reached because receipt validation failed first
- distinguish missing receipt in the harness root, missing receipt in the truth root, and missing receipts in both roots
- preserve validation order and meaning
- preserve root derivation, path selection, alias topology, and CLI surface exactly as they are today
- create no receipt, regenerate no fixture, and mutate no protected evidence

Mutation type:
- witness validation change only
- no witness production change
- no dependency-only evidence mutation
- no path override
- no new command-line interface
- no topology change
- no runtime identity, persistence, packaging, queue/provider/model, or surface semantics change

## 9. Exact authorized files
Authorized mutable file for the first mutation:
- `scripts/check_e2e_fixture_contract.mjs`

No second implementation, test, fixture, snapshot, sample-project, or evidence file is authorized in this first mutation.

## 10. Exact prohibited files
Prohibited from change in the first mutation:
- `scripts/materialize_e2e_fixture.mjs`
- `scripts/truth-with-backend.mjs`
- `scripts/e2e-with-backend.mjs`
- `app/tests/e2e/utils/sampleProject.ts`
- `app/tests/e2e/utils/serviceStubs.ts`
- `app/renderer/__tests__/IPCContracts.test.tsx`
- `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`
- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- `app/tests/e2e/visual.home.spec.ts-snapshots/**`
- any runtime code, package config, or retained evidence outside the single authorized validator script

## 11. Protected witnesses
Protected witnesses that must remain unchanged:
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- `app/tests/e2e/visual.home.spec.ts-snapshots/**`
- `app/renderer/__tests__/__snapshots__/IPCContracts.test.tsx.snap`
- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- the current failing fixture-contract witness result as historical evidence
- the current passing IPC contract witness result as historical evidence

## 12. Pre-mutation witness commands
- Failing witness to preserve and refine:
  - `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
  - current expected result before mutation: exit `1`, real validation executes, both roots report missing `last_verification.json`, alias parity not reached

- Passing guard witness to keep stable:
  - `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
  - current expected result before mutation: exit `0`, `1` test file passed, `3` tests passed
  - this witness is a regression guard only and does not directly prove diagnostic correctness

## 13. Post-mutation witness commands
- Primary post-mutation witness:
  - `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
  - expected result after mutation:
    - exit `1`
    - real validation executes
    - validation still checks both roots
    - failure text explicitly identifies the missing receipt in the harness root
    - failure text explicitly identifies the missing receipt in the truth root
    - failure text explicitly classifies the condition as stale retained evidence in retained dependency roots
    - failure text explicitly states alias parity was not reached because prerequisite receipt validation failed first
    - no receipt is created
    - no protected file changes occur

- Guard witness unchanged:
  - `node .\scripts\run-vitest-offline.mjs renderer/__tests__/IPCContracts.test.tsx`
  - expected result after mutation: exit `0`, `1` test file passed, `3` tests passed

## 14. Negative check
No new negative check is part of Mutation C1.

Deferred later candidate only:
- `--truth-project-root` may be evaluated in a later PKG-C scope as an `isolated-input verification seam`
- it is not part of the first mutation
- it is not authorized by this scope
- it would require its own scope and review
- it would require both positive and negative isolated-input proof
- it must preserve normal default root behavior
- it must not redefine canonical fixture topology
- it must not alter project identity or alias authority

## 15. Rollback boundary
- Exact files allowed to change:
  - `scripts/check_e2e_fixture_contract.mjs`

- Exact files prohibited from change:
  - every file listed in sections 10 and 11

- Pre-mutation checkpoint:
  - `4ffd8b8 docs(product): capture PKG-C passing witness baseline`

- Rollback boundary:
  - one bounded commit containing only the validator script change

- Evidence to preserve if the mutation fails:
  - failing baseline output showing both missing `last_verification.json` receipts
  - passing IPC witness output showing `1` file and `3` tests passed
  - any intermediate validator output proving unexpected file-scope or semantic drift

- Stop condition if unexpected files change:
  - stop immediately if any path outside `scripts/check_e2e_fixture_contract.mjs` changes
  - do not continue into witness-production, fixture, sample-project, or retained-evidence mutation

## 16. Stop conditions
Stop the first mutation if:
- implementation requires changing `scripts/materialize_e2e_fixture.mjs`
- implementation requires changing any sample-project root
- implementation requires changing retained evidence or snapshots
- implementation requires changing runtime identity, persistence, packaging, queue/provider/model, or surface semantics
- validator hardening cannot be done without widening into multiple unrelated evidence lanes
- post-mutation witness behavior would silently accept missing `last_verification.json`
- implementation requires adding any new command-line interface or path override

## 17. Success criteria
Measurable success criteria for the selected mutation:

- Expected command:
  - `node .\scripts\check_e2e_fixture_contract.mjs --project-id proj_esther_estate --project-root sample_project/proj_esther_estate`
- Expected exit code:
  - `1`
- Expected validation count or branch:
  - both alias roots are still checked
  - receipt-validation branch executes
  - alias-parity branch is explicitly reported as not reached
- Expected Git status:
  - only `scripts/check_e2e_fixture_contract.mjs` changes during implementation
- Expected unchanged protected roots:
  - all protected witnesses listed above remain byte-for-byte unchanged
- Expected diagnostic specificity:
  - both receipt absences are explicitly identified
  - alias parity is explicitly reported as not reached
  - failure remains hard, not warning-only
  - no root derivation changes occur
  - no CLI interface changes occur
  - no sample-project file changes occur
  - no retained-evidence changes occur
- Claims proved if successful:
  - the validator now classifies the failing witness precisely
  - the validator still fails closed on missing verification receipts
  - the current stale retained-evidence state is easier to diagnose
  - validation remains read-only and non-zero on the existing defect
- Claims not proved even if successful:
  - no sample-project repair or verification-receipt production correctness is proved
  - no alias parity success is proved
  - no runtime persistence, packaged behavior, or release readiness is proved

## 18. Claims established if successful
- The failing fixture witness would become more precise without being suppressed
- Missing verification receipts would be explicitly identified as stale retained evidence rather than generic snapshot invalidity
- Alias-parity non-execution would become explicitly visible because prerequisite receipt validation failed first

## 19. Claims not established
- The sample-project roots would still not be repaired
- The fixture-contract witness would still not pass
- Alias parity would still remain unproved until receipt validation succeeds
- Witness-production correctness would not be newly proved
- Project identity correctness would not be newly proved
- Runtime identity, persistence, packaging, queue/provider/model behavior, surface ownership, and release readiness would remain unproved

## 20. Cross-package risk
- Low cross-package risk
- The selected mutation stays inside witness-validation semantics
- It does not alter runtime truth, project identity, packaging, provider behavior, or surface ownership
- It does not mutate dependency-only sample-project roots or retained evidence

## 21. Additional baseline requirement
Additional baseline remains required after the selected first mutation.

Reason:
- even with better validator classification, no passing fixture-contract witness exists yet
- witness-production versus retained-staleness still needs a separate bounded decision before any attempt to make the fixture-contract lane green
- later work may evaluate an isolated-input verification seam, positive and negative temporary-input proof, passing fixture-contract witness strategy, stale retained-evidence treatment, and witness-production behavior
- PKG-C mutation remains planning-only until the selected mutation is separately reviewed and then executed

## 22. Package split assessment
Package split required: No

Implementation mutation split required: Yes

Reason:
- the selected mutation fits one rollback boundary
- only one file needs to change
- Mutation C1 can remain diagnostic hardening only
- Mutation C2 candidate would be a later isolated-input verification seam with its own scope and proof obligations

## 23. Stage 12 reopening assessment
Stage 12 reopening required: No

Reason:
- there is a visible witness-production owner and lifecycle
- producer and consumer agree on canonical receipt structure
- the current defect is bounded as stale retained evidence plus validator-classification weakness, not doctrinal contradiction

Internal sequence:
- Mutation C1: diagnostic hardening
- Mutation C2 candidate: isolated-input verification seam

Mutation C2 remains unauthorized.

## 24. Explicit verdict
First mutation scope verdict: `First mutation scope ready for focused re-review`
