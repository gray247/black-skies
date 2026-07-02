# Stage 14 PKG-A Isolated Identity Witness Plan

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD`: `163d6fdc6d43f0cfb75f5f8d80eff1776339339e`
- Verified subject: `docs(product): capture PKG-A executable identity witness baseline`

## 2. Planning purpose

This record plans, but does not execute, an isolated missing-identity witness and an isolated loader path/ID divergence witness for PKG-A runtime identity and persistence rebinding.

This pass is limited to:

1. deciding whether each witness is safe and feasible;
2. identifying the best layer for each witness;
3. defining temporary-fixture boundaries;
4. determining whether bounded new test harnessing is required.

This pass does not authorize implementation change, test change, fixture creation, witness execution, Mutation A1 scope, Mutation A1 implementation, commit, or push.

Runtime behavior remains evidence, not product authority.

## 3. Controlling authority

Records inspected:

1. `docs/product_systems/stage14_pkg_a_runtime_identity_persistence_charter.md`
2. `docs/product_systems/stage14_pkg_a_read_only_identity_persistence_baseline.md`
3. `docs/product_systems/stage14_pkg_a_executable_identity_witness_baseline.md`
4. `docs/product_systems/stage12_project_identity_binding_contract.md`
5. `docs/product_systems/project_persistence_local_save.md`
6. `docs/product_systems/snapshot_protected_recovery_contract.md`

Authority posture preserved:

1. Stage 12 identity doctrine controls expected architecture.
2. Path is location, not identity authority.
3. Unknown identity must remain visibly unknown.
4. Conflicting identity must fail closed at the product-contract level.
5. Recovery and snapshot history do not silently become current-save authority.

## 4. Protected-evidence boundary

No witness plan in this record depends on using or mutating:

1. `sample_project/proj_esther_estate/**`
2. `sample_project/Esther_Estate/**`
3. `build/truth_receipts/**`
4. `build/runtime_truth.json`
5. `build/runtime_truth.schema.json`
6. `ci_artifacts/**`
7. tracked visual snapshots
8. IPC snapshot evidence
9. real user projects
10. retained sample projects

All recommended witness shapes assume isolated temporary directories only, with cleanup after execution in a later separately authorized pass.

## 5. Current witness gaps

Current committed evidence already proves:

1. source: `app/main/projectLoaderIpc.ts` reads `project.json.project_id` when metadata is present;
2. source: `app/main/projectLoaderIpc.ts` returns `{}` from `readProjectMetadata()` when `project.json` is missing or unreadable;
3. source: `app/renderer/App.tsx` derives fallback identity from path basename when `project.projectId` is absent;
4. source plus prior executable baseline: reopen input can be path-based while recovery targeting is `projectId`-based.

Current committed evidence does not yet prove:

1. executable handling of a project whose metadata lacks `project_id`;
2. executable handling of a project whose directory basename disagrees with `project.json.project_id`;
3. whether the current runtime surfaces missing or conflicting identity visibly, rejects it, or tolerates it silently end to end;
4. whether renderer fallback masks loader-level unknown identity under integrated load.

## 6. Missing-identity candidate analysis

### 6.1 Candidate case selection

Primary missing-identity witness candidate:

1. temporary project root contains `outline.json`;
2. temporary project root contains `project.json` with valid metadata shape except no `project_id` field;
3. temporary project root contains an empty `drafts/` directory so loader prerequisites are satisfied before identity behavior is observed;
4. no draft content is required unless current source later proves otherwise.

Why this is the primary case:

1. it isolates missing identity from completely absent metadata-file behavior;
2. it exercises real `project.json` parsing rather than only file absence;
3. it keeps the witness aligned with the Stage 12 question of unknown identity rather than unsupported filesystem layout.

Secondary cases, not recommended for the first witness:

1. `project.json` absent entirely;
2. `project_id` present but empty string;
3. `project_id` present but `null`;
4. `project_id` present with wrong type.

Those cases are narrower follow-on variants only if the first witness shows current behavior needs finer partitioning.

### 6.2 Best layer

Recommended first layer: main-process loader witness against `loadProjectFromDisk()`.

Reasoning:

1. it can exercise real `project.json` parsing in `app/main/projectLoaderIpc.ts`;
2. it can distinguish loader output with missing `projectId` from later renderer fallback;
3. it avoids backend persistence and recovery writes;
4. existing main-process tests already use isolated temp directories and already import `loadProjectFromDisk()`;
5. current source shows the fixture must satisfy loader prerequisites, including `outline.json` and `drafts/`, before missing-identity behavior can be observed.

### 6.3 Expected current runtime result

From current source, the most likely observed result is:

1. `readProjectMetadata()` returns metadata with no `projectId`;
2. `loadProjectFromDisk()` returns a loaded project whose `projectId` is `undefined`;
3. load is not rejected solely because `project_id` is absent;
4. any later identity fabrication would occur only in renderer code, not in the loader.

Evidence: `app/main/projectLoaderIpc.ts`, especially `readProjectMetadata()` and `loadProjectFromDisk()`.

Precondition:

1. the fixture must satisfy current loader prerequisites first;
2. `outline.json` must contain the minimal current `OutlineFile` schema fields;
3. `drafts/` must exist, even if empty, because `loadProjectFromDisk()` calls `readScenes()` before returning project identity behavior.

### 6.4 Expected architectural result

Stage 12 doctrine requires:

1. unknown identity remains visibly unknown;
2. no convenient nearby path or folder name silently becomes canonical identity;
3. affected continuation and mutation authority should fail closed when identity is unresolved.

This witness would observe current runtime intake behavior only. It would not define expected product behavior.

### 6.5 Feasibility classification

Classification: feasible with bounded new test harness.

Exact evidence:

1. `app/main/__tests__/projectBootstrap.test.ts` already uses `mkdtemp(join(tmpdir(), ...))` and `rm(..., { recursive: true, force: true })`;
2. that file already imports `loadProjectFromDisk()` directly;
3. no existing committed test already covers missing `project_id`.

### 6.6 What the witness would prove

1. actual loader parsing of a metadata file that lacks `project_id`;
2. whether loader output carries no `projectId`, throws, or fabricates one;
3. whether loader-level issues are emitted at that seam.

### 6.7 What the witness would not prove

1. renderer fallback behavior after load;
2. visible UI handling of unknown identity;
3. backend persistence destination behavior;
4. wrong-project protection under save or recovery.

## 7. Loader path/ID divergence candidate analysis

### 7.1 Candidate divergence selection

Recommended first divergence case:

1. temporary project directory basename intentionally differs from metadata identity;
2. `project.json.project_id = proj_alpha`;
3. temporary directory basename is something like `temporary-project-root`;
4. `outline.json` contains the normal minimal current `OutlineFile` schema fields;
5. temporary project root contains an empty `drafts/` directory so loader prerequisites are satisfied before divergence behavior is observed;
6. `outline.json.project_id` may match metadata or remain omitted, but the first witness should not introduce additional identity claimants unless required.

Why this is the recommended first divergence:

1. it is safe and fully isolated in a temp directory;
2. it exercises real loader parsing and real path normalization;
3. it targets the known path-versus-ID split without involving persistence writes;
4. it avoids backend mutation risk.

Divergence cases not recommended for the first witness:

1. renderer summary ID versus backend target ID;
2. remembered path versus current metadata identity during reopen;
3. recovery targeting against a project whose remembered path points elsewhere.

Those cases touch persistence or recovery authority and are not required for the first isolated identity witness lane.

### 7.2 Best layer

Recommended first layer: main-process loader witness against `loadProjectFromDisk()`.

Reasoning:

1. the loader is where real path and metadata are first present together;
2. the loader can prove whether divergence is rejected, ignored, or surfaced before renderer fallback;
3. backend persistence is not needed to answer the first divergence question;
4. current source does not show directory basename acting as a loader-level canonical identity claimant.

### 7.3 Expected current runtime result

From current source, the most likely observed result is:

1. loader returns normalized `path` from the temporary directory;
2. loader returns `projectId` from `project.json.project_id`;
3. loader does not compare basename to `projectId` as a loader identity claimant;
4. loader may therefore preserve both path and metadata ID without loader-level mismatch rejection or normalization.

This is a current-runtime expectation inferred from source inspection, not product authority.

### 7.4 Expected architectural result

Current loader witness question:

1. does the loader return path and metadata ID together;
2. does the loader reject their divergence;
3. does the loader normalize either value;
4. does the loader surface the divergence or silently tolerate it.

Stage 12 architectural question:

1. does later loader-to-renderer or integration handoff preserve canonical metadata identity;
2. does later runtime prevent path-derived state from becoming identity authority;
3. does later runtime surface ambiguity or divergence visibly;
4. does later runtime fail closed when actual identity claimants conflict.

If current runtime tolerates loader-level path/ID divergence, that would be runtime evidence requiring later renderer or integration evaluation. It would not, by itself, prove that the loader seam received two canonical identity claims.

### 7.5 Feasibility classification

Classification: feasible with bounded new test harness.

Exact evidence:

1. `loadProjectFromDisk()` already accepts arbitrary path input;
2. `readProjectMetadata()` already reads metadata identity independently of directory basename;
3. current tests already prove temp-dir loader exercise is technically available.

### 7.6 What the witness would prove

1. actual loader behavior when path basename and metadata ID differ;
2. whether loader preserves both values in the returned shape;
3. whether divergence is surfaced, tolerated, or silently normalized at that seam.

### 7.7 What the witness would not prove

1. renderer fallback or display treatment after load;
2. backend persistence rebinding;
3. recovery overwrite behavior under mismatch;
4. canonical conflict resolution ownership.

## 8. Witness-layer comparison

| Layer | What it can prove | What it cannot prove safely in first scope | Evidence |
| --- | --- | --- | --- |
| Main-process loader witness | real `project.json` parsing; missing `project_id` handling; loader return shape; path-versus-ID coexistence at intake | renderer fallback adoption; backend writes; restart persistence | `app/main/projectLoaderIpc.ts`, `app/main/__tests__/projectBootstrap.test.ts` |
| Renderer witness | adoption of loader-supplied `projectId`; basename fallback in renderer state; visibility in UI state | real disk parsing unless backed by new integrated harness; backend authority | `app/renderer/App.tsx`, `app/renderer/__tests__/ProjectHome.test.tsx` |
| Integration witness | loader-to-renderer handoff; whether missing loader identity becomes renderer fallback under real load | requires broader harness and likely more moving parts than first safe witness scope | `app/main/projectLoaderIpc.ts`, `app/renderer/App.tsx`, `ProjectHome` surfaces |
| Backend witness | `projectId`-bound persistence target selection | safe first missing-identity or loader path/ID divergence proof without write risk | `services/.../routers/recovery.py`, persistence modules |

Conclusion:

1. loader witnesses should come first;
2. renderer or integration witnesses are second-stage only if loader results still leave mutation scope ambiguous;
3. backend involvement is unnecessary and unsafe for the first missing-identity or loader path/ID divergence witness lane.

## 9. Feasibility classifications

| Candidate witness | Classification | Exact basis |
| --- | --- | --- |
| Missing identity via loader with temp `project.json` lacking `project_id` | feasible with bounded new test harness | existing temp-dir main tests and direct `loadProjectFromDisk()` import already exist |
| Loader path/ID divergence via basename/metadata mismatch | feasible with bounded new test harness | same main-process seam can isolate path and metadata without writes once loader prerequisites are satisfied |
| Missing identity via renderer-only mocked test | unnecessary for first mutation scope | would not prove real loader parsing or real unknown-identity intake |
| Loader path/ID divergence via renderer fallback test only | unresolved | could prove UI adoption, but not real loader divergence intake without broader harness |
| Loader path/ID divergence via backend persistence or recovery | unsafe under current evidence boundaries | first proof would require write-capable surfaces and could target the wrong root |
| Full loader-to-renderer integrated witness | feasible only after bounded new test harness | technically plausible, but broader than the first safe proof need |

## 10. Recommended witness set

### 10.1 Witness 1

1. Witness name: loader missing-identity intake witness
2. Purpose: prove current loader behavior when metadata exists but `project_id` is absent
3. Layer under test: main-process loader
4. Exact files likely exercised: `app/main/projectLoaderIpc.ts`; proposed test file `app/main/__tests__/projectLoaderIdentityWitness.test.ts`
5. Exact temporary fixture design:
   - temp root directory
   - `outline.json` with the minimal current `OutlineFile` schema fields
   - `project.json` with valid schema and name but no `project_id`
   - empty `drafts/` directory
   - no protected roots
6. Setup steps:
   - create temp root under OS temp dir
   - write minimal `outline.json`
   - write minimal `project.json`
   - create empty `drafts/`
   - call `loadProjectFromDisk(tempRoot)`
7. Command shape: provisional app-relative Vitest wrapper command targeting `main/__tests__/projectLoaderIdentityWitness.test.ts` and the missing-identity test name, for example `node .\scripts\run-vitest-offline.mjs main/__tests__/projectLoaderIdentityWitness.test.ts`
8. Expected current result: load returns a project with `projectId` absent rather than a fabricated canonical ID
9. Expected architectural result: unknown identity should remain visibly unknown and should not silently gain authority
10. Read/write behavior: test-only writes inside temporary directory before load; read-only after setup
11. Protected-evidence risk: low if temp dir only
12. Cleanup steps: recursive delete of temp root in `afterEach`
13. Pass condition: witness reaches loader identity handling only after satisfying loader prerequisites and observes the current loader response exactly
14. Fail condition: fixture fails earlier on missing loader prerequisites such as `outline.json` or `drafts/`, or the test touches non-temp roots
15. What it proves: real loader handling of missing metadata identity
16. What it does not prove: renderer fallback, UI visibility, persistence authority
17. Whether test-code mutation would be required: yes, bounded test-only addition
18. Rollback boundary: new test file only

### 10.2 Witness 2

1. Witness name: loader path/ID divergence witness
2. Purpose: prove current loader behavior when directory basename and `project.json.project_id` differ
3. Layer under test: main-process loader
4. Exact files likely exercised: `app/main/projectLoaderIpc.ts`; proposed test file `app/main/__tests__/projectLoaderIdentityWitness.test.ts`
5. Exact temporary fixture design:
   - temp root directory whose basename does not equal metadata ID
   - `outline.json` with the minimal current `OutlineFile` schema fields
   - `project.json` with valid schema and explicit `project_id`
   - empty `drafts/` directory
6. Setup steps:
   - create temp root with intentional basename mismatch
   - write minimal valid metadata and outline
   - create empty `drafts/`
   - call `loadProjectFromDisk(tempRoot)`
7. Command shape: provisional app-relative Vitest wrapper command targeting `main/__tests__/projectLoaderIdentityWitness.test.ts` and the path/ID divergence test name, for example `node .\scripts\run-vitest-offline.mjs main/__tests__/projectLoaderIdentityWitness.test.ts`
8. Expected current result: loader returns temp-root `path` and metadata-derived `projectId`, then either preserves, normalizes, surfaces, or rejects the divergence
9. Expected architectural result: this loader witness may expose path/ID divergence that later renderer or integration proof must evaluate against Stage 12 identity-authority rules; it does not itself prove two canonical identity claims at the loader seam
10. Read/write behavior: test-only writes inside temp dir before load; read-only after setup
11. Protected-evidence risk: low if temp dir only
12. Cleanup steps: recursive delete of temp root in `afterEach`
13. Pass condition: witness reaches loader divergence handling only after satisfying loader prerequisites and cleanly exposes the current behavior
14. Fail condition: fixture fails earlier on missing loader prerequisites such as `outline.json` or `drafts/`, or the witness requires persistence or any non-temp root mutation
15. What it proves: loader-level path/ID divergence handling
16. What it does not prove: renderer fallback selection, canonical conflict resolution, or backend behavior after that divergence is handed off
17. Whether test-code mutation would be required: yes, bounded test-only addition
18. Rollback boundary: new test file only

## 11. Rejected witness shapes

Rejected for the first isolated witness pass:

1. using either Esther Estate retained root for missing or conflicting identity;
2. recovery-based divergence proof, because it requires write-capable current-project replacement semantics;
3. restore-based divergence proof, because it introduces sibling-copy lifecycle semantics irrelevant to first identity intake proof;
4. renderer-only mocked missing-identity proof as the primary witness, because it would not prove real loader parsing;
5. broad end-to-end or Electron witness, because it widens scope and cleanup risk without improving first proof quality enough.

## 12. Temporary-fixture design

Required fixture rules for both recommended witnesses:

1. create roots only under the OS temp directory;
2. use unique per-test directories;
3. satisfy loader prerequisites before observing identity behavior;
4. write only the minimal files required to trigger loader parsing;
5. `outline.json` must contain the normal minimal current `OutlineFile` schema fields;
6. create an empty `drafts/` directory because `loadProjectFromDisk()` calls `readScenes()` before returning identity behavior;
7. do not create receipts;
8. do not materialize snapshots, backups, recovery state, or retained sample fixtures;
9. do not write inside the repository tree except test logs captured by the runner, if any;
10. remove the full temp root in teardown even on failure.

Minimal file set for first-scope fixtures:

1. `outline.json`
2. `project.json`
3. `drafts/`

Optional files that should stay out of first scope unless proven necessary:

1. `drafts/**`
2. `history/**`
3. `snapshots/**`
4. recovery state files

## 13. Harness decision

Decision: a bounded new test harness is necessary.

Recommended form:

1. exact proposed test file: `app/main/__tests__/projectLoaderIdentityWitness.test.ts`
2. exact helper mechanism: in-file temp-dir setup using `mkdtemp(join(tmpdir(), ...))` and teardown with `rm(..., { recursive: true, force: true })`, matching current main-process test patterns
3. exact production files exercised: `app/main/projectLoaderIpc.ts`
4. production code changes required: likely none
5. test-only boundary: yes
6. new public runtime seam introduced: no
7. risk of becoming an accidental identity contract: manageable if the document and test both label observed runtime behavior separately from Stage 12 expected architecture
8. rollback boundary: delete the single new test file if later rejected

## 14. Execution risks

Primary risks in a later authorized execution pass:

1. accidentally broadening the fixture into a content-classification test instead of an identity test;
2. accidentally proving only mocked renderer behavior rather than loader intake;
3. accidentally treating observed tolerant runtime behavior as approved product behavior;
4. accidentally adding backend writes by involving persistence or recovery routes too early.

Risk classification:

1. recommended loader witnesses: low protected-evidence risk, moderate interpretation risk;
2. renderer/integration expansion: moderate scope risk;
3. backend or recovery expansion: high authority and write-target risk.

## 15. Cleanup requirements

Any later authorized execution pass must require:

1. teardown of all temp directories in `afterEach` or equivalent;
2. assertion that no protected roots were touched;
3. no receipt creation;
4. no snapshot update;
5. no repository-root fixture materialization;
6. stop-on-failure if any witness attempts to escape temp-root boundaries.

## 16. Stage 12 reopening recommendation

Recommendation: do not reopen Stage 12 yet.

Reason:

1. the current planning work still shows an implementable first proof lane at the loader seam;
2. no contradictory controlling contracts were discovered in this planning pass;
3. weak current test coverage is not, by itself, a Stage 12 reopening trigger.

Reopening should remain live only if later authorized witness execution proves:

1. no coherent canonical identity handoff can be implemented;
2. unknown or conflicting identity cannot be surfaced without violating other controlling contracts; or
3. proof requirements turn out to be impossible without architectural contradiction.

## 17. Package-split recommendation

Recommendation: no package split yet.

Reason:

1. both recommended first witnesses fit the same rollback boundary;
2. both target loader identity intake rather than unrelated persistence models;
3. no evidence from this planning pass proves incompatible authority models that must be split before first mutation scope.

## 18. Provisional Mutation A1 implications

These implications are provisional only and do not authorize Mutation A1.

If later witness execution confirms current expected behavior, later mutation scope will likely need to consider:

1. whether loader-level missing identity must remain unresolved and visible rather than being path-filled in the renderer;
2. whether basename-derived renderer fallback must be removed, restricted, or visibly downgraded;
3. whether loader-to-renderer identity handoff must define one canonical identity source when path and metadata ID diverge;
4. whether path/ID divergence needs visible handling at renderer or integration boundaries before any active-project binding can become authoritative;
5. whether path-derived reopen state must be prevented from becoming persistence authority;
6. whether actual conflicting identity claims, if later proved at renderer or integration boundaries, require fail-closed behavior.

## 19. Claims not proved

This planning pass did not prove:

1. current executable missing-identity behavior;
2. current executable loader path/ID divergence behavior;
3. integrated loader-to-renderer unknown-identity visibility;
4. renderer divergence visibility or rejection after a real mismatched load;
5. backend save or recovery behavior under missing identity;
6. backend wrong-project protection under path/ID divergence;
7. any Save As, copy, or import identity behavior.

## 20. Exact recommended next step

Recommended next step:

1. separate authorization to add and execute `app/main/__tests__/projectLoaderIdentityWitness.test.ts`;
2. limit that pass to the two loader-level witnesses planned here;
3. review the resulting witness record before any Mutation A1 scope pass begins.

That next step should remain planning-to-proof only. Mutation A1 selection stays out of scope until the isolated witness results are reviewed.
