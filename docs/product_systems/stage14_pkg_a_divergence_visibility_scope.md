# Stage 14 PKG-A Divergence Visibility Scope

## 1. Repository checkpoint

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Verified `HEAD`: `1e867316e9d05010ee57c97a87463a329172c564`
- Verified subject: `test(product): capture PKG-A divergence visibility witness`
- Repository gate: passed

## 2. Controlling evidence

1. `docs/product_systems/stage14_pkg_a_divergence_visibility_witness_execution.md`
   - `confirmed by executable witness`: `ProjectHome` shows divergent project name and path, does not show canonical `projectId`, does not show a divergence marker, stores recents as `path` and `name`, persists `blackskies.last-project`, and preserves both path and canonical `projectId` in `onProjectLoaded(...)`.
2. `docs/product_systems/stage14_pkg_a_post_hygiene_reassessment.md`
   - `inferred`: divergence visibility was selected as the next bounded evidence lane after A1 and ProjectHome remembered-path hygiene.
3. `docs/product_systems/stage14_pkg_a_projecthome_remembered_path_hygiene_execution.md`
   - `confirmed by executable witness`: missing-ID remembered-path residue is repaired and valid-ID remembered-path behavior remains intact.
4. `docs/product_systems/stage14_pkg_a_mutation_a1_execution.md`
   - `confirmed by executable witness`: App preserves explicit metadata `projectId` when present and fails closed when `projectId` is missing.
5. `docs/product_systems/stage14_pkg_a_renderer_identity_handoff_witness_execution.md`
   - `confirmed by executable witness`: App preserves explicit metadata `projectId` under divergent path and does not substitute basename when a canonical ID exists.
6. `docs/product_systems/stage12_project_identity_binding_contract.md`
   - `confirmed by source inspection`: path is location, not identity; display name is presentation, not identity.
7. `docs/product_systems/project_persistence_local_save.md`
   - `confirmed by source inspection`: persistence authority remains separate from renderer presentation and does not justify widening this lane into persistence repair.

## 3. Scope question

Question:

> Does current evidence justify a bounded PKG-A visibility mutation so `ProjectHome` no longer presents only path-and-name context when canonical metadata identity is different and available?

Assessment:

- `confirmed by executable witness`: the tested `ProjectHome` seam currently hides canonical `projectId` and shows no divergence marker.
- `confirmed by source inspection`: the details card already renders `activeProject.name` and `activeProject.path`, so a small read-only visibility change exists inside the current seam.
- `inferred`: a bounded visibility mutation is justified now.

## 4. Candidate boundary assessment

### Candidate A: ProjectHome details only

- supported by current witness: yes
- within PKG-A: yes
- mutation size: small
- product/UX risk: low
- testability: high
- selected or rejected: selected
- reason:
  - `confirmed by executable witness`: the current ambiguity exists in the tested `ProjectHome` details seam.
  - `confirmed by source inspection`: `ProjectHome` already has canonical `activeProject.projectId` available on the loaded details surface.
  - `inferred`: showing canonical project identity in details is the smallest safe repair that adds visible identity without changing recents schema or requiring divergence-specific logic.

### Candidate B: ProjectHome divergence marker

- supported by current witness: partly
- within PKG-A: yes
- mutation size: small-to-medium
- product/UX risk: medium
- testability: medium
- selected or rejected: rejected for this pass
- reason:
  - `confirmed by executable witness`: the witness proves no divergence marker is currently shown.
  - `inferred`: a marker would require a new basename-vs-ID comparison rule and product wording choice.
  - `inferred`: that is broader than necessary when the narrower defect is path/name-only ambiguity in the tested details seam.

### Candidate C: Recents structural/presentation change

- supported by current witness: partly
- within PKG-A: maybe, but broader
- mutation size: medium
- product/UX risk: medium-to-high
- testability: medium
- selected or rejected: rejected for this pass
- reason:
  - `confirmed by executable witness`: recents currently store only `path` and `name`.
  - `confirmed by source inspection`: `RecentProjectEntry` is a path/name/lastOpened structure.
  - `inferred`: adding `projectId` to recents would widen into localStorage schema change and compatibility handling before the smallest safe visibility repair is proved insufficient.

### Candidate D: Narrow diagnostics-only surface

- supported by current witness: yes
- within PKG-A: yes
- mutation size: small
- product/UX risk: low
- testability: high
- selected or rejected: rejected for this pass
- reason:
  - `confirmed by executable witness`: diagnostics currently omit canonical `projectId` in the tested seam.
  - `inferred`: a diagnostics-only patch would preserve ordinary path/name-only ambiguity in the normal ProjectHome details surface.
  - `inferred`: that makes it weaker than the user-facing repair already available inside the details card.

## 5. Selected or rejected mutation

Selected mutation:

**ProjectHome divergence visibility**

Selected implementation intent:

**Show canonical Project ID in ProjectHome details for loaded valid-ID projects.**

Mutation justification:

- `confirmed by executable witness`: current `ProjectHome` renders name and path but not canonical `projectId`.
- `confirmed by executable witness`: the same seam preserves canonical `projectId` in `onProjectLoaded(...)`, so the identity exists and is merely hidden.
- `confirmed by source inspection`: the details card is the narrowest existing surface that can expose that identity without schema change or broader lifecycle work.

## 6. Intended behavior

For a loaded project with a valid explicit `projectId`, `ProjectHome` details should expose canonical identity visibly, for example:

`Project ID: proj_alpha`

Required behavior:

1. `confirmed by source inspection`: use the already loaded `activeProject.projectId` value inside `ProjectHome`.
2. `inferred`: show the canonical ID in the existing details card near the project name/path context.
3. `inferred`: do not change recents storage or `blackskies.last-project`.
4. `inferred`: do not add loader, App, backend, recovery, or persistence behavior.
5. `inferred`: do not require a divergence-specific warning in this mutation.

## 7. Non-divergent behavior

For a loaded valid-ID project whose basename and canonical `projectId` do not meaningfully diverge:

1. `inferred`: the canonical Project ID display still appears.
2. `inferred`: no divergence-specific warning text appears.
3. `confirmed by executable witness`: valid-ID remembered-path behavior stays intact unless separately changed later.
4. `inferred`: visible project name, visible path, recents behavior, last-project persistence, and `onProjectLoaded(...)` behavior remain unchanged.

Rationale:

- `inferred`: always showing canonical ID for valid-ID projects avoids adding basename comparison logic or a new conditional warning rule.

## 8. Missing-ID behavior

For a loaded project with missing `projectId`:

1. `confirmed by executable witness`: A1 still fail-closes App activation.
2. `confirmed by executable witness`: ProjectHome hygiene still blocks remembered-path persistence.
3. `inferred`: this visibility mutation should not add any Project ID row when canonical `projectId` is absent.
4. `inferred`: this visibility mutation should not add a divergence warning for missing identity.

Rationale:

- `inferred`: missing identity remains governed by A1 and ProjectHome hygiene, not by this visibility scope.

## 9. Proposed files

1. `app/renderer/components/ProjectHome.tsx`
   - why it may change:
     - `confirmed by source inspection`: the details card is rendered here and already has `activeProject.projectId`.
   - intended change:
     - add a narrow read-only Project ID detail for loaded valid-ID projects.
   - prohibited adjacent changes:
     - no recents schema change, no last-project change, no loader/App/recovery/backend changes, no divergence-specific logic unless re-scoped.
   - rollback boundary:
     - one bounded details-surface change in `ProjectHome`.
2. `app/renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`
   - why it may change:
     - `confirmed by executable witness`: this file already proves current visibility absence in the same seam.
   - intended change:
     - invert the canonical-ID visibility assertion for valid-ID projects and add one non-divergent valid-ID regression.
   - prohibited adjacent changes:
     - no new App-level assertions, no recents schema assertions beyond preserving current behavior, no backend/recovery claims.
   - rollback boundary:
     - one dedicated witness file for ProjectHome visibility.
3. `docs/product_systems/stage14_pkg_a_divergence_visibility_execution.md`
   - why it may change:
     - document the bounded mutation only if implementation is later authorized.
   - intended change:
     - execution record only.
   - prohibited adjacent changes:
     - no new package selection, no loader or backend lane expansion.
   - rollback boundary:
     - documentary only.
4. `app/renderer/__tests__/ProjectHome.test.tsx`
   - why it may change:
     - execution-only fallback if a narrow existing regression gap requires it.
   - intended change:
     - none by default.
   - prohibited adjacent changes:
     - no broad refactor or unrelated UI assertions.
   - rollback boundary:
     - avoid changing this file unless a later implementation pass proves it necessary.

## 10. Proposed code boundary

Bounded code boundary if implemented later:

1. `confirmed by source inspection`: the `ProjectHome` details card under `activeProject ? (...) : ...`
2. `inferred`: a single new read-only row or label/value presentation derived from `activeProject.projectId`
3. `inferred`: no changes to:
   - `RecentProjectEntry`
   - localStorage schema
   - `loadProjectAtPath(...)` remembered-path logic
   - `onProjectLoaded(...)`
   - App activation
   - loader tolerance
   - recovery or persistence seams

## 11. Proposed tests and commands

### Divergent-ID case

For:

- `path: /projects/path-beta`
- `projectId: proj_alpha`
- `name: Divergent Identity Story`

Assert:

1. canonical Project ID is visibly rendered in the `ProjectHome` details seam
2. visible name remains
3. visible path remains
4. recents behavior remains unchanged unless separately selected later
5. `blackskies.last-project` remains unchanged for valid-ID behavior
6. `onProjectLoaded(...)` still preserves both path and canonical `projectId`

### Non-divergent valid-ID case

For a valid-ID project whose basename aligns with the canonical `projectId` enough to count as non-divergent for this scope:

1. canonical Project ID still appears in ProjectHome details
2. no divergence-specific warning appears
3. valid-ID remembered-path behavior remains unchanged

### Missing-ID case

1. do not reopen A1 or ProjectHome hygiene
2. only add a missing-ID assertion if implementation shape risks showing a misleading `Project ID` label or divergence warning when no canonical ID exists

### Targeted command

1. `node .\scripts\run-vitest-offline.mjs renderer/__tests__/ProjectHomeDivergenceVisibilityWitness.test.tsx`

Add another targeted command only if an implementation pass later proves a narrow existing `ProjectHome.test.tsx` dependency.

## 12. Compatibility risks

1. `inferred`: exposing canonical project ID in normal details may feel more technical than path/name-only presentation.
2. `inferred`: wording should avoid implying that Project ID is save authority, backend destination proof, or a migration verdict.
3. `inferred`: details-card layout may need a minimal presentation choice that stays readable on smaller widths.
4. `inferred`: recents ambiguity will remain until a later scope proves a broader change is justified.

## 13. Stop conditions

Stop and re-scope if any of the following becomes necessary:

1. recents schema or localStorage migration
2. App activation changes
3. loader rejection or diagnostics changes
4. backend or recovery behavior changes
5. persistence-destination repair
6. full project-picker redesign
7. a product decision that rejects always-visible canonical ID and instead requires a conditional divergence warning with new UX wording authority

## 14. Exclusions

Excluded from this scope:

1. App activation changes
2. loader rejection or loader diagnostics
3. backend changes
4. recovery correctness changes
5. persistence destination repair
6. Save As
7. copy
8. import
9. broad recents schema migration
10. full project picker redesign
11. broad unknown-identity lifecycle design

## 15. Stage 12 reopening recommendation

Recommendation:

- do not reopen Stage 12

Reason:

- `confirmed by source inspection`: Stage 12 remains coherent that path is not identity.
- `inferred`: this scope is a renderer visibility refinement inside an accepted identity contract, not a contract contradiction.

## 16. Package-split recommendation

Recommendation:

- no package split

Reason:

- `inferred`: the selected mutation stays inside the existing PKG-A renderer/details seam with a coherent rollback boundary.

## 17. Claims not proved

This scope pass does not prove:

1. that recents schema must change
2. that a divergence-specific warning is required
3. that backend destination safety is wrong
4. that recovery correctness is wrong
5. that App-level visible identity surfaces are sufficient or insufficient
6. that PKG-A closure is ready immediately after this mutation

## 18. Exact recommended next step

If implementation is later authorized, execute one bounded PKG-A mutation pass for:

**ProjectHome divergence visibility via canonical Project ID display in the ProjectHome details card for loaded valid-ID projects**

Keep recents schema, divergence-marker logic, App activation, loader diagnostics, backend/recovery seams, and broader identity-lifecycle work out of that pass unless a later review separately re-scopes them.
