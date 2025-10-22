*** Begin Patch
*** Update File: README.md
@@
 3. **Launch the smoke test (Vite + Electron + services)**
    ```powershell
    powershell.exe -ExecutionPolicy Bypass -File .\start-codex.ps1 -SmokeTest
    ```
    Two terminals open: one runs `pnpm --filter app dev -- --host 127.0.0.1 --port 5173`, the other launches Electron with the
    real preload and auto-starts the FastAPI bridge. When the status pill flips to “Services online” the stack is healthy. Close both
    windows to shut everything down.
 
    > Prefer manual control? Follow the step-by-step commands in `docs/quickstart.md`.
+
+### Companion overlay & budget meter (P8)
+
+Once the desktop shell is running:
+
+1. Click the **Companion** button in the workspace header.
+2. Use the *Add category* input to create or remove rubric entries.
+3. Tick scenes in the *Batch critique* list, then press **Run batch critique**.
+4. Trigger a draft preflight (Generate ? Proceed) to populate the budget meter; the meter clears automatically when no estimate is active.
+
+The overlay surfaces scene insights (word counts, pacing hints) and the meter keeps an eye on projected spend so you can spot soft/hard-limit issues before submitting work.
*** End Patch
