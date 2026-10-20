# Program 7.5 development baseline

Use the independent `work/program7-5-continuation` checkout in the parent
Black-skies program 8 workspace, branch `codex/program7-5-stabilization`.
The accepted starting commit is `6523e515b8b05e4ab5d3859c7cb90396d6867351`.
The final source commit, tree, clean status, bundle and exact package hashes
are recorded by the Phases 3–5 closure packet outside this checkout. Do not
substitute the older development tree or infer repair identity from a version
number or the historical `feee2e2e` runtime.

## Reproduce and verify

Use the frozen pnpm lockfile with pnpm 8.15.9, supported Node 22.19.0 and
Python 3.11.9 with `requirements.dev.lock` in a separate environment. Preserve
the existing package patch and package versions. The Phase 2 independent
installation and Phase 4 reconstruction receipts identify actual module roots,
stores and machine interpreter dependencies.

```text
pnpm install --recursive --frozen-lockfile --store-dir <new-store>
<python311> -m venv <new-environment>
<new-environment>/Scripts/python -m pip install -r requirements.dev.lock
pnpm --filter @blackskies/app run build:production
pnpm typecheck:all
pnpm --filter @blackskies/app run test
<new-environment>/Scripts/python -m pytest services/tests
pnpm lint:docs
pnpm stage19:regression
```

Run the fixed gate against clean committed source, without `--allow-dirty`.
Retain actual denominators, skips and failures. Set short, newly owned `TEMP`
and `TMP` outside every Git worktree; the parent workspace itself has `.git`.
Isolate APPDATA, LOCALAPPDATA, Electron profiles and development logs. Tests use
synthetic/materialized project copies, normal GPU and disabled real local AI.
Each Electron run needs distinct output/result paths. The qualification packet
includes exact argv/environment, service tests and six additional Program 7
desktop specs covering revisions, Ideas, long form, accessibility and scale.

The hosted packaging workflow uses Windows Server 2022 and a canonical job-owned
RUNNER_TEMP subdirectory. Its results do not establish Windows 11 visual or human
acceptance. Desktop geometry journeys set their intended viewport explicitly.
Run 39459099173 at 646750335630bbf1db9c4ddd9c94f2513f6fbce0 passes the clean gate,
verified installer, isolated offline installed lifecycle, independent witness and
installed performance. The October 20 completion packet preserves downloaded
receipts/artifacts and a hash-checked replay kit. The installer SHA-256 is
3de247a61cd8db801b3465446ad5338902f746ad080d0bc3d1f2bc90bb480d21.
Later documentation-only commits do not change that package binding. The expanded
scale frame-gap defect and explicitly deferred human acceptance remain open.

## Source-return repair and ownership

CodeMirror can revise wrapped-line height estimates after an initial reveal.
The continuous writing canvas owns scrolling, so inner-editor compensation
alone can leave the selected passage offscreen. Source return now holds its
exact anchor through at most six measurements until position/height settle.
Pending frames stop on unmount, a superseding request, or changed source or
selection. The acknowledgement remains a selection result; the Electron test
independently verifies actual viewport/canvas visibility and subsequent manual
acceptance. No manuscript mutation, new destination authority or history owner
was introduced. Manual acceptance and main-process currentness guards remain
authoritative.

Seven existing Electron specs declare their actual harness dependencies and
replacement criteria. Harness execution, packaged runtime execution, installed
lifecycle and human acceptance remain separate evidence classes.

## Packaging safely

Use clean source and the unchanged package verifier. Package with publication
disabled, signing discovery disabled and newly owned helper/download caches.
Retain the receipt-bound executable, ASAR and installer and their hashes.

The existing NSIS app identity and uninstall registration are shared with the
accepted application. A new `/D` directory does not isolate that ownership.
Do not execute the candidate installer or lifecycle script in the project
owner's Windows account. Actual install/uninstall/reinstall qualification
requires a disposable Windows environment without the accepted registration.
Do not change appId merely to make an installation test pass.

The October 20 pinned builder patch handles Windows template working
directories at or beyond MAX_PATH by copying the full template tree into a
fresh short directory beneath TEMP/TMP. Keep TEMP/TMP short and outside Git;
the patch fails explicitly if the temporary parent is itself too long.
Do not change compiler stdio or relax warnings to address ENOTCONN. The
diagnostic receipt reproduces the failure with both Node and NSIS version
commands using the original long working directory. Only the patch hash in
the frozen lockfile changes; package versions and installer identity stay
pinned. Retain temporary staged resources with the build evidence as needed.

The existing packaged-runtime smoke can safely target the new `win-unpacked`
executable with a new outside-Git test root and isolated profile. Label that
result as packaged runtime, not installed lifecycle or human approval. Keep
the accepted installation and original manuscripts untouched.

## Recovery and remaining contracts

Preserve Phase 0–2 evidence and the 16-file Phase 2 overlay. The final local
Git bundle and source archive must restore into a new disposable folder before
being called recoverable. Frozen dependency reconstruction and application
reproduction are separate from source and author-data recovery. The current
preservation remains on C:; off-device durability is a separate owner action.

The 25 historical paths retain seven verified relocations, ten unavailable
references and eight unresolved gaps. New tests do not rewrite old human
decisions or recreate missing evidence. Existing legacy author-data migration,
filesystem/cloud compatibility and whole-project crash transactions retain
their scoped qualification limits.

Program 8 work requires explicit package/owner/currentness/protection and
durable receipt/idempotency/rollback contracts before destination implementation.
External-service token enforcement, legacy rewrite/export/scheduler changes,
new model/provider admission, Project Memory and Program 9 remain separately
controlled. This runbook does not grant feature implementation authority.
