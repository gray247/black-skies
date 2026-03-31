Status: Draft
Version: 1.0.1
Last Reviewed: 2026-03-31

# Plugin Sandbox

This document describes the plugin implementation that actually exists.

## Current Implementation

The current plugin path is:
- `services/src/blackskies/services/plugins/registry.py`
- `services/src/blackskies/services/plugins/host.py`
- `services/src/blackskies/services/plugins/runner.py`

The runtime does the following:
- stores plugin manifests under the plugin directory
- validates plugin IDs and manifest structure
- launches a subprocess with `python -m blackskies.services.plugins.runner`
- executes a single callable entrypoint from the manifest
- applies CPU, memory, and file-descriptor limits inside the runner where supported

The manifest format currently supports:
- `entrypoint`
- `module_path`
- `metadata`

What does not exist:
- a plugin HTTP router
- hook dispatch like `on_plan` / `on_analyze` / `on_rewrite` / `on_export` / `on_report`
- JSON-RPC transport
- host-side wall-clock timeout enforcement
- lifecycle audit logging for plugin install/execute/terminate
- network proxying or quota accounting

## Security Reality

The sandbox is partial, not complete.

It is isolated by subprocess boundary and runtime limits, but the host currently relies on subprocess invocation and manifest validation rather than a full orchestration layer.

`plugins_enabled()` is the feature gate.

If plugin execution is disabled, the registry refuses to run the plugin.

## Future Work

If the repo later adds hook dispatch, this file should be updated to define:
- the hook names
- the payload shape
- the permission model
- timeout and retry ownership
- how failures are reported back to the caller

Until that code exists, hook-language belongs in future-design notes only.
