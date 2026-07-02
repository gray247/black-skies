# Stage 14 PKG-A Isolated Identity Witness Execution

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD` at execution start: `d5370cc211c0e81fec7a146e66d136c583264461`
- Verified subject: `docs(product): plan PKG-A isolated identity witnesses`
- Verified plan commit hash: `d5370cc211c0e81fec7a146e66d136c583264461`

## 2. Controlling plan

Controlling plan:

1. `docs/product_systems/stage14_pkg_a_isolated_identity_witness_plan.md`

Related controlling records inspected:

1. `docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md`
2. `docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`
3. `docs/product_systems/stage14_pkg_a_executable_identity_witness_baseline.md`
4. `docs/product_systems/stage12_project_identity_binding_contract.md`

Authority posture preserved:

1. runtime behavior is evidence, not product authority;
2. this pass authorizes one bounded test file and one execution record only;
3. Mutation A1 remains unauthorized.

## 3. Authorized scope

This pass was limited to:

1. verifying the committed isolated witness plan checkpoint;
2. creating one test-only file;
3. executing two loader-level identity witnesses through `loadProjectFromDisk()`;
4. recording the results.

This pass did not authorize production mutation, renderer mutation, persistence mutation, recovery mutation, fixture materialization, commit, or push.

## 4. Protected-evidence boundary

This pass did not use or mutate:

1. `sample_project/proj_esther_estate/**`
2. `sample_project/Esther_Estate/**`
3. `build/truth_receipts/**`
4. `build/runtime_truth.json`
5. `build/runtime_truth.schema.json`
6. `ci_artifacts/**`
7. tracked snapshots
8. IPC snapshot evidence
9. real user projects

All witness setup writes were confined to OS-managed temporary directories created during the tests.

## 5. Test file created

Created file:

1. `app/main/__tests__/projectLoaderIdentityWitness.test.ts`

Boundaries preserved:

1. exactly two primary witness cases were added;
2. no renderer, backend, recovery, restore, Save As, copy, or import tests were added;
3. no helper file was added;
4. no production file changed.

## 6. Temporary-fixture design

Each witness used its own OS-managed temporary root created with `mkdtemp(join(tmpdir(), ...))`.

Each temporary project contained:

1. `project.json`
2. `outline.json`
3. `drafts/`

Fixture details:

1. `outline.json` used the current minimal `OutlineFile` shape through `buildBlankOutline(...)`;
2. `drafts/` existed and remained empty;
3. setup wrote only inside the temporary root;
4. cleanup used `afterEach` with recursive `rm(..., { recursive: true, force: true })`;
5. no snapshot, receipt, recovery, restore, or retained-root material was created.

## 7. Missing-identity witness

Witness name:

1. loader missing-identity intake witness

Exact setup:

1. temp root created under OS temp;
2. `outline.json` written with `buildBlankOutline('proj_missing_identity_reference')`;
3. `project.json` written with:
   - `schema_version: 'ProjectMetadataSchema v1'`
   - `name: 'Missing Identity Story'`
   - no `project_id`
4. empty `drafts/` directory created

Exact fixture contents:

```text
<temp-root>/
  project.json
  outline.json
  drafts/
```

Exact command:

1. `node .\scripts\run-vitest-offline.mjs main/__tests__/projectLoaderIdentityWitness.test.ts`

Exit code:

1. `0`

Pass/fail result:

1. witness passed

Observed loader return:

1. `loadProjectFromDisk()` returned `project.path = <temp-root>`;
2. `project.projectId` was `undefined`;
3. `project.name` was `Missing Identity Story`;
4. `project.bootstrapState` was `empty`;
5. `project.scenes` was `[]`;
6. `project.drafts` was `{}`;
7. `issues` was `[]`

Repository writes:

1. none from the witness itself

Temp-root writes:

1. `project.json`
2. `outline.json`
3. empty `drafts/` directory

Cleanup result:

1. temp root removed in `afterEach`

What it proves:

1. real loader parsing tolerates a valid metadata file with no `project_id`;
2. the loader returns a project with no `projectId` at this seam;
3. the loader did not fabricate identity or derive identity from path at this seam;
4. the loader did not fail on another prerequisite once `outline.json` and `drafts/` existed

What it does not prove:

1. renderer fallback behavior;
2. user-visible unknown-identity handling;
3. backend persistence safety;
4. recovery safety;
5. Save As, copy, or import behavior

Evidence classification:

1. current loader behavior: confirmed by executable witness
2. Stage 12 unknown-identity doctrine: confirmed by controlling record

## 8. Path/ID divergence witness

Witness name:

1. loader path/ID divergence witness

Exact setup:

1. temp root created under OS temp with a basename intentionally different from `proj_alpha`;
2. assertion in the test verified `basename(<temp-root>) !== 'proj_alpha'`;
3. `outline.json` written with `buildBlankOutline('proj_alpha')`;
4. `project.json` written with:
   - `schema_version: 'ProjectMetadataSchema v1'`
   - `project_id: 'proj_alpha'`
   - `name: 'Alpha Divergence Story'`
5. empty `drafts/` directory created

Exact fixture contents:

```text
<temp-root>/
  project.json
  outline.json
  drafts/
```

Exact command:

1. `node .\scripts\run-vitest-offline.mjs main/__tests__/projectLoaderIdentityWitness.test.ts`

Exit code:

1. `0`

Pass/fail result:

1. witness passed

Observed loader return:

1. `loadProjectFromDisk()` returned `project.path = <temp-root>`;
2. `project.projectId = 'proj_alpha'`;
3. `project.name = 'Alpha Divergence Story'`;
4. `project.bootstrapState = 'empty'`;
5. `project.scenes = []`;
6. `project.drafts = {}`;
7. `issues = []`

Repository writes:

1. none from the witness itself

Temp-root writes:

1. `project.json`
2. `outline.json`
3. empty `drafts/` directory

Cleanup result:

1. temp root removed in `afterEach`

What it proves:

1. the loader preserves explicit metadata `project_id`;
2. the loader preserves filesystem path separately from metadata `projectId`;
3. the loader tolerated path basename versus metadata-ID divergence at this seam;
4. the loader did not normalize either value or emit a divergence issue in this witness

What it does not prove:

1. renderer basename fallback;
2. canonical conflict resolution;
3. backend persistence destination safety;
4. wrong-project recovery protection;
5. actual competing canonical identity claims across later runtime surfaces

Evidence classification:

1. current loader path/ID divergence behavior: confirmed by executable witness
2. later cross-surface authority evaluation: unresolved

## 9. Exact command history

Repository gate:

1. `git rev-parse HEAD`
2. `git status -sb`
3. `git status --short`
4. `git log -8 --oneline`

Checkpoint verification:

1. `git rev-parse d5370cc`
2. `git ls-tree -r --name-only d5370cc docs/product_systems/stage14_pkg_a_isolated_identity_witness_plan.md`

Witness execution:

1. `node .\scripts\run-vitest-offline.mjs main/__tests__/projectLoaderIdentityWitness.test.ts`

Cleanup verification:

1. `Get-ChildItem -Path ([System.IO.Path]::GetTempPath()) -Directory -Filter 'black-skies-loader-missing-id-*' | Select-Object -ExpandProperty FullName`
2. `Get-ChildItem -Path ([System.IO.Path]::GetTempPath()) -Directory -Filter 'black-skies-loader-path-divergence-*' | Select-Object -ExpandProperty FullName`

## 10. Pass/fail results

Passing results:

1. targeted witness file command passed with exit code `0`;
2. `2` tests passed;
3. missing-identity witness passed;
4. path/ID divergence witness passed

Failing results:

1. none in this pass

## 11. Cleanup verification

Cleanup findings:

1. both witness temp roots were scheduled for recursive removal in `afterEach`;
2. post-run temp-prefix inspection found no remaining directories for either witness prefix;
3. no repository-root fixture materialization occurred

Evidence classification:

1. temp-root cleanup status: confirmed by executable witness and post-run filesystem inspection

## 12. Repository mutation verification

Observed repository mutation:

1. `app/main/__tests__/projectLoaderIdentityWitness.test.ts`
2. `docs/product_systems/stage14_pkg_a_isolated_identity_witness_execution.md`

Observed repository non-mutation:

1. no production file changed;
2. no protected-evidence path changed;
3. no snapshot changed;
4. no receipt was created

## 13. Confirmed behavior

1. A loader-valid project with `project.json` but no `project_id` loads successfully when `outline.json` and `drafts/` exist. Evidence class: confirmed by executable witness.
2. At that seam, the loader returns no `projectId` and does not fabricate one from path. Evidence class: confirmed by executable witness.
3. A loader-valid project whose directory basename differs from `project.json.project_id` loads successfully. Evidence class: confirmed by executable witness.
4. At that seam, the loader preserves both the filesystem path and the metadata `projectId` without normalization or emitted issue in the executed witness. Evidence class: confirmed by executable witness.
5. `app/main/projectLoaderIpc.ts` still reads `project.json.project_id` when present and still requires `drafts/` to exist before completing a load. Evidence class: confirmed by source inspection.

## 14. Unresolved behavior

1. renderer fallback adoption after missing loader identity remains unresolved as an executable result;
2. visible user-facing unknown-identity handling remains unresolved;
3. visible user-facing path/ID divergence handling remains unresolved;
4. canonical loader-to-renderer identity handoff remains unresolved;
5. backend save safety under path/ID divergence remains unresolved;
6. wrong-project recovery protection under path/ID divergence remains unresolved;
7. Save As, copy, and import remain unresolved

## 15. Contradictions or divergences

1. Missing identity is tolerated at the loader seam with no `projectId` and no emitted issue in the executed witness. Evidence class: confirmed by executable witness. Whether later runtime keeps that state visibly unknown remains unresolved against Stage 12 doctrine.
2. Path basename versus metadata-ID divergence is tolerated at the loader seam with both values preserved and no emitted issue in the executed witness. Evidence class: confirmed by executable witness. Whether later runtime surfaces or blocks that divergence remains unresolved.

## 16. Provisional Mutation A1 implications

These implications are provisional only and do not authorize Mutation A1.

1. later mutation scope will likely need an explicit loader-to-renderer handoff rule for missing `projectId`;
2. later mutation scope will likely need to decide whether unknown identity remains explicit or fail-closed before renderer fallback can occur;
3. later mutation scope will likely need visible handling for path/ID divergence before active-project state can become persistence authority;
4. renderer basename-derived fallback remains a likely later target, but this pass did not test or authorize renderer change;
5. remembered path must not become persistence authority merely because loader-level path/ID divergence is tolerated

## 17. Claims not proved

This pass did not prove:

1. renderer fallback behavior after missing identity load;
2. visible user-facing ambiguity handling;
3. one canonical runtime identity owner across loader, renderer, and backend;
4. backend persistence destination safety under path/ID divergence;
5. wrong-project recovery protection;
6. any Save As contract;
7. any copy contract;
8. any import contract;
9. final Mutation A1 scope

## 18. Recommended next PKG-A step

Recommended next step:

1. separately review this execution record;
2. then authorize a narrow renderer or loader-to-renderer handoff witness pass focused on:
   - basename-derived fallback adoption
   - visible unknown identity handling
   - visible path/ID divergence handling
3. only after that review, consider a first Mutation A1 scope pass
