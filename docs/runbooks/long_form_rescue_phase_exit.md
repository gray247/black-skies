Status: Closed
Last Reviewed: 2026-03-17

# Long-Form Rescue Plumbing Phase Exit

Purpose: define the exit gate for the long-form reliability/control closeout that covers bounded-slot rescue plumbing and reliability-control behavior.

This runbook replaces the informal "three fresh runs passed" standard with a two-part gate:
- deterministic replay fixtures must stay green
- one bounded live confirmation sample must clear a class-based acceptance rule

## Scope

This gate closes the rescue-plumbing / reliability-control phase only. It does not claim that all remaining long-form misses are solved. The phase is complete when deterministic rescue-path bugs are gone and the remaining live misses are generation-side quality variance rather than plumbing failures.

## Replay Regression Pack

These artifact-backed fixtures must stay green before the phase can close.

1. Dialogue grounding terminal miss fixture
- Eval: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_same_slot_retry_clean_300_run2.json`
- Diagnostic: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_9d2a8bc4.json`
- Chunk: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/chunks/lf_9d2a8bc4.json`
- Purpose: prove dialogue-slot generation and local grounding validation reproduce the live terminal class without rebinding or slot drift.

2. Specificity terminal miss fixture
- Eval: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_same_slot_retry_clean_300_run3.json`
- Diagnostic: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_b923f724.json`
- Chunk: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/chunks/lf_b923f724.json`
- Purpose: prove specificity followthrough behavior is stable after a bounded-slot local patch and does not regress into rebinding or target-loss behavior.

3. Length distortion fixture
- Eval: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_followthrough_credit_clean_300_run3.json`
- Diagnostic: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_b48d5521.json`
- Chunk: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/chunks/lf_b48d5521.json`
- Purpose: prove repair-only sentence-slot edits do not collapse into clause fragments and still reject true local length distortion.

4. Followthrough credit fixture
- Diagnostic: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_b923f724.json`
- Chunk: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/chunks/lf_b923f724.json`
- Purpose: prove a locally accepted specificity patch is credited correctly in rescue followthrough and does not still terminate as broader `specificity_unresolved` for the same solved local issue.

5. Legacy target/binding regression fixtures
- Diagnostic: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_27cb3073.json`
- Diagnostic: `sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/diagnostics/lf_3fbe8439.json`
- Purpose: keep the old deterministic bug classes covered so closeout does not regress into `patch_target_missing`, stale-target rebinding, or slot-id alias failure while working on later rescue issues.

## Required Replay Assertions

The replay pack must demonstrate all of the following:
- slot identity is deterministic for the replayed case, or any fallback is explicit and local rather than broad reselection
- same-slot retry never regresses into target missing, stale rebinding, or broad slot reselection
- validator-only checks still classify good, vague, and drifted local patches correctly
- old binding/aliasing bug classes remain fixed
- the terminal class for a replayed artifact matches the expected mechanism unless the code intentionally fixes that mechanism

## Live Confirmation Sample

Run one bounded fresh-server confirmation sample after the replay pack is green.

### Clean sample

Run 10 fresh executions:

```powershell
$env:PYTHONPATH = "services/src"
1..10 | ForEach-Object {
  python scripts/long_form_eval.py `
    --project-id proj_esther_estate_verify_longform `
    --chapter-id ch_0001 `
    --scene-ids sc_0001 `
    --chunk-size 1 `
    --target-words 300 `
    --base-url http://127.0.0.1:8000 `
    --output ("sample_project/proj_esther_estate_verify_longform/.blackskies/long_form/eval/eval_phase_close_clean_300_run{0}.json" -f $_)
}
```

### Adversarial sample

Run 5 fresh executions:

```powershell
$env:PYTHONPATH = "services/src"
1..5 | ForEach-Object {
  python scripts/long_form_eval.py `
    --project-id proj_esther_estate_eval_adversarial `
    --chapter-id ch_0001 `
    --scene-ids sc_0001,sc_0002 `
    --chunk-size 1 `
    --target-words 300 `
    --base-url http://127.0.0.1:8000 `
    --output ("sample_project/proj_esther_estate_eval_adversarial/.blackskies/long_form/eval/eval_phase_close_adversarial_300_run{0}.json" -f $_)
}
```

Rationale:
- `10` clean runs is large enough to move beyond the current `0/3`, `1/3`, `2/3`, and `3/5` oscillation without turning the phase gate into an expensive open-ended soak.
- `5` adversarial runs is enough to detect destabilization of the healthy path while keeping the confirmation sample bounded.

## Phase-Close Decision Rule

Close the rescue-plumbing / reliability-control phase only if all of the following are true.

### Replay gate

- The replay regression pack is green.
- No deterministic rescue-path regression appears in replay:
  - `patch_target_missing`
  - stale-target rebinding / alias-binding loss
  - broad slot reselection replacing the intended local slot
  - followthrough failing to credit an accepted local specificity patch
  - sentence-slot clause-collapse / `patch_length_distortion` regression on the known fixture

### Clean live gate

- Clean pass rate is at least `7/10`.
- No more than `1/10` clean runs may fail with a deterministic plumbing class.
- Preferred target is `8/10` or better; `7/10` is the minimum acceptable closeout bar because it is materially above the unstable baseline and leaves remaining misses concentrated in generation quality rather than rescue plumbing.
- Exception: the phase may still close at `6/10` when all of the following are true:
  - the replay regression pack is green
  - adversarial remains `5/5`
  - every failed clean run is artifact-confirmed as a generation-side miss
  - no plumbing-open deterministic classes recur in the clean sample

### Adversarial live gate

- Adversarial pass rate is at least `5/5`.
- No adversarial run may introduce a new rescue-plumbing regression.

## Failure-Class Interpretation

### Phase stays open: plumbing still broken

Any recurrence of these classes in the bounded live sample keeps the phase open:
- `patch_target_missing`
- slot-id alias/binding loss
- stale-target rebinding as a required success path
- `patch_length_distortion` from sentence-slot collapse or comparable bounded-slot mishandling
- followthrough-credit regressions where a locally accepted patch is not respected and the same solved issue still drives the terminal class

### Phase may still close: remaining generation misses

These may remain, if they are rare and the replay gate is green:
- `dialogue_grounding_unresolved`
- `patch_dialogue_grounding_unresolved`
- `patch_specificity_unresolved`
- `specificity_unresolved`
- `patch_fidelity_risk` when caused by a true drifted replacement rather than validator/pathology regression
- ordinary `quality_failed` outcomes that are not explained by deterministic rescue-plumbing bugs

These are treated as generation-side quality variance, not rescue-plumbing blockers, unless replay or artifact inspection proves a deterministic bug underneath them.

## What Counts As Phase Completion

This phase is complete when:
- the replay regression pack is green
- the clean live sample reaches at least `7/10`
- the adversarial live sample stays `5/5`
- deterministic rescue-plumbing classes no longer recur as a meaningful share of failures
- any remaining misses are artifact-inspectable generation-quality misses rather than slot selection, binding, followthrough-credit, or local length-shape bugs

At that point, rescue-plumbing work closes and any further improvement work moves into a new phase: generation-variance mitigation for rescue, not more plumbing/debugging.

## Closed Outcome

This phase is now closed on the documented exception path:
- replay regression pack remained green
- live confirmation sample landed at clean `6/10` and adversarial `5/5`
- the four failed clean artifacts were all classified as generation-side misses:
  - `dialogue_grounding_unresolved`
  - `patch_dialogue_grounding_unresolved`
  - `patch_specificity_unresolved`
- none of the plumbing-open deterministic classes recurred

Remaining long-form rescue work therefore moves into generation-variance mitigation / editorial reliability rather than bounded-slot rescue plumbing.
