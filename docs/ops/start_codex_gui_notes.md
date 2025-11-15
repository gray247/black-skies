# start-codex.ps1 GUI Troubleshooting
> **Category:** Troubleshooting / Ops
> **Reference:** See `docs/ops/dev_ops_notes.md` for other operational helpers.

This note explains what `start-codex.ps1` does, why it may not open a window in
headless or partially provisioned environments, and how to launch the developer
UI + services manually.

## What the script actually does

`start-codex.ps1` provisions dependencies and runs automated tests before doing
anything else.  The `-LaunchGui` flag is parsed, but the GUI launch happens only
*after* provisioning succeeds and both pytest + Vitest pass.  In practice this
means:

1. A Python virtual environment is created (if necessary) and the locked
   requirements (`requirements.lock`, `requirements.dev.lock`) are installed.
2. Corepack is enabled so the pnpm shim is available, then the workspace install
   (`pnpm install --recursive`) runs to synchronize Node dependencies.
3. The automated test suites execute (pytest for the services, `pnpm --filter app
   test` for the renderer).  On failure the script stops here.
4. If `-LaunchGui` was provided, the script starts two new PowerShell windows: one
   for `python -m blackskies.services`, another for `pnpm run dev`.

Because provisioning re-runs every invocation, the script can appear to “stall”
while it reinstalls dependencies.  When running in environments without a
Windows desktop (e.g., CI, WSL, or remoting without GUI), the new PowerShell
windows requested during `-LaunchGui` simply never appear.  In that case launch
the services manually as described below.

## Launching the renderer manually

Use the workflow documented in the README:

```powershell
# Either direct install…
pnpm install --recursive
# …or run the repo helper that does the same thing
pnpm run install
pnpm dev
```

`pnpm dev` starts two concurrent tasks:

- `pnpm --filter app dev` – the Vite dev server for the renderer
- `node scripts/electron-dev-placeholder.mjs` – a stub Electron task that keeps
  the process alive and prints the renderer URL

The placeholder **does not** spawn a native Electron window.  Open the renderer
in your browser at <http://127.0.0.1:5173/> instead.  When you are ready to wire
up the real desktop shell, replace `scripts/electron-dev-placeholder.mjs` with
the production Electron bootstrap.

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

1. Keep using the placeholder Electron script while iterating on the renderer.
2. Once you have a working renderer flow, create the real Electron main process
   entry point and swap it into the `pnpm dev` script.
3. Re-run `start-codex.ps1 -OnlyTests` to verify both pytest and Vitest still
   pass before committing changes.
