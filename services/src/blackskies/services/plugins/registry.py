"""Plugin registry handling manifest storage and sandbox execution."""

from __future__ import annotations

import json
import os
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List

from .host import PluginExecutionError, launch_plugin


@dataclass(slots=True)
class PluginRecord:
    """Metadata describing an installed plugin."""

    plugin_id: str
    manifest_path: Path
    enabled: bool = True


_PLUGIN_ID_RE = re.compile(r"^[a-z0-9](?:[a-z0-9_\-]{0,63})$", re.IGNORECASE)
_SAFE_ENV_VARS = (
    "PATH",
    "PATHEXT",
    "SYSTEMROOT",
    "WINDIR",
    "COMSPEC",
    "HOME",
    "USERPROFILE",
    "TMP",
    "TEMP",
    "PYTHONPATH",
)
_ALLOWED_MANIFEST_KEYS = {"entrypoint", "module_path", "metadata"}


class PluginRegistry:
    """Manage plugin manifests, state, and sandboxed execution."""

    def __init__(self, *, base_dir: Path, python_executable: str | None = None) -> None:
        self._base_dir = base_dir
        self._base_dir.mkdir(parents=True, exist_ok=True)
        self._python = python_executable

    def install(
        self,
        *,
        plugin_id: str,
        manifest: Dict[str, Any],
        source_path: Path | None = None,
    ) -> PluginRecord:
        """Install or update a plugin manifest."""

        self._validate_plugin_id(plugin_id)
        plugin_dir = self._base_dir / plugin_id
        plugin_dir.mkdir(parents=True, exist_ok=True)

        if source_path:
            dest = plugin_dir / source_path.name
            if source_path.is_dir():
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(source_path, dest)
            else:
                shutil.copy2(source_path, dest)
                dest = plugin_dir  # module lives in plugin dir root
            manifest = dict(manifest)
            manifest["module_path"] = str(dest)

        manifest_path = plugin_dir / "manifest.json"
        sanitised_manifest = self._sanitise_manifest(manifest, plugin_dir)
        manifest_path.write_text(json.dumps(sanitised_manifest, indent=2), encoding="utf-8")

        state_path = plugin_dir / "state.json"
        state = {"enabled": True}
        state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        return PluginRecord(plugin_id=plugin_id, manifest_path=manifest_path, enabled=True)

    def list_plugins(self) -> List[PluginRecord]:
        """Return metadata for installed plugins."""

        records: List[PluginRecord] = []
        if not self._base_dir.exists():
            return records

        for entry in self._base_dir.iterdir():
            if not entry.is_dir():
                continue
            manifest_path = entry / "manifest.json"
            if not manifest_path.exists():
                continue
            state_path = entry / "state.json"
            enabled = True
            if state_path.exists():
                try:
                    enabled = bool(json.loads(state_path.read_text(encoding="utf-8")).get("enabled", True))
                except json.JSONDecodeError:
                    enabled = True
            records.append(PluginRecord(plugin_id=entry.name, manifest_path=manifest_path, enabled=enabled))
        return records

    def set_enabled(self, plugin_id: str, enabled: bool) -> None:
        plugin_dir = self._base_dir / plugin_id
        state_path = plugin_dir / "state.json"
        state = {"enabled": enabled}
        state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

    def execute(self, plugin_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a plugin inside the sandbox runner and return its response."""

        record = self._get_plugin(plugin_id)
        if not record.enabled:
            raise PluginExecutionError(f"Plugin '{plugin_id}' is disabled.")

        manifest = json.loads(record.manifest_path.read_text(encoding="utf-8"))
        plugin_dir = record.manifest_path.parent
        env = self._build_runner_env(plugin_dir=plugin_dir, plugin_id=plugin_id, manifest=manifest)
        return launch_plugin(
            manifest_path=record.manifest_path,
            request_payload=request,
            python_executable=self._python or sys.executable,
            env=env,
        )

    def _get_plugin(self, plugin_id: str) -> PluginRecord:
        for record in self.list_plugins():
            if record.plugin_id == plugin_id:
                return record
        raise PluginExecutionError(f"Plugin '{plugin_id}' is not installed.")

    def _validate_plugin_id(self, plugin_id: str) -> None:
        if not _PLUGIN_ID_RE.match(plugin_id):
            raise ValueError("Plugin ID must be alphanumeric with dashes/underscores (max 64 chars).")

    def _sanitise_manifest(self, manifest: Dict[str, Any], plugin_dir: Path) -> Dict[str, Any]:
        unknown_keys = set(manifest.keys()) - _ALLOWED_MANIFEST_KEYS
        if unknown_keys:
            raise ValueError(f"Unsupported manifest keys: {', '.join(sorted(unknown_keys))}")

        entrypoint = manifest.get("entrypoint")
        if not isinstance(entrypoint, str) or not entrypoint.strip():
            raise ValueError("Plugin manifest must define a non-empty 'entrypoint'.")

        module_path = manifest.get("module_path")
        if module_path is None:
            module_path = str(plugin_dir)
        elif not isinstance(module_path, str):
            raise ValueError("Plugin manifest 'module_path' must be a string.")
        module_path_resolved = self._resolve_module_path(plugin_dir, module_path)

        metadata = manifest.get("metadata")
        if metadata is not None and not isinstance(metadata, dict):
            raise ValueError("Plugin manifest 'metadata' must be an object.")

        sanitised: Dict[str, Any] = {
            "entrypoint": entrypoint.strip(),
            "module_path": module_path_resolved,
        }
        if metadata is not None:
            sanitised["metadata"] = metadata
        return sanitised

    def _resolve_module_path(self, plugin_dir: Path, module_path: str) -> str:
        base = plugin_dir.resolve()
        candidate = Path(module_path)
        if not candidate.is_absolute():
            candidate = (plugin_dir / candidate).resolve()
        else:
            candidate = candidate.resolve()
        try:
            candidate.relative_to(base)
        except ValueError as exc:  # pragma: no cover - defensive
            raise ValueError("Plugin module_path must be within the plugin directory.") from exc
        if not candidate.exists():
            raise ValueError("Plugin module_path must exist within the plugin directory.")
        return str(candidate)

    def _build_runner_env(self, *, plugin_dir: Path, plugin_id: str, manifest: Dict[str, Any]) -> Dict[str, str]:
        env: Dict[str, str] = {}
        for key in _SAFE_ENV_VARS:
            value = os.environ.get(key)
            if value:
                env[key] = value

        module_path = manifest.get("module_path")
        if isinstance(module_path, str):
            existing = env.get("PYTHONPATH")
            env["PYTHONPATH"] = os.pathsep.join(filter(None, [module_path, existing]))
        env["BLACKSKIES_PLUGIN_ID"] = plugin_id
        env["BLACKSKIES_PLUGIN_DIR"] = str(plugin_dir)
        return env


__all__ = ["PluginRegistry", "PluginRecord"]
