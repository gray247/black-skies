# Foundation runtime-surface map

Status: implementation inventory; not a qualification receipt.

| Surface | Packaged behavior | Authority / guard | Disposition |
| --- | --- | --- | --- |
| Primary Writing Studio | `app/main/main.ts` starts the primary split-command role; `app/renderer/index.tsx` maps it to `Stage19WritingSpineApp` writing mode. | Packaged runtime enables the dedicated Stage 19 host through `shouldEnableDedicatedStage19Host`; the main preload and sandbox policy apply. | Internal V1 core. |
| Secondary Command Center | The main process creates the secondary split-command role; the renderer maps it to `Stage19WritingSpineApp` command mode. | Shared split-command authority assigns only the primary mutation ownership; Command Center remains read-only. | Internal V1 core. |
| Legacy `App` renderer | `index.tsx` selects legacy `App` only when there is no split-command window role. | It is a development/legacy fallback and is not an alternative packaged V1 writing path. Any future change to packaged launch roles must prove it cannot select this fallback. | Retained, non-authoritative. |
| Preload | `app/main/main.ts` selects the packaged preload for packaged execution. | `contextIsolation`, `nodeIntegration: false`, and packaged sandboxing form the browser boundary. | Required security boundary. |
| Service startup | Packaged runtime does not resolve legacy Python or start legacy services. | `packagedRuntimePolicy.ts` denies legacy service startup when packaged. | Offline V1 core remains local. |
| Project identity | Stage 19 project-spine IPC owns project path, generation, save, export, and recovery truth. | Primary window owns mutation; project-generation changes invalidate stale asynchronous results. | Required V1 truth boundary. |
| Floating/docking panes | Optional layout IPC creates a separate BrowserWindow for an authorized project path. | Floating windows now use sandboxing, context isolation, disabled Node integration, denied popups, and navigation origin checks. | Non-baseline optional surface; retain only with focused IPC/security evidence. |
| Analytics | Service router exists but defaults off. | Explicit `BLACKSKIES_ENABLE_ANALYTICS=1` / maturity opt-in is required; runtime ledger marks it non-baseline. | Deferred non-baseline. |
| Providers and long-form | Provider adapters and long-form routes remain code-present but disabled by default. | Offline policy prohibits provider calls; unavailable provider output must not be called authored product output. | Deferred non-baseline. |

No code may be removed on the strength of this inventory alone. Removal requires
proof that the surface is absent from the packaged graph, test graph,
qualification-helper graph, and current-authority graph.
