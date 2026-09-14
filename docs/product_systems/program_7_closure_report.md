# Program 7 Qualification Closure Report

Status: partial exact-candidate refresh complete; normal-GPU Electron requalification,
package qualification, Human Gate 4, and local-AI admission remain open.

Exact current runtime implementation commit: `cb2d5c943aa80a1f5a8248c9e46cb0ca2d1e683a`

Exact current runtime implementation tree: `7099f103054bc80847db435889932db71417ef6a`

The current local-AI, persistence, and Unicode artifacts bind to this exact
implementation commit. Accessibility, scale, Electron/Stage 19, and packaged
artifacts remain explicitly unresolved because their fresh normal-GPU/package
runs could not be completed on this host.

## Evidence completed

- Exact persistence qualification: 8 suites / 136 tests passed with zero skips or failures. Migration, corruption, concurrency, and recovery each map to named assertions and report `Pass`.
- Feedback Notes proves lossless legacy-v1 reading, extension-field preservation, first-write migration, and repeat idempotence. Current strict-schema owners reject unsupported versions rather than inventing migrations.
- Feedback Notes, Ideas, Revision Candidates, and Story Foundation now synchronize temporary files before atomic replacement, clean failed temporary files, and preserve the prior durable document when replacement fails.
- Corrupt JSON, invalid UTF-8, wrong versions, duplicate identities, abandoned temporary files, stale writers, same-revision races, interrupted candidate acceptance, and recovery-envelope failures are covered without silent repair or byte rewriting.
- The exact-candidate RT-2B runner passed 24/24 mechanical rows with real `qwen3:4b`; protected refusal, cancellation, timeout, malformed response, endpoint loss, and unchanged manuscript/story hashes remain mechanically verified. Jason’s usefulness and admission decision are not inferred.
- The exact-candidate persistence runner passed 8 suites / 136 tests, and the Unicode/Markdown runner passed all 18 required assertions.

## Explicitly not closed

The prior pilot remains mechanical evidence only and is no longer the current
candidate's qualification receipt. A fresh RT-2B real-model run must precede
Jason's scores for usefulness, source fidelity, facts, voice/style,
actionability, and uncertainty restraint. Jason alone decides whether local AI
is admitted. Human Gate 4 must review the no-AI Carmilla workflow and the
integrated surfaces. This report does not authorize, imply, or fabricate either
decision.

The nested Codex sandbox reproduces Electron `STATUS_DLL_NOT_FOUND` before first window creation. The required outer-host run passes; no GPU-disable diagnostic mode was used and no runtime or ACL repair was made.

The remaining mechanical work is fresh normal-GPU accessibility/visual and
scale receipts, a fresh Stage 19/Electron receipt, a successful exact Windows
package build, and the exact offline-firewall package matrix. The latter still
requires an Administrator PowerShell session. The P4/P5/P6 regression rows
remain reserved for Jason. These are not closure or admission claims.

## Canonical artifacts

- `docs/product_systems/program_7_evidence_ledger.jsonl`
- `docs/product_systems/program_7_local_ai_qualification.json`
- `docs/product_systems/program_7_electron_qualification.json`
- `docs/product_systems/program_7_persistence_qualification.json`
- `scripts/program7-evidence-row.schema.json`
- `scripts/validate-program7-evidence.mjs`
- `scripts/build-program7-evidence-ledger.mjs`
- `scripts/program7-human-sampling.mjs`
- `docs/product_systems/program_7_human_sample.json`
