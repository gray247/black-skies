# Snapshot Protected Recovery Contract

## 1. Purpose

Define the canonical recovery contract for `Snapshots / Backup / Restore / History`.

This artifact exists to answer:

- what snapshot-held objects may be recovered
- what may not be restored into active current state
- which protection states survive recovery
- how current state and historical state conflict
- what provenance recovery must record
- what recovery review must disclose before historical material can
  replace current active state

## 2. Scope

This contract governs:

- recoverable object classes inside snapshots
- recovery modes from preview to restore-as-current
- protection preservation during inspection, copy, staging, and restore
- conflict rules between current and historical state
- provenance requirements for recovery actions
- failure behavior when recovery is ambiguous or unsafe

This contract applies across:

- `Snapshots / Backup / Restore / History`
- truth owners such as `Narrative Insertion / Assertion`, `Lore Cards`, and `Character Cards`
- durable-state owners such as `Memory Lab`, `Signal Architecture`, `Feedback Notes / Revision Resolution`, and `Authorship Provenance AI Visibility`
- support systems such as `Project Index / Search / Retrieval`, `File Manager / Asset Pane`, `Diagnostics / Error Visibility / Debug Console`, and `Service Health / Offline / Degraded Mode`
- host surfaces such as `Writing Surface`, `Command Center Surface`, and `Workflow Spine / Author Journey`

## 3. Non-Goals

- backup-engine design
- storage schema
- database design
- snapshot file format
- backup schedule design
- cloud-sync design
- redesign of `Memory Lab`, `Signal Architecture`, `Feedback Notes`, `Provenance`, or `Diagnostics`

## 4. Snapshot Object Taxonomy

Core recovery doctrine:

- A snapshot is historical evidence, not truth authority.
- Recovery does not erase ownership.
- Recovery does not erase protection state.
- Historical existence does not automatically recreate current truth, current memory, current signals, or current notes.

| Snapshot object | Owner | Recoverability | Recovery restrictions | Truth implications |
| --- | --- | --- | --- | --- |
| `manuscript content` | `Narrative Insertion / Assertion` | preview, compare, restore as copy, restore as candidate, restore as current | current overwrite requires `T3 + T6`; hidden, masked, deleted, protected, and local-only states must survive; no silent overwrite | historical manuscript is not current manuscript truth until explicitly restored |
| `accepted assertions` | `Narrative Insertion / Assertion` | preview, compare, restore as candidate, restore as current only through owner-governed path | may not silently recreate accepted assertion truth; deleted assertions remain historical until explicitly reaccepted | historical assertion existence is not current accepted assertion truth |
| `lore truth` | lore truth owner | preview, compare, restore as candidate, restore as current only through lore owner | no silent lore resurrection; import-style restaging may be safer than direct current restore | historical lore is not active lore by default |
| `character truth` | character truth owner | preview, compare, restore as candidate, restore as current only through character owner | no silent character-fact resurrection; conflicting current character truth wins until explicit acceptance | historical character state is not current character truth by default |
| `outlines` | `Outline` | preview, compare, restore as copy, restore as candidate, restore as current | outline restore must not mutate manuscript or assertions by implication | outline remains planning state, not truth |
| `projections` | projection owner | preview, compare, restore as copy, restore as staged object | projection restore must not replace manuscript order or truth authority | projection is display/support state only |
| `notes` | `Feedback Notes / Revision Resolution` | preview, compare, restore as copy, restore as candidate, restore as current note state | note restore must preserve anchor validity warnings, deleted state, and advisory status | notes remain non-truth advisory state |
| `signals` | `Signal Architecture` | preview, compare, restore as copy, restore as candidate, restore as current signal state | signal restore must preserve suppression, dismissal, and evidence state; no truth recreation | signals remain non-truth durable state |
| `memory` | `Memory Lab` | preview, compare, restore as candidate, bounded restore as current memory state | forgotten, discarded, deleted, and excluded memory must not silently reactivate; raw excluded spans stay blocked by default | memory remains governed recall, not truth |
| `provenance` | `Authorship Provenance AI Visibility` | preview, compare, restore as copy, restore as current provenance state | raw excluded payload must not be recreated by provenance restore; metadata restore must remain metadata-only | provenance remains history/metadata, not truth |
| `preferences` | `Settings / Preferences / Workspace Layout` | preview, compare, restore as copy, restore as current | unsafe settings may require read-only or repair-first path; restore must not silently widen permissions | preferences are support state only |
| `workflow markers` | `Workflow Spine / Author Journey` | preview, compare, restore as copy, restore as current | resume markers must not become hidden save authority or truth authority | workflow state is not truth |
| `imported material` | `Import Export Document Interchange` until handoff | preview, compare, restore as staged object, restore as review object | import classification must survive; no silent promotion to manuscript or truth | imported historical material remains staged or classified intake |
| `generated material` | requesting system until acceptance | preview, compare, restore as advisory artifact, restore as candidate | generated output must not silently become accepted manuscript, truth, note, signal, or memory | generated history remains advisory |
| `diagnostics evidence` | `Diagnostics / Error Visibility / Debug Console` | preview, evidence recovery, bounded copy | protected raw evidence stays redacted or blocked unless a later support path permits more | diagnostics remain operational evidence, not narrative authority |
| `package artifacts` | `LLM Package Construction Architecture` | preview, evidence recovery only | package artifacts must not be restored as manuscript, memory, or truth | package history is technical history, not story authority |

## 5. Recovery Modes

| Recovery mode | Intent | Approval requirements | Allowed object types | Protection behavior | Provenance behavior |
| --- | --- | --- | --- | --- | --- |
| `preview only` | inspect historical state without mutation | `T0` | all snapshot objects the viewer may lawfully inspect | preserve all protection states; no unmasking by default | may record view event only if later needed |
| `read-only recovery` | open a bounded historical state without mutation | `T0` or `T1` | manuscript, outline, projection, notes, signals, memory summaries, provenance, diagnostics summaries | hidden stays hidden by default; masked stays masked; excluded stays excluded | recovery session should record snapshot id and read-only posture |
| `restore as copy` | create a separate recovery copy for manual review | `T2 + T6` | manuscript, outline, projections, notes, signals, provenance, preferences, workflow markers, staged imports | protection state survives into the copy; blocked outbound states remain blocked | must record source snapshot, copy destination, and preserved protection flags |
| `restore as candidate` | create an explicit candidate for later owner acceptance | `T2 + T6` | accepted assertions, lore truth, character truth, notes, signals, memory, generated material | candidate inherits prior protection state and non-authority status | must record candidate class, owner, and acceptance requirement |
| `restore as staged object` | recover into staging or review instead of active state | `T2 + T6` | imported material, generated material, projections, uncertain structural state | preserve import/generated/protected classifications | must record staging destination and original historical class |
| `restore as current` | replace current active owner state with historical state | `T3 + T6` | manuscript, accepted assertions, lore truth, character truth, outline, notes, signals, preferences, workflow markers, bounded memory classes | never strips protection; may be blocked when deleted, forgotten, AI-excluded, local-only, or restricted state would be violated | must record current-vs-historical comparison, approval, scope, and final result |
| `historical comparison` | compare current and historical state side by side | `T0` or `T1` | all inspectable classes | comparison must not reveal raw protected material beyond allowed view | comparison provenance may remain bounded local metadata |
| `evidence recovery` | recover bounded evidence for diagnostics, repair, or dispute review | `T2 + T6` | diagnostics evidence, route history references, package summaries, provenance metadata, protected summaries | prefer redacted witness material over raw protected payload | must record evidence scope, redactions, and requester |

## 6. Protection Preservation Rules

- Recovery does not erase protection state.
- Recovery does not convert protected content into unrestricted content.
- Recovery does not turn historical deletion into current visibility by accident.
- Recovery does not turn forgotten memory into active recall by accident.
- Recovery does not turn AI-excluded content into AI-usable content by accident.

### 6.1 State Preservation

- `hidden`: may remain hidden after recovery; restore may recover hidden state, not forced default visibility
- `masked`: raw and masked forms remain distinct; recovery may not silently unmask outward views
- `deleted`: may remain historical, previewable, or recoverable only through explicit governed recovery
- `discarded`: may remain inspectable as historical advisory debris but must not return to active use silently
- `forgotten`: may be inspectable as historical memory evidence, but must not re-enter active recall without explicit memory-owner approval
- `AI-excluded`: remains excluded from AI previews, package assembly, summaries from raw form, and outbound AI use after recovery
- `local-only`: remains local-only after recovery; restore does not authorize export, sync, or provider send
- `export-blocked`: remains blocked from export after recovery unless explicitly reclassified elsewhere
- `transfer-blocked`: remains blocked from transfer after recovery unless explicitly reclassified elsewhere
- `protected`, `restricted`, and `sensitive`: remain narrowed; recovery must prefer masked or summary view when raw view is not permitted

### 6.2 States That May Never Silently Reappear As Current

- deleted truth
- deleted manuscript ranges
- forgotten active memory
- discarded advisory artifacts
- raw AI-excluded content in any AI-facing path
- local-only content in any outbound-ready state
- masked raw content in a context that previously required masked form

## 7. Conflict Rules

### 7.1 General Precedence

When current state and historical state conflict, this order wins:

1. explicit author refusal or block
2. active protection state such as `AI-excluded`, `local-only`, `restricted`, `masked`, or `hidden`
3. current owner-governed accepted state
4. current durable-state owner rules
5. historical snapshot state as candidate, comparison material, or bounded recovery source

### 7.2 Current Versus Historical State

- Historical existence does not automatically override current state.
- Historical existence does not automatically recreate current truth.
- Historical existence does not automatically recreate current memory.
- Historical existence does not automatically recreate current signals.
- Historical existence does not automatically recreate current notes.
- Historical existence does not automatically recreate current export eligibility.

### 7.3 Object-Level Outcomes

- `manuscript`, `accepted assertions`, `lore truth`, and `character truth`: historical version becomes preview, copy, or candidate unless explicit restore-as-current succeeds
- `notes` and `signals`: historical version may return as historical record, copy, or owner-approved current durable state
- `memory`: historical version may return only as bounded candidate or explicitly re-retained memory class; forgotten or excluded memory stays blocked by default
- `provenance`: historical provenance may return as metadata, not as authority over current truth
- `imported` and `generated` material: historical version returns as staged, review, or candidate material, not current truth
- `diagnostics evidence` and `package artifacts`: historical version remains evidence only

## 8. Restore-As-Current Rules

`restore as current` is the highest-risk recovery action.

### 8.1 Allowed

- when the destination owner is explicit
- when the scope is explicit
- when current-vs-historical comparison is available
- when protection state can be preserved
- when provenance can record the action
- when direct writing can remain available if the action is refused

### 8.2 Discouraged

- when `restore as copy` or `restore as candidate` would solve the problem safely
- when the conflict is limited to a narrow range or support object
- when the recovered state contains mixed deleted, masked, or protected content that the user has not reviewed
- when the restore is being used as a shortcut for note, signal, or memory triage

### 8.3 Blocked

- when restore would silently unmask protected raw content
- when restore would silently reactivate forgotten memory as active recall
- when restore would silently convert discarded advisory output into active durable state
- when restore would silently make AI-excluded material available to AI-facing paths
- when restore would silently change local-only material into outbound-ready state
- when the snapshot artifact itself is being treated as truth authority without owner-governed acceptance

### 8.4 Requirements

- approval tier: `T3 + T6`
- explicit snapshot id
- explicit destination owner
- explicit restore scope
- visible current-vs-historical comparison or equivalent evidence
- visible protection-state preservation
- provenance record of approval and result

## 9. Recovery Provenance Rules

Recovery provenance must be discoverable without turning snapshots into truth authority.

Minimum recovery record:

- snapshot id
- object class
- owning system
- recovery mode
- approval tier used
- requester or actor
- current-vs-historical scope
- source age or time context when available
- recovery confidence or verification posture when available
- protection states preserved
- whether the result was previewed, copied, staged, accepted, rejected, blocked, abandoned, or failed

At minimum, provenance should distinguish:

- `recovered from snapshot`
- `restored as copy`
- `restored as candidate`
- `restored as staged object`
- `restored as current`
- `recovered protected material`
- `recovered candidate material`
- `recovery rejected`
- `recovery abandoned`
- `recovery blocked by protection`

Provenance must not:

- store raw excluded text by default
- let recovery metadata masquerade as truth acceptance
- erase evidence that protection state survived the recovery

## 10. Failure Behavior

When recovery permissions are unclear or conflicting:

- fail closed for restore-over-current, outbound, AI-facing, and protected-material exposure
- preserve current active state
- allow preview, read-only inspection, or comparison where possible
- downgrade to `restore as copy`, `restore as candidate`, or `restore as staged object` when safe
- require explicit review for any truth-adjacent or durable-state-changing recovery
- preserve direct writing whenever local editing is still possible
- do not silently widen recovered scope
- do not silently retry a risky restore with weaker protection assumptions

## 11. Future Alignment Targets

- `snapshots_backup_restore_history.md`
- `memory_lab.md`
- `signal_architecture.md`
- `feedback_notes_revision_resolution.md`
- `authorship_provenance_ai_visibility.md`
- `import_export_document_interchange.md`
- `file_manager_asset_pane.md`
- `project_index_search_retrieval.md`
- `service_health_offline_degraded_mode.md`
- `diagnostics_error_visibility_debug_console.md`
- `workflow_spine_author_journey.md`
- `narrative_insertion_assertion.md`

## 12. Remaining Critical Questions

- What exact object bundles should an early snapshot capture together versus separately so restore scope is honest and predictable?
- Which recovery actions, if any, must force `restore as copy` before `restore as current` is even offered?
- What exact crash-loop, repair-first, or safe-mode path should exist when current state cannot open cleanly but snapshots can?
- What exact anchor-repair behavior is required when restored notes or signals point to deleted, rewritten, or stale manuscript ranges?
- What exact bounded path, if any, allows protected diagnostics evidence to be recovered for support without leaking raw protected content?

## 13. Acceptance Criteria

This contract is acceptable only if:

- snapshot history is clearly non-authoritative
- recoverable object classes are explicit enough to prevent hidden authority drift
- restore modes are distinct enough to keep preview, copy, candidate, staged, and current restore from collapsing into one unsafe action
- protection states survive recovery without silent downgrades
- deleted, discarded, forgotten, masked, hidden, AI-excluded, and local-only material do not silently reappear as active current state
- restore-as-current is clearly narrower and higher-friction than ordinary recovery inspection
- recovery provenance records what happened without turning historical artifacts into truth authority
