# Contributing guidelines

## Workflow

- Use feature branches named `feature/<slug>` or `fix/<slug>`.
- Open drafts early; link the relevant roadmap phase and charter section.
- Ensure `pnpm install --recursive` and required Python deps are installed before running scripts.

## Coding standards

- Renderer: follow `.editorconfig`, run `pnpm --filter app lint` and `pnpm --filter app test` before pushing.
- Services: format via `black`, lint with `flake8`, type-check via `mypy`.
- Tests: map changes to the phase coverage table in `docs/tests.md` and update docs when new surfaces ship.
- Docs: run `pnpm lint:docs` before merging documentation updates and follow `docs/style.md`.

## Reviews & approvals

- Keep docs consistent; follow `docs/style.md` and update roadmap/charter when scope shifts.
- Minimum two reviewers: surface owner + tooling/QA owner for phases in progress.
- Tag `@desktop-team` for renderer changes, `@services-team` for API changes.
- Merge only when roadmap status and phase log are updated as part of the PR.

## Releases

- RC/GA builds follow the schedule in `docs/roadmap.md`; ensure release notes are appended to `RELEASE_NOTES.md` once created.
