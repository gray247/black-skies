# Repository Guidelines

## Project Structure & Module Organization
- The monorepo separates the Electron desktop client in `app/` from the FastAPI services in `services/`.
- Client process code sits under `app/main/`, renderer UI in `app/renderer/`, shared helpers in `app/shared/`, and ambient types in `app/types/`.
- Backend logic lives in `services/src/blackskies/services/`, with fixtures alongside in `fixtures/`, models in `models/`, and pytest suites in `services/tests/`.
- Operational scripts are under `scripts/`, docs and reference material under `docs/` and `sample_project/`, and developer tooling prototypes in `tools/`.

## Build, Test, and Development Commands
- `pnpm install --recursive` – bootstrap all workspaces (Node 20+, pnpm 8+).
- `pnpm dev` – launch Electron with Vite hot reload for the renderer and bridge.
- `pnpm --filter app build` / `pnpm --filter app build:main` – produce renderer and main process bundles respectively.
- `pnpm lint` – run the monorepo ESLint configuration and Prettier formatting checks.
- `uvicorn blackskies.services.app:create_app --factory --reload` – serve the FastAPI app during Python development.

## Coding Style & Naming Conventions
- Follow `.editorconfig`: two-space indentation for JavaScript/TypeScript, four spaces for Python, LF line endings.
- Frontend code obeys ESLint (`.eslintrc.cjs`) and Prettier; run `pnpm --filter app lint` before commits.
- Use PascalCase for React components, camelCase hooks/utilities, and colocate renderer tests under `app/renderer/__tests__/`.
- Python modules follow PEP 8, snake_case filenames, and dataclass-style models inside `services/src/blackskies/services/models/`.

## Testing Guidelines
- Run `pnpm --filter app test` for Vitest suites (`*.test.ts[x]`).
- Execute `pytest services/tests/` for backend coverage, using fixtures from `services/src/blackskies/services/fixtures/`.
- Add regression scenarios for new routes or IPC bridges, and document HTTPX integration cases touching request/response flows.

## Commit & Pull Request Guidelines
- Use conventional commit prefixes (`feat`, `fix`, `chore`, etc.) with imperative subjects under ~65 characters.
- Reference related tickets in the body and capture manual or automated verification notes (Vitest, Pytest, Electron smoke).
- Provide screenshots or payload diffs when UI states or API contracts change and request review early for cross-surface work.

## Environment & Configuration Tips
- Maintain a Python 3.11 virtualenv for backend tasks and install dependencies from `requirements.dev.lock` when developing locally.
- Keep credentials out of version control; rely on local `.env` files or OS keychains for secrets used by the Electron bridge.
- When experimenting with tooling, stage work in `tools/` or feature branches until ready for review.
