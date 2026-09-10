# Program 7 Long-Form Corpus - Carmilla

## Selection

- Work: `Carmilla`
- Author: Joseph Sheridan Le Fanu, 1814-1873
- First publication: 1872
- Form: human-authored Gothic vampire novella
- Source: [Project Gutenberg eBook 10007](https://www.gutenberg.org/ebooks/10007)
- Official plain text: [UTF-8 download](https://www.gutenberg.org/cache/epub/10007/pg10007.txt)
- Project Gutenberg status: public domain in the United States
- Downloaded for Program 7 planning: 2026-09-08

The unmodified Project Gutenberg UTF-8 file is retained at
[`source/carmilla_project_gutenberg_10007.txt`](source/carmilla_project_gutenberg_10007.txt).
Its complete Project Gutenberg license and distribution terms remain inside the
file. Any later derived Black Skies fixture must retain this source record and
must not remove or misrepresent the original license.

Users outside the United States must verify the copyright law that applies in
their location. The Program 7 qualification described by the current charter is
performed in the United States.

## Download Evidence

- Downloaded CRLF bytes: `181071`
- Downloaded-byte SHA-256: `F751453EF6AD9363A7E31F63B8D4EF830C7EA20A2ABA465A59FB6FBEE6BBDDCA`
- Checked-out LF bytes: `177346`
- Checked-out LF SHA-256: `557B3B2E62B2D919443F7DF979C5BF01EEFD86DDBBE012F276FA03AB06203E94`
- The two hashes intentionally differ only because Git checkout normalizes the
  downloaded CRLF representation to LF. The source file is never rewritten by
  the derived fixture workflow.
- Human-authored body word count between the Project Gutenberg start and end
  markers: `28199`
- Structure: prologue plus sixteen chapters

The body count excludes the trailing Project Gutenberg license and is used only
to establish that the work meets the Program 7 long-form target. It is not a
literary or authorship claim by Black Skies.

## Why It Fits Program 7

`Carmilla` supplies sustained human-authored horror prose, stable chapter
boundaries, recurring characters, chronology, atmosphere, emotional movement,
continuity dependencies, pacing changes, and pressure escalation. Its length
fits the accepted 20,000 to 30,000 word target without requiring AI-generated
prose as subjective-quality evidence.

## Derived Qualification Fixtures

The immutable source is now accompanied by separately tracked derived fixtures
under [`derived/`](derived/). The baseline and revised snapshots are openable
Black Skies projects with one prologue and sixteen stable chapter unit IDs.
`corpus-manifest.json` records the source and snapshot hashes; it does not
replace the source or its license. `answer-key.json` gives each seeded concern
an objective baseline/revised state and resolving range, including a concrete
resolved wording change, an intentionally open interpretive concern, a
metadata-only protected span, an intentionally unresolved concern, and an
explicit source-drift case. The recurrence fixture requires a distinct related
ID rather than reopening the resolved concern.

The verifier and focused test load both snapshots through the production
ProjectSpine project-loader path, then independently check immutable source
hashes, overlay determinism, protected-span non-disclosure, source drift, and
fixture completeness. No model execution or literary-quality claim is implied
by these deterministic fixtures.

All future corpus work must keep the original source bytes and embedded
Project Gutenberg license unchanged. Any new overlays, concerns, protected
spans, or revised variants belong in separate derived fixtures with explicit
provenance.
