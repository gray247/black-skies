#!/usr/bin/env python3
"""Check staged or tracked files for repo hygiene violations."""

from __future__ import annotations

import argparse
import fnmatch
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Rule:
    pattern: str
    label: str


BANNED_RULES: tuple[Rule, ...] = (
    Rule("playwright-report/**", "Playwright report"),
    Rule("test-results/**", "Playwright test results"),
    Rule("app/playwright-report/**", "App Playwright report"),
    Rule("app/test-results/**", "App Playwright test results"),
    Rule("app/dist/**", "App build output"),
    Rule("app/dist-electron/**", "Electron build output"),
    Rule(".hypothesis/**", "Hypothesis cache"),
    Rule("*.bak", "Backup file"),
    Rule("*.bak*", "Backup file variant"),
    Rule("*.tmp", "Temporary file"),
    Rule("*.log", "Log file"),
    Rule(".aider*", "Aider local state"),
    Rule(".codex*", "Codex local state"),
    Rule("sample_project/**/.snapshots/**", "Generated sample_project snapshot"),
    Rule("archive/**/.snapshots/**", "Archived snapshot fixture"),
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check tracked or staged repository paths for banned artifacts."
    )
    scope = parser.add_mutually_exclusive_group()
    scope.add_argument(
        "--staged",
        action="store_true",
        help="Inspect staged paths only (for pre-commit hooks).",
    )
    scope.add_argument(
        "--tracked",
        action="store_true",
        help="Inspect all tracked paths (default).",
    )
    return parser.parse_args(argv)


def git_output(*args: str) -> list[str]:
    result = subprocess.run(
        ["git", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    output = result.stdout.strip("\0\n\r ")
    if not output:
        return []
    return [entry for entry in result.stdout.split("\0") if entry]


def normalize(path: str) -> str:
    return path.replace("\\", "/")


def load_paths(scope: str) -> list[str]:
    if scope == "staged":
        return [
            normalize(path)
            for path in git_output("diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR")
        ]
    return [normalize(path) for path in git_output("ls-files", "-z")]


def classify(paths: list[str]) -> list[tuple[str, Rule]]:
    matches: list[tuple[str, Rule]] = []
    for path in paths:
        for rule in BANNED_RULES:
            if fnmatch.fnmatchcase(path, rule.pattern):
                matches.append((path, rule))
                break
    return matches


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    scope = "staged" if args.staged else "tracked"

    try:
        paths = load_paths(scope)
    except subprocess.CalledProcessError as exc:
        print(f"Failed to query git {scope} paths: {exc}", file=sys.stderr)
        return exc.returncode or 1

    violations = classify(paths)
    if not violations:
        print(f"Repo hygiene check passed for {scope} paths.")
        return 0

    print(f"Repo hygiene violations detected in {scope} paths:")
    for path, rule in violations:
        print(f"  - {path}  [matched: {rule.pattern} | {rule.label}]")
    print(
        "Remove the artifact from the staged set or generated tree before committing.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
