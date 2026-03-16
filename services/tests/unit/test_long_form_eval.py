from __future__ import annotations

from blackskies.services.long_form_eval import (
    summarize_long_form_run,
    summarize_long_form_variance,
)


def test_long_form_eval_summary_aggregates() -> None:
    chunks = [
        {
            "chunk_id": "lf_1",
            "provider": "openai",
            "model": "gpt-4o-mini",
            "acceptance_reason": "quality_pass",
            "rewrite_used": False,
            "attempt_count": 1,
            "continuity_snapshot": {"fallback_reason": None},
            "quality_snapshot": {
                "total_score": 30,
                "missing_carryover": False,
                "scores": {"continuity": 5},
            },
            "budget_snapshot": {"estimated_usd": 0.01},
        },
        {
            "chunk_id": "lf_2",
            "provider": "openai",
            "model": "gpt-4o-mini",
            "acceptance_reason": "retry_pass",
            "rewrite_used": True,
            "attempt_count": 3,
            "continuity_snapshot": {"fallback_reason": None},
            "retry_snapshot": {
                "used": True,
                "succeeded": True,
                "rescue_mode_used": True,
                "rescue_model_used": True,
                "rescue_guardrail_fail": False,
                "rescue_under_improved": False,
                "rescue_fidelity_risk": False,
                "repair_only_pass_used": False,
                "repair_only_pass_rescued": False,
                "failure_classification": {"classification": "borderline"},
            },
            "quality_snapshot": {
                "total_score": 28,
                "missing_carryover": True,
                "scores": {"continuity": 1},
            },
            "budget_snapshot": {"estimated_usd": 0.02},
        },
        {
            "chunk_id": "lf_3",
            "provider": "openai",
            "model": "gpt-4o-mini",
            "acceptance_reason": "quality_failed",
            "rewrite_used": True,
            "attempt_count": 2,
            "continuity_snapshot": {"fallback_reason": "quality_failed"},
            "retry_snapshot": {
                "used": False,
                "succeeded": False,
                "rescue_mode_used": False,
                "rescue_model_used": False,
                "rescue_guardrail_fail": False,
                "rescue_under_improved": False,
                "rescue_fidelity_risk": False,
                "repair_only_pass_used": True,
                "repair_only_pass_rescued": False,
                "rescue_failure_class": "dialogue_grounding_unresolved",
                "failure_classification": {"classification": "hard"},
            },
            "quality_snapshot": {
                "total_score": 10,
                "missing_carryover": False,
                "scores": {"continuity": 2},
            },
            "budget_snapshot": {"estimated_usd": 0.01},
        },
    ]

    summary = summarize_long_form_run(
        project_id="proj_eval",
        chapter_id="ch_0001",
        chunks=chunks,
        stopped_reason="quality_failed",
        run_id="run_test",
    )

    assert summary.chunk_count == 3
    assert summary.accepted_count == 2
    assert summary.rewrite_count == 2
    assert summary.retry_used_count == 1
    assert summary.retried_success_count == 1
    assert summary.rescue_mode_used_count == 1
    assert summary.rescue_model_used_count == 1
    assert summary.rescue_guardrail_fail_count == 0
    assert summary.rescue_under_improved_count == 0
    assert summary.rescue_fidelity_risk_count == 0
    assert summary.repair_only_pass_used_count == 1
    assert summary.repair_only_pass_rescued_count == 0
    assert summary.rescue_editorial_failure_classes == {"dialogue_grounding_unresolved": 1}
    assert summary.fallback_count == 1
    assert summary.borderline_failure_count == 1
    assert summary.avg_attempts == 2.0
    assert summary.avg_quality_score == 22.67
    assert summary.continuity_warnings == 3
    assert summary.total_estimated_usd == 0.04
    assert summary.providers == ["openai"]
    assert summary.models == ["gpt-4o-mini"]
    assert summary.stopped_reason == "quality_failed"


def test_long_form_eval_variance_distinguishes_stable_and_unstable_outcomes() -> None:
    stable = summarize_long_form_variance(
        [
            {
                "stopped_reason": None,
                "retry_used_count": 0,
                "retried_success_count": 0,
                "rescue_mode_used_count": 0,
                "rescue_model_used_count": 0,
                "rescue_guardrail_fail_count": 0,
                "rescue_under_improved_count": 0,
                "rescue_fidelity_risk_count": 0,
                "repair_only_pass_used_count": 0,
                "repair_only_pass_rescued_count": 0,
                "rescue_editorial_failure_classes": {},
                "borderline_failure_count": 0,
                "avg_quality_score": 31.0,
            },
            {
                "stopped_reason": None,
                "retry_used_count": 1,
                "retried_success_count": 1,
                "rescue_mode_used_count": 1,
                "rescue_model_used_count": 1,
                "rescue_guardrail_fail_count": 0,
                "rescue_under_improved_count": 0,
                "rescue_fidelity_risk_count": 0,
                "repair_only_pass_used_count": 0,
                "repair_only_pass_rescued_count": 0,
                "rescue_editorial_failure_classes": {},
                "borderline_failure_count": 1,
                "avg_quality_score": 29.5,
            },
        ]
    )
    unstable = summarize_long_form_variance(
        [
            {
                "stopped_reason": None,
                "retry_used_count": 1,
                "retried_success_count": 1,
                "rescue_mode_used_count": 1,
                "rescue_model_used_count": 1,
                "rescue_guardrail_fail_count": 0,
                "rescue_under_improved_count": 0,
                "rescue_fidelity_risk_count": 0,
                "repair_only_pass_used_count": 1,
                "repair_only_pass_rescued_count": 1,
                "rescue_editorial_failure_classes": {"dialogue_grounding_unresolved": 1},
                "borderline_failure_count": 1,
                "avg_quality_score": 30.0,
            },
            {
                "stopped_reason": "quality_failed",
                "retry_used_count": 0,
                "retried_success_count": 0,
                "rescue_mode_used_count": 1,
                "rescue_model_used_count": 1,
                "rescue_guardrail_fail_count": 0,
                "rescue_under_improved_count": 1,
                "rescue_fidelity_risk_count": 0,
                "repair_only_pass_used_count": 1,
                "repair_only_pass_rescued_count": 0,
                "rescue_editorial_failure_classes": {"specificity_unresolved": 1},
                "borderline_failure_count": 1,
                "avg_quality_score": 27.0,
            },
        ]
    )

    assert stable["consistency"] == "stable"
    assert stable["pass_rate"] == 1.0
    assert stable["retry_usage_rate"] == 0.5
    assert stable["succeeded_only_after_retry_count"] == 1
    assert stable["rescue_mode_usage_rate"] == 0.5
    assert stable["rescue_model_usage_rate"] == 0.5
    assert stable["repair_only_pass_usage_rate"] == 0.0

    assert unstable["consistency"] == "unstable"
    assert unstable["pass_rate"] == 0.5
    assert unstable["stopped_reasons"] == {"quality_failed": 1}
    assert unstable["borderline_failure_rate"] == 1.0
    assert unstable["rescue_under_improved_rate"] == 0.5
    assert unstable["rescue_editorial_failure_classes"] == {
        "dialogue_grounding_unresolved": 1,
        "specificity_unresolved": 1,
    }
