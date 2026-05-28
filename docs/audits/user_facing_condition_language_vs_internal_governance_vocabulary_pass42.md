# User-Facing Condition Language vs Internal Governance Vocabulary - Pass 42

## Executive Findings

- Vocabulary is now an authority surface. Repetition of internal governance terms can promote provisional reconstruction language into product canon even when no implementation changes occur.
- The primary boundary is not polished wording. The primary boundary is whether a term carries authority, permission, persistence, continuity, recovery success, structural identity, execution capability, or canonical architecture into a visible surface.
- Candidate user-facing condition language must translate internal reasoning into bounded condition explanation without importing governance vocabulary, developer/test terms, diagnostics evidence, recovery evidence, or source-of-truth claims.
- Terms that sound neutral are among the most dangerous. `current`, `active`, `online`, `offline`, `retrievable`, `grouped`, `restore`, `reopen`, `recover`, and `diagnostics` can appear descriptive while implying readiness, authority, persistence, recovery permission, or workflow legitimacy.
- Recovery diagnostics vocabulary from Pass 41 must remain separated from product-support condition language. `View diagnostics` and diagnostics-folder exposure remain governance-sensitive terminology, not approved user-facing labels.
- This pass does not generate final UI labels, product copy, terminology branding, workflow-state canon, implementation vocabulary, command/search language, structural retrieval language, topology language, or Story Unit vocabulary.

## Vocabulary Lane Classifications

### Internal Governance Terms

Purpose: precise reconstruction reasoning.

Examples: `authority`, `canonical`, `source of truth`, `workflow-state canon`, `authority resumption`, `mutation-boundary`, `legitimacy drift`, `blocked promotion`, `prohibited inheritance`.

Boundary: internal-only unless a later artifact authorizes translation. These terms are useful for governance but dangerous in product surfaces because they can imply the system has settled questions that remain provisional.

### Developer/Test Terms

Purpose: describe harness, runtime, fixtures, bridge behavior, invalid paths, test/offline branches, and internal state.

Examples: `developer/test`, `test-offline`, `frozen`, `service_port_unavailable`, bridge reason keys, fixture state, harness state, offline scaffolding.

Boundary: developer/test-only unless translated into bounded support condition language. These terms must not become operator workflow truth.

### Diagnostics Investigation Terms

Purpose: gather, inspect, or expose evidence.

Examples: `diagnostics`, `View diagnostics`, diagnostics folder, logs, traces, evidence, investigate, inspect.

Boundary: diagnostics-only or investigation-only. Diagnostics terms do not authorize recovery, restore, reopen, rollback, retry, rehydrate, mutation, retrieval execution, or source-of-truth authority.

### Recovery-Exception Terms

Purpose: describe exceptional recovery contexts.

Examples: `restore`, `reopen`, `recover`, `resume`, `rehydrate`, `retry`, `rollback`, stale restoration, recovery evidence.

Boundary: active support/recovery exception only. These terms are not ordinary workflow vocabulary and must not imply success, permission, or authority resumption.

### Support-Facing Condition Language

Purpose: bounded explanation that a user-visible condition exists.

Examples as classes, not final copy: condition present, operation unavailable, service unavailable, action could not complete, support material available.

Boundary: may translate internal truth into user-facing explanation only when it avoids raw diagnostics, recovery authority, source-of-truth claims, test labels, topology, structural identity, and canonical language.

### Retrieval Invalidity Language

Purpose: describe missing, stale, invalid, unresolved, orphaned, recomputed, or grouped retrieval evidence.

Boundary: investigation and governance only unless translated. Retrieval invalidity language must not imply object absence, object identity, persistence, recovery permission, or source-of-truth status.

### Continuity Language

Purpose: reason about narrative, structural, recovery, and source-of-truth continuity pressure.

Examples: `continuity`, resumed, carried forward, prior state, current state, stale continuity.

Boundary: governance-only unless translated with care. Continuity does not imply persistence, canonical identity, accepted authority, or source-of-truth survival.

### Structural / Topology Pressure Language

Purpose: describe grouping, structure, relationship, hierarchy, topology, traversal, graph pressure, and Story Unit pressure.

Boundary: pressure-only. These terms must not become product-facing structural canon, object identity, topology architecture, graph identity, Story Unit persistence, or structural command/search language.

### Authority-Transition Language

Purpose: reason about transitions between visible state, current state, accepted state, restore/reopen state, and resumed authority.

Examples: `current`, `active`, `accepted`, `authoritative`, `canonical`, `source of truth`, `resume authority`.

Boundary: internal governance only unless later translated. These terms compress authority families and can falsely imply accepted product state.

## Containment Rules

- `canonical`, `source of truth`, `authoritative`, `authority resumption`, `workflow-state canon`, and `mutation-boundary` remain governance-only.
- Developer/test terms remain internal unless translated into bounded condition language.
- `diagnostics`, `View diagnostics`, diagnostics-folder access, logs, traces, and investigation terms remain diagnostics-only or investigation-only.
- `restore`, `reopen`, `recover`, `retry`, `rollback`, `rehydrate`, and `resume` may appear only in active support/recovery exception contexts and must not imply success or permission.
- `current`, `active`, `accepted`, `online`, and `offline` become dangerous through repetition because they can imply readiness, legitimacy, or source-of-truth status.
- `grouped`, `retrievable`, `structure`, `relationship`, `hierarchy`, and `topology` create accidental canonization pressure when repeatedly surfaced as product language.
- Any vocabulary repeated in visible workflow surfaces risks becoming de facto product canon even if each individual use is truthful.

## Translation-Boundary Findings

- Internal reasoning must translate before user exposure when it contains governance terms, internal reason keys, developer/test labels, retrieval invalidity, structural pressure, topology pressure, source-of-truth pressure, or recovery evidence.
- Governance precision becomes dangerous in user-visible contexts when it exposes unresolved authority models as if they were settled product concepts.
- Support truth differs from governance truth: support truth explains a condition; governance truth explains why a condition has authority implications.
- Diagnostics explanation differs from authority explanation: diagnostics can expose evidence; authority explanation determines whether an action, state, or route is permitted.
- Continuity language becomes persistence implication when visible language suggests prior state survived as durable identity.
- Recovery language becomes success implication when it appears without explicit separation between evidence, permission, execution, and authority resumption.
- Retrieval invalidity language becomes identity implication when missing, stale, invalid, unresolved, orphaned, or grouped evidence is described as object truth.

## Exposure-Category Map

- `Safe internal-only vocabulary`: authority, source of truth, canonical, mutation-boundary, legitimacy drift, blocked promotion, prohibited inheritance, topology pressure, Story Unit pressure.
- `Leakage-sensitive vocabulary`: current, active, accepted, authoritative, restore, reopen, recover, resume, rehydrate, diagnostics, View diagnostics, grouped, retrievable, stale, invalid, orphaned, continuity, structure, relationship, hierarchy, topology, retry, online, offline.
- `Support-safe vocabulary`: bounded condition language that explains availability, interruption, or inability to complete an operation without diagnostics internals or authority claims.
- `Diagnostics-only vocabulary`: diagnostics, logs, traces, evidence, investigate, inspect, bridge details, diagnostic folder, reason keys.
- `Recovery-exception vocabulary`: restore, reopen, recover, retry, rollback, rehydrate, resumed state, stale recovery, recovery evidence.
- `Structural-pressure vocabulary`: grouped, structure, relationship, hierarchy, outline, scene-like, topology, traversal, graph.
- `Topology-pressure vocabulary`: topology, relationship, traversal, graph identity, hierarchy containment.
- `Forbidden ambient vocabulary`: canonical, authoritative, source of truth, recovery approved, restored current authority, reopened source of truth, persistent structure, retrievable object, grouped object set, topology graph, Story Unit identity.

## Leakage-Risk Classes

- `Persistence implication`: persisted, continuity, retrievable, structure, relationship, hierarchy, grouped, orphaned.
- `Authority implication`: current, active, accepted, authoritative, canonical, source of truth, resumed.
- `Permission implication`: recover, restore, reopen, retry, rollback, rehydrate, execute, apply, fix.
- `Source-of-truth implication`: current, canonical, authoritative, restored, reopened, accepted, source of truth.
- `Structural identity implication`: grouped, structure, relationship, hierarchy, topology, retrievable, orphaned.
- `Workflow legitimacy implication`: visible, online, active, available, diagnostics, View diagnostics, retrievable.
- `Recovery success implication`: restored, recovered, reopened, resumed, rehydrated, rollback.
- `Execution capability implication`: command, route, execute, recover, restore, reopen, retry, apply.
- `Command authority implication`: searchable, discoverable, retrievable, actionable, available, queued, requested.
- `Canonical architecture implication`: topology, graph, hierarchy, Story Unit, structure, source of truth.

## Prohibited Semantic Inheritance List

- retrieval -> persistence
- visibility -> authority
- continuity -> canonical identity
- diagnostics -> recovery permission
- recovery -> source-of-truth authority
- grouped -> object identity
- current -> canonical
- active -> accepted
- accepted -> authoritative
- retrievable -> persistent
- visible -> workflow legitimate
- online -> ready
- offline -> failed source-of-truth
- reopen -> authority resumption
- restore -> rollback
- recover -> success
- rehydrate -> authority resumption
- retry -> recovery permission
- advisory -> mutation authority
- structure -> Story Unit persistence
- relationship -> topology architecture
- hierarchy -> graph identity
- diagnostics evidence -> recovery evidence
- recovery evidence -> recovery execution

## Term Pressure Findings

- `current`: high risk because it can mean visible, loaded, active, most recent, accepted, or authoritative.
- `active`: high risk because it can imply workflow legitimacy or current authority.
- `accepted`: high risk because it can imply product endorsement or source-of-truth status.
- `authoritative`: governance-only; unsafe as ambient product language.
- `canonical`: governance-only; unsafe unless a later canon artifact explicitly authorizes it.
- `source of truth`: governance-only; too compressed for product support language.
- `restore`: recovery-exception only; must not imply rollback or replacement success.
- `reopen`: recovery/navigation boundary term; must not imply authority resumption.
- `recover`: exceptional; must not imply permission or success.
- `resume`: authority-transition term; must remain provisional.
- `rehydrate`: internal/runtime term; must not become authority language.
- `diagnostics`: investigation term; not support truth by default.
- `View diagnostics`: governance-sensitive and not neutral product copy.
- `grouped`: structural/batch pressure; must not imply object sets.
- `retrievable`: retrieval pressure; must not imply persistence.
- `stale`: condition/investigation term; must not imply current authority.
- `invalid`: investigation term; must not imply deleted identity or recovery permission.
- `orphaned`: internal/investigation term; must not imply persistence.
- `continuity`: governance term; must not imply durable identity.
- `structure`: pressure term; must not imply Story Unit canon.
- `relationship`: pressure term; must not imply topology architecture.
- `hierarchy`: pressure term; must not imply graph identity.
- `topology`: pressure-only; not architecture.
- `retry`: support truth for now; must not imply rollback or recovery execution.
- `online`: support/status term; must not imply operational readiness or workflow permission.
- `offline`: support/status term; must not imply source-of-truth failure or recovery permission.

## Contradiction Updates

- `C-002` remains open. Visibility is needed for support, but visible condition language can normalize diagnostics/recovery concepts.
- `C-007` remains open. Restore language can protect work while also implying replacement, rollback, or source-of-truth authority.
- `C-008` remains open. Reopen language can sound like navigation while implying authority resumption.
- `C-009` remains partially resolved. Continuity language remains useful, but can still imply persistence.
- `C-012` remains open. Retrieval vocabulary can imply persistence, identity, and authority.
- `C-013` remains open. Grouping vocabulary can imply object sets and batch authority.
- `C-014` remains contained but fragile. Recomputed language must stay separated from durable identity.
- `C-015` remains open. Failure and recovery language can imply rollback, retry, repair, or recovery authority.
- `C-017` remains open. Vocabulary stabilization itself can turn provisional terms into canon.

No new contradiction IDs are required. Pass 42 sharpens existing vocabulary contradictions rather than discovering a separate contradiction family.

## Blocked-Promotion Impacts

- Provisional vocabulary as product copy remains blocked.
- Generic `View diagnostics` wording as neutral product copy remains blocked.
- Unqualified `current`, `active`, `accepted`, `authoritative`, `canonical`, `source of truth`, `restored`, `reopened`, `retrievable`, `grouped`, `continuity`, `structure`, `relationship`, `hierarchy`, or `topology` as product authority terms remains blocked.
- Recovery diagnostics as ordinary workflow remains blocked.
- Recovery diagnostics as recovery permission remains blocked.
- Diagnostics-folder exposure as ordinary workflow tooling remains blocked.
- Structural/topology terms as product architecture remain blocked.
- Workflow-state canon, command/search implementation, structural retrieval, Story Unit persistence, topology architecture, recovery execution, and roadmap rewrite remain blocked.

## Dependency Impacts

- `User-Facing Condition Language` is now partially reconstructed as a vocabulary boundary, but not approved product copy.
- `Source-of-Truth Vocabulary` remains provisional because candidate user-facing language still needs later authorization.
- `Recovery Diagnostics Governance` remains partially reconstructed and depends on this vocabulary separation for any future closure.
- `Diagnostics Evidence Grouping` remains deferred until recovery evidence, diagnostics evidence, retrieval invalidity evidence, developer/test evidence, and support condition language are separately governed.
- `Command/Search Structural Inheritance` remains blocked because vocabulary visibility cannot become routing or execution authority.
- `Structural Retrieval Governance` remains blocked from user-facing vocabulary because retrieval terms still imply persistence and identity.
- `Topology-Aware Mutation/Recovery Pressure` remains deferred because topology and relationship terms remain pressure-only.
- Pass 40 should continue treating vocabulary as a control surface, not a final naming system.

## Unresolved Ambiguities

- Whether `View diagnostics` can ever be safe as a product-support phrase.
- Whether `online` and `offline` can remain support-safe without becoming readiness or source-of-truth language.
- Whether `current` should be prohibited entirely from user-facing support contexts or allowed only with explicit scope qualifiers.
- Whether `active` means visible, selected, loaded, operational, accepted, or authoritative in future workflow-state reconstruction.
- Whether recovery-exception terms need a mandatory entry/exit model before appearing in product surfaces.
- Whether structural/topology vocabulary can ever be user-facing without implying Story Unit persistence or graph architecture.
- Whether support-safe condition language should be created only after closure gates, or during a later controlled vocabulary pass.

## Questions For Orchestrator

- Should `current`, `active`, `accepted`, `authoritative`, `canonical`, and `source of truth` be placed under a single authority-transition quarantine?
- Should `View diagnostics` be treated as forbidden ambient vocabulary until audience-specific diagnostics labels are reconstructed?
- Should `online` and `offline` be split into runtime status language versus workflow-readiness language in a dedicated pass?
- Should Pass 43 formalize dependency, contradiction, blocked-promotion, and closure-gate IDs before more narrow vocabulary passes continue?
- Should candidate user-facing condition language remain entirely non-lexical for now, meaning classes only and no proposed labels?

## Unresolved Risks Summary

- Governance terms can become product canon through repetition in docs before any GUI work occurs.
- Support-safe wording can still imply authority if it uses `current`, `active`, `restore`, `reopen`, `recover`, `online`, or `offline` without scope.
- Diagnostics vocabulary remains especially risky because it can look helpful while creating investigation, recovery, and command/search pressure.
- Structural and topology terms remain pressure-only but can still become architecture by visible reuse.
