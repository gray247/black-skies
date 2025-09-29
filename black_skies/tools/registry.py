"""Tool permission registry backed by project metadata and checklist defaults."""

from __future__ import annotations

import json
import logging
import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping, MutableMapping, Optional

from .. import runs

logger = logging.getLogger("black_skies.tool_registry")

_CHECKLIST_FILENAME = "decision_checklist.md"
_DEFAULT_CHECKLIST_PATH = Path(__file__).resolve().parents[1] / "docs" / _CHECKLIST_FILENAME
_NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


@dataclass(frozen=True, slots=True)
class ToolDecision:
    """Structured outcome of a registry permission check."""

    tool: str
    allowed: bool
    source: str
    reason: str
    checklist_item: str | None = None
    checklist_slug: str | None = None


# Mapping of tool identifiers to the checklist item that governs their defaults.
# Values intentionally mirror the human-readable text inside ``docs/decision_checklist.md``.
_TOOL_CHECKLIST_LABELS: Mapping[str, str] = {
    "file_store": "Convert raw bullets into scene cards (sc-001, sc-002…)",
    "markdown_search": "Suggest scene order (chronological vs. shuffled/flashbacks)",
    "summarizer": "Pacing critique (where to slow/speed)",
    "template_renderer": "Auto-add expansion suggestions to scene cards (toggle)",
}


_TOOL_ALIASES: Mapping[str, str] = {
    "file-store": "file_store",
    "file_store_tool": "file_store",
    "markdown_search_tool": "markdown_search",
    "search": "markdown_search",
    "summarizer_tool": "summarizer",
    "template_renderer_tool": "template_renderer",
    "template": "template_renderer",
}


def _slugify(value: str) -> str:
    """Return a normalized slug suitable for dictionary lookups."""

    normalized = unicodedata.normalize("NFKD", value)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    normalized = normalized.replace("'", "")
    normalized = _NON_ALNUM_RE.sub("_", normalized)
    return normalized.strip("_")


@lru_cache(maxsize=4)
def _load_checklist_index(checklist_path: str) -> Dict[str, Dict[str, str | bool]]:
    """Parse the decision checklist and index entries by slug."""

    path = Path(checklist_path)
    if not path.exists():  # pragma: no cover - defensive guard
        raise FileNotFoundError(f"Decision checklist not found at {path}")

    index: Dict[str, Dict[str, str | bool]] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line.startswith("- ["):
            continue
        try:
            marker_end = line.index("]")
        except ValueError:  # pragma: no cover - malformed data guard
            continue
        tag = line[3:marker_end]
        if tag not in {"AI", "H"}:
            continue
        content = line[marker_end + 1 :].strip()
        if "→" in content:
            content = content.split("→", 1)[0].strip()
        slug = _slugify(content)
        if not slug:
            continue
        index[slug] = {
            "text": content,
            "ai": tag == "AI",
        }
    return index


def _normalize_tool_name(name: str) -> str:
    candidate = _slugify(name)
    if candidate.endswith("_tool"):
        candidate = candidate[: -len("_tool")]
    return _TOOL_ALIASES.get(candidate, candidate)


def _lower_set(items: Iterable[str]) -> set[str]:
    return {_normalize_tool_name(item) for item in items}


class ToolRegistry:
    """Central registry for checking whether a tool invocation is permitted."""

    def __init__(
        self,
        *,
        project_metadata: Mapping[str, Any] | None = None,
        project_path: Path | None = None,
        checklist_path: Path | None = None,
    ) -> None:
        if project_metadata is None:
            if project_path is None:
                raise ValueError("project_metadata or project_path must be provided")
            project_metadata = self._load_project_metadata(project_path)
        self._project_metadata: Mapping[str, Any] = project_metadata
        self._project_id: str | None = project_metadata.get("project_id")

        tools_config: Mapping[str, Any] = project_metadata.get("tools", {})
        allow = tools_config.get("allow", [])
        deny = tools_config.get("deny", [])
        self._allow_all = "*" in allow
        self._deny_all = "*" in deny
        self._allow_overrides = _lower_set(allow)
        self._deny_overrides = _lower_set(deny)

        checklist_source = checklist_path or _DEFAULT_CHECKLIST_PATH
        self._checklist_index = _load_checklist_index(str(checklist_source))
        self._tool_checklist_slugs = {
            tool: _slugify(label) for tool, label in _TOOL_CHECKLIST_LABELS.items()
        }

    @staticmethod
    def _load_project_metadata(project_path: Path) -> Mapping[str, Any]:
        path = project_path
        if path.is_dir():
            path = path / "project.json"
        if not path.exists():  # pragma: no cover - defensive guard
            raise FileNotFoundError(f"Project metadata not found at {path}")
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    @property
    def project_id(self) -> str | None:
        return self._project_id

    def canonical_name(self, tool_name: str) -> str:
        return _normalize_tool_name(tool_name)

    def _default_decision(self, tool: str, checklist_item: str | None) -> ToolDecision:
        slug: Optional[str]
        label: Optional[str]
        if checklist_item:
            slug = _slugify(checklist_item)
            label = self._checklist_index.get(slug, {}).get("text")
        else:
            slug = self._tool_checklist_slugs.get(tool)
            label = self._checklist_index.get(slug, {}).get("text") if slug else None

        if slug and slug in self._checklist_index:
            is_ai = bool(self._checklist_index[slug]["ai"])
            if is_ai:
                return ToolDecision(
                    tool=tool,
                    allowed=True,
                    source="checklist.ai",
                    reason="Checklist item marked AI-recommendable",
                    checklist_item=label,
                    checklist_slug=slug,
                )
            return ToolDecision(
                tool=tool,
                allowed=False,
                source="checklist.human",
                reason="Checklist item requires human decision",
                checklist_item=label,
                checklist_slug=slug,
            )
        return ToolDecision(
            tool=tool,
            allowed=False,
            source="checklist.unknown",
            reason="No checklist entry found; defaulting to deny",
            checklist_item=label,
            checklist_slug=slug,
        )

    def check_permission(
        self,
        tool_name: str,
        *,
        run_id: str,
        checklist_item: str | None = None,
        metadata: Mapping[str, Any] | None = None,
    ) -> ToolDecision:
        """Return whether the requested tool may be invoked and record the decision."""

        tool = self.canonical_name(tool_name)
        decision = self._default_decision(tool, checklist_item)

        if self._deny_all or tool in self._deny_overrides:
            decision = ToolDecision(
                tool=tool,
                allowed=False,
                source="project.deny",
                reason="Project configuration denies this tool",
                checklist_item=decision.checklist_item,
                checklist_slug=decision.checklist_slug,
            )
        elif self._allow_all or tool in self._allow_overrides:
            decision = ToolDecision(
                tool=tool,
                allowed=True,
                source="project.allow",
                reason="Project configuration allows this tool",
                checklist_item=decision.checklist_item,
                checklist_slug=decision.checklist_slug,
            )

        payload: MutableMapping[str, Any] = {
            "tool": tool,
            "requested_name": tool_name,
            "allowed": decision.allowed,
            "source": decision.source,
            "reason": decision.reason,
        }
        if self._project_id:
            payload["project_id"] = self._project_id
        if decision.checklist_slug:
            payload["checklist_slug"] = decision.checklist_slug
        if decision.checklist_item:
            payload["checklist_item"] = decision.checklist_item
        if metadata:
            payload["context"] = dict(metadata)

        event_type = "tool.approved" if decision.allowed else "tool.denied"
        runs.append_event(run_id, event_type, dict(payload))

        if not decision.allowed:
            logger.warning(
                "tool.denied",
                extra={"extra_payload": payload},
            )
        else:
            logger.info(
                "tool.approved",
                extra={"extra_payload": payload},
            )

        return decision


__all__ = ["ToolDecision", "ToolRegistry"]
