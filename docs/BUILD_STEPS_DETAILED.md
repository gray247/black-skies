# Black Skies — Detailed Build Steps

**Purpose:** end-to-end roadmap (~85 steps) covering environment hygiene, services, UI, packaging, and LLM integration. Use together with `docs/BUILD_PLAN.md`: that file tracks high-level milestones (P1–P4); this one expands each item into concrete tasks so every session can resume at a precise step.

**How to work:**
- Start at the lowest-numbered unfinished step.
- Read its “What” / “Files” / “Command” / “Acceptance”.
- Run the command (or equivalent) and verify the acceptance criteria.
- Paste the provided **Codex ask** into Codex CLI for automation.
- Mark the step as done in your tracking log (e.g., `phase_log.md`, `.codex_history`, or issue tracker).

Milestones may overlap; keep their order but feel free to work ahead if prerequisites are satisfied. Steps already completed in the repo can be checked off immediately when you adopt this plan.

> [!NOTE]
> Steps that cite paths under `black_skies/` describe the historical package layout that shipped prior to Phase 1. When reproducing those steps against the current tree, use the equivalent modules under `services/src/blackskies/services/`.

---

## Milestone 0 — Environment, Offline Safety, Hygiene

1. **Create setup script (offline-safe)**
   - What: Bash `scripts/setup` to create `.venv`, install pinned deps (or local wheels), and write `.env`.
   - Files: `scripts/setup`
   - Command: `bash scripts/setup`
   - Acceptance: exits 0; `.venv/` exists; `.env` has `OPENAI_API_KEY=dummy`.
   - Codex ask: “Add offline-safe `scripts/setup` that creates venv, installs from `vendor/wheels` if present, and writes `.env`.”

2. **Create maintenance script**
   - What: Bash `scripts/maint` to run `black --check`, linter, and `pytest`; never touches `.venv`.
   - Files: `scripts/maint`
   - Command: `bash scripts/maint`
   - Acceptance: runs offline; doesn’t install anything.
   - Codex ask: “Add `scripts/maint` to run format/lint/tests excluding `.venv`, `vendor`, `node_modules`.”

3. **Pin Python deps (runtime)**
   - What: Add `requirements.lock` with exact versions (fastapi, starlette, pydantic, uvicorn[standard], httpx, tenacity, etc.).
   - Files: `requirements.lock`
   - Command: `python -m pip install -r requirements.lock`
   - Acceptance: installs cleanly online.
   - Codex ask: “Create `requirements.lock` with exact versions for runtime deps.”

4. **Pin Python deps (dev)**
   - What: Add `requirements.dev.lock` (pytest, pytest-cov, pytest-rerunfailures, black, flake8/ruff).
   - Files: `requirements.dev.lock`
   - Command: `python -m pip install -r requirements.dev.lock`
   - Acceptance: dev tools install cleanly online.
   - Codex ask: “Create `requirements.dev.lock` with exact versions for dev/test deps.”

5. **Wheels freezer**
   - What: `scripts/freeze_wheels.sh` downloads wheels into `vendor/wheels/` for both lockfiles.
   - Files: `scripts/freeze_wheels.sh`, `vendor/wheels/`
   - Command: `bash scripts/freeze_wheels.sh`
   - Acceptance: directory populated with wheels; offline install works.
   - Codex ask: “Add `scripts/freeze_wheels.sh` that downloads all wheels for offline use.”

6. **Setup prefers local wheels**
   - What: Make `scripts/setup` try `--no-index --find-links vendor/wheels` first, then fall back online.
   - Files: `scripts/setup`
   - Command: `bash scripts/setup`
   - Acceptance: offline path succeeds when wheels exist.
   - Codex ask: “Modify setup to prefer local wheels; fall back to online gracefully.”

7. **Ignore junk files**
   - What: Add `.gitignore` entries for `.venv`, `vendor/wheels`, `node_modules`, caches.
   - Files: `.gitignore`
   - Command: `git status`
   - Acceptance: build artifacts ignored.
   - Codex ask: “Add comprehensive `.gitignore`.”

8. **Editorconfig**
   - What: Add `.editorconfig` (UTF-8, LF, 2 or 4 spaces).
   - Files: `.editorconfig`
   - Command: —
   - Acceptance: file present with sane defaults.
   - Codex ask: “Add `.editorconfig` with LF, UTF-8, consistent indentation.”

9. **Pytest config suppresses site-packages**
   - What: Configure pytest to ignore `.venv` and third-party paths.
   - Files: `pyproject.toml` or `pytest.ini`
   - Command: `pytest -q`
   - Acceptance: no collection from site-packages.
   - Codex ask: “Configure pytest to ignore `.venv`, `vendor`, `node_modules`.”

10. **Linter config**
    - What: Add `.flake8` or `ruff.toml` with excludes & line length 100.
    - Files: `.flake8` or `ruff.toml`
    - Command: `flake8` (or `ruff check .`)
    - Acceptance: lints only our code.
    - Codex ask: “Add linter config excluding `.venv`, `vendor`, `node_modules`, set max-line-length=100.”

11. **Black config in pyproject**
    - What: Centralize black/pytest coverage settings in `pyproject.toml`.
    - Files: `pyproject.toml`
    - Command: `black --check .`
    - Acceptance: format/lint/test configs live together.
    - Codex ask: “Add black/pytest configs to `pyproject.toml`.”

12. **Node guard rails (optional)**
    - What: Gate Node install behind `BS_ALLOW_NODE=1`; skip if registry blocked.
    - Files: `scripts/setup`
    - Command: `BS_ALLOW_NODE=1 bash scripts/setup`
    - Acceptance: no hard failures when Node unavailable.
    - Codex ask: “Gate Node steps behind env flag and check registry before install.”

---

## Milestone 1 — Package Skeleton & App Foundation

13. **Create package skeleton**
    - What: `black_skies/` with `app/ core/ storage/ agents/ exports/ critique/ util/ __init__.py`.
    - Files: package tree
    - Command: `pytest -q`
    - Acceptance: package importable.
    - Codex ask: “Create Python package skeleton with the listed subpackages.”

14. **Settings via pydantic-settings**
    - What: `core/settings.py` with `OPENAI_API_KEY`, `BLACK_SKIES_MODE`, etc.
    - Files: `black_skies/core/settings.py`
    - Command: `python -c "from black_skies.core.settings import Settings; print(Settings())"`
    - Acceptance: defaults read from `.env`, env overrides work.
    - Codex ask: “Add Settings model using pydantic-settings reading `.env`.”

15. **App factory**
    - What: `app/factory.py` → FastAPI `create_app()` with `/api/v1/healthz`.
    - Files: `black_skies/app/factory.py`
    - Command: `uvicorn black_skies.app.factory:create_app`
    - Acceptance: GET `/api/v1/healthz` → `{"ok": true}`.
    - Codex ask: “Add FastAPI app factory with `/api/v1/healthz` route.”

16. **CORS & compression**
    - What: add CORS (dev defaults) and gzip middleware.
    - Files: `black_skies/app/factory.py`
    - Command: hit `/openapi.json`
    - Acceptance: middleware engaged.
    - Codex ask: “Enable CORS and GZip middleware in app factory.”

17. **Error handler baseline**
    - What: central 422/500 JSON error shape.
    - Files: `black_skies/app/errors.py`
    - Command: trigger 422
    - Acceptance: consistent error JSON.
    - Codex ask: “Add error handlers for 422/500 and wire them.”

18. **Logging config**
    - What: JSON logs + request IDs.
    - Files: `black_skies/util/logging.py`
    - Command: curl endpoint; inspect logs
    - Acceptance: request_id present.
    - Codex ask: “Add structured logging + request ID middleware.”

19. **OpenAPI metadata**
    - What: title, version, tags, server URL notes.
    - Files: `black_skies/app/factory.py`
    - Command: view `/docs`
    - Acceptance: docs show metadata.
    - Codex ask: “Set OpenAPI title/version/tags.”

20. **CLI entrypoint (serve)**
    - What: `black_skies/cli.py` with `serve` command.
    - Files: `black_skies/cli.py`, `pyproject.toml`
    - Command: `black-skies serve`
    - Acceptance: server launches.
    - Codex ask: “Add console_script `black-skies` with `serve` subcommand.”

21. **Tests: health & settings**
    - What: `tests/test_health.py`, `tests/test_settings.py`.
    - Files: `tests/`
    - Command: `pytest -q`
    - Acceptance: both pass.
    - Codex ask: “Add smoke tests for `/api/v1/healthz` and Settings.”

---

## Milestone 2 — Data Model & Storage

22. **Data models**
    - What: Pydantic `Outline`, `DraftUnit`, `Revision`, `HistoryEntry`.
    - Files: `black_skies/core/models.py`
    - Command: `pytest -q`
    - Acceptance: schemas work.
    - Codex ask: “Implement core Pydantic models per spec.”

23. **ID helpers**
    - What: deterministic ID generators (`proj_0001`, `ch_0001`, etc.).
    - Files: `black_skies/util/ids.py`
    - Command: `python -c "import ..."`
    - Acceptance: deterministic outputs.
    - Codex ask: “Add deterministic ID helpers.”

24. **JSON serialization utils**
    - What: read/write helpers with timezone-aware timestamps.
    - Files: `black_skies/util/jsonio.py`
    - Command: round-trip a model
    - Acceptance: equality preserved.
    - Codex ask: “Add JSON read/write helpers with tz handling.”

25. **FS layout**
    - What: canonical paths for outline/drafts/revisions/history.
    - Files: `black_skies/storage/fs_layout.py`
    - Command: `pytest -q`
    - Acceptance: helpers return expected paths.
    - Codex ask: “Define canonical FS layout helpers.”

26. **Repository with atomic writes**
    - What: read/write models with temp file + rename.
    - Files: `black_skies/storage/repository.py`
    - Command: repo tests
    - Acceptance: atomic, idempotent writes.
    - Codex ask: “Implement repository with atomic JSON writes.”

27. **Model validation tests**
    - What: round-trip, required fields, invalid payloads.
    - Files: `tests/test_models.py`
    - Command: `pytest -q`
    - Acceptance: green.
    - Codex ask: “Add model validation & round-trip tests.”

28. **Temp project fixture**
    - What: `tests/conftest.py` fixture `tmp_project_dir` with canonical tree.
    - Files: `tests/conftest.py`
    - Command: `pytest -q`
    - Acceptance: fixture available.
    - Codex ask: “Add tmp_project_dir fixture.”

29. **File lock for concurrency**
    - What: lock file helper (fcntl or portalocker) for writes.
    - Files: `black_skies/storage/lock.py`
    - Command: concurrency test
    - Acceptance: no torn writes.
    - Codex ask: “Add storage lock and use it in repository writes.”

---

## Milestone 3 — Endpoints MVP (CRUD + Lists)

30. **GET outline**
    - What: serve `outline.json` or 404 with friendly detail.
    - Files: `black_skies/app/routes_outline.py`
    - Command: curl
    - Acceptance: 200/404 as expected.
    - Codex ask: “Add GET /v1/projects/{id}/outline.”

31. **PUT outline**
    - What: validate schema, write file.
    - Files: same module
    - Command: curl PUT
    - Acceptance: 200 and content persisted.
    - Codex ask: “Add PUT /v1/projects/{id}/outline with validation.”

32. **POST draft (create)**
    - What: store `DraftUnit`, return id.
    - Files: `black_skies/app/routes_drafts.py`
    - Command: curl POST
    - Acceptance: 201 with new id.
    - Codex ask: “Add POST /v1/projects/{id}/drafts (create).”

33. **GET draft by id**
    - What: fetch stored draft.
    - Files: `routes_drafts.py`
    - Command: curl GET
    - Acceptance: 200 or 404.
    - Codex ask: “Add GET /v1/projects/{id}/drafts/{draft_id}.”

34. **POST revision (create)**
    - What: persist manual revision payload.
    - Files: `black_skies/app/routes_revisions.py`
    - Command: curl POST
    - Acceptance: 201 with id.
    - Codex ask: “Add POST /v1/projects/{id}/revisions.”

35. **List endpoints**
    - What: `GET /v1/projects/{id}/drafts` + `/revisions` with pagination.
    - Files: routes
    - Command: curl lists
    - Acceptance: pagination fields present.
    - Codex ask: “Add list endpoints with limit/offset.”

36. **Dependencies for project root**
    - What: FastAPI dependency to resolve project path & ensure dirs.
    - Files: `black_skies/app/deps.py`
    - Command: run any endpoint
    - Acceptance: directories created as needed.
    - Codex ask: “Add dependency that resolves/creates project directories.”

37. **Response models + examples**
    - What: Pydantic response models & OpenAPI examples.
    - Files: routes + `core/schemas.py`
    - Command: view `/docs`
    - Acceptance: examples visible.
    - Codex ask: “Define response schemas and OpenAPI examples.”

38. **Endpoint tests (happy paths)**
    - What: tests for outline/draft/revision CRUD.
    - Files: `tests/test_endpoints_basic.py`
    - Command: `pytest -q`
    - Acceptance: green.
    - Codex ask: “Add endpoint happy-path tests.”

39. **Endpoint tests (edge cases)**
    - What: 404s, invalid payloads, pagination limits.
    - Files: `tests/test_endpoints_edges.py`
    - Command: `pytest -q`
    - Acceptance: green.
    - Codex ask: “Add endpoint edge-case tests.”

---

## Milestone 4 — Policies & Exporters

40. **Policy hooks**
    - What: `core/policies.py` with `check_project_limits`, `redact_sensitive`, `validate_export_target`.
    - Files: `black_skies/core/policies.py`
    - Command: policy tests
    - Acceptance: helpers documented, callable.
    - Codex ask: “Add core policy functions.”

41. **Wire policies on write**
    - What: call policies in PUT/POST endpoints.
    - Files: routes
    - Command: run existing tests
    - Acceptance: blocked inputs rejected.
    - Codex ask: “Integrate policies into write endpoints.”

42. **Export target validation**
    - What: ensure format/path validated.
    - Files: export endpoint
    - Command: attempt invalid export
    - Acceptance: 400 with message.
    - Codex ask: “Validate export targets with clear errors.”

43. **Markdown exporter**
    - What: outline + drafts → `draft_full.md`.
    - Files: `black_skies/exports/markdown.py`
    - Command: invoke exporter
    - Acceptance: file matches spec.
    - Codex ask: “Add markdown exporter.”

44. **JSONL exporter**
    - What: each draft unit as JSON line.
    - Files: `black_skies/exports/jsonl.py`
    - Command: invoke exporter
    - Acceptance: newline-delimited JSON.
    - Codex ask: “Add JSONL exporter.”

45. **Export endpoint**
    - What: `POST /v1/projects/{id}/export` with `{"format":"markdown|jsonl"}`.
    - Files: `black_skies/app/routes_export.py`
    - Command: curl POST
    - Acceptance: 200 with export info.
    - Codex ask: “Add export endpoint.”

46. **Exporter tests**
    - What: unit tests for markdown/jsonl output.
    - Files: `tests/test_exporters.py`
    - Command: `pytest -q`
    - Acceptance: green.
    - Codex ask: “Add exporter tests (golden output).”

47. **Policy tests**
    - What: verification for redaction/limits.
    - Files: `tests/test_policies.py`
    - Command: `pytest -q`
    - Acceptance: green.
    - Codex ask: “Add policy tests.”

---

## Milestone 5 — Agents, Pipeline, Critique, Gates, Observability

48. **Agent stubs**
    - What: `OutlineAgent`, `DraftAgent`, `RevisionAgent` (no LLM yet).
    - Files: `black_skies/agents/*.py`
    - Command: import in REPL
    - Acceptance: docstrings + signatures.
    - Codex ask: “Create agent class stubs with documented interfaces.”

49. **Pipeline orchestrator**
    - What: `core/pipeline.py` orchestrates Outline→Draft→Revision with retries.
    - Files: `black_skies/core/pipeline.py`
    - Command: pipeline tests
    - Acceptance: retries configurable; returns artifact summary.
    - Codex ask: “Add pipeline orchestrator with retry.”

50. **Persist history**
    - What: write `history/` entries per pipeline step.
    - Files: repository/pipeline
    - Command: run pipeline stub
    - Acceptance: history JSON files appear.
    - Codex ask: “Persist pipeline history entries.”

51. **Critique rubric**
    - What: scoring + rationale functions.
    - Files: `black_skies/critique/rubric.py`
    - Command: rubric tests
    - Acceptance: deterministic results.
    - Codex ask: “Add critique rubric module.”

52. **Decision checklist gating**
    - What: gating logic before exports/accepts.
    - Files: `black_skies/core/checklist.py`
    - Command: failing gate test
    - Acceptance: export blocked with reason.
    - Codex ask: “Add decision checklist gates and integrate.”

53. **/v2 endpoint to run pipeline**
    - What: `POST /v2/projects/{id}/draft` to orchestrate pipeline.
    - Files: `black_skies/app/routes_v2.py`
    - Command: curl POST
    - Acceptance: 202/200 with artifact metadata.
    - Codex ask: “Add v2 endpoint that runs pipeline.”

54. **(Optional) SSE streaming**
    - What: stream progress events.
    - Files: pipeline routes
    - Command: curl with `Accept: text/event-stream`
    - Acceptance: events received.
    - Codex ask: “Add optional SSE progress streaming.”

55. **Metrics endpoint**
    - What: `/api/v1/metrics` with counters for requests/pipelines/errors.
    - Files: `black_skies/app/metrics.py`
    - Command: curl `/api/v1/metrics`
    - Acceptance: counters increment in tests.
    - Codex ask: “Add Prometheus metrics endpoint and counters.”

56. **Structured logs everywhere**
    - What: include request_id, project_id, step, duration in logs.
    - Files: logging wrappers
    - Command: run pipeline; inspect logs
    - Acceptance: fields present.
    - Codex ask: “Enrich logs with structured fields.”

57. **Integration test (pipeline)**
    - What: e2e test: outline → pipeline → revision → export.
    - Files: `tests/test_integration_pipeline.py`
    - Command: `pytest -q`
    - Acceptance: green.
    - Codex ask: “Add pipeline integration test.”

---

## Milestone 6 — CLI, UI, Packaging, CI

58. **CLI: init-project**
    - What: `black-skies init-project PATH` creates directories & seed outline.
    - Files: `black_skies/cli.py`
    - Command: `black-skies init-project /tmp/demo`
    - Acceptance: tree created.
    - Codex ask: “Add CLI subcommand `init-project`.”

59. **CLI: export**
    - What: `black-skies export PATH --format markdown|jsonl`.
    - Files: `black_skies/cli.py`
    - Command: run export
    - Acceptance: export files appear.
    - Codex ask: “Add CLI subcommand `export`.”

60. **Static UI (build-less)**
    - What: `ui/index.html` using fetch for health, outline load/save, pipeline trigger, export download.
    - Files: `ui/index.html`
    - Command: open in browser
    - Acceptance: flows work without Node build.
    - Codex ask: “Add build-less static UI served by FastAPI.”

61. **Serve static assets**
    - What: mount `/` to serve `ui/index.html` & assets.
    - Files: app factory
    - Command: open `/`
    - Acceptance: page loads.
    - Codex ask: “Serve static UI from app.”

62. **Dockerfile (offline-capable)**
    - What: multi-stage image copying wheels; install with `--no-index`.
    - Files: `Dockerfile`
    - Command: `docker build .`
    - Acceptance: builds offline (wheels present).
    - Codex ask: “Add Dockerfile that installs from local wheels.”

63. **Makefile (quality-of-life)**
    - What: `make setup`, `make test`, `make serve`, `make wheels`.
    - Files: `Makefile`
    - Command: `make test`
    - Acceptance: targets succeed.
    - Codex ask: “Add Makefile with common targets.”

64. **GitHub Actions: lint+test**
    - What: workflow runs `scripts/setup` + `scripts/maint`; caches wheels/venv by hash.
    - Files: `.github/workflows/lint-test.yml`
    - Command: push PR; observe CI
    - Acceptance: CI passes.
    - Codex ask: “Add CI workflow to run setup/maint with caching.”

65. **CI: build & push image on tags**
    - What: publish image to GHCR on `v*` tags.
    - Files: `.github/workflows/release.yml`
    - Command: tag push
    - Acceptance: image published.
    - Codex ask: “Add release workflow to build/push Docker image on tags.”

66. **README overhaul**
    - What: quickstart (offline wheels), commands, API, UI walkthrough.
    - Files: `README.md`
    - Command: fresh clone; follow steps
    - Acceptance: works end-to-end.
    - Codex ask: “Rewrite README with offline quickstart.”

67. **CHANGELOG + versioning**
    - What: `CHANGELOG.md` (Keep a Changelog), bump to `1.0.0`.
    - Files: `CHANGELOG.md`, `pyproject.toml`
    - Command: —
    - Acceptance: release notes recorded.
    - Codex ask: “Add CHANGELOG and bump version.”

68. **Sample data seeds**
    - What: `samples/demo_project/` with outline/drafts.
    - Files: sample tree
    - Command: run flows against sample
    - Acceptance: good for demos/tests.
    - Codex ask: “Add sample project data.”

69. **MkDocs site (optional)**
    - What: `mkdocs.yml`, docs pages linking architecture, endpoints, build plan.
    - Files: `mkdocs.yml`, `docs/*.md`
    - Command: `mkdocs serve`
    - Acceptance: site renders locally.
    - Codex ask: “Add MkDocs config and docs index.”

---

## Milestone 7 — LLM Integration, Prompts, Safety, Costs

70. **LLM adapter layer**
    - What: `core/llm.py` interface with `NullProvider` + `OpenAIProvider`.
    - Files: `black_skies/core/llm.py`
    - Command: unit tests
    - Acceptance: both implement same interface.
    - Codex ask: “Create LLM adapter with Null + OpenAI providers.”

71. **Provider selection via settings**
    - What: choose provider based on env/config; default Null.
    - Files: `settings.py`, `llm.py`
    - Command: `OPENAI_API_KEY=dummy` run pipeline
    - Acceptance: Null used by default; OpenAI when key set.
    - Codex ask: “Wire provider selection through settings.”

72. **Prompt templates**
    - What: outline/draft/revision templates (jinja or format strings).
    - Files: `black_skies/agents/prompts.py`
    - Command: prompt tests
    - Acceptance: renders with placeholders.
    - Codex ask: “Add prompt templates and render helpers.”

73. **Safety hooks**
    - What: pre-LLM redaction; post-LLM moderation/sanitization.
    - Files: integrate with agents/policies
    - Command: tests for redaction/moderation
    - Acceptance: unsafe content blocked or tagged.
    - Codex ask: “Integrate safety hooks around LLM calls.”

74. **Backoff & rate limits**
    - What: retries/backoff and simple rate limiter around LLM calls.
    - Files: `core/llm.py`
    - Command: simulated transient error test
    - Acceptance: retries then fail with clear error.
    - Codex ask: “Add retry/backoff and basic rate limiting to LLM calls.”

75. **Cost/logging & metrics**
    - What: log token counts, redact keys, expose metrics per model.
    - Files: logging/api/v1/metrics integration
    - Command: run pipeline; inspect logs/api/v1/metrics
    - Acceptance: cost fields present (0 for Null).
    - Codex ask: “Add cost logging and redact secrets.”

76. **Agents call through adapter**
    - What: `OutlineAgent/DraftAgent/RevisionAgent` call `llm.generate()` when provider ≠ Null.
    - Files: agent modules
    - Command: unit tests with Null + mocked OpenAI
    - Acceptance: interface consistent.
    - Codex ask: “Route agents through LLM adapter.”

77. **E2E tests with Null provider**
    - What: deterministic pipeline run using NullProvider.
    - Files: `tests/test_e2e_null_llm.py`
    - Command: `pytest -q`
    - Acceptance: green, stable output.
    - Codex ask: “Add pipeline tests using Null provider.”

78. **Optional smoke with real OpenAI**
    - What: test marked `@pytest.mark.optional` when `OPENAI_API_KEY` set.
    - Files: `tests/test_optional_openai.py`
    - Command: `OPENAI_API_KEY=... pytest -q -m optional`
    - Acceptance: passes when key present; skipped otherwise.
    - Codex ask: “Add optional smoke tests that skip without API key.”

---

## Milestone 8 — Finishing Touches

79. **Config matrix & env examples**
    - What: `configs/` sample envs (dev/offline/ci), `.env.example`.
    - Files: `configs/*`, `.env.example`
    - Command: copy examples and run setup
    - Acceptance: all modes work.
    - Codex ask: “Add config samples and `.env.example`.”

80. **Security review pass**
    - What: secrets scanning, log redaction check, dependency audit summary.
    - Files: `docs/security.md`
    - Command: run scanner locally if available
    - Acceptance: findings documented.
    - Codex ask: “Add security checklist doc and secret redaction tests.”

81. **Performance sanity**
    - What: simple load test script for `/v2/.../draft` (Null provider).
    - Files: `scripts/loadtest.py`
    - Command: `python scripts/loadtest.py`
    - Acceptance: baseline throughput recorded.
    - Codex ask: “Add load test script for pipeline with Null provider.”

82. **Release notes & tags**
    - What: update `CHANGELOG.md` to new version; create Git tag.
    - Files: `CHANGELOG.md`
    - Command: `git tag v2.0.0`
    - Acceptance: notes match shipped features.
    - Codex ask: “Update changelog and create release tags.”

83. **Contribution guide**
    - What: `CONTRIBUTING.md` (branching, PR format, tests, offline rules).
    - Files: `CONTRIBUTING.md`
    - Command: —
    - Acceptance: doc present.
    - Codex ask: “Add CONTRIBUTING.md with PR/CI rules.”

84. **Issue templates**
    - What: GitHub issue/PR templates.
    - Files: `.github/ISSUE_TEMPLATE/*.yml`, `.github/pull_request_template.md`
    - Command: —
    - Acceptance: templates appear on GitHub.
    - Codex ask: “Add GitHub issue and PR templates.”

85. **Post-release smoke checklist**
    - What: create `docs/post_release_checklist.md` with manual QA (installer, pipeline run, export verify).
    - Files: `docs/post_release_checklist.md`
    - Command: follow checklist on release
    - Acceptance: future releases have playbook.
    - Codex ask: “Add post-release checklist doc.”

---

### Minimal Test Matrix
- Unit: models, ids, jsonio, policies, exporters, LLM adapter (Null).
- API: outline/drafts/revisions CRUD; export; pipeline v2.
- Integration: pipeline with history + export.
- Optional: SSE, OpenAI smoke.
- Quality: black, flake8/ruff (`scripts/maint`).
- Metrics/logs: counters increment; request_id present.

---

### Handy Commands
- Setup (offline-capable): `bash scripts/setup`
- Freeze wheels when online: `bash scripts/freeze_wheels.sh`
- Quality gate: `bash scripts/maint`
- Serve: `black-skies serve`
- Init project: `black-skies init-project ./projects/demo`
- Run pipeline (Null): `curl -X POST http://localhost:8000/v2/projects/demo/draft`
- Export: `black-skies export ./projects/demo --format markdown`

Document maintained alongside `docs/BUILD_PLAN.md`. Update both when scopes change, and log decisions in `phase_log.md`.
