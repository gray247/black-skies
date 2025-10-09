"""Safety policy helpers for tool invocations."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Mapping

DEFAULT_SOFT_LIMIT = 5.0
DEFAULT_HARD_LIMIT = 10.0

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_SECRET_KEY_NAMES = {
    "api_key",
    "apikey",
    "auth",
    "authorization",
    "bearer",
    "secret",
    "token",
}
_SECRET_VALUE_RE = re.compile(r"sk-[A-Za-z0-9]{20,}|[A-Za-z0-9]{24,}")


class SafetyViolation(RuntimeError):
    """Raised when a tool invocation violates locked policies."""

    def __init__(
        self, code: str, message: str, *, details: Mapping[str, Any] | None = None
    ) -> None:
        super().__init__(message)
        self.code = code
        self.details: dict[str, Any] = dict(details or {})


@dataclass(frozen=True)
class SafetyReport:
    """Outcome of running policy checks prior to a tool invocation."""

    budget_status: str = "unknown"
    estimated_usd: float | None = None
    total_after_usd: float | None = None
    spent_usd: float | None = None
    privacy_flags: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "budget_status": self.budget_status,
            "estimated_usd": self.estimated_usd,
            "total_after_usd": self.total_after_usd,
            "spent_usd": self.spent_usd,
            "privacy_flags": list(self.privacy_flags),
        }


def _to_float(value: Any, *, default: float | None = None, field: str) -> float | None:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError) as exc:  # pragma: no cover - defensive guard
        raise SafetyViolation(
            "POLICY_VIOLATION",
            f"Invalid numeric value for '{field}'.",
            details={"field": field, "value": value},
        ) from exc


def _extract_budget(
    project_metadata: Mapping[str, Any], invocation_metadata: Mapping[str, Any] | None
) -> tuple[float | None, float, float, float, float]:
    project_budget = (
        project_metadata.get("budget")
        if isinstance(project_metadata.get("budget"), Mapping)
        else {}
    )
    invocation_budget: Mapping[str, Any] | None = None
    if invocation_metadata:
        candidate = invocation_metadata.get("budget")
        if isinstance(candidate, Mapping):
            invocation_budget = candidate
        else:
            invocation_budget = invocation_metadata

    spent_usd = (
        _to_float(
            project_budget.get("spent_usd") if project_budget else 0.0,
            field="spent_usd",
            default=0.0,
        )
        or 0.0
    )
    estimated_usd = None
    total_after_usd = None

    if invocation_budget:
        estimated_usd = _to_float(
            invocation_budget.get("estimated_usd"),
            field="estimated_usd",
            default=None,
        )
        total_after_usd = _to_float(
            invocation_budget.get("total_after_usd"),
            field="total_after_usd",
            default=None,
        )

    soft_candidate = None
    if invocation_budget and "soft_limit_usd" in invocation_budget:
        soft_candidate = invocation_budget.get("soft_limit_usd")
    elif project_budget and "soft" in project_budget:
        soft_candidate = project_budget.get("soft")

    hard_candidate = None
    if invocation_budget and "hard_limit_usd" in invocation_budget:
        hard_candidate = invocation_budget.get("hard_limit_usd")
    elif project_budget and "hard" in project_budget:
        hard_candidate = project_budget.get("hard")

    soft_limit_value = _to_float(
        soft_candidate,
        field="soft_limit_usd",
        default=DEFAULT_SOFT_LIMIT,
    )
    hard_limit_value = _to_float(
        hard_candidate,
        field="hard_limit_usd",
        default=DEFAULT_HARD_LIMIT,
    )

    if total_after_usd is None and estimated_usd is not None:
        total_after_usd = spent_usd + estimated_usd

    return (
        estimated_usd,
        spent_usd,
        total_after_usd if total_after_usd is not None else spent_usd,
        soft_limit_value if soft_limit_value is not None else DEFAULT_SOFT_LIMIT,
        hard_limit_value if hard_limit_value is not None else DEFAULT_HARD_LIMIT,
    )


def _check_privacy(invocation_metadata: Mapping[str, Any] | None) -> list[str]:
    flags: list[str] = []
    if not invocation_metadata:
        return flags
    privacy_context = invocation_metadata.get("privacy")
    if isinstance(privacy_context, Mapping):
        share_scope = str(privacy_context.get("share_scope", "local"))
        consent = bool(privacy_context.get("user_consent", False))
        if share_scope and share_scope.lower() not in {"local", "project"}:
            flags.append("share_scope:" + share_scope.lower())
            if not consent:
                raise SafetyViolation(
                    "PRIVACY_DENIED",
                    "External sharing requires explicit user consent.",
                    details={"share_scope": share_scope},
                )
    return flags


def preflight_check(
    *,
    tool: str,
    project_metadata: Mapping[str, Any],
    invocation_metadata: Mapping[str, Any] | None = None,
) -> SafetyReport:
    """Validate a tool invocation against budget and privacy policies."""

    estimated_usd, spent_usd, total_after_usd, soft_limit, hard_limit = _extract_budget(
        project_metadata,
        invocation_metadata,
    )

    if hard_limit < soft_limit:
        raise SafetyViolation(
            "POLICY_VIOLATION",
            "Project hard limit is lower than soft limit.",
            details={"soft_limit_usd": soft_limit, "hard_limit_usd": hard_limit},
        )

    budget_status = "unknown"
    if estimated_usd is not None:
        if estimated_usd < 0:
            raise SafetyViolation(
                "POLICY_VIOLATION",
                "Estimated budget cannot be negative.",
                details={"estimated_usd": estimated_usd},
            )
        if total_after_usd > hard_limit:
            raise SafetyViolation(
                "BUDGET_EXCEEDED",
                f"Projected total ${total_after_usd:.2f} exceeds hard limit ${hard_limit:.2f}.",
                details={
                    "tool": tool,
                    "total_after_usd": round(total_after_usd, 2),
                    "hard_limit_usd": round(hard_limit, 2),
                },
            )
        if total_after_usd > soft_limit:
            budget_status = "soft-limit"
        else:
            budget_status = "ok"

    privacy_flags = _check_privacy(invocation_metadata)

    return SafetyReport(
        budget_status=budget_status,
        estimated_usd=estimated_usd,
        total_after_usd=total_after_usd if estimated_usd is not None else None,
        spent_usd=spent_usd,
        privacy_flags=tuple(privacy_flags),
    )


def _scrub_value(value: Any, *, key: str | None = None) -> Any:
    if isinstance(value, Mapping):
        return {
            inner_key: _scrub_value(inner_value, key=inner_key)
            for inner_key, inner_value in value.items()
        }
    if isinstance(value, (list, tuple, set)):
        container_type = type(value)
        scrubbed_items = [_scrub_value(item, key=key) for item in value]
        return container_type(scrubbed_items)
    if isinstance(value, str):
        sanitized = value
        if key and key.lower() in _SECRET_KEY_NAMES:
            return "[REDACTED]"
        sanitized = _EMAIL_RE.sub("[REDACTED_EMAIL]", sanitized)
        sanitized = _SECRET_VALUE_RE.sub("[REDACTED_SECRET]", sanitized)
        return sanitized
    return value


def postflight_scrub(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Return a sanitized copy of ``payload`` suitable for logging."""

    if not isinstance(payload, Mapping):  # pragma: no cover - defensive guard
        raise TypeError("postflight_scrub expects a mapping payload")

    sanitized: dict[str, Any] = {}
    for key, value in payload.items():
        sanitized[key] = _scrub_value(value, key=str(key))
    return sanitized


__all__ = ["SafetyReport", "SafetyViolation", "preflight_check", "postflight_scrub"]
