# Stage 13 Historical Salvage-Source Inventory

Status: Stage 13 creation artifact; ready for read-only review.

## 1. Purpose and scope

This inventory classifies historical salvage-planning and governance records, with emphasis on Phase 32 records.

It identifies:

- what historical records claimed
- what useful evidence remains
- what assumptions are superseded or conflicting under current doctrine
- which obligations still matter to later Stage 13 passes
- which historical terms must not regain authority by inertia

This pass does not inspect runtime implementation contents, modify historical records, execute salvage, select technologies, archive, clean, delete, stage, commit, push, or begin the next pass.

## 2. Repository and Pass 2 checkpoint

Repository gate for this pass:

- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Tracking branch: `origin/salvage/minimal-two-surface-shell`
- Worktree at pass start: clean
- Current HEAD: `eb249f9 docs(product): inventory stage 13 authority and salvage sources`
- Pass 2 checkpoint: `eb249f9`
- Stage 13 program checkpoint: `332d1a6 docs(product): define stage 13 salvage completion plan program`
- Stage 12 closure checkpoint: `62ad8b4 docs(product): close stage 12 architecture readiness contract`

## 3. Historical-source selection method

Selection began from current authority, then moved to the historical source groups named by the Pass 2 inventory.

Selection rules:

- inspect current authority before historical evidence
- inspect historical documentation records, not runtime file contents
- treat Phase 32 and Phase 29 records as evidence unless current authority explicitly promotes a bounded claim
- do not treat Phase 32 pass numbering as current Stage 13 sequencing
- do not treat old `salvage`, `carry forward`, `keep`, `discard`, or `implementation slice` language as present execution authority

## 4. Records inspected

Current controlling sources:

- `docs/product_systems/stage13_salvage_completion_plan_program.md`
- `docs/product_systems/stage13_current_authority_salvage_source_inventory.md`
- `docs/product_systems/current_truth_index.md`
- `docs/product_systems/current_product_roadmap.md`
- `docs/product_systems/pre_code_discovery_plan.md`
- `docs/product_systems/stage12_architecture_readiness_contract.md`
- `docs/product_systems/stage12_architecture_readiness_contract_closure.md`

Historical Phase 32 records:

- `docs/audits/phase32/pass195_read_only_scene_compatibility_planning.md`
- `docs/audits/phase32/pass198_qualitative_evaluation_fixture_foundation_planning.md`
- `docs/audits/phase32/pass203_static_qualitative_evaluator_v0_planning.md`
- `docs/audits/phase32/pass206_foundation_integration_planning.md`
- `docs/audits/phase32/pass208_foundation_integration_boundary_review_and_checkpoint.md`
- `docs/audits/phase32/pass209_narrative_object_persistence_boundary_planning.md`
- `docs/audits/phase32/pass210_narrative_object_persistence_contract_planning.md`
- `docs/audits/phase32/pass211_black_skies_untangle_inventory.md`
- `docs/audits/phase32/pass212_rebuild_vs_salvage_decision_record.md`
- `docs/audits/phase32/pass213_minimal_clean_shell_boundary.md`
- `docs/audits/phase32/pass214_salvage_carry_forward_plan.md`
- `docs/audits/phase32/pass215_salvage_branch_scaffold_readiness.md`
- `docs/audits/phase32/pass217_salvage_static_project_context_planning.md`
- `docs/audits/phase32/pass219_salvage_exclusion_ledger.md`
- `docs/audits/phase32/pass220_modular_salvage_architecture_blueprint.md`
- `docs/audits/phase32/pass221_salvage_carry_forward_extraction_map.md`
- `docs/audits/phase32/pass222_product_system_dossier_plan.md`
- `docs/audits/phase32/continuity_carry_forward_register.md`
- `docs/audits/phase32/continuity_surface_to_dossier_crosswalk.md`

Related historical audit documents inspected by filename and documentation content where relevant:

- `docs/audits/phase29/authority_boundary_matrix.md`
- `docs/audits/phase29/keep_merge_hide_defer_delete_matrix.md`
- `docs/audits/phase29/gui_surface_inventory.md`
- `docs/audits/phase29/tool_button_control_inventory.md`
- `docs/audits/phase29/intelligence_surface_matrix.md`
- other `docs/audits/phase29/*.md` records by filename and heading/status evidence

## 5. Historical authority limits

Phase 32 records remain historical evidence or bounded lane-specific evidence unless a current authority record explicitly promotes a claim.

They may show:

- why a salvage branch exists
- which old artifacts were previously considered useful, dangerous, or reference-only
- what risks earlier planning identified
- what test-only or documentation-only boundaries were intended
- which old concepts must not be reintroduced as current authority

They may not establish:

- current product truth
- current Stage 13 pass order
- implementation readiness
- release readiness
- runtime artifact disposition
- archive, cleanup, deletion, or retirement execution
- technology selection
- Stage 14 authorization

## 6. Record inventory

| Record or group | Historical purpose | Apparent phase or lane | What it tried to preserve or change | Present authority class | Useful evidence | Stale or conflicting assumptions | Current doctrine affected | Later Stage 13 routing | Live obligation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `pass195_read_only_scene_compatibility_planning.md` | Planned read-only bridge from scene-first runtime to narrative-object-compatible views. | Phase 32 scene compatibility | Preserve scene-first validity while deriving read-only narrative-object views. | Historical evidence | Strong no-mutation, no-migration, no-UI, no-Story-Unit-gate boundary. | Names old scene-first runtime as current authority for that historical lane. | Scenes remain projections or compatibility surfaces; Narrative Assertion / Insertion is current foundation. | Runtime/structural inventory and surfaces/UI inventory. | Preserve adapter-boundary caution as evidence. |
| `pass198_qualitative_evaluation_fixture_foundation_planning.md` and `pass203_static_qualitative_evaluator_v0_planning.md` | Planned manually authored fixtures and deterministic static evaluator. | Phase 32 test-only foundation | Preserve explainable signal concepts without grading, AI inference, or runtime mutation. | Historical evidence | Useful categories: contradiction, unresolved gap, provenance, payoff, orphaned assertion, reorder, scene projection, authored/inferred boundary. | Fixture and evaluator language can overclaim if treated as product proof. | Tests prove only their lane; advisory signals do not become authored truth. | Test, fixture, harness, and evidence inventory. | Carry forward no-grading and no-authority constraints. |
| `pass206_foundation_integration_planning.md` and `pass208_foundation_integration_boundary_review_and_checkpoint.md` | Planned and checkpointed a test-only integration chain. | Phase 32 foundation integration | Preserve contract/fixture/evaluator coherence while keeping runtime detached. | Historical evidence | Clearly separates real code/test assets from production integration. | "What is now real" can be misread as runtime authority. | Existing code and tests are evidence, not product authority. | Test/evidence pass before runtime pass uses claims. | Preserve test-only limitation. |
| `pass209_narrative_object_persistence_boundary_planning.md` and `pass210_narrative_object_persistence_contract_planning.md` | Planned future narrative-object persistence boundary and schema direction. | Phase 32 persistence planning | Preserve separate versioned store idea while keeping scene-first projects valid. | Historical evidence | Useful risks: split-brain, identity drift, migration corruption, export/recovery mismatch, Story Unit mandatory risk. | Proposes schema/store shape before Stage 12 family contracts existed. | Stage 12 now controls identity, migration, cache, evidence, queue, cost, deployment, and proof floors. | Data/schema/persistence/migration/recovery inventory. | Treat as schema-planning evidence only; verify against Stage 12 before any use. |
| `pass211_black_skies_untangle_inventory.md` | Classified known-good foundations, runtime tangles, and lift-out risks. | Phase 32 untangle planning | Preserve pure shared contracts and loader lessons; identify monolith and bridge risks. | Historical evidence | Useful anti-tangle evidence for `App.tsx`, `preload.ts`, ProjectHome, recovery, test-mode gravity, sample-project clutter. | Uses old `keep`, `replace`, `discard` vocabulary that is not Stage 13 disposition vocabulary. | Stage 13 dispositions are Preserve, Preserve with constraints, Replace, Retire, Verify, Archive later. | Runtime/structural inventory and test/evidence inventory. | Reclassify later with Stage 13 vocabulary before any disposition. |
| `pass212_rebuild_vs_salvage_decision_record.md` | Recorded historical choice toward smaller salvage rebuild instead of internal layering or scratch rebuild. | Phase 32 salvage decision | Preserve branch-lineage rationale and selective carry-forward posture. | Historical evidence | Useful decision rationale: old shell too tangled, full scratch too costly, known-good contracts worth preserving. | Minimal shell included scene list/editor and "implementation arc" language under old posture. | Current authority keeps Stage 13 planning-only and Stage 14 unauthorized. | Runtime/structural inventory and Stage 14 gates. | Preserve rationale; do not inherit build order. |
| `pass213_minimal_clean_shell_boundary.md`, `pass214_salvage_carry_forward_plan.md`, `pass215_salvage_branch_scaffold_readiness.md`, and `pass217_salvage_static_project_context_planning.md` | Planned isolated two-surface salvage shell and branch scaffold. | Phase 32 clean-shell planning | Preserve Writing Surface / Command Center split and renderer-side isolation. | Historical evidence | Useful constraints: no Companion, no Memory Lab, no project IO, no migration, no runtime qualitative evaluator, no graph UI, no docking clutter. | Branch/scaffold readiness reflects old commit lineage and prior scaffold assumptions. | Writing Surface and Command Center remain distinct; implementation remains blocked. | Surfaces/UI inventory, desktop/packaging inventory, runtime/structural inventory. | Preserve boundary language; verify actual artifacts later. |
| `pass219_salvage_exclusion_ledger.md` | Prevented wholesale carry-forward of monster shell, preload bridge, and scene-first foundation drift. | Phase 32 exclusion planning | Preserve exclusion patterns and rebuild-from-scratch cautions. | Historical evidence | Useful warnings against `App.tsx`, `preload.ts`, StoryUnitV1 as base model, diagnostics/dashboard clutter, recovery/export/project-switch reentry. | "Do not carry forward" is historical recommendation, not current runtime Retire/Delete disposition. | Stage 13 may classify but cannot execute archive, cleanup, deletion, or retirement. | Runtime/structural inventory and disposition matrix. | Re-express in Stage 13 disposition vocabulary later. |
| `pass220_modular_salvage_architecture_blueprint.md` | Defined modular salvage-shell rules for older implementation lane. | Phase 32 lane-specific blueprint | Preserve two-surface, modular, no-monolith, import-boundary, no-project-IO rules. | Bounded lane-specific historical evidence | Current truth index lists it as accepted salvage architecture evidence, but it does not authorize implementation. | Gives folder/module structure and next implementation sequence from old lane. | Current Stage 13 program controls pass boundaries; technologies and implementation remain unselected. | Runtime/structural inventory and surfaces/UI inventory. | Preserve boundary rules with constraints; verify before using any structure. |
| `pass221_salvage_carry_forward_extraction_map.md` | Mapped direct carry-forward, later carry-forward, reference-only, and do-not-carry-forward items. | Phase 32 lane-specific extraction map | Preserve pure contract candidates, test patterns, and anti-copy rules. | Bounded lane-specific historical evidence | High-value list of old source groups and risks without inspecting runtime now. | "Immediate carry-forward" conflicts with current Stage 13 need for later runtime inspection before disposition. | Historical code is evidence only; Preserve does not mean ship unchanged. | Runtime/structural inventory, test/evidence inventory, disposition matrix. | Convert historical carry-forward classes into Stage 13 dispositions later. |
| `pass222_product_system_dossier_plan.md` | Early plan for dossier recovery and product-system inventory. | Phase 32 dossier recovery | Preserve two-surface and dossier-first discovery posture. | Superseded historical evidence | Useful ancestor of product-system registry thinking. | Superseded by current `docs/product_systems/` registry, roadmap, maturity inventory, and Stage 13 program. | Current product-system spine controls dossier registry and doctrine. | Authority/status cleanup only if later needed. | No live obligation beyond historical context. |
| `continuity_carry_forward_register.md` | Classified continuity code, tests, and concepts for future salvage. | Phase 32 continuity salvage support | Preserve advisory, contradiction, non-mutation, and continuity-scope lessons. | Historical evidence | Strong warnings against scene scope, Memory Lab gravity, prototype storage paths, and mutation. | Lists runtime/test files by path; classifications are historical and not current dispositions. | Continuity remains advisory unless accepted; Memory Lab not build-ready authority. | Historical continuity follow-up, tests/evidence pass, provider/model pass only where relevant. | Preserve non-mutation/advisory invariants for later review. |
| `continuity_surface_to_dossier_crosswalk.md` | Mapped Phase 29 surfaces into future product-system dossiers. | Phase 32 crosswalk | Preserve translation from old surfaces to current dossiers without granting authority. | Historical evidence with supporting value | Useful map from old dashboards, graphs, Companion, critique, recovery, routing, and support surfaces to current dossier homes. | Mentions missing future dossiers from old context; many now exist or are bridge-backed in current registry. | Current authority and dossier maturity inventory control dossier status. | Authority/status follow-up and surfaces/UI inventory. | Use as historical mapping, not current registry. |
| Related Phase 29 matrices and summaries | Captured old runtime surface, control, intelligence, authority, and disposition evidence. | Phase 29 audit | Preserve old runtime truth and authority-boundary warnings. | Historical evidence or bounded audit evidence where explicitly cited by current truth index | Useful surface IDs, workflow conflicts, intelligence overclaim risks, support/dev boundaries, evidence-quality labels. | Some evidence references runtime lines and old surfaces; this pass did not inspect runtime contents. | Current authority controls; old runtime behavior is evidence only. | Surfaces/UI, tests/evidence, provider/model, telemetry/cache, and runtime/structural passes. | Preserve as evidence source; verify claims in bounded later passes. |

## 7. Claims and assumptions carried by the historical record set

The historical records carried these main claims or assumptions:

- a smaller salvage shell was preferable to continued layering inside the old app shell
- the two-surface model should be preserved
- `Narrative Insertion / Narrative Assertion` should become the foundation
- prose and scene should be projection or compatibility layers
- old `App.tsx`, `preload.ts`, dashboard, docking, diagnostics, and test-mode accumulation were architectural risks
- pure shared contracts, validators, fixtures, and test patterns appeared useful
- persistence should be separate, versioned, optional, and project-scoped if ever pursued
- fixtures and static evaluators should remain test-only and non-authoritative until separately authorized
- Companion, Memory Lab, graph surfaces, runtime evaluators, migration, project IO, export, recovery, and project-switch expansion should be deferred

These are historical claims. They require current-authority verification before becoming Stage 13 dispositions or Stage 14 gates.

## 8. Useful evidence retained

Useful retained evidence includes:

- explicit two-surface separation language
- repeated rejection of Companion, Memory Lab, graph runtime, and evaluator runtime as early dependencies
- no-grading and advisory-signal limits
- no-prose-extraction limits
- no-mutation and no-project-write boundaries
- import-boundary and anti-monolith concerns
- warning that fixtures and tests prove only their lane
- warning that sample-project clutter is unsafe as clean-shell authority
- warning that scene-first compatibility adapters can ossify into native architecture
- old mapping from Phase 29 surfaces to dossier homes
- historical proof that prior planning already recognized runtime tangle, bridge sprawl, and authority collapse risks

## 9. Conflicts with current doctrine

Conflicts or tension points:

- Phase 32 "immediate carry-forward" and "keep" language is not current Stage 13 disposition language.
- Early Phase 32 records preserve scene-first runtime authority for compatibility, while current doctrine treats scene as projection, container, view, or compatibility surface only.
- Persistence contract planning predates Stage 12 identity, migration, evidence, cache, queue, cost, deployment, model, and proof floors.
- Old scaffold and branch-readiness language can look like implementation sequencing, but Stage 13 is planning-only.
- Phase 29 runtime-surface evidence can look like product authority if not filtered through current product-system doctrine.
- "What is now real" in foundation checkpoint records could be overread as production integration, though the same records state it is test-only.

No conflict found in this pass requires Stage 12 reopening. Later passes must reopen Stage 12 if detailed evidence reveals identity-chain break, ownership collision, evidence overclaim, invalidation gap, silent authority transfer, implementation infeasibility, or release evidence contradiction.

## 10. Superseded assumptions

Superseded assumptions include:

- Stage 13 must follow old Phase 32 pass numbering or extraction sequence.
- Phase 32 salvage branch direction is current product-development priority by itself.
- Earlier dossier plans define the current product-system registry.
- Scene-first project loading can define future product truth.
- Story Unit compatibility scaffolding can become native foundation by default.
- Static evaluator, fixtures, or foundation tests can prove runtime readiness.
- Old `keep`, `carry forward`, `discard`, or `do not carry forward` labels are current dispositions.
- Salvage scaffold readiness authorizes implementation.
- Schema sketches authorize persistence implementation.
- Old branch-lineage commits define current Stage 13 gates.

## 11. Unresolved obligations still relevant

Live obligations carried forward as planning obligations:

- Re-evaluate Phase 32 carry-forward candidates under Stage 13 disposition vocabulary.
- Verify runtime candidates only in a later runtime and structural artifact inventory.
- Verify tests, fixtures, harnesses, and foundation claims only in a later test/evidence inventory.
- Reconcile any persistence/schema ideas against Stage 12 family contracts before any schema or migration planning advances.
- Preserve last-witness protection for Phase 29 and Phase 32 audit evidence before any later archive or cleanup candidate is named.
- Keep historical surface mappings available for later surfaces/UI and authority cleanup passes.
- Preserve author-policy deferrals and do not convert them into architecture assumptions.

## 12. Duplicate or overlapping historical roles

| Overlap | Records | Risk | Later handling |
| --- | --- | --- | --- |
| Carry-forward classification | `pass211`, `pass214`, `pass219`, `pass221`, `continuity_carry_forward_register` | Different old vocabularies can compete with Stage 13 dispositions. | Normalize in disposition matrix after source-class passes. |
| Scene compatibility | `pass195`, `pass209`, `pass210`, `pass220`, `pass221` | Compatibility can become foundation by inertia. | Runtime/structural and surfaces/UI passes must preserve projection-only status. |
| Test-only foundation | `pass198`, `pass203`, `pass206`, `pass208`, `pass221` | Tests can be overclaimed as readiness. | Test/evidence pass must limit claim strength. |
| Persistence/schema direction | `pass209`, `pass210`, Phase 29 persistence/recovery records | Old schema thinking can bypass Stage 12 floors. | Data/schema/persistence pass must check Stage 12 family contracts first. |
| Companion and Memory Lab | `pass213`, `pass214`, `pass222`, continuity records, Phase 29 matrices | Advisory or optional systems may regain hidden authority. | Provider/model/surfaces and runtime passes must keep optional, non-owning status. |
| Surface mapping | `continuity_surface_to_dossier_crosswalk`, Phase 29 matrices, current dossiers | Historical mappings may look like current registry truth. | Current authority inventory and surfaces/UI pass control treatment. |

## 13. Historical terms that may mislead later passes

Later passes must handle these terms carefully:

- `current runtime authority` in Phase 32 means historical observed runtime authority, not current product authority.
- `keep`, `carry forward now`, `carry forward later`, `reference only`, `quarantine`, `discard`, `do not carry forward`, and `replace` are historical labels, not Stage 13 dispositions.
- `implementation slice`, `next execution arc`, `first implementation`, and `scaffold readiness` are old lane language and do not authorize Stage 14.
- `scene-first validity` preserves compatibility evidence only; it does not restore scene-first doctrine.
- `foundation`, `contract authority`, `validation authority`, `fixture authority`, and `test authority` in Phase 32 must be read as bounded to that historical lane unless current authority promotes them.
- `dossier plan` in Pass 222 is superseded by current product-system registry and maturity records.

## 14. Later-pass routing

| Historical evidence class | Later pass |
| --- | --- |
| Old shell, preload, loader, bootstrap, runtime tangle, project IO, and scaffold files | Runtime and structural artifact inventory |
| Foundation tests, fixtures, harnesses, evaluator proofs, and Phase 29 evidence-quality claims | Test, fixture, harness, and evidence inventory |
| Narrative object store, schema sketches, scene projections, restored/copy identity, sample project, persistence/recovery concerns | Data, schema, persistence, migration, and recovery inventory |
| Electron shell, branch scaffold, launcher, app package, Vitest config, build/package patterns | Desktop, launcher, packaging, and installation inventory |
| Writing Surface, Command Center, old dashboards, graph panes, Companion overlay, split-command workspace | Surfaces and UI inventory |
| Provider, model, local/paid routing, package, approval, hidden context, explicit-content, and Companion AI assumptions | Provider/model/routing/package inventory |
| Queue, retry, cancellation, telemetry, diagnostics, cache, logs, and cost assumptions in old records | Provider/model/queue/telemetry/cache/cost inventory or split passes |
| Phase 29 and Phase 32 documents as last witnesses | Evidence and disposition matrix, with Stage 16 archive execution only |

## 15. Evidence limitations

This inventory proves only that the listed historical records were inspected as documentation evidence.

It does not prove:

- runtime correctness
- runtime presence or absence of the referenced code
- test validity
- fixture validity
- packaged behavior
- schema feasibility
- migration safety
- provider-policy currentness
- model qualification
- queue correctness
- cache or telemetry compliance
- cost accuracy
- archive eligibility
- implementation readiness
- release readiness

Historical records are evidence only. Unknown state remains visibly unknown. Missing or ambiguous authority fails closed.

## 16. Stop and reopening conditions

Stop later Stage 13 work if:

- the repository gate differs from authorization
- current authority is missing, ambiguous, or contradictory
- a historical record appears to contradict a Stage 12 architecture floor
- a pass would require runtime implementation, GUI work, schema work, provider/model integration, queue work, telemetry work, cache work, packaging, cleanup, archive execution, deletion, release work, or technology selection
- an author-policy decision would need to be resolved by assumption
- evidence is insufficient for the claim being made

Invoke Stage 12 reopening if later evidence reveals contradiction among contracts, ownership collision, identity-chain break, invalidation or propagation gap, evidence overclaim, silent authority transfer, family-contract regression, unresolved architecture dependency, author-policy change to a mandatory floor, implementation infeasibility, or release evidence contradicting the contract.

## 17. Recommended next bounded pass

Recommended next pass: runtime and structural artifact inventory.

Rationale:

- Phase 32 historical records repeatedly identify runtime and structural source groups as the highest-risk salvage material.
- The historical language is now bounded, so later runtime inspection can proceed without treating old carry-forward labels as authority.
- Runtime and structural source groups affect dependency order for later test, schema, UI, provider, queue, cache, telemetry, cost, packaging, and disposition passes.
- The next pass must remain inventory-only and must not execute salvage, modify runtime, select technologies, or authorize Stage 14.

Alternative if the author wants one more documentation-only pass first: a narrower historical contradiction follow-up focused on Phase 29 to Phase 32 mapping. This inventory does not require that follow-up before runtime inventory.

Stage 14 remains unauthorized. Implementation and release remain blocked.
