"""Service configuration utilities."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, ClassVar, cast

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator, model_validator

from .memory_lab.options import MemoryLabRuntimeOptions
from .memory_lab.runtime_profiles import load_runtime_profile, list_runtime_profile_names
from .model_routing import ModelRoutingPolicy
from .memory_lab.validation import validate_memory_thresholds
from .feature_flags import FeatureMaturity, normalize_feature_maturity


def _default_project_dir() -> Path:
    """Determine a sensible default project directory."""

    cwd_candidate = Path.cwd() / "sample_project"
    if cwd_candidate.exists():
        return cwd_candidate

    module_path = Path(__file__).resolve()
    for parent in module_path.parents:
        candidate = parent / "sample_project"
        if candidate.exists():
            return candidate

    return cwd_candidate


class ServiceSettings(BaseModel):
    """Runtime configuration for the FastAPI services."""

    ENV_PREFIX: ClassVar[str] = "BLACKSKIES_"
    ENV_FILE: ClassVar[str | None] = ".env"
    ENV_FILE_ENCODING: ClassVar[str] = "utf-8"

    model_config: ClassVar[ConfigDict] = cast(
        ConfigDict,
        {
            "extra": "ignore",
            "env_prefix": ENV_PREFIX,
        },
    )

    project_base_dir: Path = Field(
        default_factory=_default_project_dir,
        description="Base directory containing project folders.",
    )
    max_request_body_bytes: int = Field(
        default=512 * 1024,
        ge=16 * 1024,
        description="Maximum allowed size in bytes for incoming request bodies.",
    )
    draft_task_timeout_seconds: int = Field(
        default=120,
        ge=15,
        description="Maximum duration allowed for draft generation/preflight tasks in seconds.",
    )
    draft_task_retry_attempts: int = Field(
        default=1,
        ge=0,
        le=5,
        description="Number of retry attempts for draft generation tasks after timeouts or transient failures.",
    )
    critique_task_timeout_seconds: int = Field(
        default=90,
        ge=10,
        description="Maximum duration allowed for critique tasks in seconds.",
    )
    critique_task_retry_attempts: int = Field(
        default=1,
        ge=0,
        le=5,
        description="Number of retry attempts for critique tasks after transient failures.",
    )
    critique_circuit_failure_threshold: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of consecutive critique failures before opening the circuit breaker.",
    )
    critique_circuit_reset_seconds: float = Field(
        default=45.0,
        ge=0.0,
        description="Seconds before a tripped critique circuit allows new attempts.",
    )
    analytics_task_timeout_seconds: int = Field(
        default=60,
        ge=10,
        description="Maximum duration allowed for analytics exports in seconds. This controls analytics task execution only; analytics feature exposure/default state is handled in feature_flags.py.",
    )
    analytics_task_retry_attempts: int = Field(
        default=1,
        ge=0,
        le=5,
        description="Number of retry attempts for analytics exports after transient failures.",
    )
    analytics_circuit_failure_threshold: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of consecutive analytics failures before opening the circuit breaker.",
    )
    analytics_circuit_reset_seconds: float = Field(
        default=60.0,
        ge=0.0,
        description="Seconds before a tripped analytics circuit allows new attempts.",
    )
    model_routing_policy: ModelRoutingPolicy = Field(
        default=ModelRoutingPolicy.LOCAL_ONLY,
        description="Routing policy for model-backed calls.",
    )
    model_router_log_decisions: bool = Field(
        default=True,
        description="Enable routing decision logs for model-backed calls.",
    )
    model_router_metadata_enabled: bool = Field(
        default=False,
        description="Include optional routing metadata in service responses. Implemented, but disabled in the standard runtime baseline by default.",
    )
    model_router_provider_calls_enabled: bool = Field(
        default=False,
        description="Allow routed calls to invoke provider adapters. The routing layer ships by default; live provider execution remains an explicit opt-in.",
    )
    long_form_provider_enabled: bool = Field(
        default=False,
        description="Enable the provider-backed long-form execution loop. Implemented, but not part of the default runtime surface.",
    )
    phase4_mock_routes_enabled: bool = Field(
        default=False,
        description="Expose legacy phase4 mock critique/rewrite routes. Disabled by default; enable only for explicit harness/dev seam testing.",
    )
    local_provider: str = Field(
        default="ollama",
        description="Local model provider identifier (currently supports ollama).",
    )
    local_llm_available: bool = Field(
        default=True,
        description="Whether the local model provider is healthy and available.",
    )
    local_llm_base_url: str = Field(
        default="http://127.0.0.1:11434",
        description="Base URL for the local LLM provider (Ollama).",
    )
    local_llm_model: str = Field(
        default="qwen3:4b",
        description="Default local LLM model name.",
    )
    local_llm_health_check: bool = Field(
        default=False,
        description="Enable health probing for the local LLM provider.",
    )
    local_llm_timeout_seconds: float = Field(
        default=12.0,
        ge=0.5,
        description="Timeout in seconds for local LLM requests.",
    )
    openai_api_key: str | None = Field(
        default=None,
        description="API key for OpenAI-backed providers.",
    )
    openai_model: str = Field(
        default="gpt-4o-mini",
        description="Default OpenAI model name.",
    )
    openai_base_url: str = Field(
        default="https://api.openai.com/v1",
        description="Base URL for OpenAI API requests.",
    )
    openai_health_check: bool = Field(
        default=False,
        description="Enable health probing for OpenAI providers.",
    )
    openai_timeout_seconds: float = Field(
        default=30.0,
        ge=1.0,
        description="Timeout in seconds for OpenAI API requests.",
    )
    backup_verifier_enabled: bool = Field(
        default=False,
        description="Enable the background backup verification daemon. The daemon is implemented in code but disabled in the shipping baseline unless this flag is set.",
    )
    backup_verifier_maturity: FeatureMaturity | None = Field(
        default=None,
        description="Optional maturity override for backup verifier exposure during the migration from boolean feature flags. Supported values: off, experimental, internal, partial, production.",
    )
    backup_verifier_interval_seconds: int = Field(
        default=30 * 60,
        ge=60,
        description="Base interval in seconds between backup verification runs.",
    )
    backup_verifier_backoff_max_seconds: int = Field(
        default=4 * 60 * 60,
        ge=60,
        description="Maximum interval in seconds when backing off due to idle cycles.",
    )
    verifier_schedule_seconds: int = Field(
        default=3600,
        ge=60,
        description="Interval in seconds for the scheduled snapshot verifier.",
    )
    memory_lab_enabled: bool = Field(
        default=False,
        description="Enable advisory Memory Lab behavior. Memory Lab is implemented as an optional advisory subsystem and is disabled in the baseline runtime by default.",
    )
    memory_lab_maturity: FeatureMaturity | None = Field(
        default=None,
        description="Optional maturity override for Memory Lab exposure during the migration from boolean feature flags. Supported values: off, experimental, internal, partial, production.",
    )
    memory_lab_runtime_profile: str = Field(
        default="stable_default",
        description="Named Memory Lab runtime profile for operational defaults.",
    )
    memory_lab_max_candidates: int = Field(
        default=8,
        ge=1,
        description="Maximum number of Memory Lab candidate artifacts considered during resolution.",
    )
    memory_lab_max_unresolved: int = Field(
        default=5,
        ge=1,
        description="Maximum unresolved tension artifacts selected into an advisory memory packet.",
    )
    memory_lab_write_legacy_continuity: bool = Field(
        default=True,
        description="When true, continue writing legacy continuity payloads alongside Memory Lab entries. This compatibility bridge stays on even while Memory Lab itself remains opt-in.",
    )
    memory_lab_debug_logging: bool = Field(
        default=False,
        description="Enable debug logging for Memory Lab advisory selection behavior. This is a diagnostics aid for the optional subsystem, not a baseline runtime feature.",
    )
    memory_lab_anchor_enabled: bool = Field(
        default=False,
        description="Enable Memory Lab anchor scoring and tracking behaviors. Implemented but disabled by default with the rest of the advisory system.",
    )
    memory_lab_anchor_auto_threshold: int = Field(
        default=3,
        ge=1,
        description="Auto-promotion threshold for anchors based on reinforcement/selection counts.",
    )
    memory_lab_reinforcement_enabled: bool = Field(
        default=False,
        description="Enable post-selection reinforcement updates and event persistence for Memory Lab artifacts. Experimental advisory behavior, disabled in the baseline runtime.",
    )
    memory_lab_interpretations_enabled: bool = Field(
        default=False,
        description="Enable deterministic interpretation variants for ambiguous summary artifacts. Experimental advisory behavior, disabled in the baseline runtime.",
    )
    memory_lab_max_interpretations_per_group: int = Field(
        default=2,
        ge=1,
        description="Maximum number of interpretation variants retained for a single interpretation group.",
    )
    memory_lab_alternate_interpretation_threshold: float = Field(
        default=0.08,
        ge=0.0,
        description="Maximum score delta to expose a same-group second-place interpretation as an alternate reading.",
    )
    memory_lab_weight_max: float = Field(
        default=2.0,
        ge=1.0,
        description="Upper bound for reinforced Memory Lab artifact weights.",
    )
    memory_lab_decay_enabled: bool = Field(
        default=False,
        description="Enable deterministic advisory memory decay before resolver scoring. Experimental advisory behavior, disabled in the baseline runtime.",
    )
    memory_lab_decay_base_rate: float = Field(
        default=0.03,
        ge=0.0,
        description="Base per-scene decay rate for Memory Lab artifacts.",
    )
    memory_lab_decay_min_weight: float = Field(
        default=0.05,
        ge=0.0,
        description="Minimum allowed advisory memory weight after decay.",
    )
    memory_lab_decay_fading_threshold: float = Field(
        default=0.40,
        ge=0.0,
        description="Weight threshold below which active memory becomes fading.",
    )
    memory_lab_decay_suppressed_threshold: float = Field(
        default=0.20,
        ge=0.0,
        description="Weight threshold below which fading memory becomes suppressed.",
    )
    memory_lab_decay_archived_threshold: float = Field(
        default=0.10,
        ge=0.0,
        description="Weight threshold below which suppressed memory becomes archived.",
    )
    memory_lab_decay_log_anchor_protection: bool = Field(
        default=False,
        description="When enabled, log anchor protection events during decay evaluation.",
    )
    memory_lab_decay_allow_revival: bool = Field(
        default=True,
        description="Allow fading/suppressed artifacts to recover status after selection reinforcement.",
    )
    memory_lab_decay_suppressed_fallback_enabled: bool = Field(
        default=True,
        description="Allow bounded suppressed-memory fallback consideration when normal confidence is low.",
    )
    memory_lab_decay_low_confidence_fallback_threshold: float = Field(
        default=0.35,
        ge=0.0,
        description="Score threshold below which suppressed fallback candidates may compete.",
    )
    memory_lab_reinforcement_event_retention_limit: int = Field(
        default=200,
        ge=1,
        description="Maximum number of reinforcement events retained per artifact.",
    )
    memory_lab_decay_event_retention_limit: int = Field(
        default=200,
        ge=1,
        description="Maximum number of decay events retained per artifact.",
    )
    memory_lab_contested_event_retention_limit: int = Field(
        default=200,
        ge=1,
        description="Maximum number of contested outcome events retained per scene.",
    )
    memory_lab_diagnostics_level: str = Field(
        default="standard",
        description="Diagnostics verbosity profile for Memory Lab runtime decisions.",
    )
    memory_lab_experimental_enabled: bool = Field(
        default=False,
        description="Enable Phase 7 experimental framework execution such as exposure-only alternates. This flag remains off in the stable product baseline.",
    )
    memory_lab_experimental_active_experiments: str = Field(
        default="",
        description="Comma-separated list of active experiment ids in the experimental framework.",
    )
    memory_lab_experimental_fail_closed: bool = Field(
        default=True,
        description="Block unknown or invalid experiments when the experimental framework is enabled.",
    )
    memory_lab_experimental_log_events: bool = Field(
        default=True,
        description="Emit minimal experimental run logs for start/end/outcome/violation events.",
    )

    @field_validator("project_base_dir")
    @classmethod
    def _ensure_project_dir_exists(cls, value: Path) -> Path:
        """Validate that the configured project directory exists."""

        if not value.exists():
            raise ValueError(f"Project base directory does not exist: {value}")
        return value

    @field_validator("max_request_body_bytes")
    @classmethod
    def _validate_body_limit(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("max_request_body_bytes must be positive")
        return value

    @field_validator("backup_verifier_backoff_max_seconds")
    @classmethod
    def _validate_backup_backoff(
        cls,
        value: int,
        info: ValidationInfo,
    ) -> int:
        """Ensure the maximum backoff interval is not shorter than the base interval."""

        base_interval = info.data.get("backup_verifier_interval_seconds")
        if base_interval is not None and value < int(base_interval):
            raise ValueError(
                "backup_verifier_backoff_max_seconds must be >= backup_verifier_interval_seconds"
            )
        return value

    @model_validator(mode="after")
    def _validate_memory_decay_thresholds(self) -> ServiceSettings:
        validate_memory_thresholds(
            fading_threshold=self.memory_lab_decay_fading_threshold,
            suppressed_threshold=self.memory_lab_decay_suppressed_threshold,
            archived_threshold=self.memory_lab_decay_archived_threshold,
            min_weight=self.memory_lab_decay_min_weight,
        )
        # Migration window: explicit maturity overrides win, but legacy booleans
        # remain accepted and are normalized into subsystem exposure state.
        self.backup_verifier_enabled = self.backup_verifier_feature_maturity.is_active
        self.memory_lab_enabled = self.memory_lab_feature_maturity.is_active
        return self

    @field_validator("memory_lab_runtime_profile")
    @classmethod
    def _validate_memory_lab_runtime_profile(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("memory_lab_runtime_profile must be non-empty")
        if normalized not in list_runtime_profile_names():
            expected = ", ".join(list_runtime_profile_names())
            raise ValueError(f"memory_lab_runtime_profile must be one of: {expected}")
        return normalized

    @staticmethod
    def _parse_env_file(path: Path, encoding: str) -> dict[str, str]:
        """Parse an environment file supporting `export` and quoted values."""

        parsed: dict[str, str] = {}

        for raw_line in path.read_text(encoding=encoding).splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[len("export ") :].strip()

            if "=" not in line:
                continue

            key, raw_value = line.split("=", 1)
            key = key.strip()
            value = raw_value.strip()

            if value and value[0] == value[-1] and value[0] in {'"', "'"}:
                value = value[1:-1]

            parsed[key] = value

        return parsed

    def memory_lab_runtime_options(self) -> MemoryLabRuntimeOptions:
        profile = load_runtime_profile(self.memory_lab_runtime_profile)

        def _profile_or_explicit(field_name: str, profile_value):  # type: ignore[no-untyped-def]
            field_default = self.__class__.model_fields[field_name].default
            current_value = getattr(self, field_name)
            if current_value != field_default:
                return current_value
            return profile_value

        return MemoryLabRuntimeOptions(
            enabled=self.memory_lab_feature_maturity.is_active,
            max_candidates=int(
                _profile_or_explicit("memory_lab_max_candidates", profile.max_candidates)
            ),
            max_unresolved=int(
                _profile_or_explicit("memory_lab_max_unresolved", profile.max_unresolved)
            ),
            alternate_interpretation_threshold=float(
                _profile_or_explicit(
                    "memory_lab_alternate_interpretation_threshold", profile.alternate_threshold
                )
            ),
            weight_max=self.memory_lab_weight_max,
            reinforcement_enabled=bool(
                _profile_or_explicit(
                    "memory_lab_reinforcement_enabled", profile.reinforcement_enabled
                )
            ),
            anchor_enabled=self.memory_lab_anchor_enabled,
            anchor_auto_threshold=self.memory_lab_anchor_auto_threshold,
            decay_enabled=bool(
                _profile_or_explicit("memory_lab_decay_enabled", profile.decay_enabled)
            ),
            decay_base_rate=self.memory_lab_decay_base_rate,
            decay_min_weight=self.memory_lab_decay_min_weight,
            decay_fading_threshold=self.memory_lab_decay_fading_threshold,
            decay_suppressed_threshold=self.memory_lab_decay_suppressed_threshold,
            decay_archived_threshold=self.memory_lab_decay_archived_threshold,
            decay_log_anchor_protection=self.memory_lab_decay_log_anchor_protection,
            decay_allow_revival=self.memory_lab_decay_allow_revival,
            decay_suppressed_fallback_enabled=bool(
                _profile_or_explicit(
                    "memory_lab_decay_suppressed_fallback_enabled",
                    profile.suppressed_fallback_enabled,
                )
            ),
            decay_low_confidence_fallback_threshold=float(
                _profile_or_explicit(
                    "memory_lab_decay_low_confidence_fallback_threshold",
                    profile.low_confidence_fallback_threshold,
                )
            ),
            reinforcement_event_retention_limit=int(
                _profile_or_explicit(
                    "memory_lab_reinforcement_event_retention_limit",
                    profile.retention_limits_by_event_type["reinforcement"],
                )
            ),
            decay_event_retention_limit=int(
                _profile_or_explicit(
                    "memory_lab_decay_event_retention_limit",
                    profile.retention_limits_by_event_type["decay"],
                )
            ),
            contested_event_retention_limit=int(
                _profile_or_explicit(
                    "memory_lab_contested_event_retention_limit",
                    profile.retention_limits_by_event_type["contested"],
                )
            ),
            diagnostics_level=str(
                _profile_or_explicit("memory_lab_diagnostics_level", profile.diagnostics_level)
            ),
            profile_name=profile.profile_name,
            profile_version=profile.version,
            experimental_enabled=self.memory_lab_experimental_enabled,
            experimental_active_experiments=tuple(
                item.strip()
                for item in self.memory_lab_experimental_active_experiments.split(",")
                if item.strip()
            ),
            experimental_fail_closed=self.memory_lab_experimental_fail_closed,
            experimental_log_events=self.memory_lab_experimental_log_events,
            debug_logging=self.memory_lab_debug_logging,
        )

    @classmethod
    def from_environment(cls) -> "ServiceSettings":
        """Load settings from environment variables or a `.env` file."""

        env_prefix = cls.ENV_PREFIX
        env_file_name = cls.ENV_FILE
        env_encoding = cls.ENV_FILE_ENCODING

        file_values: dict[str, str] = {}
        if env_file_name:
            env_file_path = Path(env_file_name)
            if not env_file_path.is_absolute():
                env_file_path = Path.cwd() / env_file_path
            if env_file_path.exists():
                file_values = cls._parse_env_file(env_file_path, env_encoding)

        overrides: dict[str, str] = {}
        alias_keys: dict[str, list[str]] = {
            "openai_api_key": ["OPENAI_API_KEY"],
            "local_llm_model": ["BLACKSKIES_LOCAL_MODEL"],
            "local_llm_timeout_seconds": ["BLACKSKIES_LOCAL_TIMEOUT_SECONDS"],
        }
        def _normalize_env_value(raw_value: str) -> str:
            # Shell export flows (notably mixed CRLF in WSL/CI handoffs) can leak
            # trailing carriage returns into env values and break enum/bool parsing.
            return raw_value.strip()

        for field_name in cls.model_fields:
            env_key = f"{env_prefix}{field_name.upper()}"
            if env_key in os.environ:
                overrides[field_name] = _normalize_env_value(os.environ[env_key])
            elif env_key in file_values:
                overrides[field_name] = _normalize_env_value(file_values[env_key])
            elif field_name in alias_keys:
                for alias in alias_keys[field_name]:
                    if alias in os.environ:
                        overrides[field_name] = _normalize_env_value(os.environ[alias])
                        break
                    if alias in file_values:
                        overrides[field_name] = _normalize_env_value(file_values[alias])
                        break

        typed_overrides = cast(dict[str, Any], overrides)
        return cls(**typed_overrides)

    @property
    def backups_dir(self) -> Path:
        """Root directory where long-term backup bundles live."""

        return self.project_base_dir / "backups"

    @property
    def backup_verifier_feature_maturity(self) -> FeatureMaturity:
        """Return normalized maturity for backup verifier exposure."""

        return normalize_feature_maturity(
            self.backup_verifier_maturity,
            legacy_enabled=self.backup_verifier_enabled,
            enabled_state=FeatureMaturity.INTERNAL,
        )

    @property
    def memory_lab_feature_maturity(self) -> FeatureMaturity:
        """Return normalized maturity for Memory Lab subsystem exposure."""

        return normalize_feature_maturity(
            self.memory_lab_maturity,
            legacy_enabled=self.memory_lab_enabled,
            enabled_state=FeatureMaturity.EXPERIMENTAL,
        )


__all__: list[str] = ["ServiceSettings"]
