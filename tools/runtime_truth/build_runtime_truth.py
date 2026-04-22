"""Generate the Runtime Truth Ledger from code and configuration defaults.

This artifact is generated only. Do not hand-edit ``build/runtime_truth.json``.
The ledger is code/config-derived truth plus a small curated policy section for
documentation pointers.

Important: ``canonical_docs`` and ``deferred_docs`` are policy-backed curated
metadata owned by maintainers. They are not inferred from runtime imports,
route discovery, or dynamic tracing.
"""

from __future__ import annotations

import ast
import hashlib
import importlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Iterable, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

REPO_ROOT = Path(__file__).resolve().parents[2]
SERVICES_SRC = REPO_ROOT / "services" / "src"
if str(SERVICES_SRC) not in sys.path:
    sys.path.insert(0, str(SERVICES_SRC))

from fastapi.routing import APIRoute  # noqa: E402

from blackskies.services.config import ServiceSettings  # noqa: E402
from blackskies.services.feature_flags import (  # noqa: E402
    analytics_enabled,
    analytics_maturity,
    plugins_maturity,
    voice_notes_maturity,
)
from blackskies.services.model_router import create_default_model_router  # noqa: E402
from blackskies.services.model_routing import ModelRouterConfig  # noqa: E402

app_module = importlib.import_module("blackskies.services.app")

GENERATOR_VERSION = "1"


FeatureKind = Literal["runtime", "experimental", "deferred", "operational"]
FeatureState = Literal["off", "experimental", "internal", "partial", "production"]
DocRole = Literal["current_runtime_canon", "memory_runtime_canon", "model_runtime_canon"]


class GeneratedFrom(BaseModel):
    git_commit: str
    config_defaults_hash: str
    generator_version: str = GENERATOR_VERSION


class ServiceBaseline(BaseModel):
    service_version: str
    app_factory: str
    settings_class: str
    api_base: str


class RouteEntry(BaseModel):
    path: str
    method: str
    present: bool = True
    baseline_enabled: bool = Field(
        description="Policy-assigned baseline exposure state for the discovered route."
    )
    guarded_by: list[str] = Field(default_factory=list)
    notes: str = ""


class ProviderState(BaseModel):
    supported: list[str]
    configured: list[str]
    routable: list[str]
    callable: list[str]
    health_check_targets: list[str] = Field(
        description=(
            "Providers configured for health checks via settings flags. "
            "This is config-derived metadata, not live health telemetry."
        )
    )


class RoutingState(BaseModel):
    policy: str
    routing_metadata_enabled: bool
    provider_calls_enabled: bool
    local_provider: str


class FeatureEntry(BaseModel):
    name: str
    kind: FeatureKind
    state: FeatureState
    source_of_truth: str
    baseline_default: str
    user_visible: bool
    config_keys: list[str] = Field(default_factory=list)
    env_vars: list[str] = Field(default_factory=list)
    runtime_entrypoints: list[str] = Field(default_factory=list)
    notes: str = ""


class MemoryState(BaseModel):
    scene_memory_live: bool
    memory_lab_live: bool
    memory_prototype_runtime: bool
    notes: str


class PluginsState(BaseModel):
    runtime_namespace_present: bool
    execution_state: FeatureState
    env_var: str
    registry_path: str
    notes: str


class AnalyticsState(BaseModel):
    enabled_by_default: bool
    env_var: str
    routes: list[str]
    notes: str


class HealthSurface(BaseModel):
    path: str
    visible: bool
    enabled_by_default: bool
    diagnostics_only: bool
    notes: str


class DeferredDoc(BaseModel):
    name: str
    path: str
    live_runtime_dependency: bool = Field(
        description="Whether this deferred feature has a live runtime seam in current code."
    )
    seam_owners: list[str] = Field(
        default_factory=list,
        description="Owning runtime files/modules for the deferred seam when present.",
    )
    seam_state: Literal["none", "disabled", "off", "internal", "partial", "experimental"] = "none"
    seam_type: Literal[
        "none",
        "stable_runtime_adapter",
        "typed_interface_stub",
        "explicit_disabled_integration_seam",
        "tested_intentional_seam",
    ] = "none"
    notes: str = Field(
        default="",
        description="Curated policy metadata. Not runtime import/discovery output.",
    )

    @model_validator(mode="after")
    def _validate_seam_metadata(self) -> "DeferredDoc":
        if self.live_runtime_dependency:
            if not self.seam_owners:
                raise ValueError(
                    "Deferred docs with live runtime dependency must declare seam_owners."
                )
            if self.seam_state == "none":
                raise ValueError(
                    "Deferred docs with live runtime dependency must declare a non-baseline seam_state."
                )
            if self.seam_type == "none":
                raise ValueError(
                    "Deferred docs with live runtime dependency must declare a seam_type."
                )
        else:
            if self.seam_owners:
                raise ValueError(
                    "Deferred docs without live runtime dependency must not declare seam_owners."
                )
            if self.seam_state != "none":
                raise ValueError(
                    "Deferred docs without live runtime dependency must use seam_state='none'."
                )
            if self.seam_type != "none":
                raise ValueError(
                    "Deferred docs without live runtime dependency must use seam_type='none'."
                )
        return self


class CanonicalDoc(BaseModel):
    path: str
    role: DocRole
    notes: str = Field(
        default="",
        description="Curated policy metadata. Not runtime import/discovery output.",
    )


class RuntimeTruth(BaseModel):
    model_config = ConfigDict(extra="forbid")

    service_baseline: ServiceBaseline
    routes: list[RouteEntry]
    providers: ProviderState
    routing: RoutingState
    features: list[FeatureEntry]
    memory: MemoryState
    plugins: PluginsState
    analytics: AnalyticsState
    health_surfaces: list[HealthSurface]
    deferred_docs: list[DeferredDoc] = Field(
        description="Curated policy-backed deferred-document pointers. Not runtime-discovered."
    )
    canonical_docs: list[CanonicalDoc] = Field(
        description="Curated policy-backed canonical-document pointers. Not runtime-discovered."
    )
    generated_from: GeneratedFrom
    generated_at: str | None = None


class RouteBaselineRule(BaseModel):
    """Curated policy rule for baseline route exposure in the ledger.

    Route discovery is runtime-derived from FastAPI. ``baseline_enabled`` is a
    policy assignment layered on top and intentionally centralized here so that
    route exposure rules are explicit and maintainable.
    """

    match: Literal["exact", "prefix"]
    pattern: str
    baseline_enabled: bool
    guarded_by: list[str] = Field(default_factory=list)
    notes: str = ""


# ``baseline_enabled`` is intentionally policy-assigned in these rules instead
# of inferred from route import/discovery. This keeps ownership explicit and
# avoids conflating route presence with baseline product exposure.
ROUTE_BASELINE_RULES: tuple[RouteBaselineRule, ...] = (
    RouteBaselineRule(
        match="prefix",
        pattern="/api/v1/backup_verifier/",
        baseline_enabled=False,
        guarded_by=["BLACKSKIES_BACKUP_VERIFIER_ENABLED"],
        notes="Route is present, but the backing daemon is implemented-but-disabled by default.",
    ),
    RouteBaselineRule(
        match="exact",
        pattern="/api/v1/healthz",
        baseline_enabled=True,
        notes="Reports disabled subsystem visibility without implying activation.",
    ),
    RouteBaselineRule(
        match="prefix",
        pattern="/api/v1/analytics/",
        baseline_enabled=analytics_enabled(),
        guarded_by=["BLACKSKIES_ENABLE_ANALYTICS"],
        notes="Route is present; analytics exposure follows the analytics feature flag.",
    ),
    RouteBaselineRule(
        match="exact",
        pattern="/api/v1/long-form/execute",
        baseline_enabled=False,
        guarded_by=["BLACKSKIES_LONG_FORM_PROVIDER_ENABLED"],
        notes="Long-form execution route is present, but provider-backed long-form is not baseline-enabled.",
    ),
)


def _normalize_value(value: Any) -> Any:
    if isinstance(value, Path):
        return str(value)
    if hasattr(value, "value"):
        enum_value = getattr(value, "value")
        if isinstance(enum_value, (str, int, float, bool)) or enum_value is None:
            return enum_value
    if isinstance(value, BaseModel):
        return value.model_dump(mode="json")
    if isinstance(value, dict):
        return {key: _normalize_value(val) for key, val in sorted(value.items())}
    if isinstance(value, (list, tuple, set, frozenset)):
        normalized = [_normalize_value(item) for item in value]
        return sorted(normalized) if isinstance(value, (set, frozenset)) else normalized
    return value


def _config_defaults_snapshot() -> dict[str, Any]:
    snapshot: dict[str, Any] = {}
    for field_name, field in sorted(ServiceSettings.model_fields.items()):
        if field.default_factory is not None:
            default_value = f"<factory:{field.default_factory.__name__}>"
        else:
            default_value = field.default
        snapshot[field_name] = _normalize_value(default_value)
    return snapshot


def _config_defaults_hash() -> str:
    payload = json.dumps(
        _config_defaults_snapshot(), ensure_ascii=False, sort_keys=True, separators=(",", ":")
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _git_commit() -> str:
    try:
        completed = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return "unknown"
    return completed.stdout.strip() or "unknown"


def _default_settings() -> ServiceSettings:
    sample_project = REPO_ROOT / "sample_project"
    return ServiceSettings(project_base_dir=sample_project)


def _default_router_config(settings: ServiceSettings) -> ModelRouterConfig:
    return ModelRouterConfig(
        policy=settings.model_routing_policy,
        openai_api_key=settings.openai_api_key,
        provider_calls_enabled=settings.model_router_provider_calls_enabled,
        local_provider=settings.local_provider,
        local_llm_available=settings.local_llm_available,
        local_llm_base_url=settings.local_llm_base_url,
        local_llm_model=settings.local_llm_model,
        local_llm_health_check=settings.local_llm_health_check,
        local_llm_timeout_seconds=settings.local_llm_timeout_seconds,
        openai_model=settings.openai_model,
        openai_base_url=settings.openai_base_url,
        openai_health_check=settings.openai_health_check,
        openai_timeout_seconds=settings.openai_timeout_seconds,
        log_decisions=settings.model_router_log_decisions,
        routing_metadata_enabled=settings.model_router_metadata_enabled,
    )


def _provider_state(settings: ServiceSettings) -> ProviderState:
    router = create_default_model_router(_default_router_config(settings))
    providers = list(router.providers.values())
    supported = sorted(
        {
            provider.adapter().provider_name
            for provider in providers
            if provider.adapter() is not None
        }
    )

    configured: set[str] = set()
    if settings.local_provider:
        configured.add(settings.local_provider)
    if settings.openai_api_key:
        configured.add("openai")

    routable: set[str] = set()
    for provider in providers:
        adapter = provider.adapter()
        if adapter is None:
            continue
        provider_name = adapter.provider_name
        if provider_name == settings.local_provider and settings.local_llm_available:
            routable.add(provider_name)
        if provider_name == "openai" and settings.openai_api_key:
            routable.add(provider_name)

    callable_providers = sorted(routable) if settings.model_router_provider_calls_enabled else []

    health_check_targets: list[str] = []
    if settings.local_llm_health_check:
        health_check_targets.append(settings.local_provider)
    if settings.openai_health_check:
        health_check_targets.append("openai")

    return ProviderState(
        supported=sorted(supported),
        configured=sorted(configured),
        routable=sorted(routable),
        callable=callable_providers,
        health_check_targets=sorted(set(health_check_targets)),
    )


def _route_metadata(
    path: str, method: str, settings: ServiceSettings
) -> tuple[bool, list[str], str]:
    del method, settings
    for rule in ROUTE_BASELINE_RULES:
        if rule.match == "exact" and path == rule.pattern:
            return (rule.baseline_enabled, list(rule.guarded_by), rule.notes)
        if rule.match == "prefix" and path.startswith(rule.pattern):
            return (rule.baseline_enabled, list(rule.guarded_by), rule.notes)
    return (True, [], "")


def _routes(settings: ServiceSettings) -> list[RouteEntry]:
    application = app_module.create_app(settings)
    discovered: dict[tuple[str, str], RouteEntry] = {}
    for route in application.routes:
        if not isinstance(route, APIRoute):
            continue
        for method in sorted(route.methods - {"HEAD", "OPTIONS"}):
            baseline_enabled, guarded_by, notes = _route_metadata(route.path, method, settings)
            key = (route.path, method)
            discovered[key] = RouteEntry(
                path=route.path,
                method=method,
                baseline_enabled=baseline_enabled,
                guarded_by=guarded_by,
                notes=notes,
            )
    return sorted(discovered.values(), key=lambda item: (item.path, item.method))


def _config_env_var(field_name: str) -> str:
    return f"{ServiceSettings.ENV_PREFIX}{field_name.upper()}"


def _features(settings: ServiceSettings) -> list[FeatureEntry]:
    return [
        FeatureEntry(
            name="analytics",
            kind="runtime",
            state=analytics_maturity().value,
            source_of_truth="services/src/blackskies/services/feature_flags.py",
            baseline_default="on",
            user_visible=True,
            env_vars=["BLACKSKIES_ENABLE_ANALYTICS"],
            runtime_entrypoints=["services/src/blackskies/services/routers/analytics.py"],
            notes="Analytics routes are part of the backend surface by default.",
        ),
        FeatureEntry(
            name="provider_calls",
            kind="runtime",
            state="off",
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=False,
            config_keys=["model_router_provider_calls_enabled"],
            env_vars=[_config_env_var("model_router_provider_calls_enabled")],
            runtime_entrypoints=[
                "services/src/blackskies/services/app.py",
                "services/src/blackskies/services/model_router.py",
            ],
            notes="Routing is active, but live provider adapter execution is an explicit opt-in.",
        ),
        FeatureEntry(
            name="routing_metadata",
            kind="operational",
            state="off",
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=False,
            config_keys=["model_router_metadata_enabled"],
            env_vars=[_config_env_var("model_router_metadata_enabled")],
            runtime_entrypoints=["services/src/blackskies/services/app.py"],
            notes="Optional routing metadata in responses is disabled by default.",
        ),
        FeatureEntry(
            name="long_form_provider_execution",
            kind="runtime",
            state="off",
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=False,
            config_keys=["long_form_provider_enabled"],
            env_vars=[_config_env_var("long_form_provider_enabled")],
            runtime_entrypoints=[
                "services/src/blackskies/services/routers/long_form.py",
                "services/src/blackskies/services/operations/long_form_execution.py",
            ],
            notes="Long-form provider-backed execution is implemented but not baseline-enabled.",
        ),
        FeatureEntry(
            name="backup_verifier",
            kind="operational",
            state=settings.backup_verifier_feature_maturity.value,
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=True,
            config_keys=["backup_verifier_enabled"],
            env_vars=[_config_env_var("backup_verifier_enabled")],
            runtime_entrypoints=[
                "services/src/blackskies/services/app.py",
                "services/src/blackskies/services/backup_verifier.py",
                "services/src/blackskies/services/routers/health.py",
            ],
            notes="Verifier state is visible in health payloads even when the daemon is disabled by default.",
        ),
        FeatureEntry(
            name="memory_lab",
            kind="runtime",
            state=settings.memory_lab_feature_maturity.value,
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=False,
            config_keys=["memory_lab_enabled"],
            env_vars=[_config_env_var("memory_lab_enabled")],
            runtime_entrypoints=[
                "services/src/blackskies/services/prompt_pipeline.py",
                "services/src/blackskies/services/memory_lab/orchestrator.py",
                "services/src/blackskies/services/operations/draft_generation.py",
            ],
            notes="Advisory memory subsystem behind flags.",
        ),
        FeatureEntry(
            name="memory_lab_anchor",
            kind="runtime",
            state="off",
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=False,
            config_keys=["memory_lab_anchor_enabled"],
            env_vars=[_config_env_var("memory_lab_anchor_enabled")],
            runtime_entrypoints=["services/src/blackskies/services/memory_lab/orchestrator.py"],
            notes="Anchor scoring exists but remains disabled with the advisory subsystem.",
        ),
        FeatureEntry(
            name="memory_lab_reinforcement",
            kind="experimental",
            state="experimental",
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=False,
            config_keys=["memory_lab_reinforcement_enabled"],
            env_vars=[_config_env_var("memory_lab_reinforcement_enabled")],
            runtime_entrypoints=["services/src/blackskies/services/memory_lab/reinforcement.py"],
            notes="Experimental reinforcement behavior, disabled in the baseline runtime.",
        ),
        FeatureEntry(
            name="memory_lab_interpretations",
            kind="experimental",
            state="experimental",
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=False,
            config_keys=["memory_lab_interpretations_enabled"],
            env_vars=[_config_env_var("memory_lab_interpretations_enabled")],
            runtime_entrypoints=["services/src/blackskies/services/memory_lab/interpretations.py"],
            notes="Experimental interpretation variants, disabled in the baseline runtime.",
        ),
        FeatureEntry(
            name="memory_lab_decay",
            kind="experimental",
            state="experimental",
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=False,
            config_keys=["memory_lab_decay_enabled"],
            env_vars=[_config_env_var("memory_lab_decay_enabled")],
            runtime_entrypoints=["services/src/blackskies/services/memory_lab/decay.py"],
            notes="Experimental decay behavior, disabled in the baseline runtime.",
        ),
        FeatureEntry(
            name="memory_lab_experimental_framework",
            kind="experimental",
            state="experimental",
            source_of_truth="services/src/blackskies/services/config.py",
            baseline_default="off",
            user_visible=False,
            config_keys=["memory_lab_experimental_enabled"],
            env_vars=[_config_env_var("memory_lab_experimental_enabled")],
            runtime_entrypoints=[
                "services/src/blackskies/services/memory_lab/experimental.py",
                "services/src/blackskies/services/memory_lab/wave1.py",
            ],
            notes="Phase 7 experimental framework remains off by default.",
        ),
        FeatureEntry(
            name="plugins",
            kind="operational",
            state=plugins_maturity().value,
            source_of_truth="services/src/blackskies/services/feature_flags.py",
            baseline_default="off",
            user_visible=False,
            env_vars=["BLACKSKIES_ENABLE_PLUGINS"],
            runtime_entrypoints=[
                "services/src/blackskies/services/plugins/registry.py",
                "services/src/blackskies/services/plugins/host.py",
            ],
            notes="Plugin execution exists in code but is not part of the standard runtime baseline.",
        ),
        FeatureEntry(
            name="voice_notes",
            kind="deferred",
            state=voice_notes_maturity().value,
            source_of_truth="services/src/blackskies/services/feature_flags.py",
            baseline_default="off",
            user_visible=False,
            env_vars=["BLACKSKIES_ENABLE_VOICE_NOTES"],
            runtime_entrypoints=[
                "services/src/blackskies/services/backup_verifier.py",
                "services/src/blackskies/services/routers/health.py",
            ],
            notes="Deferred voice workflow with only limited archival verification seams in runtime code.",
        ),
    ]


def _iter_service_source_files() -> Iterable[Path]:
    base = SERVICES_SRC / "blackskies" / "services"
    for path in sorted(base.rglob("*.py")):
        if any(part in {"__pycache__", "tests"} for part in path.parts):
            continue
        yield path


def _module_imported(module_name: str) -> bool:
    for path in _iter_service_source_files():
        if path.parts[-2] == "memory_prototype":
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name == module_name or alias.name.startswith(f"{module_name}."):
                        return True
            if isinstance(node, ast.ImportFrom):
                imported_module = node.module or ""
                if imported_module == module_name or imported_module.startswith(f"{module_name}."):
                    return True
                if node.level and any(
                    alias.name == module_name.split(".")[-1] for alias in node.names
                ):
                    return True
        source = path.read_text(encoding="utf-8")
        if f".{module_name.split('.')[-1]}" in source:
            # Relative-import fallback for modules loaded with `from .foo import ...`.
            if module_name.endswith("scene_memory") and "from .scene_memory import" in source:
                return True
            if module_name.endswith("memory_prototype") and "from .memory_prototype" in source:
                return True
    return False


def _package_imported(package_name: str) -> bool:
    for path in _iter_service_source_files():
        if package_name.endswith("memory_prototype") and path.parts[-2] == "memory_prototype":
            continue
        source = path.read_text(encoding="utf-8")
        if f"{package_name}" in source or f".{package_name.split('.')[-1]}" in source:
            if package_name.endswith("memory_lab") and "memory_lab" in source:
                return True
            if package_name.endswith("memory_prototype") and "memory_prototype" in source:
                return True
    return False


def _memory_state() -> MemoryState:
    scene_memory_live = _module_imported("blackskies.services.scene_memory")
    memory_lab_live = _package_imported("blackskies.services.memory_lab")
    memory_prototype_runtime = _package_imported("blackskies.services.memory_prototype")
    return MemoryState(
        scene_memory_live=scene_memory_live,
        memory_lab_live=memory_lab_live,
        memory_prototype_runtime=memory_prototype_runtime,
        notes="memory_prototype has no observed production import path",
    )


def _plugins_state() -> PluginsState:
    return PluginsState(
        runtime_namespace_present=(SERVICES_SRC / "blackskies" / "services" / "plugins").exists(),
        execution_state="off",
        env_var="BLACKSKIES_ENABLE_PLUGINS",
        registry_path="services/src/blackskies/services/plugins/registry.py",
        notes="Plugin runtime namespace exists, but execution is non-baseline and feature-gated.",
    )


def _analytics_state() -> AnalyticsState:
    return AnalyticsState(
        enabled_by_default=analytics_enabled(),
        env_var="BLACKSKIES_ENABLE_ANALYTICS",
        routes=[
            "/api/v1/analytics/summary",
            "/api/v1/analytics/scenes",
            "/api/v1/analytics/relationships",
            "/api/v1/analytics/budget",
        ],
        notes=(
            "Analytics routes are exposed by default and can be hidden by the analytics feature flag; "
            "default maturity is production unless explicitly overridden."
        ),
    )


def _health_surfaces() -> list[HealthSurface]:
    return [
        HealthSurface(
            path="/api/v1/healthz",
            visible=True,
            enabled_by_default=True,
            diagnostics_only=True,
            notes="Health payload reports backup verifier visibility even when the verifier is disabled by default.",
        ),
        HealthSurface(
            path="/api/v1/backup_verifier/report",
            visible=True,
            enabled_by_default=False,
            diagnostics_only=True,
            notes="Report route is present, but the backing verifier subsystem is implemented-but-disabled by default.",
        ),
        HealthSurface(
            path="/api/v1/backup_verifier/run",
            visible=True,
            enabled_by_default=False,
            diagnostics_only=True,
            notes="Manual verification route exists, but it belongs to a subsystem that is not baseline-enabled.",
        ),
    ]


def _deferred_docs() -> list[DeferredDoc]:
    # Curated policy metadata: these docs are intentionally listed by maintainers.
    # They are not inferred from runtime imports or dynamic tracing.
    return [
        DeferredDoc(
            name="voice_notes",
            path="docs/deferred/voice_notes_transcription.md",
            live_runtime_dependency=True,
            seam_owners=[
                "services/src/blackskies/services/backup_verifier.py",
                "services/src/blackskies/services/routers/health.py",
                "services/src/blackskies/services/feature_flags.py",
            ],
            seam_state="disabled",
            seam_type="explicit_disabled_integration_seam",
            notes=(
                "Curated policy pointer. Deferred voice workflow remains non-baseline; only archival verification seams "
                "are live behind explicit feature gating."
            ),
        ),
        DeferredDoc(
            name="smart_merge",
            path="docs/deferred/smart_merge_tool.md",
            live_runtime_dependency=False,
            seam_owners=[],
            seam_state="none",
            seam_type="none",
            notes="Curated policy pointer. Deferred merge workflow; no active runtime seam.",
        ),
        DeferredDoc(
            name="accessibility_toggles",
            path="docs/gui/accessibility_toggles.md",
            live_runtime_dependency=False,
            seam_owners=[],
            seam_state="none",
            seam_type="none",
            notes="Curated policy pointer. Planned future work; no active runtime seam.",
        ),
    ]


def _canonical_docs() -> list[CanonicalDoc]:
    # Curated policy metadata: these canonical pointers are maintained manually
    # and should not be interpreted as runtime-discovered import facts.
    return [
        CanonicalDoc(
            path="docs/specs/current_state.md",
            role="current_runtime_canon",
            notes="Curated policy pointer; not inferred from runtime import tracing.",
        ),
        CanonicalDoc(
            path="docs/specs/memory_runtime.md",
            role="memory_runtime_canon",
            notes="Curated policy pointer; not inferred from runtime import tracing.",
        ),
        CanonicalDoc(
            path="docs/specs/model_runtime.md",
            role="model_runtime_canon",
            notes="Curated policy pointer; not inferred from runtime import tracing.",
        ),
    ]


def build_runtime_truth() -> RuntimeTruth:
    settings = _default_settings()
    return RuntimeTruth(
        service_baseline=ServiceBaseline(
            service_version=app_module.SERVICE_VERSION,
            app_factory="services/src/blackskies/services/app.py:create_app",
            settings_class="services/src/blackskies/services/config.py:ServiceSettings",
            api_base="/api/v1",
        ),
        routes=_routes(settings),
        providers=_provider_state(settings),
        routing=RoutingState(
            policy=settings.model_routing_policy.value,
            routing_metadata_enabled=settings.model_router_metadata_enabled,
            provider_calls_enabled=settings.model_router_provider_calls_enabled,
            local_provider=settings.local_provider,
        ),
        features=_features(settings),
        memory=_memory_state(),
        plugins=_plugins_state(),
        analytics=_analytics_state(),
        health_surfaces=_health_surfaces(),
        deferred_docs=_deferred_docs(),
        canonical_docs=_canonical_docs(),
        generated_from=GeneratedFrom(
            git_commit=_git_commit(),
            config_defaults_hash=_config_defaults_hash(),
            generator_version=GENERATOR_VERSION,
        ),
    )


def build_runtime_truth_schema() -> dict[str, Any]:
    return RuntimeTruth.model_json_schema()


def render_runtime_truth_payload() -> dict[str, Any]:
    return build_runtime_truth().model_dump(mode="json")


def render_runtime_truth_schema() -> dict[str, Any]:
    return build_runtime_truth_schema()


def normalized_payload(payload: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(payload)
    normalized.pop("generated_at", None)
    generated_from = normalized.get("generated_from")
    if isinstance(generated_from, dict):
        # git_commit is provenance metadata for the current checkout and changes
        # on every commit, so it is excluded from semantic freshness comparisons.
        generated_from = dict(generated_from)
        generated_from.pop("git_commit", None)
        normalized["generated_from"] = generated_from
    return normalized


def write_artifacts() -> tuple[Path, Path]:
    build_dir = REPO_ROOT / "build"
    build_dir.mkdir(parents=True, exist_ok=True)
    payload_path = build_dir / "runtime_truth.json"
    schema_path = build_dir / "runtime_truth.schema.json"

    payload = render_runtime_truth_payload()
    schema = render_runtime_truth_schema()

    payload_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    schema_path.write_text(
        json.dumps(schema, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return payload_path, schema_path


def main() -> None:
    payload_path, schema_path = write_artifacts()
    print(f"Wrote {payload_path.relative_to(REPO_ROOT)}")
    print(f"Wrote {schema_path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
