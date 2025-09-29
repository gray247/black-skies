# docs/packaging.md - Windows Packaging Guide
**Status:** ACTIVE as of 2025-09-29

This guide describes how to build the Black Skies Windows installer (NSIS) and the portable ZIP-style executable using the new packaging tooling.

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
# create NSIS installer + portable executable
corepack pnpm --filter app run package:win
```
The script performs the following steps:
1. `vite build` -> writes the renderer bundle to `app/dist/`.
2. `tsc --project tsconfig.main.json` -> emits main/preload code to `dist-electron/`.
3. `electron-builder --config electron-builder.yml --win nsis portable` ->
   - copies `dist`, `dist-electron`, and production dependencies into `app/release/`
   - bundles `services/src` + `requirements*.lock` under `resources/python`
   - copies `sample_project/` into the package for first-launch testing
   - produces:
     - `app/release/BlackSkies-Setup-<version>.exe`
     - `app/release/BlackSkies-Portable-<version>.exe`

A dry run without installer generation is available for local inspection:
```powershell
corepack pnpm --filter app run package:dir
```
The `--dir` target creates `app/release/win-unpacked/` with the assembled app tree.

> **Note:** Building Windows artifacts must be executed on Windows. Cross-compiling from WSL/Linux will download the Linux Electron target and fail the sanity check.

---

## 4. Verifying the builds
1. **Installer:** run `BlackSkies-Setup-<version>.exe`, choose an install directory, launch from the finish screen, and confirm the FastAPI service starts (the Recovery banner should stay hidden when no crash markers exist).
2. **Portable:** execute `BlackSkies-Portable-<version>.exe`; it unpacks to a temporary directory and launches immediately. Close the app to clean up the temporary folder.
3. During manual QA, inspect `%LOCALAPPDATA%\BlackSkies\logs` for `main.log` and verify snapshots export correctly in the installed copy.

---

## 5. Updating the build number
The version originates from `app/package.json` and is injected into the packaged metadata via `electron-builder.yml`. Bump `"version"` in `app/package.json` before releasing and rerun the packaging command.

---

## 6. Troubleshooting
- **Missing Python runtime:** ensure Python 3.11 is installed and accessible. On systems with multiple versions, set `BLACKSKIES_PYTHON` to the desired interpreter path before launching the packaged app.
- **NSIS not found:** add the NSIS installation folder (e.g., `C:\\Program Files (x86)\\NSIS`) to `PATH` and retry `package:win`.
- **Electron download blocked:** run behind a proxy that permits GitHub release downloads or pre-populate `~\\AppData\\Local\\electron\\Cache` with the required zip.
- **Slow rebuilds:** delete `app/dist/` and `dist-electron/` when switching branches to avoid stale assets; rerun the packaging command after cleanup.
