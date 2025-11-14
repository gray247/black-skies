from __future__ import annotations

from pathlib import Path

import pytest

from blackskies.services import cache


def test_cache_roundtrip(tmp_path: Path) -> None:
    project_root = tmp_path / "proj"
    project_root.mkdir()
    key = cache.make_cache_key(prompt="Generate outline", params={"acts": 3})
    assert len(key) == 64
    assert cache.load_cache(project_root, key) is None

    cache_path = cache.store_cache(project_root, key, {"outline": "cached"})
    assert "history" in str(cache_path)
    assert "cache" in str(cache_path)
    assert "_runtime" not in str(cache_path)
    retrieved = cache.load_cache(project_root, key)
    assert retrieved == {"outline": "cached"}


def test_cache_key_deterministic(tmp_path: Path) -> None:
    project_root = tmp_path / "proj"
    project_root.mkdir()
    params = {"acts": 3, "chapters": [1, 2, 3]}
    key1 = cache.make_cache_key(prompt="Outline", params=params)
    key2 = cache.make_cache_key(prompt="Outline", params=dict(params))
    assert key1 == key2
