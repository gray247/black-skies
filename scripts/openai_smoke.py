"""Minimal smoke test for the configured OpenAI/OpenAI-compatible provider path."""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any
from urllib import error as url_error
from urllib import request as url_request

from blackskies.services.config import ServiceSettings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smoke test the configured provider path.")
    parser.add_argument(
        "--base-url",
        default=None,
        help="Optional explicit override for the provider base URL.",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Optional explicit override for the model name.",
    )
    parser.add_argument(
        "--api-key-env",
        default=None,
        help="Optional environment variable name to read the API key override from.",
    )
    return parser.parse_args()


def classify_base_url(base_url: str) -> str:
    normalized = base_url.rstrip("/").lower()
    if normalized.startswith("https://api.openai.com/v1"):
        return "REAL OPENAI API"
    return "LOCAL COMPATIBLE ENDPOINT"


def classify_exception(exc: Exception) -> tuple[str, str]:
    if isinstance(exc, url_error.HTTPError):
        if exc.code == 401:
            return "AUTH/CONFIG ISSUE", f"HTTP {exc.code}: Unauthorized"
        if exc.code == 429:
            return "QUOTA/BILLING ISSUE", f"HTTP {exc.code}: Too Many Requests"
        detail = exc.read().decode("utf-8", errors="replace")
        return "MODEL/FORMAT ISSUE", f"HTTP {exc.code}: {detail}"
    if isinstance(exc, url_error.URLError):
        return "NETWORK OR ENDPOINT ISSUE", str(exc.reason)
    if isinstance(exc, TimeoutError):
        return "NETWORK OR ENDPOINT ISSUE", str(exc)
    return "MODEL/FORMAT ISSUE", str(exc)


def post_chat_completion(*, base_url: str, api_key: str, model: str) -> dict[str, Any]:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Reply with one short sentence only."},
            {"role": "user", "content": "Say hello from the smoke test."},
        ],
        "temperature": 0,
        "max_tokens": 24,
    }
    request = url_request.Request(
        f"{base_url.rstrip('/')}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    with url_request.urlopen(request, timeout=30) as response:
        body = response.read().decode("utf-8")
    decoded = json.loads(body)
    if not isinstance(decoded, dict):
        raise RuntimeError("Non-object JSON response")
    return decoded


def extract_text(payload: dict[str, Any]) -> str:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError(f"Invalid completion payload: {json.dumps(payload)[:400]}")
    first = choices[0]
    if not isinstance(first, dict):
        raise RuntimeError(f"Invalid completion choice: {json.dumps(first)[:200]}")
    message = first.get("message")
    if not isinstance(message, dict):
        raise RuntimeError(f"Invalid completion message: {json.dumps(first)[:200]}")
    content = message.get("content")
    if isinstance(content, str):
        return content.strip()
    raise RuntimeError(f"Missing text content: {json.dumps(message)[:200]}")


def main() -> int:
    args = parse_args()
    settings = ServiceSettings.from_environment()

    api_key = settings.openai_api_key
    if args.api_key_env:
        api_key = os.environ.get(args.api_key_env)

    base_url = args.base_url or settings.openai_base_url
    model = args.model or settings.openai_model

    provider_type = classify_base_url(base_url)
    print(f"PROVIDER TYPE: {provider_type}")
    print(f"RESOLVED BASE URL: {base_url}")
    print(f"RESOLVED MODEL: {model}")

    if not api_key:
        print("SMOKE RESULT: FAILED")
        print("CLASSIFICATION: AUTH/CONFIG ISSUE")
        print("DETAIL: No API key resolved for the smoke test.")
        return 1

    try:
        payload = post_chat_completion(base_url=base_url, api_key=api_key, model=model)
        text = extract_text(payload)
        print("SMOKE RESULT: SUCCESS")
        print(f"OUTPUT: {text}")
        return 0
    except Exception as exc:  # noqa: BLE001
        classification, detail = classify_exception(exc)
        print("SMOKE RESULT: FAILED")
        print(f"CLASSIFICATION: {classification}")
        print(f"DETAIL: {detail}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
