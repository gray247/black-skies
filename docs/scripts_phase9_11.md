# docs/scripts_phase9_11.md — DRAFT

## CLI / Scripts
Document utilities tied to Phases 9–11, including their flags and log destinations.

### `scripts/export_diff.py`
Compares exported Markdown against a golden baseline to catch inline critique markers or formatting regressions. Accepts `--dry-run` to skip writing artifacts, logs to `logs/export_diff.log`, and returns non-zero when diffs exceed thresholds.

### `scripts/insights-rescue.ps1`
Clears stuck model queue flags and resets Overseer state when batches hang. Supports `--dry-run` and records actions to `logs/insights-rescue.log`.

### `scripts/dev-runner.mjs`
Launches services plus Electron with testing flags (e.g., `--critique-mode=mock`). The script respects `--dry-run` for smoke checks and emits JSON logs to `logs/dev-runner.log`.

### `tools/perf-summarize.py`
Ingests `.perf/*.jsonl` telemetry and rolls it up into a human-readable table or CSV. Always honors `--dry-run` and writes summaries to `logs/perf-summarize.log`.

All scripts log to `logs/` by default and support `--dry-run` to validate inputs without mutating state.
