# Current Documentation Authority Inventory

## Purpose

This record defines the documents that may state current repository,
internal-build, operator, support, and Stage 19 truth during Package `19.22`.
The machine-readable inventory is
[`current_authority_inventory.json`](current_authority_inventory.json).

Every listed document is linted and every local Markdown link in that set is
resolved by `pnpm lint:docs`. A document does not become current authority
merely because another file links to it.

## Authority boundary

The inventory includes:

- current user, support, security, developer, package, rollback, and UI
  guidance;
- the current product-roadmap and truth-index entry points;
- the Stage 19 scope, master plan, Package `19.21` receipt, Package `19.22`
  ledger, and final handover; and
- the internal build record retained under the filename `RELEASE.md`.

Package closure records not listed here remain immutable historical receipts.
They may prove a past decision but cannot override the current inventory.
Product dossiers remain doctrine for the concepts they own; they do not state
Package `19.22`, artifact, or public-release status unless promoted into this
inventory.

The following roots are explicitly historical or non-current for this gate:

- `archive/`
- `docs/archive/`
- `docs/audits/`
- `docs/roadmap/`
- `work/`

Those roots remain tracked evidence. Package `19.22` does not delete, move,
lint-repair, or promote them. If an active build, test, workflow, or listed
current document consumes one as current truth, the exclusion is invalid and
the owning finding reopens.

## Milestone language

The bounded status during this package is:

```text
PACKAGE_19_22: ACTIVE
STAGE_19: OPEN
INTERNAL_V1_BASELINE: QUALIFICATION_IN_PROGRESS
PUBLIC_RELEASE: NOT_AUTHORIZED
ALPHA_OR_BETA: NOT_CLAIMED
V3_PRODUCT_PROGRAM: NOT_STARTED_BY_THIS_PACKAGE
```

Only the final Package `19.22` closure record may change the first three lines,
and only after the complete closure standard and Jason's final
internal-milestone judgment are satisfied.
