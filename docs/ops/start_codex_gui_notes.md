Status: Active
Version: 1.0.1
Last Reviewed: 2026-04-21

# start-codex.ps1 GUI Troubleshooting
> **Category:** Troubleshooting / Ops
> **Reference:** See `docs/ops/dev_ops_notes.md` for other operational helpers.

This note explains what `start-codex.ps1` does, why it may not open a window in
headless or partially provisioned environments, and how to launch the developer
UI + services manually.

## What the script actually does

`start-codex.ps1` provisions dependencies and runs automated tests before doing
anything else. The `-LaunchGui` flag is parsed, but the GUI launch happens only
*after* provisioning succeeds and both pytest + Vitest pass. In practice this
means:

1. A Python virtual environment is created (if necessary) and the locked
   requirements (`requirements.lock`, `requirements.dev.lock`) are installed.
2. Corepack is enabled so the pnpm shim is available, then lockfile-synced install
   (`pnpm install --frozen-lockfile --prefer-frozen-lockfile`) runs to synchronize Node dependencies.
3. The automated test suites execute (pytest for the services, `pnpm --filter app
   test` for the renderer). On failure the script stops here.
4. If `-LaunchGui` was provided, the script starts two new PowerShell windows: one
   for `python -m blackskies.services`, another for `pnpm run dev`.

Because provisioning re-runs every invocation, the script can appear to "stall"
while it reinstalls dependencies. When running in environments without a
Windows desktop (e.g., CI, WSL, or remoting without GUI), the new PowerShell
windows requested during `-LaunchGui` may never appear. In that case launch
the services manually as described below.

## Launching the renderer manually

Use the workflow documented in the README:

```powershell
# Either direct install...
pnpm install --recursive
# ...or run the repo helper that does the same thing
pnpm run bootstrap
pnpm dev
```

`pnpm dev` starts two concurrent tasks:

- `pnpm --filter app dev` - the Vite dev server for the renderer
- `node scripts/electron-dev.mjs` - the Electron dev launcher that builds the main process and starts Electron against the renderer URL

If Electron fails to launch, verify `app/node_modules` exists and that
`pnpm --filter app build:main` succeeds before rerunning `pnpm dev`.

If PowerShell reports `pnpm : The term 'pnpm' is not recognized`, enable Corepack
and activate the pnpm shim:

```powershell
corepack enable
corepack prepare pnpm@8 --activate
```

Afterwards rerun `pnpm install --recursive`.

## Running the backend services

Start the FastAPI services in a second terminal so the renderer can hit the API
endpoints:

```powershell
python -m blackskies.services
```

The health check is exposed at <http://127.0.0.1:8000/api/v1/healthz>.

## Next steps for a full desktop shell

1. Use `pnpm dev` for the integrated renderer + Electron dev loop.
2. Keep `scripts/electron-dev.mjs` aligned with the app main entrypoint and renderer URL conventions.
3. Re-run `start-codex.ps1 -OnlyTests` to verify both pytest and Vitest still
   pass before committing changes.
