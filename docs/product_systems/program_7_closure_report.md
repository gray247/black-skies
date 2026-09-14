# Program 7 Qualification Closure Report

Status: partial exact-candidate refresh and Windows package construction
complete; normal-GPU Electron requalification, exact packaged lifecycle,
Human Gate 4, and local-AI admission remain open.

Exact current runtime implementation commit: `cb2d5c943aa80a1f5a8248c9e46cb0ca2d1e683a`

Exact current runtime implementation tree: `7099f103054bc80847db435889932db71417ef6a`

The current local-AI, persistence, and Unicode artifacts bind to this exact
implementation commit. Accessibility, scale, Electron/Stage 19, and the exact
packaged lifecycle remain explicitly unresolved because their fresh
normal-GPU/elevated runs could not be completed on this host.

## Evidence completed

- Exact persistence qualification: 8 suites / 136 tests passed with zero skips or failures. Migration, corruption, concurrency, and recovery each map to named assertions and report `Pass`.
- Feedback Notes proves lossless legacy-v1 reading, extension-field preservation, first-write migration, and repeat idempotence. Current strict-schema owners reject unsupported versions rather than inventing migrations.
- Feedback Notes, Ideas, Revision Candidates, and Story Foundation now synchronize temporary files before atomic replacement, clean failed temporary files, and preserve the prior durable document when replacement fails.
- Corrupt JSON, invalid UTF-8, wrong versions, duplicate identities, abandoned temporary files, stale writers, same-revision races, interrupted candidate acceptance, and recovery-envelope failures are covered without silent repair or byte rewriting.
- The exact-candidate RT-2B runner passed 24/24 mechanical rows with real `qwen3:4b`; protected refusal, cancellation, timeout, malformed response, endpoint loss, and unchanged manuscript/story hashes remain mechanically verified. Jason’s usefulness and admission decision are not inferred.
- The exact-candidate persistence runner passed 8 suites / 136 tests, and the Unicode/Markdown runner passed all 18 required assertions.
- Windows NSIS construction and repository package verification passed at documentation HEAD `7e5d7ecf3593bcef084227c231073c8d75ea1f4c` by using the already-cached Electron `39.8.10` archive directly. The verified installer is `86,966,243` bytes, SHA-256 `a20f9158c2f55eae16cabfc2764533ba63ab65abd9275e344498ae15a11eaa05`, unsigned under the internal-RC policy, with zero forbidden unpacked paths. This is not promoted to the ledger's packaged Pass because its receipt identity and the ledger's runtime candidate identity differ and the elevated lifecycle is incomplete.

## Explicitly not closed

The RT-2B pilot is current mechanical evidence for the runtime implementation
candidate, but it is not a human admission decision. Jason's scores for
usefulness, source fidelity, facts, voice/style, actionability, and uncertainty
restraint remain required. Jason alone decides whether local AI is admitted.
Human Gate 4 must review the no-AI Carmilla workflow and the integrated
surfaces. This report does not authorize, imply, or fabricate either decision.

The nested Codex sandbox reproduces Electron `STATUS_DLL_NOT_FOUND` before first window creation. The required outer-host run passes; no GPU-disable diagnostic mode was used and no runtime or ACL repair was made.

The remaining mechanical work is fresh normal-GPU accessibility/visual and
scale receipts, a fresh Stage 19/Electron receipt, aligning the verified
Windows package receipt with the ledger's exact candidate identity, and the
exact offline-firewall package matrix. The latter still requires an
Administrator PowerShell session. The P4/P5/P6 regression rows remain reserved
for Jason. These are not closure or admission claims.

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
