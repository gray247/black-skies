# Stage 13 Combined Salvage Disposition Matrix

## 1. Purpose and authority
This matrix assigns provisional Stage 13 salvage dispositions to the major artifact families inventoried in Passes 2 through 9.

It is planning only. It does not authorize implementation, replacement, movement, archival, deletion, cleanup, schema work, provider/model execution, queue operation, budget change, or release work.

Current authority is not a salvage candidate. Current authority controls this matrix. Runtime behavior remains evidence, not product authority.

Controlling sources for this matrix:
- `docs/product_systems/stage13_salvage_completion_plan_program.md`
- `docs/product_systems/stage13_current_authority_salvage_source_inventory.md`
- `docs/product_systems/stage13_historical_salvage_source_inventory.md`
- `docs/product_systems/stage13_runtime_structural_artifact_inventory.md`
- `docs/product_systems/stage13_test_fixture_harness_evidence_inventory.md`
- `docs/product_systems/stage13_data_persistence_migration_recovery_inventory.md`
- `docs/product_systems/stage13_desktop_packaging_installation_inventory.md`
- `docs/product_systems/stage13_surface_ui_artifact_inventory.md`
- `docs/product_systems/stage13_operational_ai_infrastructure_inventory.md`
- `docs/product_systems/stage12_architecture_readiness_contract.md`

## 2. Repository and Pass 9 checkpoint
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Pass 9 checkpoint: `3560d2c docs(product): inventory operational AI and infrastructure artifacts`

## 3. Decision method
Decision rules used here:
- preserve only when the capability remains aligned and the existing artifact family is not in direct architectural conflict
- use `Preserve with constraints` when the capability remains useful but only after explicit rebinding, revalidation, isolation, or guardrails
- use `Replace` when the capability remains needed but the current structure materially conflicts with current doctrine or Stage 12 floors
- use `Retire` when an active role should stop guiding runtime or planning behavior, without authorizing deletion
- use `Verify` when evidence is insufficient for a safe preserve/replace/retire call
- use `Archive later` only for historically valuable material that should remain available through Stage 14 planning and move to Stage 16 archival execution later

Current control records are listed separately and excluded from salvage totals because current authority is not a salvage candidate.

## 4. Disposition definitions and limitations
- `Preserve`: aligned and useful, but not automatically shippable unchanged
- `Preserve with constraints`: useful only after named rebinding, revalidation, adaptation, isolation, or guardrails
- `Replace`: capability remains needed, but current structure conflicts materially with current architecture
- `Retire`: capability or artifact should not remain active; no deletion is authorized
- `Verify`: evidence is insufficient for a safe preserve/replace/retire decision
- `Archive later`: historically valuable material should be separated during Stage 16; no archival now

## 5. Control-record coverage
These records are covered for completeness and explicitly excluded from salvage disposition totals.

| Identifier | Path or artifact group | Related product system | Authority class | Coverage note | Execution stage |
| --- | --- | --- | --- | --- | --- |
| CTRL-01 | Tier 1 current controlling authority records | Product-system governance | Current authority | Not a salvage candidate; remains controlling authority for all later packages | Not applicable |
| CTRL-02 | Tier 2 Stage 12 family contracts | Architecture readiness | Current bounded authority | Not a salvage candidate; constrains every salvage package | Not applicable |
| CTRL-03 | Tier 3 prior closed-stage authority still marked current | Closed-stage governance | Current supporting authority | Not a salvage candidate unless later authority demotes it | Not applicable |

## 6. Matrix by major artifact family

### 6.1 Historical governance and salvage evidence
| Identifier | Path or artifact group | Related product system | Authority class | Stage 12 family constraints | Observed alignment | Major risk | Provisional disposition | Rationale | Required constraint or verification | Dependency | Intended execution or resolving stage | Reopening requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HIST-01 | `docs/audits/phase32/**`, `docs/audits/phase29/**`, related historical carry-forward records | Historical governance and salvage planning | Historical evidence | Family 10 evidence retention; consolidated doctrine sections 2, 9, 12 | Valuable historical witness set; not current authority | Old carry-forward labels, old sequencing, and scene-first gravity can re-enter by inertia | Archive later | Historically valuable and still needed as witness material, but should not stay in the active current-authority lane | Retain as evidence only; no current planning role beyond named witness use; Stage 16 owns archival execution | Last-witness protection and Stage 14 package closure | Stage 16 archive/cleanup execution | Reopen Stage 12 only if a needed current claim depends on missing or contradictory witness evidence |
| HIST-02 | Historical Phase 32 sequencing, `keep/carry forward/discard` labels, and prior salvage branch sequencing logic | Historical planning posture | Historical evidence | Consolidated doctrine sections 2, 5, 9, 12 | Useful as historical rationale only | Can masquerade as current Stage 13 sequencing or current disposition language | Retire | The active planning role of those labels should end; Stage 13 now owns the disposition vocabulary and sequencing gates | Keep records as evidence while retiring their active planning role | Current Stage 13 program and matrix adoption | Stage 14 planning intake only as historical context | Reopen only if current authority still depends on a conflicting historical label |

### 6.2 Runtime roots and structural coordinators
| Identifier | Path or artifact group | Related product system | Authority class | Stage 12 family constraints | Observed alignment | Major risk | Provisional disposition | Rationale | Required constraint or verification | Dependency | Intended execution or resolving stage | Reopening requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RT-01 | Runtime roots and entry points: `app/main/main.ts`, `app/main/projectLoaderIpc.ts`, `app/renderer/index.tsx`, `services/src/blackskies/services/app.py`, root launch scripts | Desktop shell, service shell, project loading | Runtime evidence | Families 1-3, 10; consolidated sections 5, 8, 12 | Capability remains needed; current roots are identifiable | Entry paths still mix dev, packaged, truth-lane, and sample-path assumptions | Preserve with constraints | The runtime root capability remains necessary, but every entry path must be rebound to current identity, instance, and evidence rules | Rebind to Stage 12 identity, deployment, and evidence floors; do not treat dev/truth harness routes as packaged proof | Desktop/package boundary and data/identity package | Stage 14 package A | Reopen if a root cannot satisfy project identity, install boundary, or evidence-retention floors |
| RT-02 | Large renderer and shell coordinators: `app/renderer/App.tsx`, `ProjectHome.tsx`, `WorkspaceHeader.tsx`, `DockWorkspace.tsx`, split-command shell coordinators | Writing Surface, Command Center, shared workspace | Runtime evidence | Families 1-4, 10; consolidated sections 2, 11, 12 | Capability families remain needed | Current structure materially concentrates writing, operations, diagnostics, companion, recovery, and action gating | Replace | The capability remains required, but the current coordinator shape conflicts with Writing Surface sovereignty and clear workflow ownership | Preserve behavior only through bounded extraction or rebinding; no wholesale carry-forward of the coordinator shape | Surface/UI package and runtime root package | Stage 14 package B | Reopen if decomposition exposes a Stage 12 approval or identity floor that the current shell cannot satisfy |
| RT-03 | Static salvage shell scaffold: `app/renderer/salvage/**` | Two-surface salvage scaffold | Runtime/supporting evidence | Consolidated sections 2 and 11 | Useful as doctrine-aligned reference scaffold | Static scaffold can be mistaken for implementation-ready runtime | Preserve with constraints | It preserves the intended two-surface shell boundary, but only as reference or bounded extraction material | Reference-only until rebound to verified runtime roots and identity rules | Surface/UI package | Stage 14 package B | No reopening unless the scaffold itself contradicts current authority |

### 6.3 Tests, fixtures, harnesses, stubs, and evidence
| Identifier | Path or artifact group | Related product system | Authority class | Stage 12 family constraints | Observed alignment | Major risk | Provisional disposition | Rationale | Required constraint or verification | Dependency | Intended execution or resolving stage | Reopening requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-01 | Current test, fixture, harness, and smoke lanes: `app/tests/**`, `services/tests/**`, root `tests/**`, `scripts/*truth*`, `scripts/*smoke*`, `scripts/*e2e*` | Evidence and verification | Runtime evidence and retained witness material | Families 10-12; consolidated sections 9, 12, 15 | Strong verification value when lane-bound | Easy overclaim from harness success to packaged/runtime/live-provider proof | Preserve with constraints | The evidence lanes are needed, but only with explicit claim-strength labeling and no broad proof inflation | Keep lane labels explicit; bind future proof gates to exact runner, scope, commit, and artifact identity | Stage 14 evidence package | Stage 14 package C | Reopen if a required release or identity claim depends on a lane that cannot prove it |
| TEST-02 | Stubs, fake services, monkeypatched providers, fixture aliases, and synthetic harness helpers | Testing harness, provider/model evidence | Runtime evidence | Families 1, 5-12; consolidated sections 8-10, 12 | Useful for bounded test lanes | Fake evidence can be mistaken for live provider, queue, budget, or identity evidence | Preserve with constraints | The capability is useful, but it must remain explicitly non-live and non-authoritative | Confine to test/evidence lanes; do not preserve as runtime operational authority | Stage 14 evidence package and operational package | Stage 14 package C | Reopen if current operational claims depend on stub evidence alone |
| TEST-03 | Retained reports and last witnesses: `build/truth_receipts/**`, `build/runtime_truth.json`, `ci_artifacts/**`, historical review/audit evidence, visual baselines | Evidence retention | Retained witness evidence | Family 10; consolidated sections 9, 12, 15 | Material claim support remains useful | Cleanup or replacement could destroy sole witnesses | Preserve with constraints | Required witness material must stay available until superseded by better bounded proof or Stage 16 archival execution | No cleanup, overwrite, or archive before last-witness review and Stage 16 | Stage 14 evidence package and Stage 16 | Stage 16 for archive/cleanup execution | Reopen if a material claim loses its only witness |

### 6.4 Data, schema, persistence, snapshots, backups, restore, and recovery
| Identifier | Path or artifact group | Related product system | Authority class | Stage 12 family constraints | Observed alignment | Major risk | Provisional disposition | Rationale | Required constraint or verification | Dependency | Intended execution or resolving stage | Reopening requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DATA-01 | Core project persistence roots: `project.json`, `outline.json`, `drafts/*.md`, project root layout, service persistence writers | Project persistence and local save | Runtime evidence | Families 1-3, 10; consolidated sections 2, 5, 12 | Core capability remains needed | Path/name/scene structure can be mistaken for identity or foundational truth | Preserve with constraints | Core persistence is necessary, but only after explicit identity rebinding and projection-only treatment of scenes/chapters | Rebind to Stage 12 identity chain; keep Narrative Assertion / Narrative Insertion foundational; do not preserve scene-first ownership | Stage 14 identity and persistence package | Stage 14 package A | Reopen if identity binding or projection-only rules cannot be preserved |
| DATA-02 | Snapshot, backup, restore, and recovery family: `history/snapshots/**`, `backups/**`, `history/recovery/state.json`, recovery/restore routers and services | Recovery, backup, last-witness handling | Runtime evidence | Families 1-3, 8, 10; consolidated sections 5-10, 12 | Capability remains needed | Restore semantics, copy semantics, and recovery state can be overread as identity continuity or complete truth recovery | Preserve with constraints | Recovery capability is necessary, but only if restore/copy/materialized-sibling boundaries remain explicit and evidence-bound | Preserve distinctions among snapshot, backup, restore, export, migration, recovery, and verification; no silent identity inheritance | Stage 14 identity and persistence package | Stage 14 package A | Reopen if restore/copy boundaries violate Stage 12 identity or evidence rules |
| DATA-03 | Legacy snapshot compatibility roots and mixed compatibility manifests: `.snapshots/**`, compatibility `manifest.json` readers/writers | Snapshot compatibility surface | Mixed current/legacy evidence | Families 1, 10; consolidated sections 5, 9, 12 | Some compatibility value may remain | Insufficient evidence whether this surface is still operationally required or only compatibility debt | Verify | The current inventories do not safely prove preserve, replace, or retire | Confirm active callers, compatibility necessity, and last-witness role before disposition | Identity/persistence package and evidence package | Stage 14 package A or C after verification | Reopen only if an active identity or recovery floor depends on unresolved compatibility behavior |
| DATA-04 | Sample-project alias dependence outside explicit fixture lanes: `sample_project/**` alias roots and sample resolution helpers | Fixtures versus live identity | Mixed runtime and fixture evidence | Families 1-3, 10; consolidated sections 5, 9, 12 | Fixture use is acceptable; live identity dependence is not | Sample alias or folder name can silently stand in for project identity | Retire | Active runtime dependence on sample aliases as identity or current-project evidence should end | Preserve fixture lanes only; retire live or compatibility authority dependence | Identity/persistence package and evidence package | Stage 14 package A | Reopen if fixture isolation cannot be achieved without breaking a Stage 12 identity floor |

### 6.5 Desktop, packaging, installed, and portable boundaries
| Identifier | Path or artifact group | Related product system | Authority class | Stage 12 family constraints | Observed alignment | Major risk | Provisional disposition | Rationale | Required constraint or verification | Dependency | Intended execution or resolving stage | Reopening requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DESK-01 | Current desktop and packaging boundary: `app/package.json`, `app/electron-builder.yml`, `scripts/dev-runner.mjs`, `scripts/electron-dev.mjs`, `scripts/launch_truth_electron.py` | Desktop shell and packaging | Runtime evidence | Families 2, 3, 10, 11; consolidated sections 5, 9, 12 | Core desktop/package capability remains needed | Dev launch, packaged launch, truth-lane launch, and portable/install boundaries are easy to blur | Preserve with constraints | The desktop capability remains needed, but only if dev, packaged, installer, and portable claims remain separated and evidence-bound | Separate dev proof from packaged proof; no inheritance of install identity, approvals, caches, or project truth | Stage 14 desktop/package package | Stage 14 package D | Reopen if install or portable behavior cannot honor deployment/identity floors |
| DESK-02 | Legacy or duplicate Electron paths: `app/electron/**` and other secondary entry-like runtime surfaces | Desktop runtime lineage | Mixed current/legacy runtime evidence | Families 2, 3, 10; consolidated sections 5, 9, 12 | Duplicate-path risk is confirmed; active status is not fully resolved | Cannot safely retire or preserve as active runtime authority without proof | Verify | Evidence is insufficient to decide whether the family is dead compatibility, active fallback, or mixed runtime debt | Verify live reachability, witness value, and collision risk first | Desktop/package package and runtime root package | Stage 14 package D after verification | Reopen if both active paths are required and cannot be reconciled with deployment floors |

### 6.6 Surface and UI families
| Identifier | Path or artifact group | Related product system | Authority class | Stage 12 family constraints | Observed alignment | Major risk | Provisional disposition | Rationale | Required constraint or verification | Dependency | Intended execution or resolving stage | Reopening requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UI-01 | Writing Surface, project-entry, scene-navigation, and core drafting surface capabilities | Writing Surface | Runtime evidence | Families 1-4, 10; consolidated sections 2, 11, 12 | The drafting capability remains central and must survive salvage | Current surfaces are entangled with diagnostics, recovery, action density, and scene-first navigation | Preserve with constraints | The core writing capability must remain, but only with sovereignty restored and non-writing operations kept non-gating | Preserve writing-first behavior; keep scenes and chapters projection-only; do not preserve operational clutter as writing authority | Surface/UI package | Stage 14 package B | Reopen if core drafting cannot remain usable without AI, Companion, provider, or queue |
| UI-02 | Command Center, dock workspace, split-command shell, and cross-surface operational shells | Command Center and workspace host | Runtime evidence | Families 1-4, 8-10; consolidated sections 2, 11, 12 | Command Center support capability remains needed | Current shells materially mix support operations with writing and duplicate state across surfaces | Replace | The support capability remains needed, but the current shell structure conflicts with the non-gating, non-sovereign Command Center doctrine | Replace shell structure, not the bounded support capability; preserve only explicit support boundaries | Surface/UI package and runtime root package | Stage 14 package B | Reopen if a later shell plan would make Command Center a truth owner or writing gate |
| UI-03 | Companion overlay and Companion-adjacent action surfaces | Companion | Runtime evidence | Families 4-12; consolidated sections 2, 8-12 | Advisory capability remains useful | Current overlay mixes analytics, rubric editing, critique, and action triggers in one surface | Replace | Companion remains useful, but the current overlay shape is too operationally dense for the doctrine | Keep Companion optional, advisory, non-owning, and non-authoritative; no silent acceptance paths | Surface/UI package and operational package | Stage 14 package B | Reopen if Companion cannot be kept optional and non-owning |

### 6.7 Provider, model, queue, telemetry, cache, cost, and hardware families
| Identifier | Path or artifact group | Related product system | Authority class | Stage 12 family constraints | Observed alignment | Major risk | Provisional disposition | Rationale | Required constraint or verification | Dependency | Intended execution or resolving stage | Reopening requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OPS-01 | Provider and transmission paths: service adapters, route calls, bridge service calls, truth-lane provider paths | Provider policy and transmission | Runtime evidence | Families 4-6, 10, 12; consolidated sections 5, 8-10, 12 | Capability remains needed for bounded AI-assisted workflows | Provider fallback, transmission, and provider-reported state can be overread as acceptance or verification | Preserve with constraints | Provider/transmission capability remains needed, but only after explicit route, approval, and evidence rebinding | No silent provider substitution, no hidden context widening, no provider acknowledgment inflation | Operational package | Stage 14 package E | Reopen if provider/transmission behavior cannot honor approval or provider-policy floors |
| OPS-02 | Model routing and qualification runtime: router, routing policy, adapters, model metadata, qualification-facing docs and runtime hooks | Model routing and qualification | Runtime evidence | Families 4-6, 9, 11, 12; consolidated sections 5, 8-10, 12 | Capability remains needed | Availability can be mistaken for qualification; aliases can be mistaken for stable identity | Preserve with constraints | The capability remains needed, but only with task-specific qualification, alias revalidation, and explicit fallback posture | No qualification inheritance from availability, price, or prior success | Operational package | Stage 14 package E | Reopen if model identity or qualification cannot be made current and explicit |
| OPS-03 | Queue, attempt, retry, cancellation, and restart state: resilience executors, recovery tracker interaction, queue-facing doctrine/runtime hooks | Queue and workflow control | Mixed runtime/doctrine evidence | Families 4-10, 11, 12; consolidated sections 5, 8-10, 12 | Capability likely remains needed | Evidence is insufficient to prove preserve versus replace for a full queue/runtime state family | Verify | Current evidence establishes risk and bounded semantics, but not a safe structural carry-forward decision | Verify active queue surfaces, attempt identity handling, cancellation propagation, and retry invalidation before execution packaging | Operational package | Stage 14 package E after verification | Reopen if queue identity, cancellation, or retry semantics break Stage 12 floors |
| OPS-04 | Telemetry, diagnostics, logs, and caches | Telemetry and cache governance | Runtime evidence | Families 6-10; consolidated sections 8-10, 12 | Support capability remains needed | Caches or diagnostics can become shadow truth or leak content; witness retention is easy to damage | Preserve with constraints | The support capability remains useful, but only under strict non-owning and content-minimizing boundaries | Keep caches/telemetry non-truth-owning; preserve witness material; no manuscript-content telemetry by default | Operational package and evidence package | Stage 14 package E and C | Reopen if the family depends on shadow truth, stale approval, or unsupported deletion claims |
| OPS-05 | Cost, usage, reservation, and budget systems | Budget and cost accounting | Runtime evidence | Families 4, 6, 8-10, 12; consolidated sections 5, 8-10, 12 | Capability remains needed | Unknown cost can be shown as zero, or budget state can be mistaken for transmission authority | Preserve with constraints | Budget/cost capability remains needed, but only with explicit distinction among estimate, reservation, attempted spend, and reconciled spend | No optimistic zero-cost assumption; no transmission authority from budget availability alone | Operational package | Stage 14 package E | Reopen if budget state cannot be reconciled with identity, cancellation, or provider-policy floors |
| OPS-06 | Hardware detection, qualification, and pressure handling | Hardware and local-model safety | Doctrine-heavy evidence set | Families 3, 10-12; consolidated sections 5, 8-10, 12 | Hardware safety capability remains needed | Evidence is too thin to preserve or replace the runtime family safely | Verify | The inventories confirmed doctrine and risk, but not a sufficiently direct runtime ownership surface | Verify current detection/qualification/refusal paths and no-silent-remote-escalation behavior | Operational package | Stage 14 package E after verification | Reopen if current local/remote fallback behavior violates hardware or model floors |

### 6.8 Generated, environmental, and cleanup-adjacent artifacts
| Identifier | Path or artifact group | Related product system | Authority class | Stage 12 family constraints | Observed alignment | Major risk | Provisional disposition | Rationale | Required constraint or verification | Dependency | Intended execution or resolving stage | Reopening requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ENV-01 | Generated build outputs, cache roots, temp traces, test reports, and environmental directories without established witness role | Generated/environmental artifacts | Mixed runtime evidence | Family 10; consolidated sections 9, 12, 15 | Some may be disposable, some may still be witnesses | Evidence is insufficient to distinguish safe archive-later candidates from current witnesses or active compatibility surfaces | Verify | Cleanup and archive planning cannot safely proceed until witness value and active reachability are known | Verify witness role, compatibility role, and active runtime dependence before any cleanup planning | Evidence package and Stage 16 preparation | Stage 16 after verification | Reopen if later cleanup pressure would destroy a material witness or active compatibility surface |

## 7. Cross-cutting constraints
- `Preserve` never means ship unchanged.
- `Retire` never means delete now.
- `Archive later` is deferred to Stage 16.
- No runtime artifact inherits approval, project identity, model qualification, queue authority, or budget authority from nearby metadata.
- Scenes and chapters remain projections, containers, views, or compatibility surfaces.
- Writing Surface and Command Center remain distinct.
- Companion remains optional, advisory, non-owning, and non-authoritative.
- Tests, fixtures, harnesses, and reports prove only their exercised lane.
- Missing or ambiguous authority fails closed.
- Implementation technologies remain unselected.

## 8. Verify backlog
| Identifier | Item | Why verify is required | Resolving stage |
| --- | --- | --- | --- |
| VERIFY-01 | `.snapshots/**` and related compatibility manifests | Active operational role versus compatibility-only role remains unresolved | Stage 14 package A |
| VERIFY-02 | `app/electron/**` and other duplicate Electron entry-like paths | Active reachability and witness role remain unresolved | Stage 14 package D |
| VERIFY-03 | Queue/attempt/retry/cancellation runtime family | Current evidence is not strong enough for preserve/replace/retire | Stage 14 package E |
| VERIFY-04 | Hardware qualification/runtime safety family | Doctrine is stronger than direct runtime evidence | Stage 14 package E |
| VERIFY-05 | Generated/environmental artifacts without established witness role | Cleanup planning would be unsafe without witness classification | Stage 16 preparation |

## 9. Replace backlog
| Identifier | Item | Why replacement is provisional |
| --- | --- | --- |
| REPL-01 | Large renderer and shell coordinators | Capability remains needed, but the coordinator shape conflicts with clear surface and workflow ownership |
| REPL-02 | Command Center/dock/split-command operational shells | Current shell structure materially mixes support operations with writing authority |
| REPL-03 | Companion overlay shape | Advisory capability remains useful, but the current overlay bundles too much operational and analytical weight |

## 10. Retire and Archive-later register
| Identifier | Item | Disposition | Limitation |
| --- | --- | --- | --- |
| RA-01 | Historical Phase 32 and Phase 29 record set as an active planning lane | Archive later | Retain through Stage 14 and move only in Stage 16 |
| RA-02 | Historical carry-forward labels and prior salvage sequencing as active planning drivers | Retire | Keep records as evidence; retire only the active planning role |
| RA-03 | Sample-project alias dependence outside fixture lanes | Retire | Preserve fixture-only use; do not delete fixture roots here |

## 11. Stage 14 candidate execution packages

### PKG-A: Runtime Identity and Persistence Rebinding
- Bounded objective: rebind project-loading, persistence, snapshot, backup, restore, recovery, and sample-alias behavior to Stage 12 identity and evidence floors
- Included disposition items: `RT-01`, `DATA-01`, `DATA-02`, `DATA-03`, `DATA-04`
- Dependencies: current authority, Stage 12 families 1-3 and 10, retained witness preservation
- Required evidence: active callers, identity-chain validation, restore/copy semantics, witness-role confirmation for legacy compatibility roots
- Stop conditions: any silent identity inheritance, restored-copy authority inheritance, or witness loss risk
- Excluded work: packaging, provider/model execution, queue implementation, release work

### PKG-B: Surface Sovereignty and Coordinator Reduction
- Bounded objective: restore a bounded two-surface shell with Writing Surface sovereignty, non-gating Command Center behavior, and optional Companion behavior
- Included disposition items: `RT-02`, `RT-03`, `UI-01`, `UI-02`, `UI-03`
- Dependencies: runtime root package, current surface doctrine, identity-safe project entry
- Required evidence: workflow ownership map, explicit mutation paths, current non-authority status of Companion and support panes
- Stop conditions: any design that makes Command Center a truth owner, makes Companion required, or turns writing into an operations console
- Excluded work: provider/model integration, packaging work, release readiness work

### PKG-C: Evidence Lane and Witness Protection Package
- Bounded objective: preserve bounded test/evidence value while preventing overclaim and witness loss
- Included disposition items: `TEST-01`, `TEST-02`, `TEST-03`, `ENV-01`
- Dependencies: current evidence contracts, retained witness mapping, proof-lane naming discipline
- Required evidence: lane-by-lane claim-strength map, witness-role map, generated-artifact classification
- Stop conditions: any cleanup or archive proposal that would destroy sole witnesses, or any attempt to treat harness success as release proof
- Excluded work: broad reruns as release proof, cleanup execution, archival execution

### PKG-D: Desktop and Packaging Boundary Rebinding
- Bounded objective: separate dev launch, packaged launch, installed-instance, and portable-instance claims, and resolve duplicate Electron path reachability
- Included disposition items: `DESK-01`, `DESK-02`
- Dependencies: runtime root package, identity/persistence package, witness package
- Required evidence: active path map, packaged-versus-dev claim map, install/portable state boundary map
- Stop conditions: any design that collapses project identity into install identity or treats build success as release proof
- Excluded work: package builds as final proof, installer execution as release approval, uninstall/cleanup work

### PKG-E: Operational Governance Rebinding
- Bounded objective: rebind provider/model/transmission, queue semantics, telemetry/cache, cost/budget, and hardware/local-safety behavior to Stage 12 floors
- Included disposition items: `OPS-01`, `OPS-02`, `OPS-03`, `OPS-04`, `OPS-05`, `OPS-06`
- Dependencies: runtime root package, evidence package, desktop/package boundary package
- Required evidence: explicit fallback map, approval/budget/queue invalidation map, cache and telemetry classification, hardware/runtime safety map
- Stop conditions: any silent provider substitution, silent API escalation, queue authority inheritance, unknown cost as zero, or local refusal becoming remote authorization
- Excluded work: provider/model execution, benchmark runs, cost changes, telemetry cleanup, release claims

## 12. Dependencies and blockers
- The runtime-root, desktop-boundary, and identity/persistence packages are mutually dependent and must sequence carefully.
- Evidence and witness mapping must precede any cleanup or archive planning.
- Surface reduction depends on preserving explicit identity and mutation paths first.
- Operational governance rebinding depends on evidence classification, because many current claims are only lane-bound.
- Hardware and queue subfamilies remain the main evidence-thin blockers inside the operational package.

## 13. Stage 12 reopening triggers
- any silent project-identity inheritance across copy, restore, migration, install, or fixture alias paths
- any active path that makes scenes or chapters foundational truth owners
- any approval, queue, cache, budget, provider, or model authority inherited from stale or adjacent metadata
- any provider fallback or model substitution that cannot remain explicit and revalidated
- any cost state that cannot distinguish estimate, attempted spend, and reconciled spend
- any hardware/local-refusal path that silently authorizes remote escalation
- any planned cleanup or archive move that would destroy last necessary witness evidence

## 14. Deferred author-policy decisions
- provider breadth and provider-risk tolerance
- model breadth and qualification depth
- retry breadth and cancellation presentation
- budget thresholds and spend-warning depth
- telemetry retention breadth and cache retention depth
- hardware support floor values and degradation posture
- archive visibility and long-term history retention depth

No disposition in this matrix resolves those policy choices by assumption.

## 15. Evidence limitations
- This matrix is constrained by the inventories it summarizes.
- It does not prove runtime correctness, release readiness, packaged safety, live provider behavior, hardware qualification, or queue correctness.
- It does not authorize technology selection or implementation sequence beyond bounded candidate packages.
- `Verify` items remain open because evidence is currently insufficient, not because the capability is unimportant.

## 16. Recommended next bounded pass
Recommended next pass: dependency sequencing and Stage 14 execution-gate plan.

That pass should:
- order the candidate Stage 14 packages
- name prerequisite evidence and stop conditions package by package
- keep cleanup, archival, deletion, provider/model execution, and release work blocked
