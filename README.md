# Black Skies

Black Skies is a local-first Windows writing application with two coordinated
windows:

- **Writing Studio** owns project creation/opening, manuscript structure,
  editing, Save, recovery, Markdown export, and optional selected-prose
  critique.
- **Command Center** mirrors project, navigation, recovery, and durable-save
  status. It does not edit prose or mutate manuscript structure.

The current release candidate targets Windows 11 x64. Core writing, Save,
reopen, recovery, and Markdown export work offline and do not require Python,
a globally installed Node.js runtime, a repository checkout, or provider
credentials.

## Start here

- End users and acceptance operators:
  [`docs/quickstart.md`](docs/quickstart.md)
- Support and troubleshooting:
  [`docs/ops/support_playbook.md`](docs/ops/support_playbook.md)
- Release-candidate identity and release boundary:
  [`RELEASE.md`](RELEASE.md)
- Package/build operators:
  [`docs/packaging.md`](docs/packaging.md)
- Current product and Stage 19 authority:
  [`docs/product_systems/current_truth_index.md`](docs/product_systems/current_truth_index.md)

## Current release status

Version `1.0.0-rc1` is an unsigned internal release candidate, not a public or
SmartScreen-trusted release. Package `19.20` accepted the exact packaged
candidate recorded in `RELEASE.md`. Package `19.21` closed after aligning and
rehearsing this documentation against that product. Package `19.22` remains
the final V1.0 closure/release boundary and requires Jason's explicit release
authorization.

## Developer workspace

The repository contains retained legacy services, historical product plans,
development harnesses, and future work that are not part of the installed V1
runtime. Developer commands are documented separately in `AGENTS.md`,
`docs/tests.md`, and the explicitly developer-only `RUNBOOK.md`; they must not
be treated as end-user prerequisites or current product authority.
