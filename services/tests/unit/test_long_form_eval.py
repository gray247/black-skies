from __future__ import annotations

from blackskies.services.long_form_eval import summarize_long_form_run


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
            "acceptance_reason": "rewrite_pass",
            "rewrite_used": True,
            "attempt_count": 2,
            "continuity_snapshot": {"fallback_reason": None},
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
    assert summary.fallback_count == 1
    assert summary.avg_attempts == 1.67
    assert summary.avg_quality_score == 22.67
    assert summary.continuity_warnings == 3
    assert summary.total_estimated_usd == 0.04
    assert summary.providers == ["openai"]
    assert summary.models == ["gpt-4o-mini"]
    assert summary.stopped_reason == "quality_failed"
