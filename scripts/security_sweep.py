"""Aggregate security sweep checks (env, dependencies, licenses)."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from dataclasses import asdict, dataclass
from importlib import metadata
from pathlib import Path
from typing import Any, Iterable, Mapping

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
SERVICES_SRC = REPO_ROOT / "services" / "src"
if SERVICES_SRC.exists() and str(SERVICES_SRC) not in sys.path:
    sys.path.insert(0, str(SERVICES_SRC))

from dependency_report import DependencyRecord, collect_records
from blackskies.services.config import ServiceSettings


@dataclass(slots=True)
class EnvCheckResult:
    missing_keys: list[str]

    @property
    def status(self) -> str:
        return "ok" if not self.missing_keys else "action_required"

    def to_dict(self) -> dict[str, Any]:
        return {"status": self.status, "missing_keys": self.missing_keys}


@dataclass(slots=True)
class LicenseRecord:
    name: str
    version: str
    license: str | None


def _load_env_example(path: Path) -> set[str]:
    if not path.exists():
        return set()
    keys: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped.startswith("export "):
            stripped = stripped[len("export ") :].strip()
        if "=" in stripped:
            key, _ = stripped.split("=", 1)
            keys.add(key.strip())
    return keys


def check_env_handling(example_path: Path) -> EnvCheckResult:
    expected_keys = {
        f"{ServiceSettings.ENV_PREFIX}{field_name.upper()}"
        for field_name in ServiceSettings.model_fields
    }
    present_keys = _load_env_example(example_path)
    missing = sorted(expected_keys - present_keys)
    return EnvCheckResult(missing_keys=missing)


def summarize_python_licenses(dependencies: Iterable[DependencyRecord]) -> list[LicenseRecord]:
    records: list[LicenseRecord] = []
    for dep in dependencies:
        license_text: str | None = None
        try:
            meta = metadata.metadata(dep.name)
        except metadata.PackageNotFoundError:
            pass
        else:
            license_text = meta.get("License")
            if not license_text:
                classifiers = meta.get_all("Classifier") or []
                license_classifiers = [c for c in classifiers if c.startswith("License ::")]
                if license_classifiers:
                    license_text = "; ".join(license_classifiers)
        records.append(
            LicenseRecord(
                name=dep.name,
                version=dep.version,
                license=license_text,
            )
        )
    return records


def read_package_manifest(path: Path) -> Mapping[str, Any] | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def detect_tooling() -> dict[str, bool]:
    return {
        "pip_audit": shutil.which("pip-audit") is not None,
        "safety": shutil.which("safety") is not None,
        "pnpm": shutil.which("pnpm") is not None,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run security sweep helpers and emit JSON summary.")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("security-sweep.json"),
        help="Path to write the sweep summary (default: security-sweep.json)",
    )
    parser.add_argument(
        "--env-example",
        type=Path,
        default=Path(".env.example"),
        help="Path to the environment example file (default: .env.example)",
    )
    parser.add_argument(
        "--requirements",
        nargs="*",
        type=Path,
        default=[Path("requirements.lock"), Path("requirements.dev.lock")],
        help="Requirement snapshots to include in the dependency audit.",
    )
    parser.add_argument(
        "--package-json",
        type=Path,
        default=Path("package.json"),
        help="Path to the root package.json for license inspection.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    env_result = check_env_handling(args.env_example)
    dependencies = collect_records(args.requirements)
    python_licenses = summarize_python_licenses(dependencies)
    package_manifest = read_package_manifest(args.package_json)
    tool_availability = detect_tooling()

    payload = {
        "env": env_result.to_dict(),
        "dependencies": {
            "count": len(dependencies),
            "sources": [str(path) for path in args.requirements],
            "records": [asdict(record) for record in sorted(dependencies, key=lambda r: r.name)],
        },
        "python_licenses": [asdict(record) for record in python_licenses],
        "node_package": package_manifest.get("name") if package_manifest else None,
        "node_license": package_manifest.get("license") if package_manifest else None,
        "tooling": tool_availability,
    }

    args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Security sweep summary written to {args.output}")
    if env_result.missing_keys:
        print("Missing env keys:", ", ".join(env_result.missing_keys))
        return 1
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    raise SystemExit(main())
