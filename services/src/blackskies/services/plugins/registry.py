"""Plugin registry handling manifest storage and sandbox execution."""

from __future__ import annotations

import json
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
            manifest = dict(manifest)
            manifest.setdefault("module_path", str(dest))

        manifest_path = plugin_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

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
        return launch_plugin(
            manifest_path=record.manifest_path,
            request_payload=request,
            python_executable=self._python or manifest.get("python_executable") or sys.executable,
        )

    def _get_plugin(self, plugin_id: str) -> PluginRecord:
        for record in self.list_plugins():
            if record.plugin_id == plugin_id:
                return record
        raise PluginExecutionError(f"Plugin '{plugin_id}' is not installed.")


__all__ = ["PluginRegistry", "PluginRecord"]
