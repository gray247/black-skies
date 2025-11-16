Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# Build Steps Playbook
> **Source of Truth:** Canonical Build & Verification reference; merge or prune other build docs before hitting this plan.
> **Status:** Reference doc for every milestone command.

Reference of every step with commands, acceptance notes, and Codex prompts. Generated from build_steps.json.

## Milestone 0 - Environment, Offline Safety, Hygiene
*Status:* Mandatory for RC

### Step 1: Create setup script (offline-safe)
- **Profiles:** API-only
- **Primary artifacts:** `scripts/setup`
- **What:** Bash `scripts/setup` to create `.venv`, install pinned deps (or local wheels), and write `.env`.
- **Command:** `bash scripts/setup`
- **Acceptance:** exits 0; `.venv/` exists; `.env` has `OPENAI_API_KEY=dummy`.
- **Codex ask:** “Add offline-safe `scripts/setup` that creates venv, installs from `vendor/wheels` if present, and writes `.env`.”

### Step 2: Create maintenance script
- **Profiles:** API-only
- **Primary artifacts:** `scripts/maint`
- **What:** Bash `scripts/maint` to run `black --check`, linter, and `pytest`; never touches `.venv`.
- **Command:** `bash scripts/maint`
- **Acceptance:** runs offline; doesn’t install anything.
- **Codex ask:** “Add `scripts/maint` to run format/lint/tests excluding `.venv`, `vendor`, `node_modules`.”

### Step 3: Pin Python deps (runtime)
- **Profiles:** API-only
- **Primary artifacts:** `requirements.lock`
- **What:** Add `requirements.lock` with exact versions (fastapi, starlette, pydantic, uvicorn[standard], httpx, tenacity, etc.).
- **Command:** `python -m pip install -r requirements.lock`
- **Acceptance:** installs cleanly online.
- **Codex ask:** “Create `requirements.lock` with exact versions for runtime deps.”

### Step 4: Pin Python deps (dev)
- **Profiles:** API-only
- **Primary artifacts:** `requirements.dev.lock`
- **What:** Add `requirements.dev.lock` (pytest, pytest-cov, pytest-rerunfailures, black, flake8/ruff).
- **Command:** `python -m pip install -r requirements.dev.lock`
- **Acceptance:** dev tools install cleanly online.
- **Codex ask:** “Create `requirements.dev.lock` with exact versions for dev/test deps.”

### Step 5: Wheels freezer
- **Profiles:** API-only
- **Primary artifacts:** `scripts/freeze_wheels.sh`, `vendor/wheels/`
- **What:** `scripts/freeze_wheels.sh` downloads wheels into `vendor/wheels/` for both lockfiles.
- **Command:** `bash scripts/freeze_wheels.sh`
- **Acceptance:** directory populated with wheels; offline install works.
- **Codex ask:** “Add `scripts/freeze_wheels.sh` that downloads all wheels for offline use.”

### Step 6: Setup prefers local wheels
- **Profiles:** API-only
- **Primary artifacts:** `scripts/setup`
- **What:** Make `scripts/setup` try `--no-index --find-links vendor/wheels` first, then fall back online.
- **Command:** `bash scripts/setup`
- **Acceptance:** offline path succeeds when wheels exist.
- **Codex ask:** “Modify setup to prefer local wheels; fall back to online gracefully.”

### Step 7: Ignore junk files
- **Profiles:** All
- **Primary artifacts:** `.gitignore`
- **What:** Add `.gitignore` entries for `.venv`, `vendor/wheels`, `node_modules`, caches.
- **Command:** `git status`
- **Acceptance:** build artifacts ignored.
- **Codex ask:** “Add comprehensive `.gitignore`.”

### Step 8: Editorconfig
- **Profiles:** All
- **Primary artifacts:** `.editorconfig`
- **What:** Add `.editorconfig` (UTF-8, LF, 2 or 4 spaces).
- **Command:** -
- **Acceptance:** file present with sane defaults.
- **Codex ask:** “Add `.editorconfig` with LF, UTF-8, consistent indentation.”

### Step 9: Pytest config suppresses site-packages
- **Profiles:** API-only
- **Primary artifacts:** `pyproject.toml` or `pytest.ini`
- **What:** Configure pytest to ignore `.venv` and third-party paths.
- **Command:** `pytest -q`
- **Acceptance:** no collection from site-packages.
- **Codex ask:** “Configure pytest to ignore `.venv`, `vendor`, `node_modules`.”

### Step 10: Linter config
- **Profiles:** All
- **Primary artifacts:** `.flake8` or `ruff.toml`
- **What:** Add `.flake8` or `ruff.toml` with excludes & line length 100.
- **Command:** `flake8` (or `ruff check .`)
- **Acceptance:** lints only our code.
- **Codex ask:** “Add linter config excluding `.venv`, `vendor`, `node_modules`, set max-line-length=100.”

### Step 11: Black config in pyproject
- **Profiles:** All
- **Primary artifacts:** `pyproject.toml`
- **What:** Centralize black/pytest coverage settings in `pyproject.toml`.
- **Command:** `black --check .`
- **Acceptance:** format/lint/test configs live together.
- **Codex ask:** “Add black/pytest configs to `pyproject.toml`.”

### Step 12: Node guard rails (optional)
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `scripts/setup`
- **What:** Gate Node install behind `BS_ALLOW_NODE=1`; skip if registry blocked.
- **Command:** `BS_ALLOW_NODE=1 bash scripts/setup`
- **Acceptance:** no hard failures when Node unavailable.
- **Codex ask:** “Gate Node steps behind env flag and check registry before install.”

## Milestone 1 - Package Skeleton & App Foundation
*Status:* Mandatory for RC

### Step 13: Create package skeleton
- **Profiles:** API-only
- **Primary artifacts:** package tree
- **What:** `black_skies/` with `app/ core/ storage/ agents/ exports/ critique/ util/ __init__.py`.
- **Command:** `pytest -q`
- **Acceptance:** package importable.
- **Codex ask:** “Create Python package skeleton with the listed subpackages.”

### Step 14: Settings via pydantic-settings
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/core/settings.py`
- **What:** `core/settings.py` with `OPENAI_API_KEY`, `BLACK_SKIES_MODE` (defaulting to `offline`), etc.
- **Command:** `python -c "from black_skies.core.settings import Settings; print(Settings())"`
- **Acceptance:** defaults read from `.env`, env overrides work.
- **Codex ask:** “Add Settings model using pydantic-settings reading `.env`.”

### Step 15: App factory
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/factory.py`
- **What:** `app/factory.py` → FastAPI `create_app()` with `/api/v1/healthz`.
- **Command:** `uvicorn black_skies.app.factory:create_app`
- **Acceptance:** GET `/api/v1/healthz` → `{"ok": true}`.
- **Codex ask:** “Add FastAPI app factory with `/api/v1/healthz` route.”

### Step 16: CORS & compression
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/factory.py`
- **What:** add CORS (dev defaults) and gzip middleware.
- **Command:** hit `/openapi.json`
- **Acceptance:** middleware engaged.
- **Codex ask:** “Enable CORS and GZip middleware in app factory.”

### Step 17: Error handler baseline
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/errors.py`
- **What:** central 422/500 JSON error shape.
- **Command:** trigger 422
- **Acceptance:** consistent error JSON.
- **Codex ask:** “Add error handlers for 422/500 and wire them.”

### Step 18: Logging config
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/util/logging.py`
- **What:** JSON logs + request IDs.
- **Command:** curl endpoint; inspect logs
- **Acceptance:** request_id present.
- **Codex ask:** “Add structured logging + request ID middleware.”

### Step 19: OpenAPI metadata
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/factory.py`
- **What:** title, version, tags, server URL notes.
- **Command:** view `/docs`
- **Acceptance:** docs show metadata.
- **Codex ask:** “Set OpenAPI title/version/tags.”

### Step 20: CLI entrypoint (serve)
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/cli.py`, `pyproject.toml`
- **What:** `black_skies/cli.py` with `serve` command.
- **Command:** `black-skies serve`
- **Acceptance:** server launches.
- **Codex ask:** “Add console_script `black-skies` with `serve` subcommand.”

### Step 21: Tests: health & settings
- **Profiles:** API-only
- **Primary artifacts:** `tests/`
- **What:** `tests/test_health.py`, `tests/test_settings.py`.
- **Command:** `pytest -q`
- **Acceptance:** both pass.
- **Codex ask:** “Add smoke tests for `/api/v1/healthz` and Settings.”

## Milestone 2 - Data Model & Storage
*Status:* Mandatory for RC

### Step 22: Data models
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/core/models.py`
- **What:** Pydantic `Outline`, `DraftUnit`, `Revision`, `HistoryEntry`.
- **Command:** `pytest -q`
- **Acceptance:** schemas work.
- **Codex ask:** “Implement core Pydantic models per spec.”

### Step 23: ID helpers
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/util/ids.py`
- **What:** deterministic ID generators (`proj_0001`, `ch_0001`, etc.).
- **Command:** `python -c "import ..."`
- **Acceptance:** deterministic outputs.
- **Codex ask:** “Add deterministic ID helpers.”

### Step 24: JSON serialization utils
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/util/jsonio.py`
- **What:** read/write helpers with timezone-aware timestamps.
- **Command:** round-trip a model
- **Acceptance:** equality preserved.
- **Codex ask:** “Add JSON read/write helpers with tz handling.”

### Step 25: FS layout
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/storage/fs_layout.py`
- **What:** canonical paths for outline/drafts/revisions/history.
- **Command:** `pytest -q`
- **Acceptance:** helpers return expected paths.
- **Codex ask:** “Define canonical FS layout helpers.”

### Step 26: Repository with atomic writes
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/storage/repository.py`
- **What:** read/write models with temp file + rename.
- **Command:** repo tests
- **Acceptance:** atomic, idempotent writes.
- **Codex ask:** “Implement repository with atomic JSON writes.”

### Step 27: Model validation tests
- **Profiles:** API-only
- **Primary artifacts:** `tests/test_models.py`
- **What:** round-trip, required fields, invalid payloads.
- **Command:** `pytest -q`
- **Acceptance:** green.
- **Codex ask:** “Add model validation & round-trip tests.”

### Step 28: Temp project fixture
- **Profiles:** API-only
- **Primary artifacts:** `tests/conftest.py`
- **What:** `tests/conftest.py` fixture `tmp_project_dir` with canonical tree.
- **Command:** `pytest -q`
- **Acceptance:** fixture available.
- **Codex ask:** “Add tmp_project_dir fixture.”

### Step 29: File lock for concurrency
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/storage/lock.py`
- **What:** lock file helper (fcntl or portalocker) for writes.
- **Command:** concurrency test
- **Acceptance:** no torn writes.
- **Codex ask:** “Add storage lock and use it in repository writes.”

## Milestone 3 - Endpoints MVP (CRUD + Lists)
*Status:* Mandatory for RC

### Step 30: GET outline
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/routes_outline.py`
- **What:** serve `outline.json` or 404 with friendly detail.
- **Command:** curl
- **Acceptance:** 200/404 as expected.
- **Codex ask:** “Add GET /v1/projects/{id}/outline.”

### Step 31: PUT outline
- **Profiles:** API-only
- **Primary artifacts:** same module
- **What:** validate schema, write file.
- **Command:** curl PUT
- **Acceptance:** 200 and content persisted.
- **Codex ask:** “Add PUT /v1/projects/{id}/outline with validation.”

### Step 32: POST draft (create)
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/routes_drafts.py`
- **What:** store `DraftUnit`, return id.
- **Command:** curl POST
- **Acceptance:** 201 with new id.
- **Codex ask:** “Add POST /v1/projects/{id}/drafts (create).”

### Step 33: GET draft by id
- **Profiles:** API-only
- **Primary artifacts:** `routes_drafts.py`
- **What:** fetch stored draft.
- **Command:** curl GET
- **Acceptance:** 200 or 404.
- **Codex ask:** “Add GET /v1/projects/{id}/drafts/{draft_id}.”

### Step 34: POST revision (create)
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/routes_revisions.py`
- **What:** persist manual revision payload.
- **Command:** curl POST
- **Acceptance:** 201 with id.
- **Codex ask:** “Add POST /v1/projects/{id}/revisions.”

### Step 35: List endpoints
- **Profiles:** API-only
- **Primary artifacts:** routes
- **What:** `GET /v1/projects/{id}/drafts` + `/revisions` with pagination.
- **Command:** curl lists
- **Acceptance:** pagination fields present.
- **Codex ask:** “Add list endpoints with limit/offset.”

### Step 36: Dependencies for project root
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/deps.py`
- **What:** FastAPI dependency to resolve project path & ensure dirs.
- **Command:** run any endpoint
- **Acceptance:** directories created as needed.
- **Codex ask:** “Add dependency that resolves/creates project directories.”

### Step 37: Response models + examples
- **Profiles:** API-only
- **Primary artifacts:** routes + `core/schemas.py`
- **What:** Pydantic response models & OpenAPI examples.
- **Command:** view `/docs`
- **Acceptance:** examples visible.
- **Codex ask:** “Define response schemas and OpenAPI examples.”

### Step 38: Endpoint tests (happy paths)
- **Profiles:** API-only
- **Primary artifacts:** `tests/test_endpoints_basic.py`
- **What:** tests for outline/draft/revision CRUD.
- **Command:** `pytest -q`
- **Acceptance:** green.
- **Codex ask:** “Add endpoint happy-path tests.”

### Step 39: Endpoint tests (edge cases)
- **Profiles:** API-only
- **Primary artifacts:** `tests/test_endpoints_edges.py`
- **What:** 404s, invalid payloads, pagination limits.
- **Command:** `pytest -q`
- **Acceptance:** green.
- **Codex ask:** “Add endpoint edge-case tests.”

## Milestone 4 - Policies & Exporters
*Status:* Mandatory for RC

### Step 40: Policy hooks
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/core/policies.py`
- **What:** `core/policies.py` with `check_project_limits`, `redact_sensitive`, `validate_export_target`.
- **Command:** policy tests
- **Acceptance:** helpers documented, callable.
- **Codex ask:** “Add core policy functions.”

### Step 41: Wire policies on write
- **Profiles:** API-only
- **Primary artifacts:** routes
- **What:** call policies in PUT/POST endpoints.
- **Command:** run existing tests
- **Acceptance:** blocked inputs rejected.
- **Codex ask:** “Integrate policies into write endpoints.”

### Step 42: Export target validation
- **Profiles:** API-only
- **Primary artifacts:** export endpoint
- **What:** ensure format/path validated.
- **Command:** attempt invalid export
- **Acceptance:** 400 with message.
- **Codex ask:** “Validate export targets with clear errors.”

### Step 43: Markdown exporter
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/exports/markdown.py`
- **What:** outline + drafts → `draft_full.md`.
- **Command:** invoke exporter
- **Acceptance:** file matches spec.
- **Codex ask:** “Add markdown exporter.”

### Step 44: JSONL exporter
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/exports/jsonl.py`
- **What:** each draft unit as JSON line.
- **Command:** invoke exporter
- **Acceptance:** newline-delimited JSON.
- **Codex ask:** “Add JSONL exporter.”

### Step 45: Export endpoint
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/routes_export.py`
- **What:** `POST /v1/projects/{id}/export` with `{"format":"markdown|jsonl"}`.
- **Command:** curl POST
- **Acceptance:** 200 with export info.
- **Codex ask:** “Add export endpoint.”

### Step 46: Exporter tests
- **Profiles:** API-only
- **Primary artifacts:** `tests/test_exporters.py`
- **What:** unit tests for markdown/jsonl output.
- **Command:** `pytest -q`
- **Acceptance:** green.
- **Codex ask:** “Add exporter tests (golden output).”

### Step 47: Policy tests
- **Profiles:** API-only
- **Primary artifacts:** `tests/test_policies.py`
- **What:** verification for redaction/limits.
- **Command:** `pytest -q`
- **Acceptance:** green.
- **Codex ask:** “Add policy tests.”

## Milestone 5 - Agents, Pipeline, Critique, Gates, Observability
*Status:* Post-RC (optional)

### Step 48: Agent stubs
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/agents/*.py`
- **What:** `OutlineAgent`, `DraftAgent`, `RevisionAgent` (no LLM yet).
- **Command:** import in REPL
- **Acceptance:** docstrings + signatures.
- **Codex ask:** “Create agent class stubs with documented interfaces.”

### Step 49: Pipeline orchestrator
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/core/pipeline.py`
- **What:** `core/pipeline.py` orchestrates Outline→Draft→Revision with retries.
- **Command:** pipeline tests
- **Acceptance:** retries configurable; returns artifact summary.
- **Codex ask:** “Add pipeline orchestrator with retry.”

### Step 50: Persist history
- **Profiles:** API-only
- **Primary artifacts:** repository/pipeline
- **What:** write `history/` entries per pipeline step.
- **Command:** run pipeline stub
- **Acceptance:** history JSON files appear.
- **Codex ask:** “Persist pipeline history entries.”

### Step 51: Critique rubric
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/critique/rubric.py`
- **What:** scoring + rationale functions.
- **Command:** rubric tests
- **Acceptance:** deterministic results.
- **Codex ask:** “Add critique rubric module.”

### Step 52: Decision checklist gating
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/core/checklist.py`
- **What:** gating logic before exports/accepts.
- **Command:** failing gate test
- **Acceptance:** export blocked with reason.
- **Codex ask:** “Add decision checklist gates and integrate.”

### Step 53: /v2 endpoint to run pipeline
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/routes_v2.py`
- **What:** `POST /v2/projects/{id}/draft` to orchestrate pipeline.
- **Command:** curl POST
- **Acceptance:** 202/200 with artifact metadata.
- **Codex ask:** “Add v2 endpoint that runs pipeline.”

### Step 54: (Optional) SSE streaming
- **Profiles:** API-only
- **Primary artifacts:** pipeline routes
- **What:** stream progress events.
- **Command:** curl with `Accept: text/event-stream`
- **Acceptance:** events received.
- **Codex ask:** “Add optional SSE progress streaming.”

### Step 55: Metrics endpoint
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `black_skies/app/metrics.py`
- **What:** `/api/v1/metrics` with counters for requests/pipelines/errors.
- **Command:** curl `/api/v1/metrics`
- **Acceptance:** counters increment in tests.
- **Codex ask:** “Add Prometheus metrics endpoint and counters.”

### Step 56: Structured logs everywhere
- **Profiles:** API-only
- **Primary artifacts:** logging wrappers
- **What:** include request_id, project_id, step, duration in logs.
- **Command:** run pipeline; inspect logs
- **Acceptance:** fields present.
- **Codex ask:** “Enrich logs with structured fields.”

### Step 57: Integration test (pipeline)
- **Profiles:** API-only
- **Primary artifacts:** `tests/test_integration_pipeline.py`
- **What:** e2e test: outline → pipeline → revision → export.
- **Command:** `pytest -q`
- **Acceptance:** green.
- **Codex ask:** “Add pipeline integration test.”

## Milestone 6 - CLI, UI, Packaging, CI
*Status:* Post-RC (optional)

### Step 58: CLI: init-project
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/cli.py`
- **What:** `black-skies init-project PATH` creates directories & seed outline.
- **Command:** `black-skies init-project /tmp/demo`
- **Acceptance:** tree created.
- **Codex ask:** “Add CLI subcommand `init-project`.”

### Step 59: CLI: export
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/cli.py`
- **What:** `black-skies export PATH --format markdown|jsonl`.
- **Command:** run export
- **Acceptance:** export files appear.
- **Codex ask:** “Add CLI subcommand `export`.”

### Step 60: Static UI (build-less)
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `ui/index.html`
- **What:** `ui/index.html` using fetch for health, outline load/save, pipeline trigger, export download.
- **Command:** open in browser
- **Acceptance:** flows work without Node build.
- **Codex ask:** “Add build-less static UI served by FastAPI.”

### Step 61: Serve static assets
- **Profiles:** API-only
- **Primary artifacts:** app factory
- **What:** mount `/` to serve `ui/index.html` & assets.
- **Command:** open `/`
- **Acceptance:** page loads.
- **Codex ask:** “Serve static UI from app.”

### Step 62: Dockerfile (offline-capable)
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `Dockerfile`
- **What:** multi-stage image copying wheels; install with `--no-index`.
- **Command:** `docker build .`
- **Acceptance:** builds offline (wheels present).
- **Codex ask:** “Add Dockerfile that installs from local wheels.”

### Step 63: Makefile (quality-of-life)
- **Profiles:** API-only
- **Primary artifacts:** `Makefile`
- **What:** `make setup`, `make test`, `make serve`, `make wheels`.
- **Command:** `make test`
- **Acceptance:** targets succeed.
- **Codex ask:** “Add Makefile with common targets.”

### Step 64: GitHub Actions: lint+test
- **Profiles:** API-only
- **Primary artifacts:** `.github/workflows/lint-test.yml`
- **What:** workflow runs `scripts/setup` + `scripts/maint`; caches wheels/venv by hash.
- **Command:** push PR; observe CI
- **Acceptance:** CI passes.
- **Codex ask:** “Add CI workflow to run setup/maint with caching.”

### Step 65: CI: build & push image on tags
- **Profiles:** Desktop, Browser
- **Primary artifacts:** `.github/workflows/release.yml`
- **What:** publish image to GHCR on `v*` tags.
- **Command:** tag push
- **Acceptance:** image published.
- **Codex ask:** “Add release workflow to build/push Docker image on tags.”

### Step 66: README overhaul
- **Profiles:** All
- **Primary artifacts:** `README.md`
- **What:** quickstart (offline wheels), commands, API, UI walkthrough.
- **Command:** fresh clone; follow steps
- **Acceptance:** works end-to-end.
- **Codex ask:** “Rewrite README with offline quickstart.”

### Step 67: CHANGELOG + versioning
- **Profiles:** API-only
- **Primary artifacts:** `CHANGELOG.md`, `pyproject.toml`
- **What:** `CHANGELOG.md` (Keep a Changelog), bump to `1.0.0`.
- **Command:** -
- **Acceptance:** release notes recorded.
- **Codex ask:** “Add CHANGELOG and bump version.”

### Step 68: Sample data seeds
- **Profiles:** API-only
- **Primary artifacts:** sample tree
- **What:** `samples/demo_project/` with outline/drafts.
- **Command:** run flows against sample
- **Acceptance:** good for demos/tests.
- **Codex ask:** “Add sample project data.”

### Step 69: MkDocs site (optional)
- **Profiles:** Browser
- **Primary artifacts:** `mkdocs.yml`, `docs/*.md`
- **What:** `mkdocs.yml`, docs pages linking architecture, endpoints, build plan.
- **Command:** `mkdocs serve`
- **Acceptance:** site renders locally.
- **Codex ask:** “Add MkDocs config and docs index.”

## Milestone 7 - LLM Integration, Prompts, Safety, Costs
*Status:* Post-RC (optional)

### Step 70: LLM adapter layer
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/core/llm.py`
- **What:** `core/llm.py` interface with `NullProvider` + `OpenAIProvider`.
- **Command:** unit tests
- **Acceptance:** both implement same interface.
- **Codex ask:** “Create LLM adapter with Null + OpenAI providers.”

### Step 71: Provider selection via settings
- **Profiles:** API-only
- **Primary artifacts:** `settings.py`, `llm.py`
- **What:** choose provider based on env/config; default Null.
- **Command:** `OPENAI_API_KEY=dummy` run pipeline
- **Acceptance:** Null used by default; OpenAI when key set.
- **Codex ask:** “Wire provider selection through settings.”

### Step 72: Prompt templates
- **Profiles:** API-only
- **Primary artifacts:** `black_skies/agents/prompts.py`
- **What:** outline/draft/revision templates (jinja or format strings).
- **Command:** prompt tests
- **Acceptance:** renders with placeholders.
- **Codex ask:** “Add prompt templates and render helpers.”

### Step 73: Safety hooks
- **Profiles:** API-only
- **Primary artifacts:** integrate with agents/policies
- **What:** pre-LLM redaction; post-LLM moderation/sanitization.
- **Command:** tests for redaction/moderation
- **Acceptance:** unsafe content blocked or tagged.
- **Codex ask:** “Integrate safety hooks around LLM calls.”

### Step 74: Backoff & rate limits
- **Profiles:** API-only
- **Primary artifacts:** `core/llm.py`
- **What:** retries/backoff and simple rate limiter around LLM calls.
- **Command:** simulated transient error test
- **Acceptance:** retries then fail with clear error.
- **Codex ask:** “Add retry/backoff and basic rate limiting to LLM calls.”

### Step 75: Cost/logging & metrics
- **Profiles:** API-only
- **Primary artifacts:** logging/api/v1/metrics integration
- **What:** log token counts, redact keys, expose metrics per model.
- **Command:** run pipeline; inspect logs/api/v1/metrics
- **Acceptance:** cost fields present (0 for Null).
- **Codex ask:** “Add cost logging and redact secrets.”

### Step 76: Agents call through adapter
- **Profiles:** API-only
- **Primary artifacts:** agent modules
- **What:** `OutlineAgent/DraftAgent/RevisionAgent` call `llm.generate()` when provider ≠ Null.
- **Command:** unit tests with Null + mocked OpenAI
- **Acceptance:** interface consistent.
- **Codex ask:** “Route agents through LLM adapter.”

### Step 77: E2E tests with Null provider
- **Profiles:** API-only
- **Primary artifacts:** `tests/test_e2e_null_llm.py`
- **What:** deterministic pipeline run using NullProvider.
- **Command:** `pytest -q`
- **Acceptance:** green, stable output.
- **Codex ask:** “Add pipeline tests using Null provider.”

### Step 78: Optional smoke with real OpenAI
- **Profiles:** API-only
- **Primary artifacts:** `tests/test_optional_openai.py`
- **What:** test marked `@pytest.mark.optional` when `OPENAI_API_KEY` set.
- **Command:** `OPENAI_API_KEY=... pytest -q -m optional`
- **Acceptance:** passes when key present; skipped otherwise.
- **Codex ask:** “Add optional smoke tests that skip without API key.”

## Milestone 8 - Finishing Touches
*Status:* Post-RC (optional)

### Step 79: Config matrix & env examples
- **Profiles:** All
- **Primary artifacts:** `configs/*`, `.env.example`
- **What:** `configs/` sample envs (dev/offline/ci), `.env.example`.
- **Command:** copy examples and run setup
- **Acceptance:** all modes work.
- **Codex ask:** “Add config samples and `.env.example`.”

### Step 80: Security review pass
- **Profiles:** All
- **Primary artifacts:** `docs/ops/security.md`
- **What:** secrets scanning, log redaction check, dependency audit summary.
- **Command:** run scanner locally if available
- **Acceptance:** findings documented.
- **Codex ask:** “Add security checklist doc and secret redaction tests.”

### Step 81: Performance sanity
- **Profiles:** API-only
- **Primary artifacts:** `scripts/loadtest.py`
- **What:** simple load test script for `/v2/.../draft` (Null provider).
- **Command:** `python scripts/loadtest.py`
- **Acceptance:** baseline throughput recorded.
- **Codex ask:** “Add load test script for pipeline with Null provider.”

### Step 82: Release notes & tags
- **Profiles:** All
- **Primary artifacts:** `CHANGELOG.md`
- **What:** update `CHANGELOG.md` to new version; create Git tag.
- **Command:** `git tag v2.0.0`
- **Acceptance:** notes match shipped features.
- **Codex ask:** “Update changelog and create release tags.”

### Step 83: Contribution guide
- **Profiles:** All
- **Primary artifacts:** `CONTRIBUTING.md`
- **What:** `CONTRIBUTING.md` (branching, PR format, tests, offline rules).
- **Command:** -
- **Acceptance:** doc present.
- **Codex ask:** “Add CONTRIBUTING.md with PR/CI rules.”

### Step 84: Issue templates
- **Profiles:** All
- **Primary artifacts:** `.github/ISSUE_TEMPLATE/*.yml`, `.github/pull_request_template.md`
- **What:** GitHub issue/PR templates.
- **Command:** -
- **Acceptance:** templates appear on GitHub.
- **Codex ask:** “Add GitHub issue and PR templates.”

### Step 85: Post-release smoke checklist
- **Profiles:** All
- **Primary artifacts:** `docs/post_release_checklist.md`
- **What:** create `docs/post_release_checklist.md` with manual QA (installer, pipeline run, export verify).
- **Command:** follow checklist on release
- **Acceptance:** future releases have playbook.
- **Codex ask:** “Add post-release checklist doc.”
