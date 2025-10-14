"""Lightweight YAML loader and dumper compatible with PyYAML's safe API."""

from __future__ import annotations

from dataclasses import dataclass
import ast
import json
import re
from typing import Any, Iterator, Sequence

__all__ = ["YAMLError", "safe_dump", "safe_load", "safe_load_all"]


class YAMLError(RuntimeError):
    """Base error raised for YAML parsing problems."""


@dataclass(slots=True)
class _Token:
    """Representation of a parsed YAML line with indentation metadata."""

    indent: int
    content: str
    line_no: int


_NUMBER_RE = re.compile(r"^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?$")
_BOOLEAN_VALUES = {"true": True, "false": False}
_NULL_VALUES = {"null", "none", "~", ""}


def safe_dump(
    data: Any,
    *,
    sort_keys: bool = False,
    allow_unicode: bool = True,
    indent: int = 2,
) -> str:
    """Serialize ``data`` to a YAML string.

    The implementation emits JSON, which is a compatible subset of YAML 1.2.
    A trailing newline is ensured to match PyYAML's default behaviour.
    """

    separators: tuple[str, str]
    if indent is None or indent <= 0:
        separators = (",", ":")
        json_indent = None
    else:
        separators = (",", ": ")
        json_indent = indent

    serialized = json.dumps(
        data,
        sort_keys=sort_keys,
        ensure_ascii=not allow_unicode,
        indent=json_indent,
        separators=separators,
    )
    if not serialized.endswith("\n"):
        serialized = f"{serialized}\n"
    return serialized


def _ensure_text(document: str | Any) -> str:
    if hasattr(document, "read"):
        value = document.read()
        if isinstance(value, bytes):
            return value.decode("utf-8")
        return value if isinstance(value, str) else str(value)
    if isinstance(document, bytes):
        return document.decode("utf-8")
    return str(document)


def safe_load(document: str | Any) -> Any:
    """Parse ``document`` and return the corresponding Python value."""

    text = _ensure_text(document)
    stripped = text.strip()
    if not stripped:
        return None

    if stripped.startswith(("{", "[")):
        try:
            return json.loads(stripped)
        except json.JSONDecodeError as exc:  # pragma: no cover - defensive guard
            raise YAMLError("Invalid JSON payload") from exc

    tokens = _tokenize(text)
    if not tokens:
        return None

    parser = _Parser(tokens)
    value = parser.parse(tokens[0].indent)
    parser.ensure_consumed()
    return value


def safe_load_all(document: str | Any) -> Iterator[Any]:
    """Yield documents parsed from a multi-document YAML string."""

    text = _ensure_text(document)
    segments = re.split(r"(?m)^\s*---\s*$", text)
    for segment in segments:
        text = segment.strip()
        if not text:
            continue
        yield safe_load(text)


def _tokenize(document: str) -> list[_Token]:
    tokens: list[_Token] = []
    for line_no, raw in enumerate(document.splitlines(), start=1):
        if "\t" in raw:
            msg = "Tabs are not supported in YAML indentation"
            raise YAMLError(f"{msg} (line {line_no})")
        stripped = raw.rstrip()
        if not stripped:
            continue
        indent = len(stripped) - len(stripped.lstrip(" "))
        content = stripped.lstrip()
        if not content or content.startswith("#"):
            continue
        tokens.append(_Token(indent=indent, content=content, line_no=line_no))
    return tokens


class _Parser:
    """Recursive-descent parser for a small YAML subset used in tests."""

    def __init__(self, tokens: Sequence[_Token]) -> None:
        self._tokens = list(tokens)
        self._index = 0

    def ensure_consumed(self) -> None:
        if self._index != len(self._tokens):
            token = self._tokens[self._index]
            msg = f"Unexpected trailing content at line {token.line_no}"
            raise YAMLError(msg)

    def parse(self, indent: int) -> Any:
        token = self._current()
        if token.indent != indent:
            msg = f"Unexpected indentation at line {token.line_no}"
            raise YAMLError(msg)

        if token.content.startswith("- "):
            return self._parse_list(indent)

        if token.content.startswith(("{", "[")):
            self._index += 1
            return self._parse_scalar(token.content, token)

        if _is_mapping_entry(token.content):
            return self._parse_mapping(indent)

        self._index += 1
        return self._parse_scalar(token.content, token)

    def _parse_mapping(self, indent: int) -> dict[str, Any]:
        result: dict[str, Any] = {}
        while not self._finished():
            token = self._current()
            if token.indent < indent or token.content.startswith("- "):
                break
            if token.indent != indent:
                msg = f"Unexpected indentation at line {token.line_no}"
                raise YAMLError(msg)

            key, value_text = _split_mapping_entry(token)
            self._index += 1
            if value_text is None:
                value = self._parse_nested(indent)
            else:
                value = self._parse_scalar(value_text, token)
                if not self._finished() and self._current().indent > indent:
                    nested = self._parse_nested(indent)
                    value = _merge_inline_value(value, nested, token)
            result[key] = value
        return result

    def _parse_list(self, indent: int) -> list[Any]:
        items: list[Any] = []
        while not self._finished():
            token = self._current()
            if token.indent != indent or not token.content.startswith("- "):
                break
            rest = token.content[2:].strip()
            self._index += 1

            if not rest:
                items.append(self._parse_nested(indent))
                continue

            if rest.endswith(":"):
                key = rest[:-1].strip()
                if not key:
                    msg = f"Invalid list mapping key at line {token.line_no}"
                    raise YAMLError(msg)
                value = self._parse_nested(indent)
                items.append({key: value})
                continue

            if ":" in rest and not rest.startswith(("{", "[")):
                key, value_text = rest.split(":", 1)
                key = key.strip()
                value = self._parse_scalar(value_text.strip(), token)
                if not key:
                    msg = f"Invalid list mapping key at line {token.line_no}"
                    raise YAMLError(msg)
                nested_mapping: dict[str, Any] | None = None
                if not self._finished() and self._current().indent > indent:
                    nested = self._parse_nested(indent)
                    if not isinstance(nested, dict):
                        msg = f"Expected mapping continuation at line {token.line_no}"
                        raise YAMLError(msg)
                    nested_mapping = dict(nested)
                item_dict: dict[str, Any] = {key: value}
                if nested_mapping:
                    for nested_key, nested_value in nested_mapping.items():
                        if nested_key in item_dict:
                            continue
                        item_dict[nested_key] = nested_value
                items.append(item_dict)
                continue

            scalar = self._parse_scalar(rest, token)
            if not self._finished() and self._current().indent > indent:
                msg = f"Unexpected nested block for scalar list item at line {token.line_no}"
                raise YAMLError(msg)
            items.append(scalar)
        return items

    def _parse_nested(self, parent_indent: int) -> Any:
        if self._finished():
            raise YAMLError("Expected indented block, found end of document")
        next_token = self._current()
        if next_token.indent <= parent_indent:
            msg = f"Expected indented block at line {next_token.line_no}"
            raise YAMLError(msg)
        return self.parse(next_token.indent)

    def _parse_scalar(self, text: str, token: _Token) -> Any:
        candidate = text.strip()
        lowered = candidate.lower()
        if lowered in _BOOLEAN_VALUES:
            return _BOOLEAN_VALUES[lowered]
        if lowered in _NULL_VALUES:
            return None
        if _NUMBER_RE.match(candidate):
            if any(ch in candidate for ch in (".", "e", "E")):
                return float(candidate)
            return int(candidate)
        if candidate.startswith(("'", '"', "[", "{", "(")) and candidate.endswith(
            ("'", '"', "]", "}", ")")
        ):
            try:
                return ast.literal_eval(candidate)
            except (SyntaxError, ValueError) as exc:  # pragma: no cover - defensive
                raise YAMLError(f"Invalid scalar at line {token.line_no}") from exc
        return candidate

    def _current(self) -> _Token:
        return self._tokens[self._index]

    def _finished(self) -> bool:
        return self._index >= len(self._tokens)


def _split_mapping_entry(token: _Token) -> tuple[str, str | None]:
    if ":" not in token.content:
        msg = f"Expected ':' in mapping entry at line {token.line_no}"
        raise YAMLError(msg)
    key_text, value_text = token.content.split(":", 1)
    key = key_text.strip()
    if not key:
        msg = f"Missing mapping key at line {token.line_no}"
        raise YAMLError(msg)
    value = value_text.strip()
    return key, value if value else None


def _merge_inline_value(value: Any, nested: Any, token: _Token) -> Any:
    if isinstance(value, dict) and isinstance(nested, dict):
        merged = dict(value)
        merged.update(nested)
        return merged
    if isinstance(value, list) and isinstance(nested, list):
        return [*value, *nested]
    msg = f"Unsupported inline value continuation at line {token.line_no}"
    raise YAMLError(msg)


def _is_mapping_entry(content: str) -> bool:
    if content.startswith(("{", "[")):
        return False
    if content.endswith(":"):
        return True
    return ": " in content or ":\t" in content
