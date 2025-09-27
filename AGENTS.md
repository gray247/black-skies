# Repository Guidelines

## Project Structure & Module Organization
The monorepo separates the desktop client and backend services. `app/` hosts the Electron + React UI: process logic in `main/`, renderer features in `renderer/`, shared utilities in `shared/`, and ambient types in `types/`. `services/` contains the FastAPI layer (`src/blackskies/services`) with fixtures and models split under dedicated folders and pytest suites in `services/tests/`. Operational helpers live in `scripts/` (see `electron-dev-placeholder.mjs`), while `docs/` and `sample_project/` capture design references. Use `tools/` for developer utilities or experimental CLIs.

## Build, Test, and Development Commands
Run `pnpm install --recursive` once to sync workspace dependencies (Node >=20, pnpm >=8). Start the desktop client with `pnpm dev`, which launches Vite hot reloading alongside the Electron bridge. Build production bundles via `pnpm --filter app build` and compile the main process with `pnpm --filter app build:main`. Lint all packages using `pnpm lint`. For the services layer, activate a Python 3.11 virtualenv and run `uvicorn blackskies.services.app:create_app --factory --reload` for local APIs.

## Coding Style & Naming Conventions
Honor `.editorconfig`: two-space indentation by default, four spaces for Python modules, and LF line endings. Frontend code follows ESLint (configured in `.eslintrc.cjs`) and Prettier - run `pnpm --filter app lint` before submitting. Prefer PascalCase React components, camelCase hooks and helpers, and colocate renderer tests under `renderer/__tests__/`. Python services adhere to PEP 8 with Flake8 (`.flake8`), `snake_case` modules, and dataclass-style models in `models/`.

## Testing Guidelines
Use Vitest for UI logic with `pnpm --filter app test`; name files `*.test.ts` or `*.test.tsx`. Python endpoints rely on Pytest in `services/tests/`, with fixtures under `services/src/blackskies/services/fixtures`. Add regression coverage for new routes or diagnostics, and document HTTPX-based integration tests when touching request or response flows.

## Commit & Pull Request Guidelines
Follow the repository's conventional prefixes (`feat`, `fix`, `chore`, etc.) as shown in recent history. Keep subject lines imperative and under about 65 characters, expanding details in the body when needed. Each pull request should include a clear summary, linked issues or tickets, verification notes (unit, integration, or manual checks), and screenshots or API traces whenever UX or payloads change. Request early reviews when changes span both the Electron shell and service APIs.
