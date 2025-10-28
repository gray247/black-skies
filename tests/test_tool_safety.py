import pytest

from blackskies.services.tools.safety import (
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


def test_postflight_scrub_handles_nested_structures() -> None:
    payload = {
        "session": {
            "owner": {"email": "owner@example.com", "token": "sk-secret-ABCDEFGHIJKLMNOPQRST"},
            "history": [
                {"participant": "writer@example.com", "notes": "Call writer@example.com ASAP"},
                {
                    "attachments": [
                        {"apiKey": "abcd1234efgh5678ijkl9012", "path": "/tmp/report.txt"},
                        {
                            "AUTH": "EFGH5678IJKL9012MNOP3456QRST",
                            "memo": "Sent to reader@example.net",
                            "description": "token=ZZZZZZZZZZZZZZZZZZZZZZZZ",
                        },
                    ]
                },
            ],
        },
        "participants": (
            {"email": "critic@example.org", "token": "token=ZZZZZZZZZZZZZZZZZZZZZZZZ"},
        ),
    }

    sanitized = postflight_scrub(payload)

    assert sanitized["session"]["owner"]["email"] == "[REDACTED_EMAIL]"
    assert sanitized["session"]["owner"]["token"] == "[REDACTED]"
    history_entry = sanitized["session"]["history"][0]
    assert history_entry["participant"] == "[REDACTED_EMAIL]"
    assert history_entry["notes"] == "Call [REDACTED_EMAIL] ASAP"
    attachment_block = sanitized["session"]["history"][1]["attachments"]
    assert attachment_block[0]["apiKey"] == "[REDACTED]"
    assert attachment_block[1]["AUTH"] == "[REDACTED]"
    assert attachment_block[1]["memo"] == "Sent to [REDACTED_EMAIL]"
    assert attachment_block[1]["description"] == "token=[REDACTED_SECRET]"
    participant = sanitized["participants"][0]
    assert participant["email"] == "[REDACTED_EMAIL]"
    assert participant["token"] == "[REDACTED]"
