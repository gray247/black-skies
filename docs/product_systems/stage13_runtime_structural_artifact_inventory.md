# Stage 13 Runtime and Structural Artifact Inventory

Status: Ready for review  
Stage: Stage 13 - Salvage Completion Plan  
Pass: Pass 4 - Runtime and Structural Artifact Inventory  
Repository branch: `salvage/minimal-two-surface-shell`  
Pass 3 checkpoint: `d40477a docs(product): inventory historical salvage sources`

## 1. Purpose and scope

This inventory records the current runtime and structural implementation artifacts visible in the repository so later Stage 13 passes can plan salvage work without treating runtime behavior as product authority.

This pass may inspect runtime file contents for classification. It does not execute runtime behavior, edit code, judge tests, select technologies, assign final salvage dispositions, authorize cleanup, or authorize implementation.

## 2. Repository and Pass 3 checkpoint

Repository gate result used for this inventory:

- Branch: `salvage/minimal-two-surface-shell`
- Upstream: `origin/salvage/minimal-two-surface-shell`
- Worktree: clean before creation of this inventory
- Latest commit: `d40477a docs(product): inventory historical salvage sources`
- Pass 3 checkpoint recorded for this pass: `d40477a`

## 3. Inspection limits

Content inspection was limited to current runtime and structural implementation files needed to identify major roots, entry points, boundaries, state ownership, identity assumptions, truth-mutation paths, scene-first assumptions, coupling, and legacy scaffold evidence.

The following were not assessed in detail during this pass:

- tests, fixtures, harnesses, and packaged behavior
- provider/model routing implementation beyond path and app-factory boundary identification
- queue, retry, cancellation, telemetry, cache, and cost logic beyond path and structural boundary identification
- detailed schemas, migrations, persistence correctness, recovery behavior, and backup verification behavior
- packaging internals, installer behavior, release readiness, generated output, vendor output, or environmental artifacts

Runtime behavior remains evidence, not authority. Final disposition remains pending for every artifact or group listed here.

## 4. Runtime root and entry-point inventory

| Root or entry | Artifact type | Apparent role | Authority class | Evidence quality | Later pass | Final disposition |
| --- | --- | --- | --- | --- | --- | --- |
| `app/package.json`, `app/index.html`, `app/vite.config.ts`, `app/tsconfig*.json` | Electron/React app configuration | Defines app build and renderer shell entry structure | Tier 5 runtime evidence | Path and structural inspection only | packaging/configuration inventory | Pending |
| `app/main/main.ts` | Electron main process entry | Creates windows, resolves app/runtime paths, spawns or suppresses service process, registers IPC, split-command lifecycle, logging, diagnostics | Tier 5 runtime evidence | Content inspected | desktop/runtime boundary inventory | Pending |
| `app/main/preload.ts` | Electron preload bridge | Exposes project loader, services, diagnostics, layout, runtime config, split-command, test/dev hooks, and filesystem read helpers to the renderer | Tier 5 runtime evidence | Content inspected | IPC/surface/security inventory | Pending |
| `app/renderer/index.tsx` | React renderer entry | Mounts `App` into `#root` and sets deterministic boot/test flags | Tier 5 runtime evidence | Content inspected | surface/UI inventory | Pending |
| `app/renderer/App.tsx` | Renderer application coordinator | Centralizes project state, active scene state, services, recovery, snapshots, critique, Companion overlay, docking, split-command routing, budget, export, and test-mode routing | Tier 5 runtime evidence | Content inspected | surface/UI and structural follow-up | Pending |
| `services/src/blackskies/services/app.py` | Python service application factory | Builds FastAPI app, middleware, routers, diagnostics, model router, snapshots, recovery tracker, critique service, resilience registry, scheduler, and backup-verifier state | Tier 5 runtime evidence | Content inspected | backend/service inventory | Pending |
| `blackskies/__init__.py`, `black_skies/` | Python package roots or compatibility roots | Thin package identity or compatibility surface; detailed use not established in this pass | Tier 5 runtime evidence | Path-level inspection | runtime namespace follow-up | Pending |
| `scripts/`, `tools/`, `config/` | Runtime support, diagnostics, validation, config | Contains launch, smoke, truth, governance, runtime validation, and YAML runtime/load-profile support | Tier 5 supporting runtime evidence | Path-level inspection | tooling/config inventory | Pending |

## 5. Major subsystem and module groups

| Group | Representative paths | Apparent role | Current doctrine affected | Observed structural assumption | Evidence quality | Later pass |
| --- | --- | --- | --- | --- | --- | --- |
| Electron main shell | `app/main/main.ts`, `app/main/serviceResolution.ts`, `app/main/layoutIpc.ts`, `app/main/logging.ts`, `app/main/runtimeSessionTruth.ts` | Window lifecycle, service startup/resolution, layout IPC, diagnostics, session truth snapshotting | Systems own workflows; runtime behavior is evidence | Main process coordinates app, service, layout, logging, and split-command state | Content/path | desktop/runtime boundary |
| Preload bridge | `app/main/preload.ts`, `app/shared/ipc/*.ts` | Renderer access to services, project loading, diagnostics, layout, split-command ownership, runtime config | Hidden mutation and silent authority risks | Large preload surface joins filesystem reads, service calls, IPC, test hooks, layout mutation, and reveal/open helpers | Content/path | IPC/surface/security |
| Renderer orchestration | `app/renderer/App.tsx`, hooks, utilities, contexts | User-facing app state and workflow orchestration | Writing Surface and Command Center separation; Companion advisory only | `App.tsx` is a broad coordinator across writing, operations, diagnostics, Companion, recovery, snapshots, export, and test states | Content/path | surface/UI inventory |
| Project loading and bootstrap | `app/main/projectLoaderIpc.ts`, `app/main/projectBootstrap.ts`, `app/shared/ipc/projectLoader.ts` | Opens, creates, validates, and loads project roots, `project.json`, `outline.json`, `drafts/*.md`, scene metadata | Project identity; Narrative Assertion/Insertion floor; scene projection doctrine | Project path, project metadata, outline, scenes, and draft markdown are treated as load-bearing runtime structures | Content | data/schema/persistence |
| Renderer project home | `app/renderer/components/ProjectHome.tsx`, `app/renderer/DraftEditor.tsx`, `app/renderer/utils/draftPreviewSync.ts` | Project selection, recents, last project path, active scene, draft editor, runtime session truth | Author truth and explicit mutation | Local storage and active scene/draft sync influence runtime state | Content/path | surface/UI and data/persistence |
| Docking and workspace layout | `app/renderer/components/docking/*`, `app/shared/ipc/layout.ts` | Dockable panes, floating panes, layout persistence, hotkeys, relocation notices | Writing Surface/Command Center boundary | Operational panes and writing panes share one workspace layout system | Content/path | surface/UI |
| Split-command workspace | `app/renderer/components/workspace/*`, `app/shared/splitCommandAuthority.ts`, `app/renderer/utils/splitCommandShellState.ts` | Experimental split writing/command workspace with ownership sync and collapse state | Distinct Writing Surface and Command Center | Text explicitly labels editor-local, derived, and non-gating roles, but it still derives structure from scenes/story units | Content/path | surface/UI and architecture alignment |
| Python service routers | `services/src/blackskies/services/routers/**` | API routes for health, analytics, backups, export, restore, recovery, outline, long form, phase4, draft flows | Workflows owned by systems, not models/providers | Service boundary is broad and route families mix product workflow, recovery, analysis, and export concepts | Path-level with app-factory inspection | backend/service inventory |
| Python operations/persistence/models | `services/src/blackskies/services/operations/**`, `persistence/**`, `models/**` | Draft generation/export/accept, recovery, long-form, wizard snapshots, outline/draft/snapshot persistence, model contracts | Truth mutation, schema, recovery, persistence | Runtime has multiple persistence-facing and mutation-facing groups requiring separate bounded review | Path-level plus limited model identity inspection | data/schema/persistence |
| Memory Lab and memory prototype | `services/src/blackskies/services/memory_lab/**`, `memory_prototype/**` | Memory, continuity, interpretation, governance, scoring, storage, prototype state readers | Memory cannot own truth; Companion optional and advisory | Existing modules imply memory/intelligence infrastructure whose authority is not established by current doctrine | Path-level only | memory/provider/evidence inventory |
| Salvage shell scaffold | `app/renderer/salvage/MinimalTwoSurfaceShell.tsx`, `salvageShellModel.ts` | Static minimal two-surface shell scaffold | Writing Surface and Command Center distinct | Explicitly states runtime project data is not connected and writing is first/non-gated | Content | surface/UI inventory |

## 6. Frontend/backend/Electron boundaries

The current app has three major runtime boundaries:

1. Electron main process: owns window lifecycle, service process startup/resolution, diagnostic/logging IPC, project loader IPC, layout IPC, split-command secondary window lifecycle, and runtime config loading.
2. Electron preload bridge: exposes `projectLoader`, `services`, `diagnostics`, `layout`, `runtimeConfig`, optional `splitCommand`, `__electronApi`, and test/dev surfaces into the renderer.
3. Renderer and Python service: renderer `App.tsx` orchestrates UI state and calls the preload service bridge; the Python FastAPI service factory assembles routers, diagnostics, model routing, snapshots, recovery, critique, resilience, scheduler, and backup-verifier state.

Boundary risk: the preload bridge is very large (`2222` lines) and joins runtime configuration, IPC, filesystem reads, service calls, diagnostics, layout persistence, test/dev overrides, and reveal/open behavior. Later passes must verify whether this surface preserves explicit author approval, avoids hidden mutation, and keeps tests/harness controls out of normal authority.

## 7. State and ownership observations

Observed runtime state owners include:

- `App.tsx` (`3763` lines): current project, project summary, active scene, project drafts, draft edits, budget snapshot, service status, recovery state, critique state, snapshots panel state, Companion open state, docking state, split-command shell state, test-mode state, and toast state.
- `ProjectHome.tsx` (`1704` lines): recent projects, last project path, active scene, draft editor state, project load event flow, runtime session truth composition, and storage-backed recents.
- `DockWorkspace.tsx` (`1336` lines): persisted and floating layout state, hidden panes, presets, relocation and snap controls, and layout bridge calls.
- `SplitCommandWorkspace.tsx` (`516` lines): project-derived outline/story-unit views, writing studio contract, command-center panels, and active scene routing.
- `services/src/blackskies/services/app.py` (`346` lines): service app state for diagnostics, model router, snapshot persistence, recovery tracker, critique service, resilience registry, scheduler, and backup verifier.

Ownership risk: several runtime state owners are large enough to obscure which surface, system, or operation owns a workflow. This is evidence only; it does not prove salvage disposition.

## 8. Project identity and project-root assumptions

Observed identity-related structures:

- `LoadedProject` includes `path`, optional `projectId`, `name`, `outline`, `scenes`, `drafts`, `bootstrapState`, and `bootstrapTemplate`.
- `ProjectBootstrap` generates `project_id` values from a sanitized title plus random suffix and creates a project directory named from that id.
- `ProjectLoaderIpc` loads from a normalized path, reads `project.json`, `outline.json`, and `drafts/*.md`, then authorizes the normalized project path for layout IPC.
- Renderer helper `deriveProjectIdFromPath` derives an id from a path segment when needed.
- Runtime display logic labels `_restored_` paths as restored copies.
- ProjectHome persists recent and last project paths in `localStorage`.
- The project loader still exposes a sample project path resolver for `sample_project/Esther_Estate`.

Doctrine risk: Stage 12 says paths, labels, timestamps, aliases, and latest pointers are not sufficient project identity. The runtime contains path-derived and sample-project assumptions that later passes must test against the Stage 12 identity chain. This inventory does not decide whether any path is acceptable or must be replaced.

## 9. Truth-mutation paths and risks

Potential mutation-facing paths observed during structural inspection:

- `app/main/projectBootstrap.ts` writes `project.json`, `outline.json`, `drafts/*.md`, and bootstrap invalid markers during project creation.
- `app/main/projectLoaderIpc.ts` loads project content and authorizes project paths for later layout actions.
- `app/main/preload.ts` exposes service calls for draft critique/rewrite/preflight/accept/export, snapshot/recovery flows, layout save/reset/open/close, diagnostics, and filesystem read helpers.
- `app/renderer/App.tsx` coordinates draft edits, active scene selection, draft preview sync state, export, snapshot creation, verification, recovery, critique, generation scope, and Companion overlay inputs.
- `services/src/blackskies/services/operations/**`, `persistence/**`, `routers/**`, and `models/**` include mutation-facing and persistence-facing groups for draft, snapshot, restore, recovery, export, outline, and long-form functions.

Risk: these paths may mutate or reconstruct project, draft, layout, snapshot, or recovery state. Later data/persistence, evidence, and surface passes must determine which are explicit author actions, which are background maintenance, and which risk silent truth mutation. No final disposition is assigned here.

## 10. Scene/chapter-first assumptions

Observed scene/chapter structures:

- `OutlineFile` is declared with acts, chapters, and scenes under `OutlineSchema v1`.
- `SceneDraftMetadata` and `readScenes` parse `drafts/*.md` files and front matter into scenes and draft markdown.
- Project load classification compares outline scenes, parsed scene count, and draft count.
- `resolveStartupScene` chooses persisted or requested scene id, then falls back to the first scene.
- Split-command workspace derives story units and active outline from loaded project scenes/outline data.
- Static salvage shell uses a scene list as a minimal scaffold, while explicitly stating runtime project data is not connected.

Doctrine risk: current authority treats scenes and chapters as projections, containers, views, or compatibility surfaces. The runtime still appears scene/draft/outline centered. This is a later-pass verification target, not a current salvage disposition.

## 11. Writing Surface and Command Center alignment

Alignment evidence:

- `MinimalTwoSurfaceShell.tsx` explicitly separates Writing Surface and Command Center Surface, marks writing as available first, and says Command Center does not gate writing.
- `SplitCommandWorkspace.tsx` labels writing-side panels as editor-local and labels derived command-side panels as loaded workspace data or derived structure.
- `App.tsx` can route to split-command workspace, docked workspace, floating panes, ProjectHome, RecoveryBanner, WorkspaceHeader, CompanionOverlay, SnapshotsPanel, and CritiqueModal from one coordinator.

Boundary risk: the current runtime still mixes writing, operations, diagnostics, recovery, snapshots, export, Companion, critique, service health, and layout controls inside a broad renderer coordinator and header/workspace system. Later surface/UI inventory must determine whether Writing Surface is behaving as an operations console or whether Command Center is allowed to influence manuscript truth.

## 12. Companion or Memory Lab ownership risks

Observed paths:

- Renderer Companion: `app/renderer/components/CompanionOverlay.tsx` is mounted from `App.tsx` with active scene, active draft, drafts, rubric, batch critique, and service status.
- Backend critique and advisory surfaces: `services/src/blackskies/services/critique.py`, `models/critique.py`, `models/advisory.py`, draft revision paths, and service app critique state.
- Memory Lab and prototype paths: `services/src/blackskies/services/memory_lab/**` and `services/src/blackskies/services/memory_prototype/**`.

Doctrine risk: Companion must remain optional, advisory, non-owning, and non-authoritative. Memory Lab cannot own project truth. These groups require later bounded review before any salvage plan treats their outputs as evidence, advice, projections, or discardable implementation detail.

## 13. Structural coupling and monolith risks

Large or tangled files observed:

- `app/renderer/App.tsx`: `3763` lines; broad orchestration across project, scene, drafts, services, recovery, snapshots, critique, Companion, docking, split-command, budget, export, and test states.
- `app/main/preload.ts`: `2222` lines; broad bridge across filesystem reads, IPC, service calls, layout, diagnostics, test/dev hooks, and reveal/open helpers.
- `app/renderer/components/ProjectHome.tsx`: `1704` lines; project loading, recents, last project, active scene, draft editor, and session truth behavior.
- `app/renderer/components/docking/DockWorkspace.tsx`: `1336` lines; persisted/floating layout, hotkeys, panes, relocation, and test-mode gating.
- `app/main/projectLoaderIpc.ts`: `840` lines; project loading, root resolution, outline and draft parsing, sample project resolution, and bootstrap state classification.

Duplicate or legacy-looking structural paths:

- `app/electron/projectLoader.ts` and `app/electron/preload.ts` coexist with `app/main/projectLoaderIpc.ts` and `app/main/preload.ts`; current active status was not fully resolved in this pass.
- `app/renderer/testSetup.ts`, `vitest.setup.ts`, `testCleanup.ts`, `screens/TestMode*.tsx`, and preload test/dev hooks are runtime-adjacent but are routed to the tests/harness/evidence pass.
- `app/renderer/salvage/**` is a static scaffold, not connected runtime.

Risk: monolithic coordinators and duplicate entry-like paths increase architectural drift risk and may hide unsupported authority inheritance. Final salvage classification remains pending.

## 14. Legacy scaffold or abandoned-path evidence

Observed scaffold or legacy candidates:

- `app/electron/**`: earlier Electron-style preload/project loader path next to active `app/main/**`.
- `app/renderer/salvage/**`: static Stage 12/13-aligned shell scaffold that says runtime project data is not connected.
- `app/temp-trace/**`, `app/dist/**`, `app/dist-electron/**`, `app/playwright-report/**`, `app/test-results/**`, `app/node_modules/**`: generated, environmental, vendor, or report output excluded from salvage judgment here.
- `sample_project/Esther_Estate`: referenced by project loader as a sample path; identity and fixture status require later data/evidence review.
- `scripts/*truth*`, `scripts/*smoke*`, `scripts/*e2e*`, `tools/runtime_truth/**`: runtime-adjacent validation/evidence tools; not assessed as tests or broad proof in this pass.

No archive, cleanup, deletion, or retirement action is authorized by identifying these paths. Archive candidates, if any, can only become `Archive later` candidates in later Stage 13 planning; Stage 16 owns archive and cleanup execution.

## 15. Generated/vendor/environmental exclusions

Excluded from detailed classification during this pass:

- dependency/vendor roots: `node_modules/`, `app/node_modules/`, `.venv/`, `vendor/`
- build/generated roots: `build/`, `app/dist/`, `app/dist-electron/`, `services/out/`
- caches and transient roots: `.mypy_cache/`, `.ruff_cache/`, `.pytest*/`, `.codex*/`, `tmp*/`, `app/temp-trace/`
- reports/logs/artifacts: `logs/`, `ci_artifacts/`, `app/playwright-report/`, `app/test-results/`, root log files
- tests and harnesses: `app/tests/**`, `services/tests/**`, e2e/offline/test-mode paths except for path-level identification

These exclusions are not disposal decisions.

## 16. Unknowns requiring later verification

The following remain visibly unknown:

- which runtime entry points are active in packaged, development, and Playwright modes
- whether `app/electron/**` is historical, compatibility, or still reachable
- whether path-derived project identity is ever used as product identity rather than display or fallback
- whether restore/copy flows reconstruct approval or identity without explicit author action
- whether scene/draft/outline structures are compatibility projections or current truth-owning structures
- whether `runtimeSessionTruth` is merely runtime evidence or risks being interpreted as project truth
- whether service operations mutate manuscript truth, derived state, evidence, layout state, or recovery state with sufficient approval boundaries
- whether provider/model, queue/retry/cancellation, cache, telemetry, and cost paths preserve Stage 12 floors
- whether tests and reports prove only their lane or are being used as broad readiness evidence
- whether Memory Lab, Companion, graph/vector, advisory, or critique paths claim ownership over author truth

## 17. Later-pass routing

| Routing target | Source groups | Reason |
| --- | --- | --- |
| Tests, fixtures, harnesses, and evidence inventory | `app/tests/**`, `services/tests/**`, `app/renderer/testMode/**`, `scripts/*test*`, `scripts/*truth*`, reports | Runtime contains many test/harness gates and service assertions; evidence strength must be bounded before using test claims |
| Data, schema, persistence, migration, and recovery inventory | `project.json`, `outline.json`, `drafts/*.md`, `services/persistence/**`, `routers/restore.py`, `routers/recovery.py`, snapshot paths, sample project | Project identity, truth mutation, restore/copy semantics, schema authority, and persistence are central risks |
| Surface/UI inventory | `App.tsx`, `ProjectHome.tsx`, `WorkspaceHeader.tsx`, `DockWorkspace.tsx`, `SplitCommandWorkspace.tsx`, `MinimalTwoSurfaceShell.tsx`, `CompanionOverlay.tsx` | Writing Surface and Command Center separation must be evaluated without implementation |
| Provider/model/qualification inventory | `model_router.py`, `model_routing.py`, critique/rewrite/generation paths, local/openai config paths | Models perform tasks; systems own workflows; provider/model decisions remain blocked |
| Queue/retry/cancellation and resilience inventory | service resilience registry, scheduler, long-form/build tracker paths | Completion, retry, cancellation, and acceptance semantics are Stage 12-sensitive |
| Telemetry/diagnostics/log/cache/cost inventory | diagnostics, metrics, logging, analytics, cache, budgeting, budget indicator paths | Evidence, privacy, cost, and hidden state require separate bounded review |
| Desktop/packaging/launcher inventory | Electron main/preload, launch scripts, packaged build roots, installers/config | Packaging and launcher behavior remain blocked and unverified |

## 18. Stop and reopening conditions

Later Stage 13 passes must stop rather than compensate if runtime evidence shows:

- a Stage 12 architecture floor is infeasible, contradictory, incomplete, or missing required propagation
- author approval, project identity, truth mutation, or evidence ownership contradicts the Stage 12 contract
- implementation behavior is being used to silently patch missing authority
- historical or runtime behavior is being promoted above current authority
- archive, cleanup, deletion, retirement execution, implementation, release, provider/model selection, or schema migration is being pulled into Stage 13

If any material Stage 12 contradiction is confirmed, the relevant Stage 12 reopening rule must be invoked. This inventory does not reopen Stage 12 by itself.

## 19. Recommended next bounded pass

Recommended next pass: tests, fixtures, harnesses, and evidence inventory.

Rationale: the runtime map shows many test-mode, harness, diagnostic, truth, service-health, visual-stability, and evidence paths interleaved with runtime structures. Before detailed salvage planning can rely on runtime claims, Stage 13 should inventory what tests and reports actually prove, what they overclaim, and where harness behavior may have leaked into runtime assumptions. The pass must remain inventory-only and must not repair tests, run broad validation, or treat passing tests as release readiness.

Data, schema, persistence, migration, and recovery inventory should follow closely because project identity, scene/draft structures, restore/copy semantics, and truth-mutation paths are high-risk. Surface/UI inventory should also remain near-term because Writing Surface and Command Center boundaries are exposed by the same runtime map.
