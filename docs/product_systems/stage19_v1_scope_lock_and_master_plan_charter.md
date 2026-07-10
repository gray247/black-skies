# Stage 19 V1.0 Scope Lock and Master Plan Charter

## 1. Charter purpose

This charter defines the next docs-only Stage 19 planning task. The later task
must create an authoritative V1.0 scope lock and master implementation and
acceptance plan. This charter does not create that plan, authorize runtime or
test changes, close Package `19.5`, or authorize a later implementation
package.

Charter status: fulfilled by `stage19_v1_scope_lock.md`,
`stage19_v1_master_implementation_and_acceptance_plan.md`, and
`stage19_v1_salvage_traceability_matrix.md`. It remains as the planning-task
boundary and does not authorize runtime work.

## 2. Controlling decision

`stage19_v1_authority_alignment_decision.md` establishes Stage 19 as the
governed implementation and acceptance program intended to culminate in Black
Skies V1.0. V1.0 is the product milestone, not a competing stage sequence.
Packages `19.1` through `19.5` represent only the initial bounded local writing
spine.

## 3. Required authority and evidence review

The later planning task must inspect current product authority, the Stage
17-19 decision chain, the Stage 19 package records, non-protected salvaged
implementation structure, current verification results, and known release
constraints. Code and tests are evidence of behavior, not automatic product
authority. Protected evidence remains outside scope unless separately
authorized.

## 4. Required master-plan determinations

The later scope lock and master plan must determine and record:

1. the minimum honest Black Skies V1.0 promise;
2. required capabilities and explicitly excluded capabilities;
3. an inventory of salvaged systems relevant to the approved promise;
4. which behavior is implemented, synthetic, automated-test-only, manually
   untested, partial, absent, or deferred;
5. the remaining bounded Stage 19 implementation packages;
6. package dependencies and execution order;
7. manual happy-path acceptance criteria and evidence format;
8. manual failure-path acceptance criteria and evidence format;
9. real writing-session acceptance criteria;
10. the V1.0 accessibility floor;
11. packaging and install verification requirements;
12. the release-candidate gate and stop conditions;
13. required release notes and known limitations; and
14. final combined Stage 19 and Black Skies V1.0 closure criteria.

## 5. Package and scope rules

The master plan must keep every implementation package finite, dependency
ordered, separately authorized, and paired with explicit verification and stop
conditions. It must identify which work is documentation, implementation,
automated verification, manual acceptance, stabilization, packaging, or
release decision work.

The plan must not automatically include broad AI, critique, rewrite,
connectors, restore/import, protected evidence, broad provenance/sync,
advanced diagnostics, or any feature not required by the approved minimum
V1.0 promise. A deferred or excluded system may enter only through an explicit
scope decision and bounded authorization.

## 6. Required closure model

The later plan must prevent package completion from being mistaken for Stage
19 or V1.0 completion. Final closure must require all approved packages and
critical automated gates, recorded manual acceptance, real writing-session
acceptance, the accessibility floor, packaging/install proof, release-candidate
verification, documented limitations, and a clean synchronized repository.

Unresolved data-loss, project-isolation, truth-mutation, packaging, or critical
acceptance risks must have an explicit blocking disposition; they may not be
silently deferred to a closed Stage 19 or released V1.0 milestone.

## 7. Next-task output boundary

The next task may create the V1.0 scope lock and master implementation and
acceptance plan only after explicit authorization. It must not perform runtime,
test, protected-evidence, witness, fixture, cleanup/archive, packaging, or
release execution as part of planning.
