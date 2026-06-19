# Surface-To-Owner Action Handoff Contract

## 1. Purpose

Define how visible surfaces may expose actions without becoming the owning system for those actions.
This contract exists to stop UI visibility from turning into hidden authority and to keep mutation rights with the correct product-system owner.

## 2. Scope

This contract covers user-visible action exposure across:

- `Writing Surface`
- `Command Center Surface`
- `Companion`
- `Workflow Spine / Author Journey`
- other support surfaces that expose owner-governed actions

This contract governs handoff for:

- truth-adjacent actions
- durable-state actions
- outbound and transfer actions
- destructive actions
- paid and routed actions
- protected-content and explicit-content actions
- deferred or scheduled actions

## 3. Non-Goals

- defining the full AI lifecycle or approval matrix
- defining package schema or provider payload schema
- defining runtime UI layout or widget behavior
- defining storage schema or database schema
- moving `Author Intent / Story Setup`
- solving every import-source, restore-boundary, or provider-refusal detail
- granting new runtime authority to any surface

## 4. Core Doctrine

- A surface may expose an action without owning the authority behind it.
- UI visibility does not grant authority.
- A visible button, menu item, inline chip, or suggested next step is only a request path until the owning system accepts it.
- The owning system decides whether the action is allowed, blocked, downgraded, staged, or refused.
- `Writing Surface` may expose inline actions, but it does not silently mutate hidden truth, protected material, or durable support state.
- `Command Center Surface` may host heavier controls, but it does not own every action it displays.
- `Companion` may route and explain, but it does not own execution.
- `Critique / Evaluation` may produce candidates, but owning systems convert.
- `Feedback Notes / Revision Resolution` may resolve note state, not durable signal state or story truth.
- `Signal Architecture` may own durable signal state, not story truth.
- `Memory Lab` may retain governed memory, not canon.
- `Import Export Document Interchange` may import, export, and transfer, not decide story truth.
- `Snapshots / Backup / Restore / History` may restore through governed recovery paths, not silently resurrect protected or deleted truth as current canon.
- `Model Routing And Budget Architecture` may approve, block, or downgrade routes, not decide story truth.
- `LLM Package Construction Architecture` may assemble approved packages, not widen task scope.
- `Explicit Content Architecture` may gate or transform outbound package handling, not censor local manuscript truth.
- Direct writing remains available unless the action itself is the current writing action being confirmed, replaced, restored, or deleted.

## 5. Action Taxonomy

### 5.1 Surface Action

A visible affordance exposed by a surface.
Examples: `Run critique`, `Accept rewrite`, `Export`, `Resolve signal`, `Restore as copy`.

### 5.2 Owning-System Action

An action whose authority belongs to a specific owning system that may execute, refuse, stage, or block the requested mutation.
Only the owning system may finalize the action outcome.

### 5.3 Advisory Action

An action that produces findings, candidates, suggestions, rankings, warnings, or comparisons without durable truth mutation by default.

### 5.4 Durable-State Action

An action that creates, mutates, resolves, retains, discards, or restores durable non-truth state such as signals, notes, memory, provenance, routing history, queue history, or snapshots.

### 5.5 Truth-Mutating Action

An action that may create, accept, convert, replace, or delete accepted manuscript truth, accepted assertion truth, accepted lore truth, accepted character truth, or accepted project truth.

### 5.6 Outbound Or Transfer Action

An action that imports, exports, syncs, sends, publishes, or otherwise crosses the local project boundary.

### 5.7 Destructive Action

An action that may delete, hide, mask, suppress, discard, forget, overwrite, replace, or restore-over-current in a way that can remove or displace visible or durable state.

### 5.8 Paid Or Routed Action

An action that may consume paid budget, leave the local boundary, switch provider, escalate route class, or require routing approval.

### 5.9 Explicit-Content Or Protected-Content Action

An action that touches masked, hidden, deleted, excluded, local-only, explicit, provenance-sensitive, or never-send material and therefore needs protection-aware boundaries before execution.

## 6. Approval Tiers

- `T0 no-approval-needed`: read-only or inspect-only action with no durable mutation, no truth mutation, no outbound transfer, and no paid spend.
- `T1 implicit-current-context`: small local action within the current context that does not widen scope, does not spend money, does not mutate truth, and does not cross the boundary into protected or outbound work.
- `T2 explicit-user-confirmation`: the user must confirm the specific action before the owner executes it.
- `T3 fresh-approval-required`: the user must approve again because destination, spend, scope, route, provider, risk, or consequence changed.
- `T4 session-approval-allowed`: the owner may rely on bounded current-session approval for repeated low-risk actions inside an already approved class.
- `T5 blocked-until-future-contract`: the action may be visible as unavailable or future-only, but it may not execute under current doctrine.
- `T6 never-silent`: a mandatory modifier for any truth-mutating, durable-state-changing, destructive, outbound, paid, protected-content, export, sync, restore-over-current, or delete-like action.

Rules:

- `T6` stacks on top of `T2`, `T3`, `T4`, or `T5`.
- Surfaces may not downgrade an owner-required tier.
- Owners may tighten a tier for a narrower case, but they may not silently loosen a higher-risk class into a lower one.
- `T4` never grants standing permission forever.

## 7. Surface-To-Owner Handoff Rule

For every user-visible action, the following contract applies:

1. The surface may present the action, explain it, and gather current context.
2. The surface must identify the owning system before execution.
3. The surface must pass the owner:
   - requested action intent
   - current scope and target
   - approval state
   - provenance or evidence required by the owner
   - protection state such as mask, exclusion, hidden, deleted, local-only, or explicit-content status
4. The owning system must decide whether the action is:
   - allowed
   - staged for review
   - downgraded to a safer local or non-destructive path
   - blocked
   - refused
5. The surface must render the owner result honestly.
6. If the owner refuses, blocks, or downgrades the action, the surface must not simulate success.
7. If the action mutates truth or durable state, the resulting state must be stored only in the owning layer.
8. If the action is advisory, the surface must keep the result labeled as advisory until an owning conversion path accepts it.

Minimum handoff payload:

- `visible surface`
- `requested action`
- `owning system`
- `target object or scope`
- `approval tier`
- `provenance or evidence reference`
- `protection state`
- `route state` when relevant
- `fallback availability`

## 8. Action Family Matrix

| Visible surface | Action label / intent | Owning system | Tier | Permitted mutation target | Forbidden mutation target | Required provenance / evidence | Fallback if owner blocks or refuses | Direct writing remains available |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Writing Surface`, `Command Center`, `Companion` | Accept AI suggestion | `Narrative Insertion / Assertion` or other target truth owner | `T2 + T6` | selected manuscript range or explicit truth candidate path | durable signal state, durable memory, hidden truth elsewhere | source model, source action, suggestion provenance | keep suggestion advisory, dismiss, or send to review | yes |
| `Writing Surface`, `Command Center`, `Companion` | Promote advisory output to truth | target truth owner: `Narrative Insertion / Assertion`, `Lore Cards`, `Character Cards`, or `Author Intent / Story Setup` | `T2 + T6` | explicit accepted truth object | signals, notes, memory, routing state, transfer history | source trace showing candidate origin and author acceptance | leave as candidate only | yes |
| `Writing Surface`, `Command Center`, `Companion`, `Critique`, `Continuity`, `Memory Lab` | Create signal candidate | `Signal Architecture` intake rules | `T1` | temporary signal-candidate record | durable signal state, story truth | source system, evidence, confidence, affected scope | keep as local advisory finding only | yes |
| `Command Center`, `Writing Surface` | Convert signal candidate to durable signal | `Signal Architecture` | `T2 + T6` | durable signal state | manuscript truth, notes, memory, export state | candidate provenance and lifecycle state | keep candidate temporary or dismiss | yes |
| `Command Center`, `Writing Surface` | Resolve, dismiss, or suppress signal | `Signal Architecture` | `T2 + T6` | durable signal lifecycle state | source truth, manuscript text, memory | signal id, source trace, reviewer action | leave signal unchanged and visible, or mark blocked | yes |
| `Writing Surface`, `Command Center`, `Companion` | Create feedback note | `Feedback Notes / Revision Resolution` | `T1` for author note, `T2 + T6` for AI-derived note candidate acceptance | durable note state | durable signal state, truth, memory | note source, author/imported-editor origin | keep as transient annotation or candidate | yes |
| `Writing Surface`, `Command Center` | Resolve, dismiss, or park feedback note | `Feedback Notes / Revision Resolution` | `T2 + T6` | durable note lifecycle state | signal state, story truth | note id and note provenance | leave note open | yes |
| `Command Center`, `Companion` | Save advisory memory | `Memory Lab` | `T2 + T6` | durable author-approved advisory memory | accepted truth by implication, raw excluded spans by default | evidence class, memory type, source trace | leave in temporary context only | yes |
| `Command Center`, `Companion` | Forget or discard memory | `Memory Lab` | `T2 + T6` | durable memory retention state | accepted truth objects, snapshot history | memory id, retention class, discard reason | hide from current recall only, or leave unchanged | yes |
| `Writing Surface`, `Command Center`, `Companion` | Run critique | `Critique / Evaluation` | `T1` for local light run, `T4 + T6` for repeated approved bounded runs, `T3 + T6` if paid or outbound | temporary critique output | truth, durable signal state, durable notes, memory | scope, route state, protected-content permissions | refuse, downgrade to local-only, or defer | yes |
| `Writing Surface`, `Command Center`, `Companion` | Run rewrite or generation | `Draft Generation / Rewrite Loop` | `T1` for bounded local current-context run, `T3 + T6` if paid, outbound, or widened | temporary generated output | manuscript truth, assertions, notes, signals, memory | selected scope, route state, package approval when needed | refuse, downgrade, or preserve current text only | yes |
| `Writing Surface`, `Command Center` | Accept rewrite output | `Narrative Insertion / Assertion` | `T2 + T6` | selected manuscript text or explicit accepted insertion path | other hidden ranges, truth outside chosen target, memory, signals | accepted output provenance and target range | keep rewrite as temporary comparison | yes |
| `Writing Surface`, `Command Center` | Apply manuscript-order proposal or prototype arrangement | `Narrative Insertion / Assertion` with planning source from `Outline` or `Prose / Scene Projection` | `T3 + T6` | explicit accepted manuscript placement or order change for the selected narrative material | alternate canon, projection-only state, Story Unit grouping truth, silent reorder from display gestures | source proposal or prototype id, current-versus-proposed order preview, affected material scope, author confirmation | keep as preview or proposal only, or return to owner review | yes |
| `Command Center`, `File Manager`, `Workflow Spine` | Import document | `Import Export Document Interchange` | `T2 + T6` | staged import state or chosen import destination | accepted truth by default, snapshot ownership, package memory | source file identity, format-loss warnings, chosen destination | import as staged review only, source material only, or cancel | yes |
| `Command Center`, `Workflow Spine` | Classify imported material | `Import Export Document Interchange` with destination-owner handoff later | `T2 + T6` | import destination classification state | accepted canon, accepted manuscript truth by default | import source, structure confidence, destination choice | leave unclassified staging state | yes |
| `Command Center`, `Writing Surface` | Export manuscript | `Import Export Document Interchange` | `T2 + T6` | export artifact and transfer history | local manuscript truth, hidden protected ranges by default | chosen export source, mode, and preview | block export, offer clean local copy path, or cancel | yes |
| `Command Center` | Export annotated or provenance-aware document | `Import Export Document Interchange` using `Authorship Provenance AI Visibility` rules | `T3 + T6` | export artifact and transfer history | forced visible provenance in local manuscript, hidden provenance leakage | export mode, provenance visibility choice, preview | downgrade to clean export or cancel | yes |
| `Command Center` | Emergency raw-prose export | `Import Export Document Interchange` | `T3 + T6` | bounded recovery export artifact | masked, excluded, protected, or never-send material outside approved path | recovery reason, scope, explicit approval, protection state | offer normal export, read-only copy, or blocked recovery path | yes |
| `Command Center`, recovery prompts | Restore snapshot as current | `Snapshots / Backup / Restore / History` | `T3 + T6` | current save state through governed restore path | silent canon resurrection, protected-content exposure, hidden deletions becoming current without review | snapshot id, restore preview, current-vs-historical evidence | restore as copy, read-only recovery, or cancel | yes |
| `Command Center`, recovery prompts | Restore snapshot as copy | `Snapshots / Backup / Restore / History` | `T2 + T6` | new recovery copy or comparison workspace | silent overwrite of current state | snapshot id and copy destination | stay in preview mode only | yes |
| `Writing Surface`, `Command Center` | Delete, hide, or mask content | target owner: `Narrative Insertion / Assertion` for manuscript delete, `Authorship Provenance AI Visibility` for visibility state, `Explicit Content Architecture` for outbound mask state | `T3 + T6` | chosen local content state or outbound mask map | silent truth mutation outside target, signal state, memory, export history | target scope, current state, protection class, author intent | soft-hide, local-only mask, or cancel | yes |
| `Writing Surface`, `Command Center`, `Companion` | Send package to local model | `Model Routing And Budget Architecture` authorizes route; `LLM Package Construction Architecture` assembles package | `T1` for silent-local eligible work, otherwise `T2 + T6` | route decision, package artifact, temporary model run state | truth, durable memory, signals, notes | route class, package summary, exclusion state | downgrade to no-AI or manual path | yes |
| `Writing Surface`, `Command Center`, `Companion` | Send package to paid API | `Model Routing And Budget Architecture` authorizes route; `LLM Package Construction Architecture` assembles package; `Explicit Content Architecture` gates outbound class | `T3 + T6` | approved outbound package and route history | raw excluded spans, unpaid retry, silent truth mutation | cost estimate, provider, package preview, outbound clearance | local-only fallback, blocked route, or no-AI path | yes |
| `Command Center`, failure prompts | Retry failed routed work | `Model Routing And Budget Architecture` with originating owner review | `T2 + T6` for local retry, `T3 + T6` for paid or provider-switch retry | retry state and route history | silent duplicate paid spend, auto-apply results | prior failure reason, prior spend state, retry scope | leave failed, downgrade, or require manual rerun | yes |
| `Command Center`, `Companion` | Run scheduled, idle, or overnight work | `Async Job Queue / Task Runner` plus originating owner contract | `T4 + T6` for approved bounded local jobs, `T3 + T6` for anything paid, outbound, destructive, truth-changing, memory-retaining, export, or sync related | queue state and review-ready temporary results | silent truth mutation, silent durable state mutation outside owner contract, silent paid transfer | job class, owner, route state, approval reference | queue blocked, defer, or run-now manual path | yes |
| `Writing Surface`, `Command Center` | Open file asset | `File Manager / Asset Pane` | `T0` or `T1` | temporary view state and bounded file-open context | truth, import authority, export authority | file identity and file visibility state | keep asset closed | yes |
| `Writing Surface`, `Command Center` | Attach or link file asset | `File Manager / Asset Pane` for bounded reference only | `T2 + T6` now; `T5` for heavier attach semantics not yet contracted | bounded reference or link state | import authority, export authority, hidden file exposure | file visibility state, target context, protection status | browse only or cancel | yes |
| `Command Center`, error prompts | Run diagnostics or create evidence bundle | `Diagnostics / Error Visibility / Debug Console` with evidence expectations from `Testing / Harness / Evidence Contract` | `T2 + T6` | diagnostic artifact, evidence bundle, error visibility state | narrative truth, verification claims by default, protected raw content leakage | error context, privacy class, included scope | show summary only, block bundle, or redact | yes |

## 9. Forbidden Shortcuts

- A surface may not treat display state as owner state.
- `Companion` may not accept, resolve, retain, forget, export, restore, delete, or send on behalf of another owner silently.
- `Command Center Surface` may not convert visibility into authority because the heavier control appears there.
- `Writing Surface` may not auto-apply critique, signals, notes, memory, routing, export, or package outcomes.
- `Critique / Evaluation` may not silently become truth, durable signal state, durable note state, durable memory, or rewrite execution.
- `Continuity` may not silently canonize inferred continuity facts.
- `Signal Architecture` may not rewrite source truth while resolving signal state.
- `Feedback Notes / Revision Resolution` may not resolve signal state or story truth.
- `Memory Lab` may not silently retain raw excluded content, deleted material, or outbound package payloads as active durable memory.
- `Import Export Document Interchange` may not silently canonize imports, silently sync, or silently widen export scope.
- `Snapshots / Backup / Restore / History` may not silently overwrite current state or silently restore protected content into current canon.
- `Model Routing And Budget Architecture` may not silently retry paid work or silently escalate local work into outbound paid work.
- `LLM Package Construction Architecture` may not widen scope after routing or explicit-content gating says no.
- `Explicit Content Architecture` may not censor local manuscript truth by default and may not leak raw excluded spans through previews, packages, summaries, diagnostics, or memory.
- `Async Job Queue / Task Runner` may not silently run paid, outbound, destructive, truth-mutating, memory-retaining, export, sync, publish, or protected-content-revealing jobs.

## 10. Failure And Refusal Behavior

- If an owner blocks an action, the surface must show the block honestly.
- If an owner refuses an action, the surface must not show a completed or half-applied success state.
- If a safer local fallback exists, the owner may offer it explicitly.
- If no permitted fallback exists, the surface should preserve the current work and return to direct writing or inspection.
- Route failure is not manuscript failure.
- Export failure is not truth failure.
- Critique or generation refusal is not a writing block.
- Snapshot failure must prefer preview, copy, read-only recovery, or repair-first posture over silent overwrite.
- Protected-content or explicit-content refusal must fail closed for outbound work and fail open for local direct writing where possible.
- Background or scheduled work must return review-ready results, blocked state, or refusal state; it must not auto-apply.

## 11. Dossiers Requiring Future Alignment

- `writing_surface.md`
- `command_center_surface.md`
- `companion.md`
- `workflow_spine_author_journey.md`
- `narrative_insertion_assertion.md`
- `critique_evaluation.md`
- `continuity.md`
- `signal_architecture.md`
- `feedback_notes_revision_resolution.md`
- `draft_generation_rewrite_loop.md`
- `memory_lab.md`
- `import_export_document_interchange.md`
- `snapshots_backup_restore_history.md`
- `model_routing_and_budget_architecture.md`
- `llm_package_construction_architecture.md`
- `authorship_provenance_ai_visibility.md`
- `explicit_content_architecture.md`
- `file_manager_asset_pane.md`
- `async_job_queue_task_runner.md`
- `service_health_offline_degraded_mode.md`
- `diagnostics_error_visibility_debug_console.md`

## 12. Remaining Fatal And Critical Questions

### Fatal Still Outside This Pass

- The unified AI lifecycle and approval matrix is still missing.
- Import destination truth conversion still needs tighter anti-canonization detail by mode.
- Snapshot restore still needs tighter protected-content and deleted-content recovery detail.

### Critical After This Pass

- Which repeated action classes may safely rely on `T4 session-approval-allowed` across surfaces without over-broad permission drift?
- Which future trusted systems, if any, may move from signal-candidate creation into direct durable-signal actions after later contracts exist?
- What exact object-level destination states must import create before any imported material may move into manuscript, note, binder, archive, or source-material ownership?
- What exact delete, hide, mask, discard, and forget vocabulary must remain distinct across manuscript truth, provenance, memory, signals, notes, and snapshots?
- What exact degraded-mode behavior should block, pause, downgrade, or allow retries for queue, routing, restore, export, and diagnostics actions?
- What exact attachment or link behavior is safe for early `File Manager / Asset Pane` scope?

## 13. Acceptance Criteria

This contract is acceptable only if:

- every visible action is clearly subordinate to an owning system
- UI visibility does not become hidden authority
- truth mutation is explicit and owner-governed
- durable-state mutation is explicit and owner-governed
- paid, outbound, destructive, and protected-content actions are never silent
- `Companion` remains route-and-explain first
- `Command Center Surface` remains a host, not a universal owner
- `Writing Surface` remains sovereign for direct writing without becoming the owner of every exposed action
- blocked and refused actions fail honestly
- direct writing remains available even when support systems block, fail, or refuse
