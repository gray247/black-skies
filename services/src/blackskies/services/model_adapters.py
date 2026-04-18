"""Provider adapter stubs for model-backed tasks."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any, FrozenSet
from urllib import request as url_request
from urllib.error import URLError, HTTPError

LOGGER = logging.getLogger(__name__)


class AdapterError(RuntimeError):
    """Raised when adapter calls fail."""


@dataclass(frozen=True)
class AdapterConfig:
    base_url: str
    model: str
    timeout_seconds: float = 2.0


@dataclass(frozen=True)
class ProviderCapabilities:
    """Provider-facing capabilities used by routing and prompt selection."""

    provider_name: str
    prompt_profile: str
    supported_tasks: FrozenSet[str]


class BaseAdapter:
    provider_name: str = "unknown"
    prompt_profile_name: str = "default"
    supported_tasks: FrozenSet[str] = frozenset({"draft", "critique", "rewrite"})

    def __init__(self, config: AdapterConfig) -> None:
        self.config = config

    def _post_json(
        self,
        url: str,
        payload: dict[str, Any],
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request_headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if headers:
            request_headers.update(headers)
        req = url_request.Request(url, data=data, method="POST", headers=request_headers)
        try:
            with url_request.urlopen(req, timeout=self.config.timeout_seconds) as response:
                raw = response.read()
                if not raw:
                    raise AdapterError("Provider returned empty response.")
                decoded = json.loads(raw.decode("utf-8"))
        except (URLError, HTTPError, OSError) as exc:
            raise AdapterError(f"Provider request failed: {exc}") from exc
        except json.JSONDecodeError as exc:
            raise AdapterError(f"Provider returned invalid JSON: {exc}") from exc
        if not isinstance(decoded, dict):
            raise AdapterError("Provider response was not an object.")
        return decoded

    def health_check(self) -> bool:
        raise NotImplementedError

    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider_name=self.provider_name,
            prompt_profile=self.prompt_profile_name,
            supported_tasks=self.supported_tasks,
        )

    def supports_task(self, task_name: str) -> bool:
        return task_name in self.supported_tasks

    def model_name_for_task(self, task_name: str) -> str:  # noqa: ARG002
        return self.config.model

    def prompt_profile_for_task(self, task_name: str) -> str:  # noqa: ARG002
        return self.prompt_profile_name

    def extract_text(self, response: dict[str, Any] | None) -> str | None:
        if not isinstance(response, dict):
            return None
        candidate = response.get("text")
        if isinstance(candidate, str) and candidate.strip():
            return candidate
        raw_payload = response.get("raw")
        if not isinstance(raw_payload, dict):
            raw_payload = response
        return self._extract_text_from_payload(raw_payload)

    def _extract_text_from_payload(self, payload: dict[str, Any]) -> str | None:
        for key in ("response", "text", "content", "output"):
            candidate = payload.get(key)
            if isinstance(candidate, str) and candidate.strip():
                return candidate
        message = payload.get("message")
        if isinstance(message, dict):
            content = message.get("content")
            if isinstance(content, str) and content.strip():
                return content
        data = payload.get("data")
        if isinstance(data, dict):
            nested = self._extract_text_from_payload(data)
            if isinstance(nested, str) and nested.strip():
                return nested
        choices = payload.get("choices")
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                message = first.get("message")
                if isinstance(message, dict):
                    content = message.get("content")
                    if isinstance(content, str) and content.strip():
                        return content
        return None

    def generate_draft(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    def critique(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    def rewrite(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError


class OllamaAdapter(BaseAdapter):
    """Minimal Ollama adapter placeholder."""

    provider_name = "ollama"
    prompt_profile_name = "local_ollama_fast_draft"

    def health_check(self) -> bool:
        url = f"{self.config.base_url.rstrip('/')}/api/tags"
        try:
            req = url_request.Request(url, method="GET")
            with url_request.urlopen(req, timeout=self.config.timeout_seconds) as response:
                return response.status == 200
        except (URLError, HTTPError, OSError) as exc:
            LOGGER.debug("Ollama health check failed: %s", exc)
            return False

    def model_name_for_task(self, task_name: str) -> str:
        if task_name == "outline":
            return "outline-builder-v1"
        return self.config.model

    def _generate(self, payload: dict[str, Any]) -> dict[str, Any]:
        prompt = payload.get("prompt")
        if not isinstance(prompt, str) or not prompt.strip():
            raise AdapterError("Ollama payload missing prompt.")
        body: dict[str, Any] = {
            "model": self.config.model,
            "prompt": prompt,
            "stream": False,
        }
        system = payload.get("system")
        if isinstance(system, str) and system.strip():
            body["system"] = system
        options = payload.get("options")
        if isinstance(options, dict):
            body["options"] = options
        url = f"{self.config.base_url.rstrip('/')}/api/generate"
        response = self._post_json(url, body)
        text = response.get("response")
        if not isinstance(text, str):
            raise AdapterError("Ollama response missing text.")
        return {"text": text, "raw": response}

    def generate_draft(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._generate(payload)

    def critique(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._generate(payload)

    def rewrite(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._generate(payload)


class OpenAIAdapter(BaseAdapter):
    """Minimal OpenAI adapter placeholder."""

    provider_name = "openai"
    prompt_profile_name = "remote_openai_heavy_draft"

    def __init__(self, config: AdapterConfig, *, api_key: str | None) -> None:
        super().__init__(config)
        self._api_key = api_key

    def health_check(self) -> bool:
        return bool(self._api_key)

    def model_name_for_task(self, task_name: str) -> str:
        if task_name == "outline":
            return "openai.outline"
        return self.config.model

    def _raise_missing_key(self) -> None:
        if not self._api_key:
            raise AdapterError("OpenAI API key is missing.")

    def _chat(self, payload: dict[str, Any]) -> dict[str, Any]:
        self._raise_missing_key()
        prompt = payload.get("prompt")
        if not isinstance(prompt, str) or not prompt.strip():
            raise AdapterError("OpenAI payload missing prompt.")
        messages: list[dict[str, str]] = []
        system = payload.get("system")
        if isinstance(system, str) and system.strip():
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        body: dict[str, Any] = {
            "model": self.config.model,
            "messages": messages,
            "temperature": payload.get("temperature", 0.6),
        }
        max_tokens = payload.get("max_tokens")
        if isinstance(max_tokens, int) and max_tokens > 0:
            body["max_tokens"] = max_tokens
        url = f"{self.config.base_url.rstrip('/')}/chat/completions"
        response = self._post_json(
            url,
            body,
            headers={"Authorization": f"Bearer {self._api_key}"},
        )
        choices = response.get("choices")
        if not isinstance(choices, list) or not choices:
            raise AdapterError("OpenAI response missing choices.")
        first = choices[0]
        if not isinstance(first, dict):
            raise AdapterError("OpenAI response choice invalid.")
        message = first.get("message")
        if not isinstance(message, dict):
            raise AdapterError("OpenAI response missing message.")
        content = message.get("content")
        if not isinstance(content, str):
            raise AdapterError("OpenAI response missing content.")
        return {"text": content, "raw": response}

    def generate_draft(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._chat(payload)

    def critique(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._chat(payload)

    def rewrite(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._chat(payload)


__all__ = [
    "AdapterConfig",
    "AdapterError",
    "BaseAdapter",
    "OllamaAdapter",
    "OpenAIAdapter",
    "ProviderCapabilities",
]
