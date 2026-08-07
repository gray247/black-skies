# Black Skies

Black Skies is a local-first Windows writing application with two coordinated
windows:

- **Writing Studio** owns project creation/opening, manuscript structure,
  editing, Save, recovery, Markdown export, and optional selected-prose
  critique.
- **Command Center** mirrors project, navigation, recovery, and durable-save
  status. It does not edit prose or mutate manuscript structure.

The current qualified internal build targets Windows 11 x64. Core writing, Save,
reopen, recovery, and Markdown export work offline and do not require Python,
a globally installed Node.js runtime, a repository checkout, or provider
credentials.

## Start here

- End users and acceptance operators:
  [`docs/quickstart.md`](docs/quickstart.md)
- Support and troubleshooting:
  [`docs/ops/support_playbook.md`](docs/ops/support_playbook.md)
- Internal-build identity and non-release boundary:
  [`RELEASE.md`](RELEASE.md)
- Package/build operators:
  [`docs/packaging.md`](docs/packaging.md)
- Current product and Stage 19 authority:
  [`docs/product_systems/current_truth_index.md`](docs/product_systems/current_truth_index.md)

## Current internal-baseline status

Version `1.0.0-rc1` identifies an unsigned qualified internal build, not a
public, alpha, beta, production, or SmartScreen-trusted release. Package
`19.20` and Package `19.21` are historical predecessors. Package `19.22` is
closed as the final internal barebones V1 baseline; its exact candidate and
artifact are recorded in `RELEASE.md` and the closure receipt.
Public release is not authorized; public alpha or beta consideration is
deferred until after the separate V3 product program.

## Developer workspace

The repository contains retained legacy services, historical product plans,
development harnesses, and future work that are not part of the installed V1
runtime. Developer commands are documented separately in `AGENTS.md`,
`docs/tests.md`, and the explicitly developer-only `RUNBOOK.md`; they must not
be treated as end-user prerequisites or current product authority.
