"""Budget-aware run policy evaluation for model routing."""

from __future__ import annotations

from dataclasses import dataclass

from .model_routing import ModelRoutingPolicy


@dataclass(frozen=True)
class RunPolicyDecision:
    """Decision envelope for policy-aware routing."""

    task: str
    policy: ModelRoutingPolicy
    budget_status: str
    allow_local: bool
    allow_api: bool
    prefer_local: bool
    reason: str
    warnings: list[str]
    blocked: bool = False


class RunPolicyEngine:
    """Evaluate routing policy against budget state and availability."""

    def evaluate(
        self,
        *,
        task: str,
        policy: ModelRoutingPolicy,
        budget_status: str,
        local_available: bool,
        api_available: bool,
    ) -> RunPolicyDecision:
        warnings: list[str] = []
        allow_local = local_available
        allow_api = api_available
        prefer_local = policy in {
            ModelRoutingPolicy.LOCAL_ONLY,
            ModelRoutingPolicy.LOCAL_THEN_API_FALLBACK,
        }
        blocked = False
        reason = f"policy.{policy.value}"

        if policy is ModelRoutingPolicy.LOCAL_ONLY:
            allow_api = False

        if budget_status == "blocked":
            warnings.append("hard_limit_exceeded")
            allow_api = False
            prefer_local = True
            blocked = not allow_local
            reason = "budget.hard_limit"
        elif budget_status == "soft-limit":
            warnings.append("soft_limit_exceeded")
            prefer_local = True
            if policy is ModelRoutingPolicy.LOCAL_ONLY:
                allow_api = False
            reason = "budget.soft_limit"

        return RunPolicyDecision(
            task=task,
            policy=policy,
            budget_status=budget_status,
            allow_local=allow_local,
            allow_api=allow_api,
            prefer_local=prefer_local,
            reason=reason,
            warnings=warnings,
            blocked=blocked,
        )


def format_run_policy_metadata(decision: RunPolicyDecision) -> dict[str, object]:
    """Return JSON-ready run policy metadata."""

    return {
        "task": decision.task,
        "policy": decision.policy.value,
        "budget_status": decision.budget_status,
        "reason": decision.reason,
        "prefer_local": decision.prefer_local,
        "allow_local": decision.allow_local,
        "allow_api": decision.allow_api,
        "warnings": list(decision.warnings),
        "blocked": decision.blocked,
    }


__all__ = ["RunPolicyDecision", "RunPolicyEngine", "format_run_policy_metadata"]
