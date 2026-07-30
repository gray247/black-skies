# Black Skies Documentation

## Current V1 release-facing guidance

- `quickstart.md` — installed-product user guide
- `ops/support_playbook.md` — current support and troubleshooting
- `packaging.md` — Windows package/build/receipt contract
- `rollback_policy.md` — release-candidate rollback posture
- `ui_copy_spec_v1.md` — accepted Writing Studio/Command Center vocabulary
- `../RELEASE.md` — accepted candidate identity, release notes, known
  limitations, and Package `19.22` gate

## Current product and governance authority

- `product_systems/current_truth_index.md`
- `product_systems/current_product_roadmap.md`
- `product_systems/stage19_v1_scope_lock.md`
- `product_systems/stage19_v1_master_implementation_and_acceptance_plan.md`
- `product_systems/stage19_package_19_20_closure.md`
- `product_systems/stage19_package_19_21_plan_and_findings.md`
- `product_systems/stage19_package_19_21_closure.md`

Stage 19 remains open. Package `19.21` is closed; Package `19.22` is next
eligible and remains the final V1.0 closure/release boundary requiring Jason's
final human verification and explicit release authorization.

## Historical and developer material

This repository retains extensive specifications, phase records, service
runbooks, GUI plans, and future-product dossiers. A file's old `Active`,
`Locked`, version, or source-of-truth label does not override the current
product-system and Stage 19 records above.

In particular, legacy Python/FastAPI services, Companion, plugins, analytics,
model routing, broad import/export, snapshots/history, layout systems, and
future roadmap capabilities are not installed V1 user guidance unless the
current Stage 19 authority explicitly admits them.

Use historical documents for provenance and salvage planning, not to instruct
users or qualify a release candidate.
