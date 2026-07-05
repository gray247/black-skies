# Stage 14 PKG-A ProjectHome Divergence Visibility Witness Execution

## 1. Repository checkpoint

- `HEAD`: `3db9e85381f4911c53ed063a938ec4bb811d9d9e`
- Branch: `salvage/minimal-two-surface-shell`
- Gate status: passed

## 2. Authority records

- `docs/product_systems/stage14_pkg_a_post_hygiene_reassessment.md`
- `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_hygiene_execution.md`
- `docs/product_systems/stage14_pkg_a_mutation_a1_execution.md`
- `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_execution.md`
- `docs/product_systems/stage12_project_identity_binding_contract.md`
- `docs/product_systems/project_persistence_local_save.md`

## 3. Witness purpose

Determine what current `ProjectHome` surfaces show or hide when a loaded project preserves an explicit metadata identity that diverges from the filesystem path basename.

## 4. Files created

- `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
- `docs/product_systems/stage14_pkg_a_divergence_visibility_witness_execution.md`

## 5. Seams inspected

- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/App.tsx`
- `app/renderer/__tests__/ProjectHomeRememberedPathWitness.test.tsx`
- `app/renderer/__tests__/AppIdentityHandoff.test.tsx`
- `app/renderer/__tests__/ProjectHome.test.tsx`

## 6. Mocked loader result

- `path`: `/projects/path-beta`
- `name`: `Divergent Identity Story`
- `projectId`: `proj_alpha`

The mocked loader result preserves explicit metadata identity while the path basename remains different.

## 7. Visible ProjectHome details observed

- `confirmed by executable witness`: `ProjectHome` visibly renders the project name `Divergent Identity Story`.
- `confirmed by executable witness`: `ProjectHome` visibly renders the project path `/projects/path-beta`.

## 8. Canonical ID visibility result

- `confirmed by executable witness`: the tested `ProjectHome` surface does not visibly render `proj_alpha`.
- `confirmed by executable witness`: the recents button text does not visibly render `proj_alpha`.
- `confirmed by executable witness`: the diagnostics textarea in this seam shows `activeProjectPath` and `activeProjectName`, but does not include `proj_alpha`.
- `confirmed by source inspection`: the recent-project structure stores `path`, `name`, and `lastOpened`, with no canonical `projectId` field.

## 9. Divergence-marker visibility result

- `confirmed by executable witness`: no visible divergence marker or warning was observed in this seam for `project id`, `mismatch`, or `divergence`.
- `confirmed by source inspection`: `ProjectHome` renders path and name details for the active project, but no dedicated divergence marker path was found in the inspected surface.

## 10. Recents persistence result

- `confirmed by executable witness`: `blackskies.recent-projects` stores an entry for the divergent valid-ID project.
- `confirmed by executable witness`: the persisted recent entry includes `path` and `name`.
- `confirmed by executable witness`: the persisted recent entry does not include `projectId`.
- `confirmed by source inspection`: `RecentProjectEntry` is structurally path/name/lastOpened only.

## 11. Last-project persistence result

- `confirmed by executable witness`: `blackskies.last-project` persists `/projects/path-beta` for the divergent valid-ID project.
- `confirmed by source inspection`: this remains expected valid-ID behavior after the remembered-path hygiene mutation.

## 12. Handoff payload result

- `confirmed by executable witness`: `onProjectLoaded(...)` receives the divergent loaded project with both path and canonical identity preserved:
  - `project.projectId = "proj_alpha"`
  - `project.path = "/projects/path-beta"`
  - `targetPath = "/projects/path-beta"`
  - `lastOpenedPath = "/projects/path-beta"`
- `confirmed by source inspection`: `ProjectHome` forwards the loaded project object upward unchanged on the successful load path.
- `confirmed by prior executable witness`: App canonical-ID preservation after handoff was already established separately and was not re-proved in this ProjectHome-only witness.

## 13. Commands and exit codes

- `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx` -> exit `1`
  - test seam import mismatch: named import used against the default `ProjectHome` export
- `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx` -> exit `1`
  - harness mismatch: `onToast` and `suppressBootstrap` were missing, so bootstrap-side behavior interrupted the intended witness seam
- `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx` -> exit `1`
  - underspecified divergent fixture did not match the valid loaded-project shape expected by `ProjectHome`
- `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx` -> exit `1`
  - direct singular text query hit duplicate visible project-name nodes after the seam loaded correctly
- `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx` -> exit `0`
  - final result: `1` file passed, `1` test passed

## 14. Confirmed behavior

- `confirmed by executable witness`: name and path are visible in `ProjectHome`.
- `confirmed by executable witness`: canonical metadata `projectId` is not visibly displayed in the tested `ProjectHome` surface.
- `confirmed by executable witness`: no divergence warning or marker is surfaced in the tested `ProjectHome` seam.
- `confirmed by executable witness`: recents and last-project persistence remain path-oriented for valid divergent-ID projects.
- `confirmed by executable witness`: `ProjectHome` handoff preserves both the divergent path context and the canonical `projectId`.

## 15. Unresolved behavior

- `unresolved`: whether any separate App-level visible surface warns about divergence without mounting full App.
- `unresolved`: whether project-picker surfaces outside this seam expose canonical identity or divergence state.
- `unresolved`: whether the absence of visible canonical identity or divergence markers warrants a mutation, and if so what the narrowest acceptable UX boundary would be.

## 16. Claims not proved

This witness does not prove:

- backend destination safety
- recovery correctness
- export correctness
- snapshot correctness
- restore correctness
- all recents UI behavior outside the tested surface
- all App UI visibility
- need for mutation

## 17. Whether mutation is now justified

- `inferred`: current evidence supports `mutation likely, but scope pass required first`.

Rationale: the witness proves a current visibility gap in the tested `ProjectHome` seam, but does not yet define the narrowest acceptable user-facing correction boundary.

## 18. Recommended next PKG-A step

Prepare a bounded divergence-visibility scope pass focused on whether `ProjectHome` details, recents presentation, or a narrowly scoped diagnostic surface should expose canonical `projectId` or a path-vs-ID divergence marker without widening into backend, recovery, or broader identity-lifecycle mutation.
