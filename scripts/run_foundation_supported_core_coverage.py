#!/usr/bin/env python3
"""Run the governed Python supported-core coverage denominator fail-closed."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import xml.etree.ElementTree as element_tree
from datetime import UTC, datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs" / "testing" / "foundation_supported_core_coverage.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", required=True, type=Path)
    parser.add_argument("--basetemp", required=True, type=Path)
    return parser.parse_args()


def git_head() -> str:
    return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()


def main() -> int:
    args = parse_args()
    if sys.version_info[:2] != (3, 11):
        raise RuntimeError(
            f"Supported-core coverage requires Python 3.11 exactly; received {sys.version.split()[0]}."
        )
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("schema") != "black-skies.foundation-supported-core-coverage.v1":
        raise RuntimeError("Supported-core coverage manifest schema is invalid.")
    minimum = manifest.get("minimumBranchCoverage")
    included = manifest.get("included")
    if minimum != 60 or not isinstance(included, list) or not included:
        raise RuntimeError("Supported-core coverage policy is incomplete.")
    modules = [entry.get("pythonModule") for entry in included if entry.get("pythonModule")]
    test_paths = sorted({
        entry["verification"]
        for entry in included
        if isinstance(entry.get("verification"), str)
        and entry["verification"].startswith("services/")
    })
    if not modules:
        raise RuntimeError("Supported-core coverage manifest has no Python modules.")
    if any(not isinstance(module, str) or not module for module in modules):
        raise RuntimeError("Supported-core coverage module list is invalid.")
    if not test_paths:
        raise RuntimeError("Supported-core coverage manifest has no service verification tests.")

    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.basetemp.mkdir(parents=True, exist_ok=True)
    raw_report = args.receipt.with_suffix(".coverage.json")
    junit_report = args.receipt.with_suffix(".junit.xml")
    command = [
        sys.executable,
        "-m",
        "pytest",
        *test_paths,
        "--import-mode=importlib",
        f"--basetemp={args.basetemp}",
        f"--junitxml={junit_report}",
        "--cov-branch",
        f"--cov-report=json:{raw_report}",
        *[f"--cov={module}" for module in modules],
    ]
    result = subprocess.run(command, cwd=ROOT, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Supported-core coverage test command failed with exit code {result.returncode}.")
    if not raw_report.is_file():
        raise RuntimeError("Coverage JSON report was not produced.")
    if not junit_report.is_file():
        raise RuntimeError("Coverage JUnit report was not produced.")
    report = json.loads(raw_report.read_text(encoding="utf-8"))
    totals = report.get("totals", {})
    percent = totals.get("percent_covered")
    if not isinstance(percent, (int, float)):
        raise RuntimeError("Coverage report is malformed.")
    suite = element_tree.parse(junit_report).getroot()
    test_counts = {
        "tests": sum(int(node.attrib.get("tests", 0)) for node in suite.iter("testsuite")),
        "failures": sum(int(node.attrib.get("failures", 0)) for node in suite.iter("testsuite")),
        "errors": sum(int(node.attrib.get("errors", 0)) for node in suite.iter("testsuite")),
        "skips": sum(int(node.attrib.get("skipped", 0)) for node in suite.iter("testsuite")),
    }
    if test_counts["failures"] or test_counts["errors"] or test_counts["skips"]:
        raise RuntimeError(f"Supported-core coverage test counts are not clean: {test_counts}.")
    receipt = {
        "schema": "black-skies.foundation-supported-core-coverage-receipt.v1",
        "qualifiedCommit": git_head(),
        "generatedAtUtc": datetime.now(UTC).isoformat(),
        "minimumBranchCoverage": minimum,
        "actualBranchCoverage": percent,
        "included": included,
        "excluded": manifest["excluded"],
        "totals": totals,
        "testCounts": test_counts,
        "status": "passed" if percent >= minimum else "failed",
    }
    args.receipt.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    if percent < minimum:
        raise RuntimeError(f"Supported-core branch coverage {percent}% is below {minimum}%.")
    print("FOUNDATION_SUPPORTED_CORE_COVERAGE_PASS")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"[foundation-coverage] {error}", file=sys.stderr)
        raise SystemExit(1)
