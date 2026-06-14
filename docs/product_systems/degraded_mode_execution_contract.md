# Degraded Mode Execution Contract

## 1. Purpose

Define the canonical execution contract for degraded, blocked, offline, failed, refused, partially available, recovery-first, and safe-mode states inside Black Skies.

This artifact exists so support-system failure does not permit:

- silent truth mutation
- silent durable-state mutation
- silent retry loops
- false healthy status
- unsafe export
- unsafe restore
- unsafe AI fallback
- blocked direct writing

## 2. Scope

This contract governs:

- execution-state vocabulary
- system-specific degraded behavior
- retry and queue rules
- safe-mode, read-only, and recovery-first posture
- failure behavior across routing, AI, queue, export, restore, memory, notes, signals, and diagnostics
- diagnostics and evidence limits during failure

This contract applies across:

- `Service Health / Offline / Degraded Mode`
- `Async Job Queue / Task Runner`
- `Diagnostics / Error Visibility / Debug Console`
- `Testing / Harness / Evidence Contract`
- `Model Routing And Budget Architecture`
- `LLM Package Construction Architecture`
- `Import Export Document Interchange`
- `Snapshots / Backup / Restore / History`
- `Memory Lab`
- `Signal Architecture`
- `Feedback Notes / Revision Resolution`
- `Writing Surface`
- `Command Center Surface`
- `Companion`
- later local-model and paid-API execution paths

## 3. Non-Goals

- runtime retry implementation
- queue implementation
- safe-mode implementation
- health-check implementation
- service orchestration
- database schema
- GUI flow design
- runtime state machine design

## 4. Core Doctrine

- Direct writing remains available whenever local editing is still possible.
- Health ambiguity must not be reported as healthy.
- Degraded execution must fail closed for truth mutation, durable-state mutation, outbound transfer, paid retry, destructive retry, restore-over-current, and protected-content exposure.
- Degraded execution may fail open only for safe local direct writing, safe local inspection, and bounded read-only review when higher contracts permit them.
- No blocked, refused, failed, or retried action may silently apply pending AI, export, restore, memory, note, or signal changes.
- Retry is a governed action, not an invisible background convenience.
- Recovery-first posture is honest about risk and availability; it is not normal mode with softer labels.

## 5. Execution State Vocabulary

| State | Meaning | Owner | Visible user posture | Allowed actions | Forbidden actions | Fallback behavior |
| --- | --- | --- | --- | --- | --- | --- |
| `healthy` | required owner, dependency, and approval conditions are present for the current bounded action | owning system for the action | calm, normal, truthful | normal owner-governed actions | false claims about wider availability than actually exists | none beyond ordinary owner rules |
| `degraded` | some capability is reduced, slower, partial, or narrowed, but a bounded safe path still exists | relevant system owner with health layer visibility | truthful warning, narrowed path | safe local work, bounded review, downgraded non-destructive work | pretending full feature parity, hidden auto-escalation, unsafe fallback | downgrade to local, smaller-scope, read-only, or review-first path |
| `offline` | required external or non-local dependency is unavailable | health/routing owner for the affected path | explicit offline or local-only message | local writing, local review, local-only actions | outbound calls, sync claims, fake success | local-only fallback or blocked external path |
| `blocked` | policy, protection, spend, or owner contract forbids execution before it starts | owning policy or action owner | explicit blocked state with reason | safe review, revision of request, cancel | execution by override through surface convenience | stay blocked, revise scope, or choose manual path |
| `refused` | execution was eligible or attempted, then declined by provider, system, or user at approval time | action owner plus route/provider witness | explicit refusal state | manual retry after review, alternative route if separately approved | silent provider switch, silent paid retry, silent fallback that changes risk class | show reason, offer bounded alternative, preserve direct writing |
| `failed` | execution attempted and did not complete successfully | action owner | explicit failure state | bounded retry if rules allow, diagnostics, review | pretending success, silent auto-apply of partial effects | preserve current state, show safe next step |
| `pending` | action is waiting for dependency, approval, route, or ownership decision | action owner | visible pending/waiting state | cancel, review, approve when allowed | silent expiry into success, silent background mutation | remain pending, convert to queued, or cancel |
| `queued` | action is explicitly enqueued for later execution under queue rules | `Async Job Queue / Task Runner` plus originating owner | visible queued state | inspect, cancel, later run when allowed | queueing unsafe/destructive/outbound work without contract | review queue entry, pause, cancel, or run later |
| `retryable` | a failed or refused action may be retried without violating risk boundaries if revalidated | originating owner plus route/policy owner when relevant | visible retry option, not automatic | explicit retry after revalidation | silent paid/outbound/destructive retry | require review, then rerun or downgrade |
| `non-retryable` | repeating the same action is unsafe, meaningless, or forbidden without material change | originating owner | visible blocked/no-retry posture | inspect, revise inputs, switch to safer path | blind rerun loop | cancel, stage, recover, or manual alternative |
| `recovery-first` | the system must prioritize preserving work and safe recovery over ordinary feature execution | health/recovery owner | explicit recovery-first banner/posture | read-only inspection, recovery review, safe copy, repair-first actions | heavy scans, outbound send, destructive cleanup, false healthy path | copy-first, read-only, repair-first, or safe-mode |
| `read-only` | content may be inspected but not durably changed through the affected path | affected owner | explicit read-only state | inspect, compare, copy, export only if separately safe | direct durable mutation through the read-only path | preserve inspection, offer copy or repair path |
| `safe-mode` | startup or runtime posture that minimizes risk by narrowing available systems and actions | health/recovery owner | explicit safe-mode state | direct writing if safe, read-only open, repair-first, minimal diagnostics | heavy background work, paid/outbound work, destructive bulk actions | remain narrow until explicit exit or repair |
| `unavailable` | capability is absent or not currently offered, without implying why | relevant owner | explicit unavailable state | inspect adjacent status, choose other path | pretending temporary availability or auto-retrying hiddenly | stay unavailable or route to manual path |
| `no-ai-route-available` | no permitted AI path remains after routing, protection, approval, budget, and provider checks | `Model Routing And Budget Architecture` | explicit no-AI route state | manual/no-AI fallback, revise mask/scope, local non-model alternatives | hidden outbound escalation, hidden provider switch, treating route failure as manuscript failure | continue writing, save manual note/signal/task, or cancel |
| `permission-required` | action may proceed only after the required approval or permission is granted | owning system for the action | explicit permission-needed state | review, approve, cancel | silent assumption of approval | remain pending or blocked until granted |
| `approval-denied` | required approval was explicitly withheld | owning system for the action | explicit denial state | revise request, cancel, choose manual path | silent retry, silent downgrade to a materially different risky action | preserve current state and direct writing |

## 6. System-Specific Degraded Behavior

| System | What remains available | What must pause | What must block | What may retry | What must not silently retry | Direct writing path |
| --- | --- | --- | --- | --- | --- | --- |
| `Writing Surface` | local prose entry, local inspection, bounded overlays if safe, recoverable-write cues | heavy support overlays, deep scans, provenance-heavy views | any action needing unavailable owner, unsafe export, unsafe restore, unsafe AI apply | safe local UI refresh only | save-state mutation retries that risk data confusion | always primary if local editing works |
| `Command Center Surface` | blocker visibility, review queues, read-only summaries, explicit approval prompts | heavy aggregation if owners are unavailable | any surfaced action whose owner is blocked, refused, or unsafe | refresh of summaries after owner revalidation | hidden mutation retries just because controls are visible | must never gate writing |
| `Companion` | explanations, manual/no-AI fallbacks, safe local navigation, blocked-state explanation | deep scans, heavy analysis, scheduled help that depends on failed owners | paid/outbound/helpful-but-risky actions without approval, any durable mutation | retry explanation only after owner says retryable | silent provider switch, silent scan rerun, silent spend | must always yield to direct writing |
| `Model Routing / Budget` | route status, cost state, block/refusal reasons, local-only downgrade decisions | session-approved reuse when prerequisites changed | over-cap, approval-denied, privacy-blocked, outbound-blocked, no-AI-route-available tasks | retry only after revalidation and explicit approval where needed | silent paid retry, silent provider-switch retry | writing continues without AI |
| `Package Construction` | local package summaries, blocked-assembly reasons, approved local-only package views | outbound assembly when route or protection is unstable | blocked/outbound-denied/protected raw payload assembly | local recompute after approved source review | stale package resend after source/protection changed | writing continues without packaging |
| `Local model execution` | approved local-only advisory runs if local engine is healthy | larger or background runs when hardware/perf is degraded | any local model action when unavailable, unsafe, or recovery-first blocks it | retry if source, route, and health remain valid | hidden loop retries that consume time or change scope | writing continues |
| `Paid API execution` | none unless approval and outbound path still valid | pending or queued paid work during degraded network/provider state | paid/outbound work when offline, blocked, denied, over-cap, or protection-failed | explicit retry after review and fresh approval when required | silent paid retry, silent provider switch, silent outbound resend | writing continues |
| `Async Job Queue` | queue review, cancel, inspect results, approved bounded local queueing | execution of jobs whose dependencies degraded | destructive, truth-mutating, outbound, paid, or protection-sensitive jobs without safe conditions | retryable local jobs after revalidation | silent paid/outbound/destructive reruns | writing continues while queue is blocked |
| `Memory Lab` | existing governed recall already safely retained, local bounded summaries, read-only memory review | new heavy scans, new durable retention, outbound memory-related work | retention of raw excluded/protected material, silent memory save/forget actions | local re-query of existing safe recall only | re-running failed heavy scans or reactivating forgotten memory | writing continues without memory help |
| `Signal Architecture` | current durable signal review, read-only signal history, explicit author triage | automated normalization or cleanup when dependencies are degraded | silent resolve/dismiss/convert actions, risky bulk changes | explicit retry of non-destructive normalization after revalidation | silent stale-signal cleanup retry | writing continues without signal maintenance |
| `Feedback Notes` | note viewing, manual note authoring if local state is healthy, read-only history | clustering, AI-derived suggestions, heavy review helpers | silent durable note creation from degraded AI output, bulk note resolution | explicit retry of safe local note helper paths | silent note-creation or auto-resolution retry | writing continues with manual notes if local state works |
| `Document Interchange` | local staging review, clean visibility into blocked transfer state, safe local copy paths | sync-like or outbound transfer when dependencies degraded | import/export/sync/publish if protection, approval, route, or storage conditions are unsafe | retry only after source/destination/protection revalidation | silent outbound retry, silent emergency raw export, silent import reclassification | writing continues locally |
| `Snapshots / Restore` | preview, read-only recovery, restore-as-copy when safe, recovery status | restore-as-current if current state or protection state is uncertain | silent restore-over-current, protected-content resurrection, crash-loop-inducing restore | explicit retry of safe preview/copy recovery after review | silent restore rerun after failure | writing continues if project can still open locally |
| `Diagnostics` | safe summary, next safe step, redacted witness material | deep evidence collection if it risks more harm or leakage | raw protected evidence exposure, fake proof claims, state mutation to look healthy | explicit rerun of bounded diagnostics | silent evidence-bundle recreation or noisy loops | writing continues while diagnostics remain support-only |
| `File Manager` | bounded browse, safe local open, visibility of file risk or absence | risky file operations during degraded storage/permission state | protected-file leakage, risky move/delete/repair, attachment authority drift | safe metadata refresh only | hidden file-operation retries | writing continues without file operations |
| `Project Index / Search` | existing local index query, bounded source-labeled retrieval, read-only results | rebuild or heavy semantic refresh during degraded state | hidden/excluded snippet leakage, retrieval-as-canon, stale inference promotion | explicit reindex after storage/health revalidation | silent stale-index refresh loops | writing continues with manual browsing if needed |

## 7. Retry And Queue Rules

### 7.1 Retry Allowed

Retry is allowed only when all of the following are true:

- the owner marks the action `retryable`
- the source scope is still valid
- the protection state is still valid
- the route or destination has not become riskier
- the retry does not silently repeat paid, outbound, destructive, truth-changing, or durable-state-changing work without the required approval

### 7.2 Retry Requires Approval

Retry requires explicit fresh approval when:

- the action is paid
- the action is outbound
- the provider changes
- the source scope widened
- the protection state changed
- the package view changed
- the action can mutate truth or durable state
- the previous failure happened after partial success or spend

### 7.3 Retry Blocked

Retry is blocked when:

- the action is `non-retryable`
- the protection state now forbids it
- the source changed enough to stale the package or action
- the route is `blocked`, `approval-denied`, or `no-ai-route-available`
- the action would risk double spend, double export, double restore-over-current, or duplicate destructive mutation

### 7.4 Queueing Allowed

Queueing is allowed only for:

- approved bounded local jobs
- non-destructive advisory work
- jobs whose result still requires later review
- jobs whose owner contract allows deferred execution

### 7.5 Queueing Unsafe

Queueing is unsafe for:

- paid work without approval
- outbound work without approval
- destructive work
- truth mutation
- direct durable-state mutation outside accepted owner workflows
- restore-over-current
- export/sync/publish
- protection-sensitive work whose source or package may change before execution

### 7.6 Pending Work Must Be

- `canceled` when the owner or policy forbids execution now
- `parked` when the user may want it later but it is unsafe now
- `reviewed` before rerun when the source, scope, or route changed
- never silently auto-applied on health recovery

## 8. Safe-Mode And Recovery-First Rules

### 8.1 Safe-Mode Entry

Safe mode is appropriate when:

- startup would otherwise loop or crash
- settings or project state may be corrupted
- recent recovery or restore is suspect
- normal execution would make damage worse

Safe mode must:

- narrow available systems
- expose that the app is not in normal mode
- preserve direct writing if local editing is still safe
- block risky background work and risky mutation paths

### 8.2 Recovery-First Entry

Recovery-first posture is appropriate when:

- recent writing may be pending, degraded, or at risk
- restore is under review
- project open succeeded only partially
- storage or health ambiguity makes ordinary operation untrustworthy

Recovery-first must:

- favor preview, copy, read-only, and repair-first paths
- avoid silent pending-action replay
- show what is unavailable
- not claim healthy save or sync posture falsely

### 8.3 Read-Only Entry

Read-only posture is appropriate when:

- the project can be opened but not safely mutated
- recovery or repair decisions are pending
- permission or storage risk makes write-back unsafe

Read-only must:

- preserve inspection and comparison
- block durable mutation through the affected path
- offer copy, export-if-safe, or repair guidance only where separately allowed

### 8.4 Crash-Loop Posture

When recent restore, settings, project state, or queue state causes repeated failure:

- do not reopen into full normal mode automatically
- prefer safe mode or recovery-first
- block silent restore retries
- block silent queued action replay
- expose repair-first or read-only options

## 9. Execution Failure Behavior

| Failure class | User-visible state | Retry allowed? | Fallback allowed? | Owner revalidation required? | Direct writing continues? |
| --- | --- | --- | --- | --- | --- |
| `AI` | `failed`, `refused`, `no-ai-route-available`, or `approval-denied` as appropriate | only if retryable | yes, manual/no-AI/local fallback | yes | yes |
| `routing` | `blocked`, `refused`, `permission-required`, `approval-denied`, or `no-ai-route-available` | only after route revalidation | yes, local/manual fallback | yes | yes |
| `queue` | `queued`, `failed`, `blocked`, `paused`, or `review-required` | local-only safe retry maybe | yes, manual rerun or cancel | yes | yes |
| `export` | `blocked`, `failed`, `offline`, or `permission-required` | only after destination/protection revalidation | yes, local copy or cancel if separately safe | yes | yes |
| `import` | `failed`, `blocked`, or `review-required` | only after source/classification revalidation | yes, stage only or cancel | yes | yes |
| `restore` | `recovery-first`, `read-only`, `failed`, or `blocked` | preview/copy retry maybe; current restore rarely | yes, preview/copy/read-only fallback | yes | yes if project remains editable |
| `diagnostics` | `failed`, `unavailable`, or `summary-only` | bounded rerun only | yes, minimal safe summary | yes | yes |
| `memory` | `degraded`, `blocked`, or `unavailable` | safe local recall query maybe | yes, continue without memory help | yes | yes |
| `signals` | `degraded`, `blocked`, or `review-required` | safe non-destructive retry maybe | yes, leave signals unchanged | yes | yes |
| `notes` | `degraded`, `blocked`, or `review-required` | safe local helper retry maybe | yes, manual note path | yes | yes |
| `package construction` | `blocked`, `failed`, or `summary-only` | only after source/protection/route revalidation | yes, no-AI/manual fallback | yes | yes |

## 10. Diagnostics And Evidence Limits

- Diagnostics may explain failure, but they remain witnesses, not proof.
- Diagnostics must not leak protected content.
- Diagnostics must not export raw manuscript by default.
- Diagnostics must not expose AI-excluded text.
- Diagnostics must not override provenance restrictions.
- Diagnostics must not mutate state to make tests green.
- Diagnostics must not be confused with product correctness or verification closure.
- Evidence bundles must remain bounded, redacted where required, and aligned with `Testing / Harness / Evidence Contract`.
- If evidence collection fails, verification claims remain blocked; failure explanation may still be shown.

## 11. Failure Vocabulary

- `degraded`: some safe capability remains, but normal capability is narrowed
- `offline`: needed external or non-local dependency is unavailable
- `blocked`: policy or permission forbids starting the action
- `refused`: the action was considered or attempted, then declined by provider/system/user
- `failed`: the action attempted execution and did not complete successfully
- `unavailable`: capability is absent without implying exact cause
- `pending`: waiting on dependency, approval, or owner decision
- `queued`: explicitly staged for later governed execution
- `retryable`: rerun is allowed after validation
- `non-retryable`: rerun is unsafe or meaningless without material change

These terms must not collapse into a generic `offline` blob.

## 12. Future Alignment Targets

- `service_health_offline_degraded_mode.md`
- `async_job_queue_task_runner.md`
- `diagnostics_error_visibility_debug_console.md`
- `testing_harness_evidence_contract.md`
- `model_routing_and_budget_architecture.md`
- `llm_package_construction_architecture.md`
- `import_export_document_interchange.md`
- `snapshots_backup_restore_history.md`
- `memory_lab.md`
- `signal_architecture.md`
- `feedback_notes_revision_resolution.md`
- `writing_surface.md`
- `command_center_surface.md`
- `companion.md`

## 13. Remaining Critical Questions

- Which exact local-save or pending-write signals must be surfaced first so degraded writing posture is honest without overstating danger?
- Which queued local-only jobs, if any, may survive app restart automatically versus requiring re-review?
- What exact repair-first toolset should safe mode expose before runtime implementation begins?
- What exact partial-success rules govern imports, exports, and paid AI runs that fail after some side effects occur?
- Which failure summaries must always be visible even if deeper diagnostics fail?

## 14. Acceptance Criteria

This contract is acceptable only if:

- direct writing remains primary whenever local editing is still possible
- failure vocabulary is explicit enough to stop `offline` from swallowing every failure mode
- degraded execution blocks unsafe retries, unsafe fallback, and false healthy reporting
- queue and retry rules are explicit enough to prevent silent paid, outbound, destructive, or truth-mutating reruns
- safe-mode and recovery-first posture are clearly narrower than normal mode
- diagnostics remain bounded witnesses rather than hidden authority or proof
