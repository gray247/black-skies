Status: Archived
Version: 0.1.0
Last Reviewed: 2025-11-15

# Build Steps Checklist
> **Status:** Archived reference – canonical Build & Verification content lives in `../BUILD_STEPS_PLAYBOOK.md`.
> **Reference:** Use the playbook for commands, acceptance notes, and Codex asks.

Generated from build_steps.json. Profiles indicate which deployment surfaces a step touches.

## Milestone 0 - Environment, Offline Safety, Hygiene
*Status:* Mandatory for RC

| Step | Summary | Profiles | Artifacts | Command |
| :--- | :------ | :------- | :-------- | :------- |
| 1 | Create setup script (offline-safe) | API-only | `scripts/setup` | `bash scripts/setup` |
| 2 | Create maintenance script | API-only | `scripts/maint` | `bash scripts/maint` |
| 3 | Pin Python deps (runtime) | API-only | `requirements.lock` | `python -m pip install -r requirements.lock` |
| 4 | Pin Python deps (dev) | API-only | `requirements.dev.lock` | `python -m pip install -r requirements.dev.lock` |
| 5 | Wheels freezer | API-only | `scripts/freeze_wheels.sh`, `vendor/wheels/` | `bash scripts/freeze_wheels.sh` |
| 6 | Setup prefers local wheels | API-only | `scripts/setup` | `bash scripts/setup` |
| 7 | Ignore junk files | All | `.gitignore` | `git status` |
| 8 | Editorconfig | All | `.editorconfig` | - |
| 9 | Pytest config suppresses site-packages | API-only | `pyproject.toml` or `pytest.ini` | `pytest -q` |
| 10 | Linter config | All | `.flake8` or `ruff.toml` | `flake8` (or `ruff check .`) |
| 11 | Black config in pyproject | All | `pyproject.toml` | `black --check .` |
| 12 | Node guard rails (optional) | Desktop, Browser | `scripts/setup` | `BS_ALLOW_NODE=1 bash scripts/setup` |

## Milestone 1 - Package Skeleton & App Foundation
*Status:* Mandatory for RC

| Step | Summary | Profiles | Artifacts | Command |
| :--- | :------ | :------- | :-------- | :------- |
| 13 | Create package skeleton | API-only | package tree | `pytest -q` |
| 14 | Settings via pydantic-settings | API-only | `black_skies/core/settings.py` | `python -c "from black_skies.core.settings import Settings; print(Settings())"` |
| 15 | App factory | Desktop, Browser | `black_skies/app/factory.py` | `uvicorn black_skies.app.factory:create_app` |
| 16 | CORS & compression | Desktop, Browser | `black_skies/app/factory.py` | hit `/openapi.json` |
| 17 | Error handler baseline | Desktop, Browser | `black_skies/app/errors.py` | trigger 422 |
| 18 | Logging config | API-only | `black_skies/util/logging.py` | curl endpoint; inspect logs |
| 19 | OpenAPI metadata | Desktop, Browser | `black_skies/app/factory.py` | view `/docs` |
| 20 | CLI entrypoint (serve) | API-only | `black_skies/cli.py`, `pyproject.toml` | `black-skies serve` |
| 21 | Tests: health & settings | API-only | `tests/` | `pytest -q` |

## Milestone 2 - Data Model & Storage
*Status:* Mandatory for RC

| Step | Summary | Profiles | Artifacts | Command |
| :--- | :------ | :------- | :-------- | :------- |
| 22 | Data models | API-only | `black_skies/core/models.py` | `pytest -q` |
| 23 | ID helpers | API-only | `black_skies/util/ids.py` | `python -c "import ..."` |
| 24 | JSON serialization utils | API-only | `black_skies/util/jsonio.py` | round-trip a model |
| 25 | FS layout | API-only | `black_skies/storage/fs_layout.py` | `pytest -q` |
| 26 | Repository with atomic writes | API-only | `black_skies/storage/repository.py` | repo tests |
| 27 | Model validation tests | API-only | `tests/test_models.py` | `pytest -q` |
| 28 | Temp project fixture | API-only | `tests/conftest.py` | `pytest -q` |
| 29 | File lock for concurrency | API-only | `black_skies/storage/lock.py` | concurrency test |

## Milestone 3 - Endpoints MVP (CRUD + Lists)
*Status:* Mandatory for RC

| Step | Summary | Profiles | Artifacts | Command |
| :--- | :------ | :------- | :-------- | :------- |
| 30 | GET outline | Desktop, Browser | `black_skies/app/routes_outline.py` | curl |
| 31 | PUT outline | API-only | same module | curl PUT |
| 32 | POST draft (create) | Desktop, Browser | `black_skies/app/routes_drafts.py` | curl POST |
| 33 | GET draft by id | API-only | `routes_drafts.py` | curl GET |
| 34 | POST revision (create) | Desktop, Browser | `black_skies/app/routes_revisions.py` | curl POST |
| 35 | List endpoints | API-only | routes | curl lists |
| 36 | Dependencies for project root | Desktop, Browser | `black_skies/app/deps.py` | run any endpoint |
| 37 | Response models + examples | API-only | routes + `core/schemas.py` | view `/docs` |
| 38 | Endpoint tests (happy paths) | API-only | `tests/test_endpoints_basic.py` | `pytest -q` |
| 39 | Endpoint tests (edge cases) | API-only | `tests/test_endpoints_edges.py` | `pytest -q` |

## Milestone 4 - Policies & Exporters
*Status:* Mandatory for RC

| Step | Summary | Profiles | Artifacts | Command |
| :--- | :------ | :------- | :-------- | :------- |
| 40 | Policy hooks | API-only | `black_skies/core/policies.py` | policy tests |
| 41 | Wire policies on write | API-only | routes | run existing tests |
| 42 | Export target validation | API-only | export endpoint | attempt invalid export |
| 43 | Markdown exporter | API-only | `black_skies/exports/markdown.py` | invoke exporter |
| 44 | JSONL exporter | API-only | `black_skies/exports/jsonl.py` | invoke exporter |
| 45 | Export endpoint | Desktop, Browser | `black_skies/app/routes_export.py` | curl POST |
| 46 | Exporter tests | API-only | `tests/test_exporters.py` | `pytest -q` |
| 47 | Policy tests | API-only | `tests/test_policies.py` | `pytest -q` |

## Milestone 5 - Agents, Pipeline, Critique, Gates, Observability
*Status:* Post-RC (optional)

| Step | Summary | Profiles | Artifacts | Command |
| :--- | :------ | :------- | :-------- | :------- |
| 48 | Agent stubs | API-only | `black_skies/agents/*.py` | import in REPL |
| 49 | Pipeline orchestrator | API-only | `black_skies/core/pipeline.py` | pipeline tests |
| 50 | Persist history | API-only | repository/pipeline | run pipeline stub |
| 51 | Critique rubric | API-only | `black_skies/critique/rubric.py` | rubric tests |
| 52 | Decision checklist gating | API-only | `black_skies/core/checklist.py` | failing gate test |
| 53 | /v2 endpoint to run pipeline | Desktop, Browser | `black_skies/app/routes_v2.py` | curl POST |
| 54 | (Optional) SSE streaming | API-only | pipeline routes | curl with `Accept: text/event-stream` |
| 55 | Metrics endpoint | Desktop, Browser | `black_skies/app/metrics.py` | curl `/api/v1/metrics` |
| 56 | Structured logs everywhere | API-only | logging wrappers | run pipeline; inspect logs |
| 57 | Integration test (pipeline) | API-only | `tests/test_integration_pipeline.py` | `pytest -q` |

## Milestone 6 - CLI, UI, Packaging, CI
*Status:* Post-RC (optional)

| Step | Summary | Profiles | Artifacts | Command |
| :--- | :------ | :------- | :-------- | :------- |
| 58 | CLI: init-project | API-only | `black_skies/cli.py` | `black-skies init-project /tmp/demo` |
| 59 | CLI: export | API-only | `black_skies/cli.py` | run export |
| 60 | Static UI (build-less) | Desktop, Browser | `ui/index.html` | open in browser |
| 61 | Serve static assets | API-only | app factory | open `/` |
| 62 | Dockerfile (offline-capable) | Desktop, Browser | `Dockerfile` | `docker build .` |
| 63 | Makefile (quality-of-life) | API-only | `Makefile` | `make test` |
| 64 | GitHub Actions: lint+test | API-only | `.github/workflows/lint-test.yml` | push PR; observe CI |
| 65 | CI: build & push image on tags | Desktop, Browser | `.github/workflows/release.yml` | tag push |
| 66 | README overhaul | All | `README.md` | fresh clone; follow steps |
| 67 | CHANGELOG + versioning | API-only | `CHANGELOG.md`, `pyproject.toml` | - |
| 68 | Sample data seeds | API-only | sample tree | run flows against sample |
| 69 | MkDocs site (optional) | Browser | `mkdocs.yml`, `docs/*.md` | `mkdocs serve` |

## Milestone 7 - LLM Integration, Prompts, Safety, Costs
*Status:* Post-RC (optional)

| Step | Summary | Profiles | Artifacts | Command |
| :--- | :------ | :------- | :-------- | :------- |
| 70 | LLM adapter layer | API-only | `black_skies/core/llm.py` | unit tests |
| 71 | Provider selection via settings | API-only | `settings.py`, `llm.py` | `OPENAI_API_KEY=dummy` run pipeline |
| 72 | Prompt templates | API-only | `black_skies/agents/prompts.py` | prompt tests |
| 73 | Safety hooks | API-only | integrate with agents/policies | tests for redaction/moderation |
| 74 | Backoff & rate limits | API-only | `core/llm.py` | simulated transient error test |
| 75 | Cost/logging & metrics | API-only | logging/api/v1/metrics integration | run pipeline; inspect logs/api/v1/metrics |
| 76 | Agents call through adapter | API-only | agent modules | unit tests with Null + mocked OpenAI |
| 77 | E2E tests with Null provider | API-only | `tests/test_e2e_null_llm.py` | `pytest -q` |
| 78 | Optional smoke with real OpenAI | API-only | `tests/test_optional_openai.py` | `OPENAI_API_KEY=... pytest -q -m optional` |

## Milestone 8 - Finishing Touches
*Status:* Post-RC (optional)

| Step | Summary | Profiles | Artifacts | Command |
| :--- | :------ | :------- | :-------- | :------- |
| 79 | Config matrix & env examples | All | `configs/*`, `.env.example` | copy examples and run setup |
| 80 | Security review pass | All | `docs/ops/security.md` | run scanner locally if available |
| 81 | Performance sanity | API-only | `scripts/loadtest.py` | `python scripts/loadtest.py` |
| 82 | Release notes & tags | All | `CHANGELOG.md` | `git tag v2.0.0` |
| 83 | Contribution guide | All | `CONTRIBUTING.md` | - |
| 84 | Issue templates | All | `.github/ISSUE_TEMPLATE/*.yml`, `.github/pull_request_template.md` | - |
| 85 | Post-release smoke checklist | All | `docs/post_release_checklist.md` | follow checklist on release |
