"""Provider adapter stubs for model-backed tasks."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any
from urllib import request as url_request
from urllib.error import URLError, HTTPError

LOGGER = logging.getLogger(__name__)


class AdapterError(RuntimeError):
    """Raised when adapter calls fail."""


def _strip_reasoning_leadin(text: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        return cleaned
    raw_lines = [line.rstrip() for line in cleaned.splitlines()]
    if not raw_lines:
        return cleaned
    first = raw_lines[0].strip().lower()
    leadins = (
        "thinking:",
        "thoughts:",
        "analysis:",
        "okay",
        "sure",
        "let's",
        "first,",
        "plan:",
        "the user",
        "i will",
        "i'll",
        "we need",
        "i need",
    )
    if (any(first.startswith(prefix) for prefix in leadins) or "the user" in first) and len(
        raw_lines[0]
    ) < 180 and len(raw_lines) > 1:
        raw_lines = raw_lines[1:]
    return "\n".join(raw_lines).strip() or cleaned


def normalize_ollama_payload(
    response: dict[str, Any] | None,
) -> tuple[str | None, bool, str | None]:
    if not isinstance(response, dict):
        return None, False, None
    raw_payload = response.get("raw") if isinstance(response.get("raw"), dict) else response
    if not isinstance(raw_payload, dict):
        return None, False, None
    candidate = raw_payload.get("response")
    if isinstance(candidate, str) and candidate.strip():
        return candidate.strip(), False, "response"
    message = raw_payload.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str) and content.strip():
            return content.strip(), False, "message.content"
    output_text = raw_payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip(), False, "output_text"
    text = raw_payload.get("text")
    if isinstance(text, str) and text.strip():
        return text.strip(), False, "text"
    choices = raw_payload.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0]
        if isinstance(first, dict):
            choice_message = first.get("message")
            if isinstance(choice_message, dict):
                content = choice_message.get("content")
                if isinstance(content, str) and content.strip():
                    return content.strip(), False, "choices.message.content"
    data = raw_payload.get("data")
    if isinstance(data, dict):
        data_response = data.get("response")
        if isinstance(data_response, str) and data_response.strip():
            return data_response.strip(), False, "data.response"
        data_message = data.get("message")
        if isinstance(data_message, dict):
            content = data_message.get("content")
            if isinstance(content, str) and content.strip():
                return content.strip(), False, "data.message.content"
        data_output = data.get("output_text")
        if isinstance(data_output, str) and data_output.strip():
            return data_output.strip(), False, "data.output_text"
    thinking = raw_payload.get("thinking")
    if isinstance(thinking, str) and thinking.strip():
        return _strip_reasoning_leadin(thinking), True, "thinking"
    return None, False, None


@dataclass(frozen=True)
class AdapterConfig:
    base_url: str
    model: str
    timeout_seconds: float = 2.0


class BaseAdapter:
    provider_name: str = "unknown"

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

    def generate_draft(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    def critique(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    def rewrite(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError


class OllamaAdapter(BaseAdapter):
    """Minimal Ollama adapter placeholder."""

    provider_name = "ollama"

    def health_check(self) -> bool:
        url = f"{self.config.base_url.rstrip('/')}/api/tags"
        try:
            req = url_request.Request(url, method="GET")
            with url_request.urlopen(req, timeout=self.config.timeout_seconds) as response:
                return response.status == 200
        except (URLError, HTTPError, OSError) as exc:
            LOGGER.debug("Ollama health check failed: %s", exc)
            return False

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

    def __init__(self, config: AdapterConfig, *, api_key: str | None) -> None:
        super().__init__(config)
        self._api_key = api_key

    def health_check(self) -> bool:
        return bool(self._api_key)

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
    "normalize_ollama_payload",
]
