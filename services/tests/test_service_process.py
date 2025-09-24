import http.client
import json
import os
import socket
import subprocess
import sys
import time
from collections.abc import Iterator
from urllib.parse import urlparse

import pytest

from blackskies.services.__main__ import MAX_PORT, MIN_PORT


def _find_available_port() -> int:
    host = "127.0.0.1"
    for port in range(MIN_PORT, MAX_PORT + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((host, port))
            except OSError:
                continue
            return port
    raise RuntimeError("No free ports available in allowed range")


def _wait_for_health(port: int, timeout: float = 10.0) -> dict[str, str]:
    deadline = time.time() + timeout
    parsed_url = urlparse(f"http://127.0.0.1:{port}/health")
    last_error: Exception | None = None

    while time.time() < deadline:
        try:
            connection = http.client.HTTPConnection(parsed_url.hostname, parsed_url.port, timeout=1.0)
            connection.request("GET", parsed_url.path or "/")
            response = connection.getresponse()
            payload = response.read()
            connection.close()
        except OSError as exc:  # pragma: no cover - diagnostic aid
            last_error = exc
            time.sleep(0.25)
            continue

        if response.status == 200:
            try:
                return json.loads(payload.decode("utf-8"))
            except json.JSONDecodeError as exc:  # pragma: no cover - defensive guard
                last_error = exc
        time.sleep(0.25)

    message = "Service did not become healthy before timeout"
    if last_error is not None:
        message = f"{message}: {last_error}"
    raise AssertionError(message)


@pytest.fixture()
def service_process() -> Iterator[tuple[subprocess.Popen[str], int]]:
    port = _find_available_port()
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    process = subprocess.Popen(
        [sys.executable, "-m", "blackskies.services", "--port", str(port)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
    )

    try:
        yield process, port
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


def test_service_health_endpoint_process_launch(
    service_process: tuple[subprocess.Popen[str], int],
) -> None:
    process, port = service_process
    payload = _wait_for_health(port)
    assert payload["status"] == "ok"
    assert "version" in payload
    assert process.poll() is None
