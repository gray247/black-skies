from __future__ import annotations

from black_skies import cache


def test_cache_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "CACHE_ROOT", tmp_path, raising=False)
    key = cache.make_cache_key(prompt="Generate outline", params={"acts": 3})
    assert len(key) == 64
    assert cache.load_cache(key) is None

    cache.store_cache(key, {"outline": "cached"})
    retrieved = cache.load_cache(key)
    assert retrieved == {"outline": "cached"}


def test_cache_key_deterministic(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "CACHE_ROOT", tmp_path, raising=False)
    params = {"acts": 3, "chapters": [1, 2, 3]}
    key1 = cache.make_cache_key(prompt="Outline", params=params)
    key2 = cache.make_cache_key(prompt="Outline", params=dict(params))
    assert key1 == key2
