# Stage 19 Package 19.15 Markdown Export Contract

Status: contract clarified; implementation pending separate bounded authorization

Package: 19.15 — Markdown manuscript export

Branch: `salvage/minimal-two-surface-shell`

Entry commit: `282894c765616ce9747956a83f131b3b718a9c4c`

Task: `BS-19.15-02 — Clarify Package 19.15 Markdown Export Contract`

## 1. Purpose and authority

This record defines the exact bounded Package 19.15 product contract before
runtime implementation begins. It reconciles the Stage 19 V1.0 requirement for
Markdown manuscript export with the accepted Project Spine, Save, recovery,
project-isolation, filesystem, and Package 19.14 AI boundaries.

Jason accepted this contract after the read-only
`BS-19.15-01 — Inspect and Reconcile Markdown Export Authority` pass found that
no dedicated Package 19.15 contract existed. The inspection disposition was
`PRE_IMPLEMENTATION_AUTHORITY_REPAIR_REQUIRED`.

When committed, this record is the controlling Package 19.15 export contract.
It does not implement export, authorize implementation by inference, close
Package 19.15, begin Package 19.16, apply deferred Package 19.14 refinements,
retire historical export code, modify packaging, or authorize a commit or push.

## 2. Authority hierarchy

Package 19.15 remains subordinate to:

1. `current_truth_index.md`;
2. `current_product_roadmap.md`;
3. `stage19_v1_scope_lock.md`;
4. `stage19_v1_master_implementation_and_acceptance_plan.md`;
5. `stage19_packages_19_9_through_19_11_closure.md`; and
6. the closed Package 19.14 authority.

This record narrows the future-facing
`import_export_document_interchange.md` dossier to one explicitly authorized
V1 slice. It does not promote that dossier's broader import, multi-format,
annotated-export, provenance-export, Google Docs, transfer-history, or
publication system into Stage 19.

Older build plans, Phase 11 export plans, `docs/gui/exports.md`,
`draft_full.md` references, legacy `App.tsx` controls, and Python export
services remain historical or partial implementation evidence. They do not
override this contract.

## 3. Package goal and bounded success claim

Package 19.15 must provide a bounded, deterministic, project-isolated Markdown
export of the entire active manuscript's durably saved canonical content in
authoritative manuscript-unit order.

The export is:

- local;
- explicitly initiated in Writing Studio;
- independent of Python, optional services, AI, credentials, and internet
  access;
- bound to one active Project Spine session and one immutable validated
  snapshot;
- written to one user-selected local destination;
- non-mutating with respect to project, manuscript, Save, recovery, generation,
  and revision state; and
- reproducible as identical bytes from the same validated source snapshot.

The strongest provisional Package 19.15 closure claim is:

> Package 19.15 provides a bounded, deterministic, project-isolated Markdown
> export of the entire durably saved active manuscript in authoritative order,
> without mutating project state or including transient AI, credential,
> recovery, or internal operational data.

That claim remains provisional until automated qualification and Jason's
hands-on acceptance are complete.

## 4. Canonical source and request binding

Main-owned Project Spine state is the sole export authority. Renderer buffers,
Command Center projections, recovery candidates, service state, legacy Python
models, and filesystem discovery cannot independently define export content.

Every export request binds to:

- project ID;
- canonical project path;
- current project-session generation;
- current project-session revision; and
- a unique operation ID.

Export binds to the active project session's current generation and revision.
V1 does not offer the user a choice among historical generations or revisions.

The renderer may request export using the exact active Project Spine binding.
It must not submit manuscript prose, unit ordering, a source project path of
its own choosing, AI state, or recovery content.

## 5. Clean-state and recovery gate

Export is available only when the entire active project is durably clean.

The following states block export:

- one or more dirty manuscript units;
- Save in progress;
- Save failed;
- unresolved recovery;
- degraded recovery that requires resolution; and
- recovery-accepted-but-unsaved prose.

Export never triggers Save, recovery acceptance, recovery rejection, checkpoint
capture, or another durability mutation automatically. The writer-facing
remedy is:

```text
Save the project successfully before exporting.
```

No Package 19.15 path may combine durable content from some units with
renderer-only or recovery-only content from others.

The Writing Studio may disable the Export control while a blocking state is
visible. If an invocation reaches main after state becomes blocking, main must
reject it with the same remedy rather than relying on renderer state.

## 6. Snapshot timing and project switching

The destination workflow occurs before the immutable source snapshot is
created:

1. Writing Studio submits a bound export request.
2. Main validates the registered Writing Studio role, active project binding,
   current clean state, and request shape.
3. Main opens the native Save dialog.
4. Cancellation ends the operation as a neutral no-op.
5. Main resolves any required explicit replacement confirmation.
6. Main revalidates the exact project ID, canonical path, generation, revision,
   operation ID, and clean/recovery state.
7. Main creates one immutable validated source snapshot.
8. Main renders and writes only that snapshot.

If any binding or blocking state changes before step 7, export fails closed.
This includes editing, Save activity, recovery-state change, project switch,
generation change, or revision change while the destination dialog is open.

After step 7, the write may complete for the original project even if the UI
later switches projects. The operation never retargets. Its success or failure
remains attributed to the original project and operation and must not appear as
current status for another project.

## 7. Manuscript membership and order

The export contains the whole active manuscript, not only the selected unit.

Membership is the complete validated current Project Spine manuscript-unit
list. Package 19.15 introduces no note, role, archive, placeholder, chapter,
scene-kind, or Story Unit filter.

Units are ordered by the unique positive numeric order validated from the
current Project Spine structural manifest. Export must not sort by filename,
unit ID, creation time, title, current selection, renderer list position, or
legacy chapter grouping.

All units are included, including units with empty or whitespace-only bodies.
Duplicate titles do not merge units or affect ordering.

An active manuscript with zero units still produces a valid project-heading
Markdown file when the writer explicitly completes the destination workflow.

## 8. Exact Markdown byte contract

The export encoding is:

- UTF-8 without a byte-order mark;
- LF (`U+000A`) line endings;
- no CR bytes introduced by export; and
- exactly one final LF byte.

The document structure is:

```markdown
# <normalized and escaped project title>

## <normalized and escaped first unit title>

<normalized first unit body>

## <normalized and escaped second unit title>

<normalized second unit body>
```

The project heading is always present. Each unit receives exactly one
second-level heading. There is exactly one blank line between headings and
following content and between document sections. When the final unit is empty,
its heading is followed only by the document's single terminating LF; export
does not invent a trailing blank body line.

An empty unit is represented as:

```markdown
## Untitled

```

within the surrounding document structure. A whitespace-only body counts as
empty for export framing. The unit remains present through its heading.

If the manuscript has no units, the exact logical structure is:

```markdown
# <normalized and escaped project title>
```

followed by exactly one final LF.

## 9. Title normalization and Markdown escaping

Project and unit titles use the same deterministic display transformation:

1. Replace every CR, LF, or horizontal-tab run, together with adjacent
   ordinary spaces, with one `U+0020` space.
2. Trim leading and trailing Unicode whitespace.
3. If the resulting project title is empty, use `Untitled Project`.
4. If the resulting unit title is empty, use `Untitled`.
5. Preserve all remaining Unicode code points.
6. Prefix a backslash to each remaining occurrence of these exact Markdown
   syntax characters:

```text
\ ` * _ [ ] < > # ! & ~
```

The escaping step applies only to generated project and unit headings. It does
not modify the durable source title or any unit body.

Duplicate normalized titles and duplicate rendered headings are permitted.
They remain distinct because manuscript membership and order are identity
based.

## 10. Unit-body fidelity and separators

The source body is the durable manuscript body after the existing authoritative
draft-envelope/front-matter boundary has been removed. Package 19.15 does not
export draft front matter.

For each body:

1. Convert CRLF and lone CR line endings to LF.
2. Preserve all other Unicode code points, Markdown punctuation, paragraph
   structure, internal blank lines, and ordinary whitespace.
3. Treat a body containing only Unicode whitespace as empty.
4. Remove terminal LF characters only as document framing before the fixed
   inter-unit separator is added.

The exporter performs no prose correction, reflow, punctuation repair,
typography normalization, Unicode normalization, Markdown escaping, critique
cleanup, or editorial rewriting.

The same immutable snapshot must always produce identical Markdown bytes.
Timestamps, project paths, IDs, generation, revision, and export-operation
metadata do not appear in the Markdown.

## 11. Filename derivation and validation

Main supplies a suggested Windows-safe filename to the native Save dialog. The
writer may edit that suggestion.

The suggestion algorithm is:

1. Start from the project title.
2. Collapse CR, LF, horizontal tabs, and adjacent ordinary spaces as defined
   for titles.
3. Trim leading and trailing Unicode whitespace.
4. Replace each Windows-invalid filename character
   `\ / : * ? " < > |` and each `U+0000` through `U+001F` control character
   with `_`.
5. Retain other valid Unicode.
6. Limit the stem to the first 120 Unicode code points.
7. Remove trailing ordinary spaces and periods after replacement and
   truncation.
8. Compare both the complete stem and the portion before its first period
   case-insensitively with the Windows device names `CON`, `PRN`, `AUX`,
   `NUL`, `COM1` through `COM9`, and `LPT1` through `LPT9`.
9. If the stem is empty or either comparison is a reserved device name, use
   `manuscript`.
10. Append exactly one lowercase `.md` extension.

For the writer-edited selected basename, main independently applies the
invalid-character, control-character, trailing-space/period, length, reserved
name, empty-name, and extension checks before writing. One or more
case-insensitive terminal `.md` suffixes are collapsed to exactly one
lowercase `.md`. A non-Markdown suffix is retained as part of the stem before
`.md` is appended.

The deterministic fallback filename is:

```text
manuscript.md
```

## 12. Destination, cancellation, collision, and overwrite

Main owns the native Save dialog and final filesystem destination. The
renderer receives no unrestricted filesystem capability.

The destination may be inside or outside the active project directory.
Selecting an export destination does not add it to the project, recent-project
state, recovery, or durable manuscript metadata.

Cancelling the Save dialog:

- creates no file;
- is not presented as an error or export failure;
- changes no project, Save, dirty, generation, revision, recovery, or AI state;
- retains no export authorization; and
- requires a new explicit invocation to try again.

Black Skies must never replace an existing destination without explicit user
confirmation bound to that exact canonical destination. Main must verify the
replacement decision; unspecified platform behavior is not sufficient product
authority. Declining replacement is a neutral no-op with the same
non-mutation guarantees as dialog cancellation.

Confirmation for one destination never authorizes another destination.

## 13. Atomic write and failure behavior

The accepted implementation mechanism is the existing main-process Project
Spine atomic-write convention:

1. render deterministic bytes in memory;
2. create a uniquely named sibling temporary file exclusively;
3. write the exact UTF-8 bytes;
4. flush and sync the file;
5. close it successfully;
6. atomically rename or explicitly replace the confirmed destination; and
7. remove the temporary file after failure where safe.

The mechanism is `IMPLEMENTATION_RESOLVED`. The full user-visible failure and
replacement semantics are governed here rather than inferred from an existing
utility.

Export success means the final destination contains the complete exact bytes.
A partial or temporary file is never reported as success.

Failure must:

- preserve an existing destination whenever final replacement did not
  complete;
- leave project, manuscript, Save, dirty, generation, revision, recovery, and
  AI state unchanged;
- retain no standing retry or replacement authorization;
- remain attributed to the original project and operation;
- present a bounded useful error and safe retry instruction; and
- require a new explicit user action to retry.

## 14. IPC and process authority

Package 19.15 uses a new minimal typed Project Spine export contract.

Main:

- validates the actual registered sender as Writing Studio;
- owns active identity, clean-state validation, snapshot creation, rendering,
  destination selection, collision handling, filesystem access, hashing, and
  final result;
- independently derives project title, membership, order, durable bodies,
  generation, and revision; and
- rejects stale or malformed requests.

Preload exposes only the bounded typed export request to Writing Studio.
Command Center receives no export mutation method. Command Center may later
project status only through separately settled projection authority; Package
19.15 does not add that behavior.

The renderer may display availability, remedy, cancellation, success, and
failure. It does not render canonical bytes, choose source units, supply prose,
or perform filesystem writes.

## 15. Result and qualification evidence

User-visible successful completion reports:

- completion status;
- destination path;
- exact file byte length; and
- exported unit count.

Cancellation and declined replacement report a neutral cancelled disposition,
not failure.

The typed internal result and Package 19.15 qualification evidence additionally
preserve:

- SHA-256 of the exact Markdown bytes;
- source project ID;
- source generation;
- source revision;
- ordered source unit IDs;
- deterministic source snapshot fingerprint;
- operation ID; and
- UTC completion timestamp.

These internal identities do not appear inside the Markdown file.

The deterministic source snapshot fingerprint is lowercase SHA-256 of the
UTF-8 bytes of a compact JSON object with this exact property order and no
insignificant whitespace:

```json
{"schemaVersion":1,"projectId":"<project ID>","generation":1,"revision":1,"units":[{"id":"<unit ID>","order":1,"title":"<durable source title>","bodySha256":"<lowercase SHA-256 of LF-normalized durable body UTF-8 bytes>"}]}
```

Units appear in authoritative order. JSON string escaping follows
`JSON.stringify` semantics. The shown numeric `1` values stand for the actual
numeric generation, revision, and unit-order values; angle-bracketed strings
stand for the corresponding exact string values. The canonical project path,
destination path, credential state, AI state, and recovery content are
excluded from the source snapshot fingerprint.

## 16. Content exclusions

The Markdown and export result must not include or derive content from:

- API credentials or credential status;
- AI request previews, payloads, hashes, cost estimates, provider usage, or
  critique results;
- stale, failed, cancelled, or in-flight AI state;
- qualification, human-review, validation, or acceptance evidence;
- recovery candidates, checkpoints, artifacts, or unresolved recovery prose;
- draft front matter;
- absolute project paths;
- internal project or unit IDs inside the Markdown;
- debug values, logs, diagnostics, service-health state, snapshots, backups,
  or history;
- other projects; or
- legacy export metadata or optional critique appendices.

Export is manuscript interchange, not Save, backup, project archive, recovery,
AI evidence export, or editorial-report export.

## 17. Legacy export subordination

Legacy `app/renderer/App.tsx` export controls and the Python
`ProjectExportService` are historical or partial implementation evidence.

They are not the Package 19.15 production path. They must not be wired into the
Stage 19 Writing Studio, aliased by the new Project Spine bridge, or used to
claim Package 19.15 acceptance.

They remain untouched unless a later separately authorized cleanup or
retain/archive/remove task owns their disposition. Package 19.15 does not
modify historical Python export tests, broad format support, ZIP restore, or
legacy renderer behavior.

## 18. Automated qualification obligations

Automated evidence must cover:

- exact deterministic Markdown bytes and repeat export identity;
- UTF-8 without BOM, LF-only output, and one final LF;
- project and unit title normalization and exact escaping;
- Markdown syntax in project and unit titles;
- line breaks and tabs in titles;
- Unicode titles and bodies;
- duplicate and blank or whitespace-only titles;
- zero-unit manuscripts;
- empty and whitespace-only unit bodies;
- authoritative membership and order;
- intentional Markdown and body fidelity;
- Windows-invalid project-title characters;
- reserved and empty filename fallback;
- filename length, trailing spaces/periods, Unicode, and `.md` normalization;
- user-edited filename validation;
- destination outside the project;
- dialog cancellation;
- existing destination replacement accepted and declined;
- clean-state requirement and exact remedy;
- dirty, saving, save-failed, unresolved recovery, degraded recovery, and
  recovery-accepted-but-unsaved rejection;
- project dirtied or switched while the dialog is open;
- stale project, path, generation, revision, and operation rejection;
- immutable-snapshot completion after later project switch;
- main-only filesystem and Writing-Studio-only IPC authority;
- Command Center rejection;
- atomic success, write/sync/rename/replacement failure, and temporary cleanup;
- preservation of an existing destination on failed replacement;
- exact result byte count, unit count, SHA-256, source identity, fingerprint,
  operation, and timestamp;
- exclusion of AI, credentials, recovery, paths, internal IDs, diagnostics,
  history, and other-project content; and
- proof that export changes no dirty state, generation, revision, recovery
  state, Save state, or manuscript content.

Exact-byte assertions are required. Broad substring-only tests cannot qualify
the deterministic format.

## 19. Hands-on acceptance obligations

Jason's disposable acceptance project must include:

- multiple ordered units;
- duplicate titles;
- a blank or whitespace-only title;
- an empty body;
- a whitespace-only body;
- intentional Markdown punctuation in titles and prose;
- Unicode;
- recognizable saved prose; and
- saved, dirty, saving/failure, and recovery-blocked scenarios where practical.

Hands-on acceptance must verify:

- the correct whole manuscript exports in authoritative order;
- the exported file opens as ordinary Markdown in a normal text editor;
- headings, bodies, Unicode, empty units, and duplicate titles are faithful;
- the suggested and edited filenames behave as specified;
- a destination outside the project is allowed;
- cancellation is neutral;
- replacement accepted and declined are explicit and correctly bounded;
- editing or switching projects while the dialog is open cannot stale or
  retarget the operation;
- repeat export of an unchanged snapshot produces identical bytes;
- failure does not damage the project or existing destination;
- Save and recovery remain independent;
- success is attributed to the correct original project; and
- no AI, credential, recovery, internal path, or operational data appears.

No provider request, API credential, Python service, internet access, or paid
operation is required.

## 20. Bounded implementation sequence

After this contract is committed and Jason separately authorizes
implementation, the recommended sequence is:

1. `BS-19.15-03 — Implement Main-Owned Markdown Export`
2. `BS-19.15-04 — Integrate Writing Studio Export`
3. `BS-19.15-05 — Qualify Markdown Export`
4. Jason hands-on Package 19.15 acceptance
5. `BS-19.15-06 — Close Package 19.15`

Implementation, qualification, hands-on acceptance, and closure remain
separate gates. Package 19.16 does not begin until Package 19.15 is closed.

## 21. Stop conditions and exclusions

Stop Package 19.15 implementation if:

- canonical Project Spine membership or order cannot be preserved;
- export would require renderer-owned prose authority;
- the clean-state gate cannot be enforced in main;
- the implementation would silently Save or export recovery prose;
- explicit replacement confirmation cannot be guaranteed;
- failure could corrupt the source project or falsely report a partial file as
  success;
- AI, credentials, recovery, internal paths, or other-project data become
  reachable;
- the production path would depend on legacy `App.tsx`, Python export, optional
  services, or paid provider execution; or
- implementation requires DOCX, EPUB, PDF, ZIP, packaging cleanup, credential
  redesign, or reopening Package 19.14.

## 22. Current disposition

```text
CONTRACT_CONFIRMED_WITH_PRECISION_REFINEMENTS
PRE_IMPLEMENTATION_AUTHORITY_REPAIR_COMPLETE_WHEN_COMMITTED
IMPLEMENTATION_PENDING_SEPARATE_AUTHORIZATION
```

Completion marker:

```text
BS_19_15_02_MARKDOWN_EXPORT_CONTRACT_CLARIFIED
```
