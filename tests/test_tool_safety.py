import pytest

from black_skies.tools.safety import (
    SafetyViolation,
    postflight_scrub,
    preflight_check,
)


def test_preflight_allows_within_budget() -> None:
    project_metadata = {"budget": {"soft": 5.0, "hard": 10.0, "spent_usd": 1.0}}
    invocation_metadata = {"budget": {"estimated_usd": 2.5}}

    report = preflight_check(
        tool="summarizer",
        project_metadata=project_metadata,
        invocation_metadata=invocation_metadata,
    )

    assert report.budget_status == "ok"
    assert report.estimated_usd == pytest.approx(2.5)
    assert report.total_after_usd == pytest.approx(3.5)
    assert report.spent_usd == pytest.approx(1.0)


def test_preflight_budget_violation() -> None:
    project_metadata = {"budget": {"soft": 5.0, "hard": 10.0, "spent_usd": 2.0}}
    invocation_metadata = {"budget": {"estimated_usd": 9.0}}

    with pytest.raises(SafetyViolation) as captured:
        preflight_check(
            tool="template_renderer",
            project_metadata=project_metadata,
            invocation_metadata=invocation_metadata,
        )

    error = captured.value
    assert error.code == "BUDGET_EXCEEDED"
    assert error.details["hard_limit_usd"] == pytest.approx(10.0)
    assert error.details["total_after_usd"] == pytest.approx(11.0)


def test_postflight_scrub_redacts_sensitive_content() -> None:
    payload = {
        "user": "writer@example.com",
        "metadata": {
            "api_key": "sk-test-abcdefghijklmnopqrstuvwxyz",
            "notes": [
                "Contact writer@example.com",
                "token=ABCD1234EFGH5678IJKL9012MNOP3456",
            ],
        },
    }

    sanitized = postflight_scrub(payload)

    assert sanitized["user"] == "[REDACTED_EMAIL]"
    assert sanitized["metadata"]["api_key"] == "[REDACTED]"
    assert sanitized["metadata"]["notes"][0] == "Contact [REDACTED_EMAIL]"
    assert sanitized["metadata"]["notes"][1] == "token=[REDACTED_SECRET]"
