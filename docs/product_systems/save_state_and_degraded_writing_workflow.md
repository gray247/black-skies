# Save-State And Degraded-Writing Workflow

## 1. Status Header

- Artifact name: `Save-State And Degraded-Writing Workflow`
- Status: `drafted`
- Artifact type: `cross-system workflow artifact`
- Owner / review lane: `Phase 32 product-definition lane`
- Last reviewed: `2026-06-15`
- Scope: `writer-facing save, degraded, recovery, restore, and resume posture`
- Out of scope: `runtime persistence implementation`, `autosave engine`,
  `database schema`, `startup UI implementation`, `notifications`,
  `recovery engine`, `state enums`

## 2. Purpose And Scope

Define what the writer should understand and experience when work is:

- saved
- pending
- degraded
- recoverable
- at risk
- blocked
- restored
- resumed

This artifact exists to keep Black Skies honest about persistence and
recovery without:

- claiming work is safe before the responsible owner confirms it
- confusing snapshots with current-save confirmation
- letting service or AI failure block safe local writing
- letting recovery or startup surfaces become hidden save authority
- letting `Companion` or tests masquerade as live save truth

## 3. Authority And Non-Ownership

This artifact is subordinate to:

- [current_truth_index.md](/C:/Dev/black-skies/docs/product_systems/current_truth_index.md)
- [current_product_roadmap.md](/C:/Dev/black-skies/docs/product_systems/current_product_roadmap.md)
- [truth_and_state_ownership_matrix.md](/C:/Dev/black-skies/docs/product_systems/truth_and_state_ownership_matrix.md)
- [degraded_mode_execution_contract.md](/C:/Dev/black-skies/docs/product_systems/degraded_mode_execution_contract.md)
- [snapshot_protected_recovery_contract.md](/C:/Dev/black-skies/docs/product_systems/snapshot_protected_recovery_contract.md)

This workflow artifact is not:

- a new product system
- a truth owner
- a durable-state owner
- a persistence implementation contract
- a startup UI spec

It clarifies cross-system writer experience only.

Important non-ownership rules:

- `Writing Surface` may show save and risk cues, but it does not gain
  storage ownership by display.
- `Workflow Spine` may guide and summarize, but it does not become
  save-state authority.
- `Companion` may explain and route, but it does not own persistence or
  recovery.
- `Snapshots / Backup / Restore / History` owns snapshot state and
  restore metadata, not current-save confirmation.
- green tests, fixtures, or harness runs are evidence only; they do not
  make work `saved` or `recovery verified`.

## 4. Core Doctrine

- Direct writing remains available whenever local editing is still safe.
- Honest state beats reassuring fiction.
- No surface may claim work is `saved` until the responsible owner has
  confirmed durable local persistence for the relevant current editable
  scope.
- Snapshots and recovery points are not the same as current-save
  confirmation.
- Service failure, routing failure, or AI failure must not block safe
  local writing.
- Restored material does not silently become current truth.
- Recovery availability is weaker than recovery verification.
- Startup and resume posture may summarize risk, but they must not
  pretend to prove save safety on their own.
- Protected, masked, excluded, deleted, forgotten, and local-only state
  survives recovery unless an owning system explicitly reclassifies it.

## 5. Vocabulary

| Term | Product meaning | Does not mean |
| --- | --- | --- |
| `saved` | The responsible local persistence path has durably confirmed the current editable local writing state for the relevant scope. | snapshot created, export done, sync done, AI jobs finished, or startup merely reopened. |
| `saving` / `pending` | Recent local work exists, but durable local confirmation is still in progress or waiting on the responsible owner. | safe final persistence already confirmed. |
| `unsaved` | Current editable work has no durable local confirmation yet. This may be because saving has not happened, is pending, or clearly failed. | automatically lost, or automatically recoverable. |
| `degraded` | A safe but narrowed path still exists, while some persistence, startup, support, or service behavior is reduced or uncertain. | fully blocked, fully failed, or fully healthy. |
| `recoverable` | There is a bounded path that may recover recent or historical material through copy, preview, read-only, candidate, staged, or current restore rules. | current-save confirmation, guaranteed completeness, or truth restoration. |
| `at risk` | Recent work may be lost, truncated, stale, or ambiguous if the writer closes, crashes, or keeps going without intervention. | already lost, or already unrecoverable. |
| `blocked` | A requested action cannot proceed safely now because a policy, health, storage, or protection rule forbids it. | all writing is blocked by default. |
| `failed` | An attempted action did not complete successfully. | blocked-before-start, or safely recovered afterward. |
| `offline` | A required external or non-local dependency is unavailable. | local writing or local persistence is necessarily unavailable. |
| `restored` | Historical material has been brought back through a governed recovery mode. | automatically current truth, automatically accepted manuscript, or automatically safe for AI/export use. |
| `resumed` | The app reopened a project, writing context, or workflow posture from earlier work. | the latest edits were durably saved, or that no recovery ambiguity exists. |
| `recovery available` | A recovery path or artifact can be offered for review, copy, preview, candidate restore, staged restore, or governed restore. | the artifact is complete, current, or already verified usable. |
| `recovery verified` | The recovery owner has actually checked that the claimed recovery artifact or mode is usable in that mode under live rules. | a mere snapshot file existing, a green fixture, or a test lane passing. |

## 6. Responsibility Map

| Area | Current responsible owner from repo truth | Responsibility here | Explicit non-owner limit |
| --- | --- | --- | --- |
| direct prose editing path | `Writing Surface` plus `Narrative Insertion / Narrative Assertion` | keep local writing usable and show bounded save or risk cues while the author works | does not own durable local save confirmation simply because it shows status |
| durable local current-save confirmation | `gap: no one-to-one owner is explicitly named in current repo truth` | must eventually be the owner that confirms local persistence before `saved` may be shown | this workflow does not invent that owner |
| snapshot state and restore metadata | `Snapshots / Backup / Restore / History` | own historical recovery artifacts, restore modes, recovery history, and restore review posture | does not own current-save truth |
| health, offline, degraded, blocked, and recovery-first posture | `Service Health / Offline / Degraded Mode` | own execution-health meaning and degraded or blocked cues | does not own manuscript truth or snapshot truth |
| startup entry, resume, and recovery-first opening cues | `Splash / Startup Experience` plus `Workflow Spine / Author Journey` | summarize what matters at launch and route the writer safely back into work | does not prove work was saved |
| workflow status, resume markers, and next-step guidance | `Workflow Spine / Author Journey` | guide, summarize, and route without forcing ceremony | does not become save-state authority |
| support-surface review of blockers, recovery, and health | `Command Center Surface` hosting owning-system views | provide heavier review when needed | visibility does not grant persistence ownership |
| explanation, fallback wording, and route-to-owner help | `Companion` | explain, summarize, and route without taking over | does not confirm save or recovery truth |
| witness detail and failure evidence | `Diagnostics / Error Visibility / Debug Console` | explain failure and next safe step when possible | diagnostics are witnesses, not proof that save or recovery succeeded |

Current repo-truth gap:

- current doctrine clearly says `Writing Surface`, `Snapshots`,
  `Service Health`, and `Workflow Spine` all contribute to local
  save-state and degraded-writing posture
- current doctrine does not yet isolate a clean one-to-one product
  artifact for durable local current-save confirmation

This workflow preserves that gap explicitly instead of inventing a save
owner.

## 7. Writer-Facing Experience Principles

- stay quiet during healthy operation
- stay visible but non-blocking when local writing remains safe
- become prominent when work is at risk
- block only when local editing or persistence cannot proceed safely
- make detail available without forcing `Companion`
- show startup or resume notices only when action or uncertainty matters
- never use a snapshot badge, recovery offer, or resume cue as a fake
  `saved` badge
- never make the writer perform manual-save rituals just to feel safe

## 8. End-To-End Workflow Cases

| Case | What happened | What the writer may continue doing | What must stop | Responsible owner | What `Writing Surface` displays | What startup or `Command Center` may display | What `Companion` may explain | Required author action | Forbidden misleading claim |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1. Normal writing and confirmed save` | local writing is healthy and the responsible persistence path has durably confirmed current editable state | continue writing normally | nothing extra | durable local current-save owner gap, surfaced through `Writing Surface` | calm `saved` state, no ceremony | usually nothing; maybe quiet normal status | optional explanation only if asked | none | `saved` because a snapshot exists or because startup resumed cleanly |
| `2. Save pending` | recent edits exist but durable local confirmation is still pending | keep writing if local editing is still safe | any claim that those edits are already durably safe | durable local current-save owner gap, surfaced through `Writing Surface` and workflow cues | visible `saving` or `pending`, not false calm | optional low-noise status if it persists long enough to matter | may explain that work is still pending and what that means | usually none while safe; review if pending becomes prolonged or risky | `all changes saved` |
| `3. Background service failure while local writing remains safe` | AI, routing, package, sync-like, or support service failed, but local editing still works | keep writing locally, review later | dependent blocked actions, silent retry, false healthy state | `Service Health / Offline / Degraded Mode` plus the failed owner | local writing stays available; support actions show degraded or blocked state | bounded degraded or blocked status, not a takeover | explain local-only or manual fallback | none unless the writer wants the blocked action | `writing is unavailable` or `save is unsafe` just because AI/support failed |
| `4. Local persistence failure` | the path responsible for durable local persistence failed or cannot confirm the current editable state | may continue only if the app still has a safe local temporary path; may copy out text or shift to recovery-first behavior | pretending work is saved, silent close, risky mutation that worsens loss | durable local current-save owner gap plus `Service Health` | prominent `at risk`, `failed`, or `pending` state; not calm `saved` | recovery-first or at-risk warning; safe next steps | explain risk and safe fallback options | review warning; choose continue, copy, wait, or recovery path | `your work is safe` without confirmation |
| `5. Snapshot or recovery-point creation` | a snapshot or other recovery artifact was created | continue writing; later inspect recovery history if needed | treating snapshot creation as current-save proof | `Snapshots / Backup / Restore / History` | optional subtle recovery availability cue only if relevant | history or recovery detail if summoned | may explain the difference between current save and recovery history | none by default | `saved` because a snapshot exists |
| `6. Application close with pending or unsafe work` | the writer tries to close while work is pending, failed, or at risk | cancel close, wait, copy out, or enter a governed risky-close choice if one exists later | silent optimistic close that hides unresolved persistence risk | durable local current-save owner gap, `Service Health`, and startup or workflow posture | clear pending or at-risk warning | close-warning or recovery-first entry cue may be shown | may explain options, but must not force itself as the only explainer | choose cancel, wait, copy, or proceed with risk awareness | `it is safe to close` when it is not confirmed |
| `7. Startup and session resume` | the app opens and resumes a project or prior context | enter writing quickly, review uncertainty only if it matters | forcing dashboard ceremony before writing | `Splash / Startup Experience` plus `Workflow Spine`, informed by `Service Health` and `Snapshots` | fast path back to writing; relevant resume or risk cue only when needed | bounded startup notice for degraded, blocked, recovery-first, or unresolved prior state | may explain what was resumed and what was not proven | review only if risk or uncertainty is shown | `resumed` means the latest work was definitely saved |
| `8. Recovery offered` | a snapshot, restore copy, read-only recovery, staged recovery, or candidate recovery is available | preview, compare, restore as copy, or review governed current restore | silent overwrite, silent truth resurrection, silent unmasking | `Snapshots / Backup / Restore / History` | if relevant, a recoverable or recovery-available cue | heavier review, comparison, and restore-mode choices | explain recovery modes and risk classes | choose preview, copy, staged review, candidate review, or cancel | `recovery available` means all recent work is back and current |
| `9. Recovery reviewed and accepted or rejected` | the writer reviewed a recovery artifact and either accepted a governed restore path or rejected it | continue writing after the choice; compare current and recovered state | treating rejected or previewed recovery as current truth | `Snapshots / Backup / Restore / History` plus the destination owner for any current restore | current text remains current until explicit accepted restore path completes | review record, historical comparison, and outcome summary | explain accepted, rejected, blocked, or abandoned outcome | explicit accept or reject when restore changes active state | `previewed` or `compared` means `restored as current` |
| `10. Protected, masked, or excluded content during recovery` | recovery touches hidden, masked, deleted, local-only, AI-excluded, or otherwise protected material | preview or recover only within the allowed mode and protection rules | silent unmasking, silent export-readiness, silent AI-readiness | `Snapshots / Backup / Restore / History` governed by `snapshot_protected_recovery_contract.md` and protection rules | clear protected or narrowed recovery cues | heavier detail only in safe review paths | explain why protected material stays limited | review narrowed recovery mode or choose safer copy/candidate path | `recovered` means protection is gone |
| `11. No verified recovery available` | the system cannot actually prove a usable recovery artifact or usable recovery mode | continue local writing if still safe; manually protect current work if possible | claiming a maybe-snapshot is verified recovery | `Snapshots / Backup / Restore / History` plus `Diagnostics` and `Service Health` | honest `no verified recovery available` or equivalent risk cue | recovery uncertainty, not fake reassurance | explain uncertainty and safest next step | decide whether to continue, copy out, or stop risky work | `recovery verified` because a file exists or a fixture passed |
| `12. Return to healthy operation` | degraded or at-risk conditions have cleared and the responsible owner again confirms normal local persistence | continue writing normally | stale scary warnings and stale blocked-state fiction | responsible owner for the recovered path plus `Service Health` | return to calm healthy `saved` posture only after confirmation | reduced noise; historical detail remains summonable only | explain that the app is healthy again if asked | usually none | `healthy now` means all past uncertainty has been magically resolved without review |

## 9. Protected-Content Behavior

- recovery preserves protection state
- recovery does not silently unmask masked content
- recovery does not silently reactivate AI-excluded content for AI-facing
  paths
- recovery does not silently turn local-only or transfer-blocked material
  into outbound-ready material
- recovery of deleted, forgotten, discarded, or hidden material must
  remain visibly historical, staged, candidate, copy-only, or otherwise
  governed until explicitly reaccepted by the proper owner
- `recovery verified` for protected material means the governed recovery
  mode is usable, not that the content became unrestricted

## 10. Healthy, Degraded, Failure, Recovery, And Resume Summary

Healthy posture:

- quiet
- minimally visible
- no forced review
- `saved` only after durable local confirmation

Degraded posture:

- still non-gating when local writing remains safe
- honest that some capability is narrowed
- does not collapse `degraded`, `blocked`, `offline`, and `failed` into
  one blob

Failure posture:

- prominent when current work is at risk
- explicit about what failed
- does not promise safety without owner confirmation

Recovery posture:

- preview, copy, staged, candidate, and current restore remain visibly
  distinct
- historical artifacts never silently become current truth

Resume posture:

- fast return to writing
- bounded summary only when recent uncertainty, degraded state, or
  recovery-first posture matters

## 11. Unresolved Ownership Gaps

Current unresolved gaps that this workflow does not paper over:

- no one-to-one product artifact currently owns durable local
  current-save confirmation
- the exact split among `Writing Surface`, `Workflow Spine`,
  `Snapshots`, `Service Health`, and `Splash` is still a workflow-level
  posture rather than a clean owner map
- the exact user-facing threshold between `pending`, `degraded`,
  `recoverable`, and `at risk` is still a product-definition question,
  not a solved runtime contract
- startup and workflow resume markers are durable support state, but
  they are not yet fully separated from save confidence in current rough
  docs

## 12. Jason Product Decisions

The artifact recommends a restrained posture, but the following still
need Jason decisions:

- how prominent `at risk` and `blocked` cues should be in the
  `Writing Surface`
- how much unresolved save or recovery detail should appear at startup
  versus later support views
- whether close-with-risk should always interrupt the writer or only
  when the risk crosses a stricter threshold
- which final writer-facing words should survive for the nuanced states
  above if later copy tightening forces tradeoffs

## 13. Implementation Questions Intentionally Deferred

This pass intentionally does not settle:

- exact persistence implementation
- autosave cadence or buffering
- state enums
- notification timing
- startup UI layout
- close-warning dialog design
- storage schema or file format
- restore engine behavior
- anchor-repair algorithm
- telemetry
- queue implementation
- precise diagnostics retention

## 14. Acceptance Criteria

This artifact is acceptable only if:

- it preserves direct writing whenever local editing is still safe
- it keeps `saved` narrower than `snapshot exists`
- it keeps `recovery available` narrower than `recovery verified`
- it does not invent a save owner where repo truth has not named one
- it keeps `Companion`, startup, and surfaces in explanation roles
  rather than persistence ownership roles
- it keeps restored material visibly governed rather than silently
  current
- it keeps tests, fixtures, and diagnostics as evidence or witness
  material rather than live persistence truth
- it remains discovery-only and implementation remains blocked
