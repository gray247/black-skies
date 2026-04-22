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

---

## AI AGENT EXECUTION RULES (CRITICAL)

These rules apply specifically to Codex and any AI agents interacting with this repository.

### 1. MODIFY > CREATE

- Always prefer modifying existing files over creating new ones
- Do not introduce new patterns if an existing one already solves the problem
- Avoid duplicate logic across modules

---

### 2. DO NOT REFACTOR WITHOUT EXPLICIT INSTRUCTION

- Do NOT restructure directories
- Do NOT rename core files
- Do NOT rewrite working systems for "cleanliness"
- Do NOT introduce new frameworks or abstractions

---

### 3. RESPECT CORE SYSTEM DESIGN

This project is built around:

- Loop-based generation systems
- Persona-driven architecture
- Memory-aware workflows

All changes must preserve these patterns.

---

### 4. SAFE CHANGE STRATEGY

When making changes:

1. Identify existing system
2. Extend or patch it
3. Avoid breaking interfaces
4. Keep changes minimal and localized

---

### 5. WHEN UNSURE

- Ask for clarification instead of guessing
- Do not invent missing architecture
- Do not assume intent

---

### 6. PERFORMANCE + STABILITY PRIORITY

Order of importance:

1. Stability (no crashes, no broken flows)
2. Consistency (existing behavior preserved)
3. Structure (clean but not disruptive)
4. Features (only after above are safe)

---

### 7. LOOP SAFETY

- All loops must have exit conditions
- Avoid unbounded recursion
- Respect token/resource limits

---

### 8. MEMORY SAFETY

- Do not overwrite stored memory without cause
- Preserve continuity between operations
- Check for existing data before generating new data

---

## TRACKER / DOC / TEST DISCIPLINE

These rules apply to every repair pass.

- Update `docs/BLACK_SKIES_FIX_TRACKER.md` whenever issue status, evidence, root cause, blockers, or scope changes
- Update affected documentation whenever commands, workflows, startup behavior, authority, or operational guidance changes
- If a bug reveals a missing test, weak test, or weak guardrail, add or strengthen coverage in the same pass when reasonably scoped
- Do not mark an issue VERIFIED without reproducible evidence
- Prefer extending existing tracker issues before creating new ones
- Record partial fixes explicitly

---

### FINAL RULE

If a change risks breaking the system, do not proceed without confirmation.