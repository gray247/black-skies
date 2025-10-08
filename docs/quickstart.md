# Quickstart / Smoke Test Guide

This document is the handoff for QA and support testers who want a clean way to bring the desktop app online without remembering the repo history. It assumes a fresh clone on Windows 11.

---

## Prerequisites

- Windows 11 (Developer Mode **enabled** if you plan to run the packaging scripts).
- Python 3.11 on `PATH`.
- Node.js 20.x (Corepack enabled).
- Git + PowerShell 7 (or Windows PowerShell 5.1).

> **Verify:**
> ```powershell
> node -v      # -> v20.x
> python --version  # -> 3.11.x
> corepack --version
> ```

---

## One‑Time Bootstrap

```powershell
# from repo root
powershell.exe -ExecutionPolicy Bypass -File .\start-codex.ps1 -OnlyTests
```

- Creates `.venv` and installs locked Python deps.
- Installs pinned pnpm + workspace packages.
- Runs the full pytest + Vitest suite as a smoke check.

If everything is green you are ready to launch the GUI.

---

## Launching the App (Smoke Test)

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\start-codex.ps1 -SmokeTest
```

What it does:

1. Ensures deps are synchronized and builds the Electron main bundle (`pnpm --filter app build:main`).
2. Opens a PowerShell window running `pnpm --filter app dev -- --host 127.0.0.1 --port 5173` (Vite renderer).
3. Opens a second window running the real Electron shell (`pnpm --filter app exec electron ..\dist-electron\main\main.js`) with the correct env vars (`ELECTRON_RENDERER_URL`, `BLACKSKIES_PYTHON`, `BLACKSKIES_PROJECT_BASE_DIR`).
4. Electron spawns the FastAPI service automatically; the status pill should transition from “Checking services” to “Services online” once `/healthz` responds.

Close the two windows to stop the app.

---

## Manual Launch (if you prefer explicit terminals)

```powershell
# window 1 (renderer)
cd C:\Dev\black-skies
pnpm --filter app dev -- --host 127.0.0.1 --port 5173

# window 2 (electron)
cd C:\Dev\black-skies\app
$env:ELECTRON_RENDERER_URL = 'http://127.0.0.1:5173/'
$env:BLACKSKIES_PYTHON     = 'C:\Dev\black-skies\.venv\Scripts\python.exe'
pnpm exec electron ..\dist-electron\main\main.js
```

The renderer window keeps Vite hot reloading; close it to stop the dev server. The Electron window spawns a child Python process (FastAPI) and cleans it up on exit.

---

## Packaging (optional)

To produce the unpacked build for QA:

```powershell
# ensure Developer Mode is enabled so symlinks can be created
$env:ELECTRON_BUILDER_DISABLE_CODE_SIGNING = '1'
pnpm --filter app run package:dir
```

The output lands in `app/release/win-unpacked`. Running `package:win` generates the NSIS installer and portable EXE (requires NSIS in `PATH`).

> If you see `Cannot create symbolic link : A required privilege is not held by the client`, turn on Windows Developer Mode or run the packaging step from an elevated PowerShell session.

---

## Sample Project

Use the bundled `sample_project/Esther_Estate` for smoke tests:

1. Launch the desktop shell, choose **Open Project**.
2. Browse to `sample_project/Esther_Estate` and confirm `project.json` loads.
3. Run through the Wizard → Generate → Critique → Accept flow and ensure the budget pill and recovery banner respond as expected.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `pnpm` not found | Ensure Corepack is enabled (`corepack enable`). |
| FastAPI health probe stuck on CORS | The service now ships with CORS allowing `http://127.0.0.1:5173`; restart if you modified it. |
| Electron fails with `ERR_REQUIRE_ESM` | Rebuild the main bundle (`pnpm --filter app build:main`) to ensure the CommonJS shims are present. |
| Packaging fails downloading `winCodeSign` | Enable Developer Mode or run the command in an elevated shell. |

For deeper debugging see `docs/packaging.md`, `docs/tests.md`, and `docs/endpoints.md`.

