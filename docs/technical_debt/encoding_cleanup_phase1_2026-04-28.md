# Encoding Cleanup — Phase 1.4 — 2026-04-28

## Command Run
```text
rg -n "â€™|â€œ|â€|Ã" docs
```

## Initial Matches
```text
docs\BLACK_SKIES_FIX_TRACKER.md:1481:Multiple active docs contained mojibake characters (`â€”`, `â€œ`, `Ã¢â‚¬â€`).
docs\technical_debt\baseline_2026-04-28.md:121:- Command: `rg -n "â€™|â€œ|â€|Ã" docs`
docs\technical_debt\baseline_2026-04-28.md:128:docs\BLACK_SKIES_FIX_TRACKER.md:1481:Multiple active docs contained mojibake characters (`â€”`, `â€œ`, `Ã¢â‚¬â€`).
```

## Replacements Made
- File: `docs/BLACK_SKIES_FIX_TRACKER.md`
- Safe replacement applied (obvious punctuation normalization only):
  - `` `â€”`, `â€œ`, `Ã¢â‚¬â€` `` -> `` `—`, `“`, `”` ``

## Remaining Matches
```text
docs\technical_debt\baseline_2026-04-28.md:121:- Command: `rg -n "â€™|â€œ|â€|Ã" docs`
docs\technical_debt\baseline_2026-04-28.md:128:docs\BLACK_SKIES_FIX_TRACKER.md:1481:Multiple active docs contained mojibake characters (`â€”`, `â€œ`, `Ã¢â‚¬â€`).
```

Remaining entries are intentional historical evidence in the baseline report and were not edited to preserve Phase 0 audit fidelity.

## Files Changed
- `docs/BLACK_SKIES_FIX_TRACKER.md`
- `docs/technical_debt/encoding_cleanup_phase1_2026-04-28.md`

## Confirmation
- Only docs were edited.
- No source, tests, workflows, lockfiles, or configs were changed.
