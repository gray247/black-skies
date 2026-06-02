# Pass 122 - Scene Selection Oscillation Runtime Instrumentation Plan

## 1. Files inspected

- `docs/audits/phase14/pass121a_scene_selection_oscillation_investigation.md`
- `docs/audits/phase14/pass120_workflow_smoke_human_verification_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `app/renderer/App.tsx`
- `app/renderer/components/ProjectHome.tsx`
- `app/renderer/utils/draftPreviewSync.ts`
- `app/renderer/utils/splitCommandShellState.ts`

## 2. Candidate writers requiring instrumentation

Instrument every path that can write or replay active scene ownership.

1. `App.applySceneSelection(...)` (`App.tsx:769-843`)
2. `App.activateProject(...)` startup scene commit (`App.tsx:1486-1523`)
3. `App` draft-preview hydration apply path (`App.tsx:1006-1057`)
4. `App.handleActiveSceneChange(...)` callback writer (`App.tsx:2049-2058`)
5. `App` split-command replay apply path (`App.tsx:2298-2309`)
6. `ProjectHome.commitActiveSceneSelection(...)` user scene click path (`ProjectHome.tsx:377-395`, `1580-1585`)
7. `ProjectHome` requested-scene sync effect (`ProjectHome.tsx:368-375`)
8. `ProjectHome` effect echo back to parent (`ProjectHome.tsx:1136-1149`)
9. `ProjectHome` load-time local default selection (`ProjectHome.tsx:765-775`)
10. Existing commit marker sink (`scene.select.commit`, `App.tsx:2553-2571`) as canonical post-write confirmation

## 3. Required runtime events

Required event families (exact names can be chosen in implementation pass, but semantics must match):

1. `scene.writer.user_request`
2. `scene.writer.apply_scene_selection.enter`
3. `scene.writer.apply_scene_selection.commit`
4. `scene.writer.activate_project.enter`
5. `scene.writer.activate_project.commit`
6. `scene.writer.projecthome.commit_click`
7. `scene.writer.projecthome.requested_scene_sync`
8. `scene.writer.projecthome.effect_echo`
9. `scene.writer.draft_preview_hydration.enter`
10. `scene.writer.draft_preview_hydration.commit`
11. `scene.writer.persisted_startup_scene.resolve`
12. `scene.writer.split_command_hydrate`
13. `scene.writer.split_command_replay.commit`
14. `scene.writer.handle_active_scene_change.commit`
15. `scene.writer.commit_observed` (mapped to current `scene.select.commit`)

## 4. Required metadata per event

Every event must include enough metadata to support writer attribution and strict ordering.

Required fields:

1. `event_id` (unique)
2. `ts_epoch_ms` (wall clock)
3. `ts_perf_ms` (monotonic ordering in same session)
4. `writer_kind` (one of: `user_selection`, `project_activation`, `hydration_replay`, `persisted_scene_restore`, `split_command_replay`, `draft_preview_replay`, `projecthome_prop_sync`, `projecthome_effect_echo`)
5. `source_function` (for example `applySceneSelection`, `activateProject`, `handleActiveSceneChange`)
6. `requested_scene_id` (nullable)
7. `selected_scene_id_before` (nullable)
8. `selected_scene_id_after` (nullable)
9. `committed_scene_id` (nullable, for commit events)
10. `project_path` (nullable)
11. `project_id` (nullable)
12. `project_switch_generation` (monotonic integer token)
13. `hydration_generation` (monotonic integer token)
14. `draft_preview_source_id` (nullable; from `DraftPreviewSyncState.sourceId` when applicable)
15. `split_command_selected_scene_id` (nullable when applicable)
16. `is_split_command_mode` (boolean)
17. `is_floating_host` (boolean)
18. `trigger_event_id` (nullable causal parent)
19. `write_applied` (boolean)
20. `skip_reason` (nullable; e.g. same-scene no-op, missing-scene, stale-generation)

Token requirements:

- `project_switch_generation` increments once per project activation boundary.
- `hydration_generation` increments per hydration replay cycle (draft-preview apply + split-command hydrate phases).

## 5. Reproduction procedure

Use the same sequence for every run to guarantee comparability.

1. Start clean app session (`pnpm dev`) with console logging capture enabled.
2. Open Project A (known multi-scene project, at least Scene 1 and Scene 2).
3. Switch to Scene 2 via scene card click.
4. Switch to Project B, then immediately back to Project A.
5. Repeat scene switch Scene 1 -> Scene 2 -> Scene 1 quickly (3 cycles).
6. Observe for oscillation/fighting behavior.
7. Capture full ordered event stream and `scene.select.commit` logs.
8. Repeat the same procedure at least 3 times in one environment.
9. If oscillation reproduces, repeat once with split-command flag explicitly disabled and once explicitly enabled (if available) to isolate split-command contribution.

## 6. Evidence collection plan

Required evidence package for each run:

1. Raw renderer console log export (full, unfiltered).
2. Structured event trace JSON containing all required metadata fields.
3. Run manifest:
   - machine/os
   - branch/commit
   - runtime config mode flags
   - whether split-command mode enabled
4. Reproduction notes:
   - exact click order and timestamps
   - whether visual oscillation occurred
5. Outcome summary:
   - final committed scene per step
   - any writer that overwrote a newer user selection

For definitive closure, minimum package is 3 reproduced runs with same dominant overwrite pattern.

## 7. Root-cause decision criteria

`ROOT CAUSE IDENTIFIED` is allowed only when all conditions are satisfied:

1. Dominant writer path is directly observed overwriting the expected scene in ordered traces.
2. The overwrite occurs after a conflicting user/project-intent event in the same generation context.
3. Major alternatives are disproven with trace evidence:
   - If split-command disabled run still reproduces, split-command primary-cause claim is disproven.
   - If hydration generations do not produce conflicting commits, hydration-primary claim is disproven.
   - If ProjectHome echo path never emits conflicting commit, echo-primary claim is disproven.
4. Evidence comes from runtime logs + ordered traces + reproduced oscillation.
5. Static inspection alone cannot be used for closure.

## 8. Confidence scoring model

Use weighted scoring; result must be `>= 80%` for `ROOT CAUSE IDENTIFIED`.

1. Direct overwrite evidence in ordered traces: 40%
2. Reproducibility across >=3 runs: 25%
3. Alternative-cause disproof quality: 20%
4. Metadata completeness (tokens + project/scene fields present): 10%
5. Visual symptom correlation (oscillation aligns with overwrite events): 5%

Interpretation:

- `>= 80%`: root cause identified
- `60-79%`: strong candidate, not sufficient
- `< 60%`: multiple candidates remain

## 9. Smallest future implementation boundary

When implementation begins, keep the first change strictly instrumentation-only:

1. `app/renderer/App.tsx`
2. `app/renderer/components/ProjectHome.tsx`
3. Optional helper-only support in `app/renderer/utils/draftPreviewSync.ts` and `app/renderer/utils/splitCommandShellState.ts` for metadata extraction

No behavior changes, no write-order guards, no authority-policy changes, and no backend/test fixture changes in the instrumentation pass.

## 10. Final verdict

`READY FOR INSTRUMENTATION IMPLEMENTATION`

Reason:

- Writer candidates are explicitly enumerated.
- Required events and metadata are decision-complete for causal attribution.
- Reproduction and evidence package requirements are concrete.
- Root-cause closure criteria enforce runtime-evidence-only proof and `>= 80%` confidence threshold.
