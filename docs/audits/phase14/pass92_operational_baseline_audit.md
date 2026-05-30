# Pass 92 - Operational Baseline Audit

## 1. Scope Declaration

Pass 92 is a discovery-only audit.

This pass inspects the current Black Skies operational baseline without repairing it.

Hard firewall preserved:

- audit discovers
- recovery repairs
- no source, test, package, build-config, or dependency changes were made

Primary audit question:

- what Black Skies actually is right now in this workspace, as supported by direct command evidence, runtime observations, and current runtime authority docs

## 2. Starting Repo State

- Repository: `C:\Dev\black-skies`
- Branch required: `phase-b2-memory-lab`
- Branch observed: `phase-b2-memory-lab`
- Latest commit required: `docs: plan operational baseline audit`
- Latest commit observed: `a652bd3 docs: plan operational baseline audit`
- Starting working tree: clean
- Starting branch status: `ahead 7`

Preflight result:

- pass conditions satisfied, so Pass 92 proceeded

## 3. Files / Configs Inspected

High-authority audit inputs:

- `docs/audits/phase14/pass91_operational_baseline_intake_plan.md`
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/specs/current_state.md`
- `docs/specs/capability_truth_matrix.md`
- `docs/specs/README.md`
- `docs/specs/architecture.md`
- `docs/specs/endpoints.md`
- `docs/specs/editorial_workflow_contract.md`
- `docs/specs/memory_runtime.md`
- `docs/specs/model_runtime.md`
- `README.md`
- `build/runtime_truth.json`

Command/config surfaces:

- `package.json`
- `app/package.json`
- `pyproject.toml`
- `pytest.ini`
- `services/pyproject.toml`
- `config/runtime.yaml`
- `services/src/blackskies/services/config.py`
- `services/src/blackskies/services/feature_flags.py`
- `services/src/blackskies/services/app.py`
- `app/shared/config/runtime.ts`

Runtime/validation scripts and docs:

- `start-codex.ps1`
- `scripts/dev-runner.mjs`
- `scripts/smoke.ps1`
- `scripts/smoke_runner.py`
- `scripts/run_service_truth.py`
- `scripts/truth-with-backend.mjs`
- `services/README.md`
- `docs/tests.md`
- `docs/reviews/validation_failures_and_blockers.md`

Source/test structure inventory:

- `app/` file tree via `rg --files app`
- `services/` file tree via `rg --files services`
- `scripts/` file tree via `rg --files scripts`
- feature/reference greps over `app/renderer`, `app/main`, `app/shared`, and `services/src/blackskies/services`

## 4. Command Evidence Log

| Command | Result | What it can prove | What it cannot prove | Forbidden claim / note |
| --- | --- | --- | --- | --- |
| `git status --short` | pass | starting tree cleanliness | product health | clean tree does not mean working product |
| `git status -sb` | pass | branch and ahead/behind state | commit correctness beyond shown branch head | branch correctness does not prove audit readiness by itself |
| `git log -1 --oneline` | pass | latest commit subject/hash | broader history intent | latest commit match does not prove prior pass quality |
| `node --version` | pass (`v22.19.0`) | actual Node version in workspace | compatibility with all scripts | docs say Node 20+, but command success matters more than doc promise |
| `pnpm --version` | pass (`8.15.9`) | actual pnpm version | full workspace health | version presence does not prove dependency integrity |
| `python --version` | pass (`3.13.7`) | actual default Python version | backend compatibility | docs require 3.11; observed 3.13 is drift, not automatic failure |
| `(Get-Command python).Source` | pass | active python path | whether all subprocesses use the same interpreter | interpreter path does not prove correct venv activation |
| `(Get-Command pnpm).Source` | pass | active pnpm shim path | install state beyond command resolution | shim presence does not prove package graph health |
| `.venv\Scripts\python.exe --version` | pass (`3.13.7`) | venv Python version | package compatibility | local venv does not meet documented 3.11 expectation |
| `pnpm lint:docs` | pass | current docs-lint lane passes | runtime or workflow truth | green docs lint is docs hygiene only |
| `pnpm --filter app build` | pass | renderer build currently succeeds | Electron launchability, UX correctness | passing renderer build is not app readiness |
| `pnpm --filter app build:main` | pass | main-process TypeScript build succeeds | full packaged desktop workflow | passing main build is not release proof |
| `pnpm --filter app test` | fail | current renderer/unit lane is not green | real-service truth, user-facing runtime failure scope | failed unit lane is not the same thing as launch failure |
| `python -m pytest services/tests -q` | fail | full backend suite is not green | exact product baseline across every failure domain | failing broad suite does not erase narrower truth-lane passes |
| `python scripts/run_service_truth.py` | pass with warning | authoritative PASS 2 backend truth subset passes in this workspace | renderer truth, GUI usability, full suite health | subset truth lane is narrower than product readiness |
| `.venv\Scripts\python.exe -m blackskies.services --host 127.0.0.1 --port 43801` plus `Invoke-WebRequest` to `/api/v1/healthz` and `/` | pass | service process starts and serves baseline routes in this workspace | full workflow correctness, long-session stability | startup success is not full service readiness |
| `pnpm dev` | pass-started, bounded stop | Vite dev server starts, Electron main process creates a window, app loads configured URL | GUI correctness, interaction quality, durable stability | launch start is not a human smoke pass |
| `pnpm test:truth` | pass | declared real-service truth lane passes end-to-end in this workspace, including critique/rewrite truth path and service extension checks | all UI workflows, all edge cases, long-running reliability | green truth lane is strong but still bounded evidence |
| `git diff --check` | pass | no whitespace/conflict-marker issues in tracked changes after audit | product correctness | hygiene pass is not behavior proof |
| final `git status --short` / `git status -sb` | pass | audit commands left tree clean | absence of hidden transient effects outside git | clean tree does not prove no runtime side effects outside repo |

Commands deliberately not run:

- `pnpm --filter app package:dir`
  - not run to avoid heavier release artifacts during a discovery pass
  - can prove packaging-only behavior, but was not required to establish the ordinary build/test/runtime baseline
- `pnpm --filter app package:win`
  - not run for the same artifact/scope reason
- `powershell.exe -ExecutionPolicy Bypass -File .\start-codex.ps1 -SmokeTest`
  - not run because it performs setup/install behavior and smoke cycles against sample projects; the pass used narrower bounded launch/truth commands instead
- Playwright harness lanes such as `pnpm test:e2e`
  - not run because the repo already documents Windows harness spawn instability and the authoritative truth lane was available
- human GUI smoke
  - not possible for Codex to verify visually; any such claim would be fake

## 5. Validation Scope Notes

Observed command evidence was classified conservatively.

Rules applied:

- documented script does not equal working workflow
- green tests do not equal product readiness
- build success does not equal launch success
- process start does not equal usable GUI
- truth-lane success does not erase unrelated failing broad suites
- feature-flag presence does not equal baseline product surface

Important environment drift discovered:

- docs expect Node 20+ and Python 3.11
- observed workspace used Node `22.19.0` and Python `3.13.7`
- core build and truth lanes still ran, but the drift weakens any claim that this workspace matches the documented baseline exactly

## 6. Build / Test Baseline

### Build baseline

- `pnpm --filter app build`: passed
- `pnpm --filter app build:main`: passed
- packaging lanes: not run

Observed meaning:

- renderer and Electron main bundles currently compile in this workspace
- this proves buildability of the ordinary app bundles
- this does not prove packaged release integrity, installer correctness, or runtime UX correctness

### Test baseline

- `pnpm lint:docs`: passed
- `pnpm --filter app test`: failed
- `python -m pytest services/tests -q`: failed
- `python scripts/run_service_truth.py`: passed with one pytest config warning
- `pnpm test:truth`: passed

Observed failing lanes:

1. Renderer/unit lane:
   - failing test: `renderer/__tests__/AppCritique.test.tsx`
   - observed failure: critique + rewrite flow did not leave the mocked `ProjectHome` draft synchronized to the expected revised text

2. Full backend suite:
   - failing test: `services/tests/prototype/test_memory_accept_race.py::test_memory_accept_race_resolution`
   - observed failure: Windows `PermissionError` during atomic replace in `memory_prototype/storage.py`
   - failing test: `services/tests/unit/test_config.py::test_env_example_documents_service_settings`
   - observed failure: `.env.example` does not document three current `ServiceSettings` fields
   - failing test: `services/tests/unit/test_draft_generation_experiment.py::test_provider_backed_draft_error_falls_back`
   - observed failure: provider timeout raises `DraftGenerationProviderTimeoutError` instead of falling back as the test expects

3. PASS 2 service-truth warning:
   - warning: pytest reported unknown config option `cache_dir`
   - lane still passed

Meaning:

- the repo has a working narrow truth path
- the repo does not have a fully green broad validation matrix
- current validation health is mixed, not clean

## 7. Runtime / Launch Baseline

### Backend/service startup

Classification: `VERIFIED WORKING`

Evidence:

- `.venv\Scripts\python.exe -m blackskies.services --host 127.0.0.1 --port 43801`
- `GET /api/v1/healthz` returned `200`
- `GET /` returned service manifest JSON

Confidence:

- high for bounded startup/health

Not proven:

- long-session stability
- provider-backed calls
- every route family under production load

### App/dev launch

Classification: `PARTIAL / UNCERTAIN`

Evidence:

- `pnpm dev` started Vite on `http://127.0.0.1:5173/`
- Electron main process logged `Creating main window`
- Electron loaded the renderer URL

Confidence:

- medium for "starts without immediate crash"

Not proven:

- usable GUI
- complete writer workflow
- layout correctness after full interaction

Human-smoke note:

- GUI correctness remains `NOT OBSERVED — REQUIRES HUMAN SMOKE`

### Truth-lane runtime

Classification: `VERIFIED WORKING`

Evidence:

- `pnpm test:truth` passed
- observed live backend + Electron launch
- observed recent-project open
- observed preflight bridge
- observed critique route
- observed rewrite route
- observed accept snapshot persistence checks
- observed recovery route
- observed backup verification report route
- observed export route

Confidence:

- high for the specific truth-lane workflow

Not proven:

- ordinary manual Generate button path
- project switching
- offline degraded UX
- general GUI usability

## 8. Feature Surface Reality Matrix

| Surface | Classification | Evidence source | Confidence | What was not proven | Next lane |
| --- | --- | --- | --- | --- | --- |
| App launch | `PARTIAL / UNCERTAIN` | `pnpm dev` logs show Vite ready, Electron main window created, renderer URL loaded | medium | visible GUI correctness and user flow quality | human smoke |
| Backend/service startup | `VERIFIED WORKING` | direct service start + `GET /api/v1/healthz` + `GET /` | high | non-trivial route families under longer usage | keep |
| Project open/load | `VERIFIED WORKING` | `pnpm test:truth` loaded recent project, ProjectHome success logs, active scene set | high | manual folder-pick flow and malformed-project handling by human smoke | keep |
| Project switching | `NOT OBSERVED` | only code/tests reference reopen and load paths | low | actual switch between two loaded projects in live GUI | investigate |
| Drafting/generation | `PARTIAL / UNCERTAIN` | preflight route observed live in truth lane; generate/accept exercised by service smoke/truth scripts outside ordinary UI click proof | medium | ordinary Generate button click path, sustained multi-scene generation UX | investigate |
| Critique/feedback | `VERIFIED WORKING` | truth lane observed `/api/v1/draft/critique` through live renderer bridge | high | broader critique quality and edge-case UX | keep |
| Rewrite/apply | `PARTIAL / UNCERTAIN` | truth lane observed `/api/v1/draft/rewrite`; renderer unit lane failed critique-sync expectation | medium | stable local draft sync behavior across renderer state | rebuild |
| Snapshots/recovery | `PARTIAL / UNCERTAIN` | truth lane verified accept snapshot authority, recovery status route, snapshot listing; UI restore not directly smoked | medium | manual restore UX and project switching after recovery | investigate |
| Offline/online service health | `PARTIAL / UNCERTAIN` | service health pill/banner code exists; truth lane saw online state only; docs track offline/test harness boundaries | low-medium | operator-facing degraded behavior in real offline conditions | investigate |
| Diagnostics/error visibility | `FAKE-COMPLETE RISK` | diagnostics/support docs are extensive; runtime UI proof not observed; recovery/diagnostics boundary remains a recurring governance topic | medium | user-safe diagnostics semantics and access boundaries | investigate |
| Binder/story structure | `NEEDS DEEPER AUDIT` | `StoryNavigationPanel`, `storyUnits.ts`, and large structural planning/audit history exist; no bounded live proof of a stable binder model | low | whether this is a real baseline feature or historical pressure residue | investigate |
| Timeline/panes/workspace | `PARTIAL / UNCERTAIN` | dock workspace, corkboard, analytics dashboard, relationship graph, and workspace header exist; truth lane saw dock workspace live; architecture doc still calls some layout promises experimental/not shipped | medium | human usability, authoritative pane policy, default-vs-experimental clarity | investigate |
| Export | `PARTIAL / UNCERTAIN` | truth lane verified `/api/v1/export` artifact content; renderer export button exists | medium | ordinary user-triggered export UX in the live app | keep |
| Settings/configuration | `EXISTS BUT BROKEN` | `config/runtime.yaml` is live; `services/tests/unit/test_config.py` fails because `.env.example` is incomplete | high | end-user settings UX; documented env/config parity is currently broken | rebuild |
| Packaging/release build | `NOT OBSERVED` | package scripts exist only | low | package-dir, Windows installer, portable build, launch from packaged artifact | investigate |
| Local/API model behavior | `PARTIAL / UNCERTAIN` | runtime truth says routing is active, provider execution off by default; truth lane logged `api_only` routing decisions; full service suite shows a provider-timeout fallback failure | medium | durable provider fallback semantics and real provider-call health | investigate |
| Analytics surface | `PARTIAL / UNCERTAIN` | runtime truth marks analytics production/on by default; truth lane hit analytics routes successfully; UI value/quality not directly smoked | medium | end-user trustworthiness of analytics interpretations | keep |
| Companion overlay | `PARTIAL / UNCERTAIN` | component exists in live app shell; README and architecture describe it; no direct interaction observed | low-medium | usefulness, safety, and day-to-day workflow legitimacy | defer |
| Split Command workspace | `PLANNED ONLY` for baseline, `FAKE-COMPLETE RISK` for code presence | code/tests exist, but runtime defaults keep `experimentalSplitCommandWorkspace` off; large historical implementation trail remains gated | medium | production legitimacy as a baseline writer surface | defer |
| Memory Lab | `PLANNED ONLY` for baseline | current runtime docs and config mark it implemented-but-off/experimental | high | whether it should move beyond advisory optionality | defer |
| Plugins | `PLANNED ONLY` for baseline | feature-gated off in current runtime docs and flags | high | any real product workflow | kill or defer depending roadmap reconstruction |
| Backup verifier daemon UX | `PLANNED ONLY` for baseline | health payload exposes disabled state; current_state and architecture say subsystem exists but is off by default | high | operator UX as a normal feature | defer |

## 9. Broken Workflow Inventory

Observed broken or suspicious workflows:

1. Renderer critique/rewrite sync lane is broken
   - Evidence: `pnpm --filter app test`
   - Failure: `renderer/__tests__/AppCritique.test.tsx > runs critique, rewrites, and applies the revision`
   - Observed break: final draft state in mocked `ProjectHome` did not match expected revised text
   - Likely ownership: renderer/editorial workflow boundary

2. Full backend test lane is not green
   - Evidence: `python -m pytest services/tests -q`
   - Failure A: prototype memory accept race on Windows atomic replace
   - Failure B: `.env.example` missing documented service settings
   - Failure C: provider-timeout fallback expectation mismatch
   - Likely ownership: services/runtime configuration + prototype/history code + draft generation fallback semantics

3. Runtime configuration documentation parity is broken
   - Evidence: `services/tests/unit/test_config.py::test_env_example_documents_service_settings`
   - Observed break: `.env.example` omits `BLACKSKIES_BACKUP_VERIFIER_MATURITY`, `BLACKSKIES_MEMORY_LAB_MATURITY`, `BLACKSKIES_PHASE4_MOCK_ROUTES_ENABLED`
   - Likely ownership: services/configuration docs

4. Prototype memory concurrency path is unstable on current Windows/Python setup
   - Evidence: `services/tests/prototype/test_memory_accept_race.py`
   - Observed break: `PermissionError` on `os.replace`
   - Likely ownership: historical/prototype memory storage path

5. Provider-timeout fallback semantics are contested
   - Evidence: `services/tests/unit/test_draft_generation_experiment.py`
   - Observed break: timeout raises provider-timeout error rather than using expected fallback path
   - Likely ownership: draft generation / provider routing contract

6. Validation lane hygiene warning remains
   - Evidence: `python scripts/run_service_truth.py`
   - Observed issue: pytest warning for unknown config option `cache_dir`
   - Likely ownership: service-truth runner / pytest config interaction

## 10. Fake-Complete Risk Inventory

1. README baseline claim is broader than observed proof
   - Claim pressure: "guided outline -> draft -> rewrite -> critique -> export"
   - Observed gap: ordinary generate click path and project switching were not proven; export was proven via truth/service lane, not normal manual smoke

2. Workspace topology carries contradictory legitimacy signals
   - Evidence: live truth lane exercised docked workspace while `app/shared/config/runtime.ts` defaults docking off, and `docs/specs/architecture.md` still warns many layout promises are experimental/not shipped
   - Risk: readers can overclaim the current pane system as fully settled

3. Split Command has large code/test presence despite non-baseline status
   - Evidence: extensive renderer/main/test surfaces; runtime default remains off
   - Risk: code weight can be mistaken for approved baseline workflow

4. Diagnostics/support maturity can be overclaimed
   - Evidence: many governance docs and visible service-status surfaces exist, but operator-safe diagnostics UX was not directly proven here
   - Risk: documentation volume can be mistaken for runtime trustworthiness

5. Analytics production status does not equal trusted writer value
   - Evidence: runtime truth marks analytics on/production and truth lane reached analytics routes
   - Gap: interpretive quality, UI framing, and non-misleading authority were not proven in this pass

6. Service-truth and truth-lane green runs can mask broader matrix instability
   - Evidence: both truth subsets passed while `pnpm --filter app test` and `python -m pytest services/tests -q` failed
   - Risk: "truth lane green" can be misread as overall operational health

## 11. Deferred / Abandoned / Obsolete Inventory

1. Voice notes/transcription
   - Classification: `deferred still explicit`
   - Evidence: current runtime docs classify it deferred with only a disabled seam

2. Smart merge
   - Classification: `deferred / likely inactive`
   - Evidence: current runtime docs say no live runtime seam

3. Accessibility toggle UI
   - Classification: `deferred / inactive`
   - Evidence: current runtime docs say no live runtime seam

4. Plugin execution as product baseline
   - Classification: `obsolete for current baseline`
   - Evidence: runtime gate remains off; no observed product workflow

5. Memory Prototype as runtime authority
   - Classification: `obsolete / historical only`
   - Evidence: `docs/specs/memory_runtime.md` explicitly marks `memory_prototype/` prototype-only; broad suite failure still lives there

6. Phase4 mock critique/rewrite routes as ordinary product surface
   - Classification: `obsolete / candidate to kill`
   - Evidence: disabled by default, described as legacy harness/dev seam only in current config

7. Earlier layout/spec language that says docking/floating/pane promises are future or experimental
   - Classification: `stale or superseded in places`
   - Evidence: live config enables docking and truth lane used dock workspace, but supporting architecture text still frames major layout work as not shipped

8. Dual sample-project alias family (`proj_esther_estate` and `Esther_Estate`)
   - Classification: `needs deeper audit`
   - Evidence: truth lane fixture tooling validates both aliases; this looks like historical validation scaffolding that may confuse current baseline interpretation

## 12. Keep / Rebuild / Defer / Kill / Investigate Intake

| Intake | Surface | Evidence basis |
| --- | --- | --- |
| `KEEP` | FastAPI startup + health baseline | directly observed working |
| `KEEP` | real-service critique/rewrite/export truth chain | `pnpm test:truth` passed |
| `KEEP` | project open/load baseline | truth lane recent-project open succeeded |
| `KEEP` | analytics route surface as current backend baseline | runtime truth + truth-lane route hits |
| `REBUILD` | renderer critique/rewrite sync reliability | app test failure |
| `REBUILD` | broad validation matrix health | app suite + full services suite failures |
| `REBUILD` | config documentation parity | `.env.example` test failure |
| `REBUILD` | provider-timeout fallback semantics | services test failure |
| `DEFER` | Memory Lab baseline promotion | docs/config say implemented but off/experimental |
| `DEFER` | Split Command promotion | code exists but baseline remains off |
| `DEFER` | Companion legitimacy expansion | surface exists, day-to-day value unproven |
| `DEFER` | backup verifier daemon as ordinary UX | disabled-by-default subsystem |
| `KILL` | phase4 mock routes as normal product surface | disabled legacy seam only |
| `KILL` | plugin execution as near-term baseline assumption | gated off with no observed workflow |
| `INVESTIGATE` | project switching | not observed |
| `INVESTIGATE` | offline/diagnostics operator experience | not directly observed |
| `INVESTIGATE` | packaging/release artifact path | not run |
| `INVESTIGATE` | binder/story-unit structural baseline | code/audits exist, baseline legitimacy unclear |
| `INVESTIGATE` | dual sample-project alias family and validation scaffolding pressure | truth lane fixture parity revealed continued dual-root handling |

## 13. Blocked-Domain Confirmation

Blocked-domain confirmation:

- no repair work was performed
- no GUI redesign work was performed
- no roadmap reconstruction rewrite was performed
- no critique/export/source-of-truth implementation work was performed
- no dependency or environment surgery was performed

Pass 92 remained inside discovery boundaries.

## 14. Stop Conditions Encountered

Stop conditions evaluated:

- no repair-required blocker forced audit termination
- no dependency installation was required
- no source/test/build edits were required
- no non-doc/non-audit files were changed by the pass
- no blocked-domain redesign drift was allowed

Scope limitations encountered:

- GUI usability remains `NOT OBSERVED — REQUIRES HUMAN SMOKE`
- package/release build path was left unrun to keep artifact scope bounded
- broad validation failures were recorded, not repaired

## 15. Final Verdict

Verdict: `BASELINE AUDIT COMPLETE`

Reason:

- the pass completed the planned bounded baseline audit
- required artifact sections are present
- direct evidence now distinguishes:
  - what builds
  - what launches
  - what narrow truth workflows are real
  - what broad test lanes fail
  - what surfaces are baseline, deferred, risky, or unclear

Top-line baseline conclusion:

- Black Skies is currently a mixed-state desktop-plus-service writing system with a real bounded truth path, a buildable app, a startable backend, and substantial visible workspace/product surface area
- it is not a cleanly validated baseline because the broad renderer and services suites are failing
- several visible surfaces carry fake-complete risk because code volume, historical docs, or test presence outrun the bounded runtime proof gathered here
