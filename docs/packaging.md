Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# docs/packaging.md - Windows Packaging Guide
**Status:** Active (last reviewed 2025-10-28)

This guide describes how to build the Black Skies Windows installer (NSIS) and the portable ZIP-style executable using the new packaging tooling.

> See also: [BUILD_STEPS_PLAYBOOK.md](./BUILD_STEPS_PLAYBOOK.md) (Milestone P7 packaging steps) for the authoritative checklist referenced by release gates.

---

## 1. Prerequisites
- **Windows 11** host shell (PowerShell or Command Prompt).
- **Node.js 20+** with Corepack enabled (`corepack enable`).
- **pnpm 8+** (Corepack will install the pinned version automatically).
- **Python 3.11** available on `PATH` (`python`), or export `BLACKSKIES_PYTHON="C:\\Path\\to\\python.exe"` prior to launching.
- **NSIS 3.09+** installed and added to `PATH` (required for the installer target).
- Optional: **7-Zip** for inspecting the portable archive contents.

---

## 2. One-time setup
```powershell
# from the repo root
corepack pnpm install --recursive
```
This installs Electron, electron-builder, and renderer/main build toolchains in the `app` workspace.

---

## 3. Building the artifacts
```powershell
# create NSIS installer + portable executable (Developer Mode or admin shell recommended)
$env:ELECTRON_BUILDER_DISABLE_CODE_SIGNING = '1'
corepack pnpm --filter app run package:win
```
The script performs the following steps:
1. `vite build` writes the renderer bundle to `app/dist/`.
2. `tsc --project tsconfig.main.json` emits main/preload code to `dist-electron/`.
3. `node ./scripts/write-dist-commonjs.cjs` adjusts the preload build for Electron’s CommonJS entrypoints.
4. `electron-builder --config electron-builder.yml --win nsis portable`:
   - copies `dist`, `dist-electron`, and production dependencies into `app/release/`
   - bundles `services/src` plus `requirements*.lock` under `resources/python`
   - copies `sample_project/` into the package for first-launch testing
   - produces:
     - `app/release/BlackSkies-Setup-<version>.exe`
     - `app/release/BlackSkies-Portable-<version>.exe`

A dry run without installer generation is available for local inspection:
```powershell
$env:ELECTRON_BUILDER_DISABLE_CODE_SIGNING = '1'
corepack pnpm --filter app run package:dir
```
The `--dir` target creates `app/release/win-unpacked/` with the assembled app tree.

> **Notes:**
> - Building Windows artifacts must be executed on Windows. Cross-compiling from WSL/Linux will download the Linux Electron target and fail the sanity check.
> - Windows Developer Mode (or an elevated PowerShell) is required so the `winCodeSign` tool can extract its symbolic links. If you see `A required privilege is not held by the client`, enable Developer Mode and rerun the packaging command.

---

## 4. Verifying the builds
1. **Installer:** run `BlackSkies-Setup-<version>.exe`, choose an install directory, launch from the finish screen, and confirm the FastAPI service starts (the Recovery banner should stay hidden when no crash markers exist).
2. **Portable:** execute `BlackSkies-Portable-<version>.exe`; it unpacks to a temporary directory and launches immediately. Close the app to clean up the temporary folder.
3. During manual QA, inspect `%LOCALAPPDATA%\BlackSkies\logs` for `main.log` and verify snapshots export correctly in the installed copy.
4. Run the smoke harness from the repository root to mirror Milestone P7 checks:
   ```powershell
   scripts/smoke.ps1 -ProjectId proj_esther_estate -Cycles 3 -SkipInstall
   bash scripts/smoke.sh --project proj_esther_estate --cycles 3
   ```

---

## 5. Updating the build number
The version originates from `app/package.json` and is injected into the packaged metadata via `electron-builder.yml`. Bump `"version"` in `app/package.json` before releasing and rerun the packaging command. Ensure the same version appears in the generated release artefacts (`BlackSkies-Setup-<version>.exe`, `BlackSkies-Portable-<version>.exe`) and record the change in `phase_log.md`.

---

## 6. Troubleshooting
- **Missing Python runtime:** ensure Python 3.11 is installed and accessible. On systems with multiple versions, set `BLACKSKIES_PYTHON` to the desired interpreter path before launching the packaged app.
- **NSIS not found:** add the NSIS installation folder (e.g., `C:\\Program Files (x86)\\NSIS`) to `PATH` and retry `package:win`.
- **Electron download blocked:** run behind a proxy that permits GitHub release downloads or pre-populate `~\\AppData\\Local\\electron\\Cache` with the required zip.
- **Slow rebuilds:** delete `app/dist/` and `dist-electron/` when switching branches to avoid stale assets; rerun the packaging command after cleanup.
- **CommonJS bridge missing:** if the packaged build fails to locate preload scripts, rerun `package:win`; the script invokes `node ./scripts/write-dist-commonjs.cjs` to populate `dist-electron` before electron-builder runs.

## Packaging Targets (Phase post-P11)
- **Windows installer** (NSIS / electron-builder + NSIS) installs to `%LOCALAPPDATA%\BlackSkies`, creates logs under `%LOCALAPPDATA%\BlackSkies\logs`, and stores runtime settings at `%LOCALAPPDATA%\BlackSkies\settings.json`.
- Installer creates a **desktop shortcut**, **Start Menu entry**, and an **Apps & Features** uninstall entry (electron-builder emits the uninstall metadata automatically).
- Optional **portable** ZIP flavors remain available for QA; they respect the same `%LOCALAPPDATA%` data paths when executed.

## First-Run Behavior
- First launch after install surfaces a welcome screen that highlights Spark Pad + Wizard presets and invites the user to start Bookend 1 (Spark Pad preset on the left, Wizard center, Draft Board right, History bottom).
- Welcome screen guides the user through enabling the Spark Pad workflow and optionally previews the first Story or Visual timeline.
- Once dismissed, the welcome experience stays suppressed until a reinstall; the next launch jumps directly into the last project.

## Data Location
- **User data (projects):** stored wherever the user selects (recommendation: `%USERPROFILE%\Documents\BlackSkies\Projects`). Projects keep their own `project.json`, `drafts/`, `history/`, and `analytics/` directories.
- **App data:** settings, logs (`main.log`, `renderer.log`), and telemetry caches stay under `%LOCALAPPDATA%\BlackSkies`.
- Export artifacts default to the project’s `/exports/` folder; installers do not redirect exported output.

## Phase Alignment
- Packaging & Distribution tops the roadmap after Phases 9–11 and Bookends 1/2 stabilize. See the “Packaging & Distribution” phase in `docs/phases/phase_charter.md` for the gate criteria before releasing installers.
