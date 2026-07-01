# Stage 13 Desktop, Packaging, Installation, and Portable-Boundary Inventory

## 1. Purpose and scope
This inventory records the desktop launch surface, Electron packaging surface, installer and portable behavior, installation ownership assumptions, environment dependencies, and multi-install boundaries that later Stage 13 passes may need to assess.

It is an evidence inventory only. It classifies current and historical records, but it does not authorize implementation, packaging execution, installer execution, portable execution, cleanup, deletion, archive execution, or Stage 14 work.

## 2. Repository and Pass 6 checkpoint
- Repository: `C:\Dev\black-skies`
- Branch: `salvage/minimal-two-surface-shell`
- Pass 6 checkpoint: `ef3397e` `docs(product): inventory data persistence migration and recovery`

## 3. Inspection limits
This pass inspected:
- current product-system authority records
- desktop and launch configuration files
- Electron main, preload, and loader files
- launcher and bootstrap scripts
- packaging configuration
- installer and portable flags
- path, identity, and environment assumptions relevant to desktop launch and installation

This pass did not inspect or classify:
- implementation technology selection
- packaging build execution
- installer execution
- portable execution
- cleanup or uninstall execution
- final salvage disposition
- Stage 14 authorization

## 4. Desktop entry points

| Path | Role | Lane | Evidence quality | Key assumptions | Major risk | Later pass | Final disposition pending |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `app/package.json` | App package manifest and script entry map | Development / packaged build orchestration | High | `main` points to `dist-electron/main/main.js`; `package:win` emits both `nsis` and `portable`; `build:main` and `build:production` are the desktop build gates | Build script success can be mistaken for release proof | Packaging / launcher verification | Pending |
| `app/electron-builder.yml` | Electron packaging configuration | Packaged application / installer / portable | High | `nsis` and `portable` are both Windows targets; `deleteAppDataOnUninstall: false`; `allowToChangeInstallationDirectory: true`; `perMachine: false`; `extraResources` bundles `services/src`, `requirements*.lock`, and `sample_project` | Installer or portable behavior may be overread as project-identity or cleanup authority | Packaging / installation boundary review | Pending |
| `scripts/dev-runner.mjs` | Repository dev launcher | Development launch | High | Launches renderer dev server on `127.0.0.1:5173` and Electron via `scripts/electron-dev.mjs` | Dev launch can be mistaken for packaged behavior | Dev-vs-packaged boundary review | Pending |
| `scripts/electron-dev.mjs` | Local Electron launch helper | Development launch | High | Builds `app` main code first, then launches Electron with `./dist-electron/main/main.js` and an explicit Python executable | Development launcher path can be mistaken for packaged entry behavior | Launcher boundary review | Pending |
| `scripts/launch_truth_electron.py` | Truth-lane Electron helper | Truth / CDP launch | High | Falls back from built `dist-electron/main/main.js` to `app/main/main.ts` if the build artifact is missing; pins remote debugging to localhost | Fallback to source entry can obscure whether a run was packaged or source-backed | Truth launcher boundary review | Pending |
| `app/main/main.ts` | Electron main process entry | Packaged application / dev application | High | Resolves `START_URL` from dev server or packaged `dist/index.html`; loads `PRELOAD_PATH` from `dist-electron/main/preload.js`; starts services unless Playwright suppresses them | Development and packaged behavior are both routed through the same main entry, so env must be tracked carefully | Main-process boundary inventory | Pending |
| `app/main/preload.ts` | Current preload bridge source | Packaged application / dev application | High | Exposes project loader, services, diagnostics, layout, split-command, and test helpers; resolves project paths, `project_id`, snapshots, backups, exports, and restore bridges | A preload bridge can silently accumulate ownership or mutation paths if read as neutral plumbing | UI / ownership follow-up | Pending |
| `app/electron/preload.ts` | Legacy preload and compatibility bridge | Historical evidence / secondary runtime source | Medium | Exposes older Electron APIs and test hooks; includes sample-project resolution and filesystem helper methods | Legacy preload behavior can be mistaken for current authority if not separated from `app/main/preload.ts` | Historical runtime follow-up | Pending |
| `app/main/projectLoaderIpc.ts` | Project load/bootstrap IPC | Desktop project entry | High | Resolves project roots by `project.json` and `outline.json`; authorizes paths for layout IPC after load; exposes sample-project path resolution | Path and metadata can be mistaken for project authority | Data/persistence/identity follow-up | Pending |
| `app/main/layoutIpc.ts` | Layout persistence IPC | Desktop layout and floating windows | High | Persists layout under `.blackskies/layout.json`; gates layout access by authorized project root | Layout storage can be misread as project truth storage | Data/persistence/identity follow-up | Pending |

## 5. Development versus packaged launch paths
The repository has both source-backed development launch and packaged artifact launch.

- Development launch:
  - `scripts/dev-runner.mjs` starts the renderer dev server and then `scripts/electron-dev.mjs`.
  - `scripts/electron-dev.mjs` launches Electron against `app/dist-electron/main/main.js` after a main build.
  - `app/main/main.ts` uses `ELECTRON_RENDERER_URL` when present and otherwise falls back to the packaged `dist/index.html` URL or local dev server URL.

- Packaged launch:
  - `app/electron-builder.yml` declares `appId`, `productName`, `artifactName`, Windows `nsis` and `portable` targets, and bundled `extraResources`.
  - `app/package.json` exposes `package:dir` and `package:win` build entry points.
  - `app/main/main.ts` resolves `PRELOAD_PATH` from `dist-electron/main/preload.js` and loads packaged renderer assets from `dist/index.html`.

Observed boundary: a successful dev launch does not prove packaged launch, and a successful packaged artifact build does not prove that the desktop runtime, installer, or portable executable was exercised.

## 6. Electron main, preload, and renderer launch boundaries
- `app/main/main.ts` is the current main-process authority for window creation, service startup, single-instance behavior, and split-command secondary window launch.
- `app/main/preload.ts` is the current preload bridge source for renderer access to project loader, services, diagnostics, layout, and test hooks.
- `app/main/projectLoaderIpc.ts` is the main-process authority for project loading, bootstrap, and sample-project path resolution.
- `app/main/layoutIpc.ts` is the main-process authority for persisted layout access and floating-window lifecycle.
- `app/electron/preload.ts` is a legacy support surface and must not be promoted over `app/main/preload.ts`.
- `app/renderer/**` remains renderer logic; it is not an installation authority surface.

Observed assumption: `main.ts` treats `dist/index.html` and `dist-electron/main/preload.js` as the packaged renderer and preload pair, while development may load a dev server URL. That is a launch choice, not a product-authority claim.

## 7. Launcher and bootstrap scripts
- `scripts/dev-runner.mjs`
  - Launches the renderer dev server on `127.0.0.1:5173`.
  - Launches Electron through `scripts/electron-dev.mjs`.
  - Ensures the desktop app is launched from the repo root, not from an arbitrary cwd.

- `scripts/electron-dev.mjs`
  - Builds `app` main code before starting Electron.
  - Injects `ELECTRON_RENDERER_URL` and `BLACKSKIES_PYTHON`.
  - Uses `app/node_modules/.bin/electron` and `app/dist-electron/main/main.js`.

- `scripts/launch_truth_electron.py`
  - Launches the Electron executable directly for the truth lane.
  - Falls back to `app/main/main.ts` when the built entry is unavailable.
  - Prints the PID for later attach workflows.

- `scripts/test_e2e_launcher_args.mjs`, `scripts/truth-with-backend.mjs`, and `app/tests/e2e/electron.launch.ts`
  - Provide launch verification and harnesses.
  - They prove the launcher lane exercised, not release readiness.

## 8. Packaging configuration
Current packaging evidence is concentrated in:
- `app/electron-builder.yml`
- `app/package.json`
- `app/scripts/write-dist-commonjs.cjs`
- `scripts/check_repo_hygiene.py` for build-output hygiene classification

Key packaging facts:
- Windows targets include both `nsis` and `portable`.
- `nsis` is configured with `oneClick: false`, `perMachine: false`, `allowToChangeInstallationDirectory: true`, `deleteAppDataOnUninstall: false`, and `runAfterFinish: true`.
- `portable` emits `BlackSkies-Portable-${version}.exe`.
- `extraResources` bundles Python service sources, lockfiles, and `sample_project`.
- `app/scripts/write-dist-commonjs.cjs` mirrors the compiled main entry into `dist-electron/main.js` for compatibility.

Observed risk:
- Packaging config can be mistaken for installer policy, cleanup policy, or project-truth policy. It is none of those by itself.

## 9. Installer behavior
Installer behavior is explicitly bounded by packaging config rather than by product doctrine.

Observed from `app/electron-builder.yml`:
- Installation is user-selectable rather than per-machine.
- Uninstall does not delete app data automatically.
- The installer may change the installation directory.
- The installer can launch the app after finish.

Observed limitation:
- These flags govern installer behavior only. They do not establish project identity, project ownership, or data authority.

## 10. Portable behavior
The Windows portable target is configured alongside NSIS in `app/electron-builder.yml`.

Observed assumptions:
- Portable output is a distinct executable artifact, not a universal project database.
- Portable packaging still bundles `services/src`, lockfiles, and `sample_project`.
- Portable execution must not silently inherit installed-instance state or cross-install approvals.

Observed risk:
- A portable copy can look like a restored or migrated instance while still lacking authority to inherit project state, approval state, or cached operational state.

## 11. Installation identity and ownership
Observed identity classes:
- device identity
- installation identity
- application version / artifact identity
- project identity
- user profile data
- application data
- project data

Relevant evidence:
- `app/electron-builder.yml` separates installer artifact identity from project resources.
- `scripts/electron-dev.mjs` and `scripts/dev-runner.mjs` both rely on repo-relative launch state, not installation identity.
- `app/main/main.ts` reads `app.isPackaged` and `process.resourcesPath` to distinguish packaged resources from repo-local resources.
- `app/main/layoutIpc.ts` authorizes project roots before persisting layout.
- `app/main/projectLoaderIpc.ts` authorizes a loaded project path before downstream layout access.

Boundary rule:
- install location, app version, executable name, shortcut path, and portable folder are evidence of installation context, not project-truth authority.

## 12. Device and environment assumptions
Observed environment dependencies:
- `ELECTRON_RENDERER_URL`
- `BLACKSKIES_PYTHON`
- `BLACKSKIES_SERVICES_PORT`
- `BLACKSKIES_PACKAGE_RESOURCES`
- `PLAYWRIGHT`
- `BLACKSKIES_FORCE_SERVICES`
- `BLACKSKIES_E2E_MODE`
- `BLACKSKIES_E2E_PORT`
- `BLACKSKIES_VISUAL_STABLE`
- `BLACKSKIES_TEST_NEEDS_RECOVERY`

Observed path and runtime assumptions:
- `app/main/main.ts` treats `process.resourcesPath` as the packaged resource root.
- `scripts/electron-dev.mjs` supplies a development Python executable, defaulting to a local venv path.
- `scripts/launch_truth_electron.py` pins Electron launch to localhost remote debugging.
- `scripts/dev-runner.mjs` forces a predictable localhost renderer server.

Observed risk:
- behavior that depends on local ports, local Python, or repo-relative cwd must not be mistaken for packaged behavior or installation authority.

## 13. Multi-install behavior
Observed multi-install signals:
- `app/electron-builder.yml` uses `perMachine: false`, which implies user-scoped installation rather than machine-wide ownership.
- `app/main/main.ts` requests a single-instance lock in non-Playwright runs.
- `scripts/dev-runner.mjs` and `scripts/electron-dev.mjs` run from repo-relative paths, which means side-by-side installs are not the same thing as side-by-side project identities.

Observed risk:
- one install can coexist with another install, but coexistence does not imply shared state, shared approvals, or shared project ownership.

## 14. Data and config location assumptions
Observed locations tied to desktop and packaging behavior:
- `app/dist/` renderer build output
- `app/dist-electron/` Electron main output
- `app/dist-electron/main/main.js` main-process entry
- `app/dist-electron/main/preload.js` preload entry
- `app/resources` packaging resources
- `app/config/runtime.yaml` and `config/runtime.yaml` runtime config references
- `sample_project/` bundled fixture resource
- `.blackskies/layout.json` persisted layout state
- `process.resourcesPath/python` packaged Python bundle location

Observed distinction:
- packaged resource location is not project identity.
- layout storage is not manuscript truth.
- bundled sample project is fixture evidence, not current author authority.

## 15. Update, uninstall, and cleanup assumptions
Observed from packaging config and desktop runtime:
- `deleteAppDataOnUninstall: false` preserves app data on uninstall.
- no current desktop record authorizes cleanup execution in this pass.
- uninstall behavior must not be reinterpreted as archive, deletion, or witness-retention policy.

Observed risk:
- uninstall or update behavior may threaten retained witnesses if later passes misread app-data preservation as proof that all project artifacts are safe.

## 16. Packaged-evidence limits
Current package evidence proves:
- the build scripts exist
- the packaging configuration names installer and portable targets
- the runtime can resolve a packaged main entry and packaged renderer assets
- the packaged shell bundles service sources and sample project resources

Current package evidence does not prove:
- that installer execution was run here
- that portable execution was run here
- that install/uninstall/reinstall behavior was observed
- that multi-install coexistence is semantically safe
- that bundled resources are authoritative project truth

## 17. Historical packaging evidence
Relevant historical/supporting records:
- `docs/backup_and_migration.md`
- `docs/gui/exports.md`
- `docs/io_spec.md`
- `docs/handoffs/phase13_handoff_pass1_current_state.md`
- `docs/handoffs/phase13_handoff_pass2_authority_and_deferred_ledger.md`
- `docs/audits/phase14/pass92_operational_baseline_audit.md`

These records are useful for historical packaging and deployment context, but they do not override current authority records or current runtime inspection.

Observed historical claim risks:
- historical packaging notes sometimes blur backup, export, archive, and restore language.
- older docs may imply portability or recovery behavior without proving current install or packaged runtime behavior.

## 18. Unknowns and later routing
Unknowns that remain visible:
- exact installer UX flow across Windows shells
- whether portable and installed instances share any user-visible state by design
- whether packaging output preserves every retained witness needed by later review
- whether any launcher fallback path hides a current-vs-legacy distinction in user-facing behavior
- whether additional environment-specific launch wrappers are still needed for supported workflows

Later routing:
- desktop/portable execution and verification claims belong in a later bounded review if they become necessary.
- install/uninstall cleanup questions belong to later evidence or policy passes, not here.

## 19. Stop and reopening conditions
Stop conditions for this pass:
- if a current record is found to promote installation, portable packaging, or launch helpers into project-truth authority
- if a current record contradicts the Stage 12 identity, copy, or deployment contracts
- if launcher or packaging behavior requires implementation changes rather than inventory
- if archive, cleanup, or delete authority is discovered in a place that would alter witness retention or project identity

Reopening condition:
- any material Stage 12 contradiction must be routed to the appropriate Stage 12 reopening path rather than corrected inside this inventory.

## 20. Recommended next bounded pass
Recommended next pass: **Writing Surface, Command Center, Companion, and UI inventory**.

Reason:
- desktop launch and packaging boundaries are now identifiable.
- the remaining high-risk boundary is how the primary user surfaces present ownership, truth, and optional support systems to the author after launch.
- that follow-up can stay inventory-only and remain separate from provider/model/queue/cost or cleanup work.

