from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest


def _load_script_module():
    repo_root = Path(__file__).resolve().parents[3]
    script_path = repo_root / "scripts" / "long_form_eval.py"
    spec = importlib.util.spec_from_file_location("long_form_eval_script", script_path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_preflight_fails_cleanly_when_server_unreachable() -> None:
    module = _load_script_module()

    def _raise_unreachable(*_args, **_kwargs):
        raise module.url_error.URLError("[WinError 10061] actively refused it")

    module._get_json = _raise_unreachable

    with pytest.raises(RuntimeError, match="EVAL PREFLIGHT FAILED: API server unreachable"):
        module.run_preflight(
            base_url="http://127.0.0.1:8000",
            timeout_seconds=5.0,
            require_real_openai=True,
        )


def test_preflight_fails_cleanly_when_runtime_invalid() -> None:
    module = _load_script_module()

    payload = {
        "status": "ok",
        "runtime": {
            "resolved_base_url": "http://127.0.0.1:11434/v1",
            "resolved_model": "gpt-4o-mini",
            "routing_policy": "local_only",
            "provider_calls_enabled": False,
            "long_form_provider_enabled": False,
            "long_form_prefer_api": False,
        },
    }

    with pytest.raises(RuntimeError, match="Expected real OpenAI API"):
        module.validate_runtime_preflight(payload, require_real_openai=True)


def test_preflight_passes_with_expected_runtime_state() -> None:
    module = _load_script_module()

    payload = {
        "status": "ok",
        "runtime": {
            "resolved_base_url": "https://api.openai.com/v1",
            "resolved_model": "gpt-4o-mini",
            "rewrite_retry_model": "gpt-4o",
            "routing_policy": "api_only",
            "provider_calls_enabled": True,
            "long_form_provider_enabled": True,
            "long_form_prefer_api": True,
        },
    }

    summary = module.validate_runtime_preflight(payload, require_real_openai=True)

    assert summary["provider_type"] == "REAL OPENAI API"
    assert summary["resolved_base_url"] == "https://api.openai.com/v1"
    assert summary["resolved_model"] == "gpt-4o-mini"
    assert summary["rewrite_retry_model"] == "gpt-4o"
