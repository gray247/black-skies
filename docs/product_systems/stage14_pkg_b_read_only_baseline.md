# Stage 14 PKG-B Read-Only Baseline

## 1. Repository gate result

Status: passed.

Repository checkpoint:

```text
79e1f49b822a5f44d6099fd61acb22289257f6a1 docs(product): charter Stage 14 PKG-B
```

Observed state:

```text
branch: salvage/minimal-two-surface-shell
upstream: synchronized with origin/salvage/minimal-two-surface-shell
initial worktree: clean
```

Required history was present:

```text
79e1f49 docs(product): charter Stage 14 PKG-B
ae7d6f0 docs(product): close Stage 14 PKG-E
68d0e8d docs(product): close Stage 14 PKG-D
409b4f2 docs(product): close Stage 14 PKG-A
b063363 docs(product): close Stage 14 PKG-C
```

No runtime code, tests, witnesses, mutation-scope records, protected evidence, cleanup/archive work, Stage 15 records, or connector work was created or modified during this baseline.

## 2. Records inspected

- `docs/product_systems/stage14_pkg_b_charter.md`
- `docs/product_systems/current_product_roadmap.md`
- `docs/product_systems/pre_code_discovery_plan.md`
- `docs/product_systems/current_truth_index.md`
- `docs/product_systems/stage14_pkg_a_closure_review.md`
- `docs/product_systems/stage14_pkg_c_closure_record.md`
- `docs/product_systems/stage14_pkg_d_closure_review.md`
- `docs/product_systems/stage14_pkg_e_closure_review.md`

## 3. Source/test files inspected

Renderer and workflow source inspected:

- `app/renderer/App.tsx`
- `app/renderer/DraftEditor.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/components/WorkspaceHeader.tsx`
- `app/renderer/components/RecoveryBanner.tsx`
- `app/renderer/components/ServiceHealthBanner.tsx`
- `app/renderer/components/ServiceStatusPill.tsx`
- `app/renderer/components/SnapshotsPanel.tsx`
- `app/renderer/components/OfflineBanner.tsx`
- `app/renderer/hooks/useRecovery.ts`
- `app/renderer/hooks/useServiceHealth.ts`
- `app/renderer/recovery/actions.mjs`

Existing tests inspected as read-only evidence:

- `app/renderer/__tests__/ProjectHome.test.tsx`
- `app/renderer/__tests__/RecoveryBanner.test.tsx`
- `app/renderer/__tests__/ServiceStatusPill.test.tsx`
- `app/renderer/__tests__/useRecovery.test.tsx`
- `app/renderer/__tests__/useServiceHealth.test.tsx`
- `app/renderer/__tests__/AppRecovery.test.tsx`
- `app/renderer/__tests__/AppSnapshotsVerification.test.tsx`
- `app/renderer/__tests__/WizardPanel.test.tsx`
- `app/renderer/__tests__/OfflineReconnect.test.tsx`

No tests were run. Inspection was static and read-only.

## 4. PKG-B authority summary

PKG-B is limited to the remaining foundation-critical save-state and degraded-writing workflow lane described by the roadmap and charter.

Allowed later seams under this baseline:

- writer-facing save-state honesty across Writing Surface, Workflow Spine, snapshots, service health, and startup/resume
- user-visible understanding of `saved`, `pending`, `recoverable`, `degraded`, `at risk`, and `blocked`
- recovery posture only where it affects writer-facing state meaning
- startup/resume exposure only where it changes the declared save/degraded state model

Explicitly not owned by PKG-B:

- PKG-A runtime identity repair
- PKG-D write-target, root-binding, export, backup-verifier, or draft-acceptance repairs
- PKG-E visibility/diagnostic polish outside save-state/degraded-writing workflow
- PKG-C evidence repair
- connector work
- cleanup/archive work
- Stage 15 work

## 5. Inherited facts and deferrals from PKG-A/C/D/E

Inherited accepted facts from PKG-C:

- evidence protection and protected-sample posture remain closed
- PKG-B does not reopen protected evidence handling

Inherited accepted facts from PKG-A:

- missing-ID activation containment is closed
- remembered-path hygiene is closed
- ProjectHome canonical `Project ID` visibility is closed

Inherited accepted facts from PKG-D:

- backup verifier report persistence contradiction is closed
- export write-target contradiction is closed
- draft-acceptance write-target contradiction is closed
- broader recovery/restore destination safety, snapshot write-target behavior, backup restore behavior, draft generation, broader draft save/edit identity behavior, generic backend root behavior, and AppPreflight residuals remain deferred outside PKG-B unless direct save-state impact is later proved

Inherited accepted facts from PKG-E:

- recents/picker canonical-identity visibility contradiction is closed by a bounded display-only change
- broader divergence warning behavior, App UI outside the scoped recents/picker surface, loader diagnostic UX outside the scoped surface, and project picker presentation outside identity display remain deferred outside PKG-B unless direct save-state/degraded-writing impact is later proved

PKG-B does not reopen PKG-A, PKG-C, PKG-D, or PKG-E.

## 6. Save-state seams found

- `ProjectHome` is the strongest currently inspected save-state truth surface. Its session-truth block explicitly renders lifecycle state, signal classification, and draft/session classifications.
- `ProjectHome` derives draft/session classifications from loaded-project presence, local draft override state, and loader issues. The visible classifications include `persisted`, `runtime-only`, `dirty`, `unsaved`, and `partial`.
- `ProjectHome` also derives session lifecycle labels such as `bootstrap`, `project-loaded`, `draft-hydrated`, and `editing`.
- `DraftEditor` itself is only an editor surface. It exposes placeholder, read-only mode, and accessibility state, but no visible save-state, autosave, or persistence-status text.
- `WorkspaceHeader` exposes workflow actions, snapshots, export, and service-health state, but no explicit save-state badge or draft-persistence label.
- Static inspection did not find a unified writer-facing save-state contract spanning `ProjectHome`, `DraftEditor`, and `WorkspaceHeader`.

## 7. Pending/dirty/unsaved-state seams found

- `ProjectHome` explicitly surfaces `Draft/session state: persisted, dirty, unsaved` when local draft overrides are active.
- `ProjectHome.test.tsx` asserts that `dirty` and `unsaved` remain visible after local draft change and across a reopen boundary.
- `ProjectHome` can also surface `persisted, partial, dirty, unsaved` when loader issues coexist with local overrides.
- No inspected active writing-shell surface exposes a parallel `dirty`, `unsaved`, or `pending` label once the user is in the main writing workflow.
- `pending` appeared only as internal wiring state in inspected source, not as visible user-facing save-state vocabulary.

## 8. Recoverable/degraded/at-risk/blocked seams found

- `ProjectHome` classifies some loader outcomes as `stale` or `recovery-required`.
- `RecoveryBanner` surfaces `Crash recovery available`, snapshot metadata, and actions for `Restore snapshot`, `Reopen last project`, and `View diagnostics`.
- `App` history/recovery presentation renders `Status`, `Last snapshot`, `Restore snapshot`, `Reopen last project`, and `Refresh from disk`.
- `SnapshotsPanel` renders backup authority states `Browseable`, `Verified`, `Restorable`, `Blocked`, and `Stale`, plus explanatory notes and blocked-reason text.
- `App` snapshot verification toasts distinguish `Latest snapshot verified` from issue counts, and failure copy states that the current project was not changed.
- `at risk` was not observed as a current user-facing state label in the inspected seams.
- `degraded` was not observed as a normalized user-facing save-state label; the currently inspected surfaces instead speak in terms of recovery, offline status, blocked restore eligibility, stale backups, and unavailable backend services.

## 9. Snapshot/status seams found

- `WorkspaceHeader` exposes `Snapshot`, `Verify snapshots`, and `Snapshots` controls in the workflow spine.
- `App` snapshot creation copy includes `Snapshot unavailable`, `Snapshot created`, `Snapshot creation failed`, and `Snapshot request timed out`.
- Timeout copy explicitly says the snapshot may still complete and tells the user to refresh the snapshots panel.
- `SnapshotsPanel` sections are explicit: `Latest verification record`, `Project backups`, and `Saved snapshots`.
- `SnapshotsPanel` verification status copy includes `Refreshing verification record...`, `Verification record unavailable`, `No snapshot verification record yet`, `Latest verification record shows no issues`, and `Latest verification record shows issues`.
- `SnapshotsPanel` also distinguishes local browsing from backend-dependent actions when services are offline.
- `WizardPanel.test.tsx` confirms step-lock snapshot failures are surfaced as `Snapshot creation failed` with recovery-oriented copy stating that no snapshot was created for that step.

## 10. Service health/offline/degraded seams found

- `ServiceStatusPill` exposes `Checking backend services`, `Backend services ready`, `Backend services offline`, and `Backend service port unavailable`.
- The offline pill also offers retry affordance and a tooltip explaining that backend services are unreachable or the service port is unavailable.
- `ServiceHealthBanner` surfaces a stronger blocking message: `Backend services offline` plus retry guidance and port-unavailable wording.
- `OfflineBanner` uses different vocabulary: `Writing tools offline` with retry and local explanatory copy.
- `useServiceHealth` differentiates `checking`, `online`, `offline`, and `service_port_unavailable`, but that normalized state is spread across multiple UI surfaces rather than presented as one save/degraded-state model.
- `OfflineReconnect.test.tsx` confirms offline mode disables dangerous actions until reconnect.

## 11. Startup/resume state seams found

- `ProjectHome` startup/welcome flow distinguishes opening an existing project, using the sample project, and creating a new project.
- `ProjectHome` bootstrap-state copy is explicit: `Empty project`, `Template-seeded starter scaffold`, `Starter scaffold`, `Partial project`, and `Bootstrap state unavailable`.
- `ProjectHome` also labels restored roots as `Restored copy`.
- `useRecovery` and `App` wire startup recovery into the initial project session; when recovery is needed, `RecoveryBanner` can appear immediately with restore/reopen controls.
- `AppRecovery.test.tsx` confirms crash-recovery status can appear at startup, can clear when clean, and can re-enable controls after reopen failure.
- Static inspection did not find a unified startup/resume save-state summary that tells the writer, in one place, whether the current draft is saved, pending, recoverable, degraded, at risk, or blocked.

## 12. Workflow Spine / Writing Surface presentation seams found

- The workflow spine currently carries most of the visible status language: `WorkspaceHeader`, `ServiceStatusPill`, `ServiceHealthBanner`, `RecoveryBanner`, `SnapshotsPanel`, and the recovery/history pane.
- The writing surface itself (`DraftEditor`) remains status-neutral. It does not currently surface save-state or degraded-writing truth in the editor body.
- `ProjectHome` contains the clearest save-state truth block, but it is a home/details surface rather than the live writing shell.
- This means current user-facing state truth is strongest before or beside writing, not within the active writing surface itself.
- Static evidence therefore points to a real presentation seam between diagnostic/home truth and in-flow writer truth, but not yet to a proved contradiction.

## 13. Current user-facing state vocabulary observed

- save/session terms observed: `persisted`, `runtime-only`, `dirty`, `unsaved`, `partial`
- project/load terms observed: `clean`, `stale`, `recovery-required`, `Empty project`, `Partial project`, `Template-seeded starter scaffold`, `Restored copy`
- recovery terms observed: `Crash recovery available`, `Restore snapshot`, `Reopen last project`, `View diagnostics`, `No recovery actions pending`
- snapshot/verification terms observed: `Snapshot unavailable`, `Snapshot created`, `Snapshot creation failed`, `Snapshot request timed out`, `Latest snapshot verified`, `Latest verification record shows no issues`, `Latest verification record shows issues`, `No verification record for this snapshot yet`
- backup authority terms observed: `Browseable`, `Verified`, `Restorable`, `Blocked`, `Stale`
- service-health terms observed: `Checking backend services`, `Backend services ready`, `Backend services offline`, `Backend service port unavailable`, `Writing tools offline`
- not observed in current user-facing wording: explicit `pending` save-state language, explicit `at risk`, or one normalized `degraded-writing` label spanning all relevant surfaces

## 14. Classification table

No contradiction proved by static evidence during this baseline.

| Finding | Evidence status | Classification | Notes |
| --- | --- | --- | --- |
| PKG-C protected-evidence posture remains closed | confirmed by accepted closure record | resolved | Inherited only; not reopened. |
| PKG-A missing-ID containment and ProjectHome canonical-ID visibility remain effective | confirmed by accepted closure record | resolved | Inherited only; not reopened. |
| PKG-D write-target and verifier contradictions remain closed | confirmed by accepted closure record | resolved | Inherited only; not reopened. |
| PKG-E recents/picker canonical-identity repair remains closed | confirmed by accepted closure record | resolved | Inherited only; not reopened. |
| `ProjectHome` session truth explicitly surfaces draft/session classifications | confirmed by source and test inspection | contained | Current save-state truth exists, but mainly on the home/details surface. |
| `RecoveryBanner`, recovery/history presentation, and snapshot panels expose recoverable/blocked/stale states | confirmed by source and test inspection | contained | Recovery and backup status language exists and is user-visible. |
| Service-health surfaces distinguish checking/online/offline/port-unavailable with retry affordances | confirmed by source and test inspection | contained | Offline/degraded language exists, but not as one unified writer-state model. |
| Active writing shell lacks explicit save-state wording parallel to `ProjectHome` session truth | confirmed by source inspection | narrow unresolved seam needing witness | Strong candidate PKG-B lane. |
| Explicit `pending` and `at risk` vocabulary is absent from inspected user-facing save-state surfaces | confirmed by source inspection | unresolved but not contradicted | Absence alone is not yet a blocker without witness evidence. |
| Startup/resume messaging is distributed across bootstrap, recovery, and recents flows rather than one declared state model | confirmed by source and test inspection | narrow unresolved seam needing witness | Bounded witness can determine whether this causes real writer confusion. |
| Remaining AppPreflight residuals | confirmed by accepted PKG-D/PKG-E closure records | out-of-scope deferred | Test-health lane only unless later product-system impact is proved. |
| Backend root/write-target/recovery destination behavior | confirmed by accepted PKG-D closure context | out-of-scope deferred | PKG-B does not absorb backend persistence ownership without direct save-state proof. |

## 15. Candidate witness lanes only if justified

Witness lanes are justified.

Candidate lane A: active writing save-state honesty

- justification: current source/test evidence shows `ProjectHome` exposes `persisted`, `dirty`, `unsaved`, and related classifications, but the active writing shell does not visibly carry an equivalent truth surface
- question: once a project is loaded and draft text changes locally, does the live writing workflow expose enough save-state truth for the writer without relying on diagnostic/home-only surfaces?
- bounded surfaces: `ProjectHome` handoff context, `WorkspaceHeader`, `DraftEditor`, and directly adjacent writer-facing status surfaces only

Candidate lane B: degraded-writing and startup/resume truth

- justification: current evidence shows explicit recovery, snapshot, backup, and service-health language, but the terms are distributed across multiple surfaces and do not yet read as one declared save/degraded-state model
- question: under offline, recovery-needed, snapshot-timeout, or restore-available conditions, do writer-facing surfaces clearly distinguish local writing availability, blocked backend actions, and recoverable state?
- bounded surfaces: `ServiceStatusPill`, `ServiceHealthBanner`, `OfflineBanner`, `RecoveryBanner`, `SnapshotsPanel`, and startup/reopen messaging only

No backend write-target, restore-destination, connector, or Stage 15 witness lane is justified under PKG-B authority.

## 16. Protected evidence posture

Protected evidence was not touched:

- `sample_project/proj_esther_estate/**`
- `sample_project/Esther_Estate/**`
- `build/truth_receipts/**`
- `build/runtime_truth.json`
- `build/runtime_truth.schema.json`
- `ci_artifacts/**`
- tracked snapshots
- IPC snapshot evidence
- real user projects

No protected sample loading, witness execution, snapshot mutation, receipt generation, restore execution, or real-project interaction was performed.

## 17. Recommended next action

Recommended next action: create a bounded PKG-B witness plan.

Reason:

- the baseline found concrete in-scope seams in live save-state honesty and degraded-writing/startup-resume truth
- the current record does not prove a contradiction by static evidence alone
- a bounded witness plan can test whether distributed status language and missing live save-state cues create an actual writer-facing contradiction without widening into backend persistence or prior package authority

PZ_CONTINUE: PKG-B witness plan justified
