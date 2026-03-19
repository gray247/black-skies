Status: Active
Date: 2026-03-18

# Editorial Reliability Decision Record

Purpose: record the current stable rescue baseline, the rescue-generation experiments attempted on top of it, and the next decision fork for long-form editorial reliability work.

## Stable Baseline

Current stable editorial baseline:
- rescue model: `gpt-5.4-mini`
- rescue strategy: `slot_patch`
- bounded-slot rescue plumbing unchanged
- clean bounded sample: `6/10`
- adversarial bounded sample: `5/5`

Why this is the stable baseline:
- it outperformed the earlier `gpt-4o-mini` rescue default on clean reliability
- it preserved adversarial health
- later rescue-generation experiments did not beat it reliably
- deterministic rescue-plumbing regressions did not recur in the bounded sample used to establish it

## Closed vs Open

Closed:
- rescue-plumbing / reliability-control
- slot binding / aliasing fixes
- stale-target handling
- followthrough specificity credit
- sentence-slot collapse handling
- GPT-5.4-family adapter request-shape fix

Still open:
- generation-side editorial rescue misses
- `patch_dialogue_grounding_unresolved`
- `patch_specificity_unresolved`
- occasional `patch_length_distortion` or other guardrail failures when strategy experiments broaden the local repair primitive

## Rescue Experiments Attempted After Plumbing Closeout

### 1. Rescue model bakeoff

Compared:
- `gpt-4o-mini`
- `gpt-5.4-mini`

Result:
- `gpt-4o-mini`: clean `2/10`, adversarial `5/5`
- `gpt-5.4-mini`: clean `4/10`, adversarial `5/5` in the repaired comparison path

Decision:
- adopted `gpt-5.4-mini` as the default rescue model

Reason:
- materially better clean rescue reliability
- adversarial unchanged

### 2. Dialogue anchor-term enforcement

Intent:
- force dialogue-targeted rescue to borrow explicit neighboring anchor terms

Result:
- regressed clean reliability sharply
- did not improve the stable baseline

Decision:
- discarded

Reason:
- overconstrained dialogue rescue and made the clean path worse

### 3. Specificity literal slot-patch tightening

Intent:
- force specificity-targeted rescue to use more literal concrete detail

Result:
- clean `4/10`
- adversarial `5/5`
- underperformed the stable `6/10` clean baseline

Decision:
- discarded

Reason:
- generation contract tightening did not translate into a better live pass rate

### 4. Hybrid escalation

Strategy:
- primary `slot_patch`
- fallback `local_rewrite_block` on failure

Result:
- clean `6/10`
- adversarial `5/5`
- reintroduced `patch_length_distortion`

Decision:
- not adopted

Reason:
- tied baseline on clean
- added a regression class without offsetting gain

### 5. Scene-state-assisted rescue

Intent:
- inject compact scene-state context into rescue prompts

Result:
- clean `4/10`
- adversarial `5/5`
- increased dialogue-grounding misses

Decision:
- not adopted

Reason:
- broader structured context did not help this rescue stack and made clean worse

### 6. Structured rescue generation

Strategy:
- tiny structured repair plan
- then prose generation from the plan

Result:
- clean `6/10`
- adversarial `4/5`
- increased `patch_dialogue_grounding_unresolved`
- introduced `patch_generic_replacement_unresolved`

Decision:
- not adopted

Reason:
- tied clean baseline
- regressed adversarial health

## Current Read

The system is no longer primarily limited by rescue-plumbing defects. The remaining instability is generation-side editorial quality under rescue.

The repo evidence now shows:
- deterministic rescue bugs can be fixed and held via replay
- stronger rescue model selection helped somewhat
- repeated rescue-generation strategy variants have not produced reliable net gains beyond the current baseline
- several seemingly reasonable rescue experiments made clean reliability worse

This means the project is at a decision point, not at another obvious rescue micro-pass.

## Next Decision Fork

### Option A: Hold the stable editorial baseline

Keep:
- rescue model `gpt-5.4-mini`
- rescue strategy `slot_patch`

Then move remaining quality handling to writer/product-level behavior:
- better surfacing of rescue misses
- clearer diagnostics and human review workflows
- acceptance that a bounded share of remaining misses are model-quality variance, not engine-path bugs

Use when:
- the goal is product stability and forward progress
- the team wants to stop spending time on rescue-generation experiments with weak evidence of lift

### Option B: Run one final higher-capability rescue comparison

Run one last bounded comparison focused only on whether a clearly stronger provider/model can materially beat the `6/10` stable clean baseline while keeping adversarial healthy.

Constraints:
- no rescue-plumbing reopening
- no prompt/validator tuning mixed into the comparison
- same bounded-slot rescue and same evaluation shape

Use when:
- the team still believes rescue quality is blocked by model capability rather than by the current rescue primitive

## Recommendation

Recommend **Option A: hold the stable editorial baseline and move remaining work to writer/product-level handling**.

Reason:
- the stable baseline is good enough to preserve progress without reopening churn
- multiple targeted rescue-generation experiments failed to beat it
- the remaining misses are generation-side, not control-path regressions
- another round of rescue-primitive experiments is more likely to consume time than to produce a reliable gain

If Option B is chosen anyway, it should be explicitly treated as a final bounded model-capability check rather than an open-ended rescue-optimization loop.

## Current Option A State

The first writer-facing editorial workflow is now in place on top of the stable rescue baseline.

Wired actions:
- `show_flag_reason`
- `accept_current_text`
- `mark_for_manual_rewrite`
- `clear_manual_review_mark`
- `regenerate_local_repair`

Persisted states:
- `Flagged`
- `Accepted`
- `Manual review`

Carryover handling:
- review state and carryover approval remain separate
- accepted scenes preserve the original failure class for audit/history
- accepted scenes upgrade effective carryover to `safe` / `allowed`
- unresolved flagged scenes continue to honor conservative `carryover_risk` and `carryover_mode`

Phase 8 closeout reference:
- see [docs/phases/phase8_closeout.md](../phases/phase8_closeout.md) for the current completion line, known-issue ledger, and manual verification checklist before Phase 9 begins
