# Program 7 Qualification Closure Report

Status: core mechanical exact-candidate qualification packet complete; the
local-AI timing cleanup is not-qualified. Human Gate 4 and local-AI admission
remain pending. Program 7 is not closed by this report.

Exact candidate commit: `c57be0ffe41b5383f50fbc29546c121603094e40`

Exact candidate tree: `a75c40f14e078ddda49b9fcfa33a5fe383390bc5`

The corrected evidence packet is bound to the exact candidate above. The
normal-GPU Electron gates were executed on the outer Windows host with
Electron 39.8.10, normal GPU, Chromium sandbox enabled, and no dirty or
diagnostic GPU override.

## Mechanical evidence

- The single exploratory prompt/fixture-repair `qwen3:4b` run observed 24 rows
  and passed 20 mechanical rows. It ran from a worktree based on commit
  `db482ce9b5f5bc3973df57ad1bebb3dbd0058619` / tree
  `79a26a31c1a59ba6455b2ec7bc38b8f2d93e85ac` while the repair remained
  uncommitted. Its `exactCommit` field therefore identifies the base HEAD,
  while row prompt hashes identify the instructions actually exercised. It is
  not a replacement for this frozen exact-candidate packet. All cold timing
  rows passed; warm Q01/Q02/Q04
  exceeded the 20s first-visible limit at 26,631ms, 28,576ms, and 21,674ms.
  Q06 cold observed `still_appears_present` instead of expected
  `appears_resolved`; its warm row passed. The model digest was
  `359d7dd4bcdab3d86b87d73ac27966f4dbb9f5efdfcc75d34a8764a09474fae7`.
  Truth remained unchanged and protection scanning found zero hits. Local-AI
  is therefore not mechanically eligible; admission remains `pending-human`.
- Persistence: 8 suites / 136 tests passed with zero failures or skips.
- Unicode/Markdown: all 18 required assertions passed.
- Accessibility: qualified packet with 66/66 observed rows passed and all
  required state bindings resolved.
- Scale: qualified 1x/2x/4x/8x packet with complete observations.
- Dedicated Program 7 Electron workflows: revision, Create/Develop,
  local-AI-disabled, and Carmilla long-form each passed 1/1.
- Clean Stage 19: 49 critical files, 806 passed, 2 skipped; Electron startup
  preflight 1/1; Electron matrix 36/36; `STAGE19_REGRESSION_PASS` and
  `CLEAN_RC_ELIGIBLE` recorded.
- Fresh Windows NSIS package: receipt is bound to the exact candidate, ASAR
  SHA-256 `9a92db5a8b2dc76079fe1071bfc6dc7a998de20ae761472a53c92fb25973e400`,
  yaml `2.8.3`, and forbidden-path count `0`.
- Administrator offline-firewall installed lifecycle: passed, including
  representative workload, cleanup, external-data preservation, uninstall,
  and same-installer reinstall.

## Local-AI cleanup disposition

The bounded prompt/fixture repair is limited to the existing operation-specific
transport contract, qualification fixtures, and deterministic tests. The real
cleanup packet is retained at:

`C:\Users\gray2\AppData\Local\Temp\blackskies-p7-local-ai-prompt-repair-run-20260920-224212\real-qualifier.json`

The opt-in outer-host Electron bridge journey passed after its assertion
timeout was corrected; it proved that a real candidate remains advisory until
an explicit acceptance action and does not mutate the manuscript. The single
post-repair run still shows a warm Q01 character-limit comment, Q02 voice and
speaker-fidelity risk, Q04 added-content risk, and Q06 cold semantic
instability. These remain known model-quality/qualification issues; no local-AI
admission is inferred.

## Human-only items

Jason’s usefulness, fidelity, facts, voice/style, actionability, and
uncertainty-restraint scores remain blank. Human Gate 4 has not been claimed.
Local-AI admission remains blank and `pending-human`; no human score or
admission decision is inferred from the mechanical RT-2B packet.

The P4/P5/P6 current-build regression rows remain reserved for Jason’s
Human Gate 4 session. This report does not claim subjective acceptance,
Human Gate 4 completion, or Program 7 closure.

## Canonical artifacts

- `docs/product_systems/program_7_evidence_ledger.jsonl`
- `docs/product_systems/program_7_local_ai_qualification.json`
- `docs/product_systems/program_7_persistence_qualification.json`
- `docs/product_systems/program_7_unicode_qualification.json`
- `docs/product_systems/program_7_accessibility_qualification.json`
- `docs/product_systems/program_7_scale_qualification.json`
- `docs/product_systems/program_7_electron_qualification.json`
- `docs/product_systems/program_7_human_sample.json`
- `scripts/validate-program7-evidence.mjs`
- `scripts/build-program7-evidence-ledger.mjs`
- `scripts/program7-human-sampling.mjs`

Lifecycle evidence is retained at:

`C:\Users\gray2\AppData\Local\Temp\blackskies-p7-c57be0ff-admin-lifecycle-20260921-0020\stage19-22-lifecycle-evidence.json`
