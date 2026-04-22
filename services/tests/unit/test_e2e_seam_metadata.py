from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
E2E_DIR = REPO_ROOT / "app" / "tests" / "e2e"


def test_e2e_specs_declare_harness_or_truth_metadata() -> None:
    """Keep harness seams explicit so smoke tests do not impersonate truth lanes."""

    spec_files = sorted(E2E_DIR.glob("*.spec.ts"))
    assert spec_files, f"No e2e spec files found under {E2E_DIR}"

    violations: list[str] = []

    for spec_file in spec_files:
        content = spec_file.read_text(encoding="utf-8")
        has_harness = "HARNESS_ONLY" in content
        has_truth_reference = "TRUTH_LANE_REFERENCE" in content

        if has_harness:
            missing = [
                token for token in ("Reason:", "Owner:", "Retire when:") if token not in content
            ]
            if missing:
                violations.append(
                    f"{spec_file.as_posix()}: HARNESS_ONLY missing {', '.join(missing)} metadata"
                )
            continue

        if has_truth_reference:
            if "Owner:" not in content:
                violations.append(
                    f"{spec_file.as_posix()}: TRUTH_LANE_REFERENCE missing Owner metadata"
                )
            continue

        violations.append(
            f"{spec_file.as_posix()}: missing HARNESS_ONLY or TRUTH_LANE_REFERENCE header"
        )

    assert not violations, "E2E seam metadata violations:\n" + "\n".join(violations)
