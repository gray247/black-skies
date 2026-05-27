# Recovery Diagnostics Governance - Pass 41

## Executive Findings

- Recovery diagnostics is a separate authority family, not a synonym for support truth, developer diagnostics, restore authority, reopen authority, rollback authority, retry truth, or source-of-truth authority.
- The highest risk is adjacency: when diagnostics evidence appears beside restore, reopen, retry, rehydrate, or resume-language, users can read investigation evidence as recovery permission.
- Recovery diagnostics may inspect, investigate, and help verify a recovery condition, but it must not silently inherit authority to recover, reopen, restore, rollback, rehydrate, retry, mutate, execute retrieval, or resume authority.
- Product-support diagnostics, recovery-exception diagnostics, developer/test diagnostics, and investigation-only evidence require separate audience handling even if a shared bridge or folder access method remains technically convenient.
- `View diagnostics` and diagnostics-folder exposure are governance-sensitive terms because repeated visibility can normalize diagnostics as ordinary workflow tooling.
- Recovery diagnostics remains blocked from ordinary workflow placement until restore/reopen semantics, retrieval invalidity, stale-state authority, and source-of-truth vocabulary are narrower.

## Recovery Diagnostics Authority Families

- `Support explanation`: explains a user-visible condition or interruption. It may say what condition is observable, but it must not expose raw diagnostic internals or imply a recovery route.
- `Diagnostics evidence`: exposes logs, traces, state records, health data, or investigation material. It supports investigation, not action authority.
- `Recovery evidence`: evidence specifically tied to a recovery condition, such as why a restore/reopen/retry path may be relevant. It is still not recovery permission.
- `Authority resumption`: any claim that a reopened, restored, rehydrated, or resumed state has become current or authoritative again. Recovery diagnostics must not create this authority.
- `Developer/test investigation`: internal or test-facing evidence for debugging harness, bridge, runtime, offline, invalidity, stale-state, or failure behavior. It must not become product-support vocabulary.

Special term boundaries:
- `inspect`: observe or examine state without changing it.
- `investigate`: gather or expose diagnostic evidence for analysis.
- `verify`: establish evidence about a condition; verification is not repair permission.
- `recover`: perform an exceptional recovery action; diagnostics does not authorize it.
- `reopen`: make something visible or navigable again; not necessarily authority resumption.
- `restore`: bring prior material back as copy or replacement; not rollback by default.
- `retry`: repeat an attempted operation; support truth, not rollback or recovery.
- `rollback`: reverse or undo a mutation path; not the same as restore.
- `rehydrate`: reconstruct runtime/session state; not source-of-truth authority.
- `resume authority`: re-establish active authority over material; must be explicit and separately governed.

## Highest-Risk Recovery Diagnostics Ambiguities

- Whether a diagnostics affordance near restore/reopen implies the system has approved recovery.
- Whether `View diagnostics` reads as ordinary troubleshooting, developer/test investigation, recovery evidence, or a next workflow step.
- Whether diagnostics-folder access exposes internal reason keys, stale-state details, test/offline scaffolding, or source-of-truth language to an audience that will treat it as product truth.
- Whether recovery diagnostics can mention stale, invalid, orphaned, unresolved, restored, reopened, rehydrated, or resumed state without implying authority resumption.
- Whether retrieval invalidity evidence creates pressure to recover, restore, reopen, rehydrate, or retry.
- Whether repeated diagnostics visibility normalizes recovery exceptions into ordinary workflow tooling.

## Recovery Legitimacy Drift Risks

- Repeated visibility can make diagnostics feel like a normal workflow panel instead of an exceptional support/investigation surface.
- Adjacency to restore, reopen, retry, rollback, or rehydrate language can transfer recovery legitimacy to diagnostics evidence.
- Evidence phrased as confident cause can be mistaken for permission to act.
- Support copy that names internal diagnostics can turn developer/test truth into operator workflow truth.
- Diagnostics entries that persist after the exceptional condition ends can make stale recovery state look active.
- Folder or log access can imply that visible records are complete, current, authoritative, and safe to use for recovery decisions.

## Support Truth Versus Recovery Diagnostics Boundaries

- Support truth may explain that a condition exists, that an operation could not complete, or that support material is available.
- Recovery diagnostics may expose evidence for investigation only when the audience and exception state justify it.
- Support truth must not become diagnostics leakage by surfacing raw bridge names, internal reason keys, test/offline branches, frozen state labels, invalid retrieval details, or source-of-truth vocabulary.
- Recovery diagnostics must not become support truth by appearing as a routine product explanation on ordinary workflow surfaces.
- Retry truth remains support truth for now; retry must not be compressed into restore, rollback, recover, or resume authority.

## Diagnostics Evidence Versus Recovery Authority

- Diagnostics evidence can support inspection, investigation, and verification.
- Diagnostics evidence does not grant mutation authority, recovery permission, source-of-truth authority, retrieval execution authority, restore authority, reopen authority, rollback authority, rehydrate authority, or resume authority.
- Recovery evidence must be labeled and contained as evidence, not as an instruction, command route, or product workflow step.
- A diagnostic finding that indicates a stale, invalid, unresolved, or orphaned state does not prove that a canonical object exists, that material should be restored, or that a previous authority should resume.
- Developer/test diagnostics can be true while still unsafe for product-support exposure.

## Restore/Reopen Adjacency Risks

- Restore adjacency can make diagnostics evidence look like pre-approval for restore-as-copy or restore-as-replacement.
- Reopen adjacency can make diagnostics evidence look like harmless navigation even when reopen may resume, replace, recover, rehydrate, or expose stale authority.
- Rehydrate adjacency can blur runtime/session reconstruction with authority resumption.
- Rollback adjacency can make failure evidence look like undo authority.
- Retry adjacency can make support truth look like recovery tooling.
- Any `View diagnostics` placement near restore/reopen controls must be treated as a recovery legitimacy pressure point, not neutral transparency.

## Retrieval Invalidity Versus Recovery Pressure

- Missing retrieval is not missing identity.
- Stale retrieval is not current authority.
- Invalid retrieval is not recovery permission.
- Unresolved retrieval is not absence.
- Orphaned retrieval is not proof of persistence.
- Grouped failed retrieval is not grouped object failure.
- Retrieval invalidity evidence can explain why retrieval is unreliable, but it must not imply structural retrieval execution, object recovery, restore/reopen authority, or source-of-truth reconstruction.

## Recovery Diagnostics Audience Separation

### Product-Support

- Purpose: bounded explanation of a user-visible support condition.
- Safe language: condition exists, operation could not complete, support material may be available, retry/support guidance if already authorized elsewhere.
- Unsafe language: raw diagnostic terms, internal reason keys, test/offline/frozen labels, source-of-truth claims, or recovery recommendations that imply permission.

### Recovery Exception

- Purpose: exceptional evidence around restore, reopen, retry, rollback, rehydrate, stale state, invalidity, or recovery continuity.
- Safe language: evidence indicates an exceptional condition requiring bounded handling.
- Unsafe language: restored current authority, reopened source of truth, recovery approved, rollback available, resumed authority, or canonical restored state.

### Developer/Test

- Purpose: debugging runtime, bridge, logs, traces, invalidity, test/offline scaffolding, and harness behavior.
- Safe language: internal reason keys and detailed diagnostic labels when confined to developer/test contexts.
- Unsafe language: exposing developer/test terms as ordinary product-support or operator workflow vocabulary.

### Investigation-Only

- Purpose: collect and inspect evidence without action authority.
- Safe language: investigate, inspect, evidence, observed condition, diagnostic material.
- Unsafe language: recover, restore, reopen, rollback, retry, rehydrate, resume, execute, apply, or fix unless separately authorized.

## Maintenance-Only Safe Areas

- Documentation-only clarification that reinforces recovery diagnostics as investigation-only.
- Tracker updates that keep recovery diagnostics separate from support truth, developer/test diagnostics, and recovery execution.
- Internal terminology notes that keep `View diagnostics`, diagnostics-folder access, recovery evidence, stale retrieval, and invalidity language provisional.
- Existing test maintenance that preserves current behavior without adding diagnostics exposure, recovery routes, command/search routes, or source-of-truth claims.
- Support wording clarification that explains a condition without exposing diagnostic internals or suggesting restore/reopen/retry/rollback authority.

## Areas That Should Pause

- Any new or expanded `View diagnostics` placement in ordinary workflow surfaces.
- Diagnostics-folder exposure from product-support surfaces unless audience, context, and exception-state boundaries are explicit.
- Recovery diagnostics UI, menu, command/search, or automation routes.
- Restore, reopen, rollback, retry, rehydrate, or resume-authority language attached to diagnostics evidence.
- Recovery diagnostics vocabulary promoted into product copy.
- Structural retrieval, retrieval-linked execution, or command/search inheritance based on recovery diagnostics evidence.
- Developer/test diagnostic labels appearing in operator-facing support or recovery surfaces.

## Blocked Promotions Affected

- diagnostics expansion
- recovery diagnostics as ordinary workflow
- recovery execution
- recovery-linked command routes
- restore/reopen execution changes based on reconstruction findings
- command/search implementation
- structural command/search inheritance
- retrieval-linked execution
- structural retrieval
- source-of-truth vocabulary as product copy
- provisional vocabulary as product copy
- current GUI as final workflow architecture
- workflow-state canon
- roadmap rewrite

## Dependency Updates For Pass 40 Control Artifact

- `Recovery Diagnostics Governance` is now partially reconstructed, but not closed.
- `Recovery Diagnostics Governance` still blocks recovery-linked routes, command/search structural inheritance, diagnostics evidence grouping, and user-facing condition language.
- `Diagnostics Evidence Grouping` should remain deferred until recovery evidence, diagnostics evidence, retrieval invalidity evidence, and developer/test evidence receive separate grouping rules.
- `User-Facing Condition Language` should follow this pass so recovery diagnostics vocabulary does not become product-support wording.
- `Command/Search Structural Inheritance` remains blocked because recovery diagnostics cannot yet provide route, request, queue, execute, restore, reopen, retry, rollback, rehydrate, or resume-authority inheritance.
- `Retrieval-Linked Execution Pressure` remains blocked because retrieval invalidity evidence is investigation-only and cannot authorize recovery.
- `Topology-Aware Recovery Pressure` remains deferred because recovery diagnostics does not authorize topology-aware restore, reopen, recovery, or rehydration.

## Contradictions Found

- `C-002` remains open. Support and recovery visibility are necessary, but repeated diagnostics visibility can normalize recovery diagnostics as ordinary workflow tooling.
- `C-004` remains contained but needs continued enforcement. Verification evidence can support investigation, but must not become repair, recovery, or mutation permission.
- `C-007` remains open. Restore protects work, but diagnostics evidence adjacent to restore can hide restore-as-replacement authority risk.
- `C-008` remains open. Reopen feels like navigation, but diagnostics evidence can make reopen appear safe even when authority resumption is unresolved.
- `C-012` remains open. Retrieval evidence helps orientation, but invalidity or stale retrieval evidence can imply persistence, identity, and authority.
- `C-015` remains open. Failure evidence is needed, but recovery diagnostics can imply rollback, retry, repair, or recovery authority.
- `C-016` remains open. Diagnostics surfaced through command/search would turn discovery into implied recovery routing.
- `C-017` remains open. Recovery diagnostics vocabulary must stabilize without becoming product copy or canon.

No new contradiction IDs are required in this pass. The new findings fit existing `C-002`, `C-004`, `C-007`, `C-008`, `C-012`, `C-015`, `C-016`, and `C-017`.

## Unresolved Ambiguities

- Whether `View diagnostics` can ever be safe as product-support language, or whether it requires audience-specific variants.
- Whether diagnostics-folder access should be allowed from recovery exception surfaces, product-support surfaces, developer/test surfaces, or only explicit investigation contexts.
- Whether recovery diagnostics should have an exit condition after the exception state clears.
- Whether recovery evidence needs a separate vocabulary family from diagnostics evidence.
- Whether stale recovery diagnostics should remain visible after current authority changes.
- Whether retry truth should remain purely support truth or later split into support retry, recovery retry, and developer/test retry.
- Whether rehydration belongs under recovery diagnostics, source-of-truth vocabulary, runtime state governance, or a separate authority family.

## Questions For Orchestrator

- Should `View diagnostics` remain an allowed generic label, or should future passes require audience-specific labels?
- Should diagnostics-folder access be treated as developer/test-only unless an explicit product-support exception is approved?
- Should recovery diagnostics have a mandatory exception-state entry and exit model before any UI or command route is reconsidered?
- Should recovery evidence split from diagnostics evidence before diagnostics evidence grouping resumes?
- Should Pass 42 focus on user-facing condition language, with recovery diagnostics vocabulary treated as the primary input?
