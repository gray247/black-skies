# Program 7 Qualification Closure Report

Status: mechanical qualification packet complete; Human Gate 4 and local-AI admission remain open.

Exact runtime commit: `31046317c7be3e80fcf70f6b89f0af0902d491ba`

Exact runtime tree: `9e59e5ff2ba1fae3b22073f8e04e3c42dfc35e2f`

## Evidence completed

- Disposable Carmilla review fixture: one current source-linked finding, immutable baseline preserved.
- Four P7-G2 Electron suites: 4/4 passed on the outer Windows host with normal GPU operation; the no-AI suite explicitly disabled local AI and verified no manuscript mutation.
- Real RT-2B pilot: 24/24 separately receipted matrix rows passed mechanically against Ollama 0.13.0 and `qwen3:4b` digest `359d7dd4bcdab3d86b87d73ac27966f4dbb9f5efdfcc75d34a8764a09474fae7`; Q11 records real `/api/generate` cancellation and Q12 records real connection refusal and endpoint-loss fixtures.
- Complete Stage 19 outer-host gate: 49/49 critical files, 803 passed, 2 expected skips, startup 1/1, Electron 36/36, `STAGE19_REGRESSION_PASS`, and `CLEAN_RC_ELIGIBLE`.
- Evidence schema and fail-closed validator: validator passes 34 granular JSONL rows with one exact commit/tree and verifies referenced artifact bytes and hashes. The deterministic sample is recorded in `program_7_human_sample.json` with blank Jason fields.

## Explicitly not closed

The pilot records mechanical evidence only. Jason must still score usefulness, source fidelity, facts, voice/style, actionability, and uncertainty for the protocol's subjective rows, then decide whether local AI is admitted. Human Gate 4 must review the no-AI Carmilla workflow and the integrated surfaces. This report does not authorize, imply, or fabricate either decision.

The nested Codex sandbox reproduces Electron `STATUS_DLL_NOT_FOUND` before first window creation. The required outer-host run passes; no GPU-disable diagnostic mode was used and no runtime or ACL repair was made.

## Canonical artifacts

- `docs/product_systems/program_7_evidence_ledger.jsonl`
- `docs/product_systems/program_7_local_ai_qualification.json`
- `docs/product_systems/program_7_electron_qualification.json`
- `scripts/program7-evidence-row.schema.json`
- `scripts/validate-program7-evidence.mjs`
- `scripts/build-program7-evidence-ledger.mjs`
- `scripts/program7-human-sampling.mjs`
- `docs/product_systems/program_7_human_sample.json`
