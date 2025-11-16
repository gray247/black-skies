Status: Active
Version: 1.0.0
Last Reviewed: 2025-11-15

# Documentation Style Guide (Draft)

## Headings
- Use sentence case (e.g. "Phase overview").
- Limit to H1–H3 unless deeper nesting is required.

## Terminology
- Expand acronyms on first use (e.g. "Release Candidate (RC)").
- Refer to phases as "P8 — Companion & Critique Expansion" to match the charter.

## Lists & tables
- Prefer tables for multi-attribute summaries (phase, owner, status).
- End bullet sentences with periods when they are full sentences; omit periods for fragments.

## Links
- Use relative links from the current document (e.g. `./filename.md`).
- Highlight draft/in-progress docs with *(draft)*.

## Tone
- Keep voice direct and action oriented ("Run `pnpm lint` before pushing").
- Call out TBD items explicitly rather than implying completion.

_Update this guide alongside major documentation changes._

Run `pnpm lint:docs` before merging documentation-heavy PRs.
