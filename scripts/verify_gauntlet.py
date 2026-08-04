#!/usr/bin/env python
"""Authoritative verification gauntlet orchestrator (passes 1-6)."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
BUILD_DIR = REPO_ROOT / "build" / "gauntlet"
LOG_DIR = BUILD_DIR / "logs"
RECEIPT_JSON = REPO_ROOT / "build" / "truth_receipts" / "latest.json"
RECEIPT_TEXT = REPO_ROOT / "build" / "truth_receipts" / "latest.txt"
PYTHON311 = REPO_ROOT / ".venv311" / "Scripts" / "python.exe"
PYTHON = REPO_ROOT / ".venv" / "Scripts" / "python.exe"
CI_PROOF_SCHEMA = "GauntletCIProof v1"
PASS_PROOF_SCHEMA = "GauntletPassProof v1"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def pick_python() -> str:
    explicit = os.environ.get("PYTHON", "").strip()
    if explicit:
        return explicit
    if PYTHON311.exists():
        return str(PYTHON311)
    return str(PYTHON if PYTHON.exists() else Path(sys.executable))


def command_to_text(command: list[str]) -> str:
    return " ".join(command)


def run_command(command: list[str], pass_id: str, step: str) -> dict[str, Any]:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    completed = subprocess.run(
        command,
        cwd=REPO_ROOT,
        env=dict(os.environ),
        capture_output=True,
        text=True,
    )
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    log_path = LOG_DIR / f"{pass_id.lower().replace(' ', '_')}_{step}_{stamp}.log"
    log_path.write_text(
        "\n".join(
            [
                f"command: {command_to_text(command)}",
                f"exit_code: {completed.returncode}",
                "",
                "stdout:",
                completed.stdout or "",
                "",
                "stderr:",
                completed.stderr or "",
            ]
        ),
        encoding="utf-8",
    )
    return {
        "command": command,
        "exit_code": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
        "log_path": str(log_path.relative_to(REPO_ROOT)),
    }


def is_environment_limit(output: str) -> bool:
    lowered = output.lower()
    markers = [
        "eperm",
        "operation not permitted",
        "pipe-based child-process spawn",
        "spawn",
        "worker startup",
    ]
    return any(marker in lowered for marker in markers)


def load_ci_proof(path: Path | None) -> dict[str, Any] | None:
    if not path:
        return None
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_ci_jobs(proof: dict[str, Any]) -> dict[str, dict[str, Any]]:
    jobs = proof.get("jobs")
    if isinstance(jobs, dict):
        return {str(k): v for k, v in jobs.items() if isinstance(v, dict)}
    if isinstance(jobs, list):
        mapped: dict[str, dict[str, Any]] = {}
        for entry in jobs:
            if not isinstance(entry, dict):
                continue
            key = str(entry.get("pass") or entry.get("id") or entry.get("name") or "").strip()
            if key:
                mapped[key] = entry
        return mapped
    return {}


def validate_truth_receipt(
    json_path: Path,
    text_path: Path,
    *,
    require_success: bool,
) -> list[str]:
    errors: list[str] = []
    if not json_path.exists():
        errors.append(f"Missing receipt JSON: {json_path}")
        return errors
    if not text_path.exists():
        errors.append(f"Missing receipt TXT: {text_path}")
        return errors

    payload = json.loads(json_path.read_text(encoding="utf-8"))
    required_top = [
        "schema_version",
        "started_at",
        "finished_at",
        "ui_chain_passed",
        "service_extension_passed",
        "routes_hit",
        "provenance",
        "artifacts",
        "failures",
    ]
    for key in required_top:
        if key not in payload:
            errors.append(f"Receipt JSON missing field: {key}")

    ui_chain_passed = payload.get("ui_chain_passed")
    service_extension_passed = payload.get("service_extension_passed")
    if not isinstance(ui_chain_passed, bool):
        errors.append("Receipt JSON ui_chain_passed must be boolean.")
    if not isinstance(service_extension_passed, bool):
        errors.append("Receipt JSON service_extension_passed must be boolean.")

    provenance = payload.get("provenance", [])
    if not isinstance(provenance, list):
        errors.append("Receipt JSON provenance must be an array.")
    elif (
        ui_chain_passed is True or service_extension_passed is True or require_success
    ) and not provenance:
        errors.append("Receipt JSON provenance missing or empty when chain execution is expected.")
    else:
        for index, item in enumerate(provenance):
            if not isinstance(item, dict):
                errors.append(f"Provenance[{index}] is not an object.")
                continue
            for field_name in ("route_name", "provider_called", "result_origin", "budget_delta"):
                if field_name not in item:
                    errors.append(f"Provenance[{index}] missing {field_name}.")

    routes = payload.get("routes_hit", [])
    if isinstance(routes, list) and any(
        str(route).startswith("/api/v1/phase4/") for route in routes
    ):
        errors.append("Forbidden /api/v1/phase4/* route present in receipt routes_hit.")

    if isinstance(provenance, list):
        for item in provenance:
            origin = str(item.get("result_origin", ""))
            if origin == "mock":
                errors.append("Forbidden result_origin=mock present in receipt provenance.")

    text_payload = text_path.read_text(encoding="utf-8")
    if "ui_chain_passed:" not in text_payload:
        errors.append("Receipt TXT missing ui_chain_passed line.")
    if "service_extension_passed:" not in text_payload:
        errors.append("Receipt TXT missing service_extension_passed line.")
    if require_success:
        if ui_chain_passed is not True:
            errors.append("Receipt JSON ui_chain_passed must be true for delegated PASS 4 proof.")
        if service_extension_passed is not True:
            errors.append(
                "Receipt JSON service_extension_passed must be true for delegated PASS 4 proof."
            )
        failures = payload.get("failures", [])
        if not isinstance(failures, list):
            errors.append("Receipt JSON failures must be an array.")
        elif failures:
            errors.append("Receipt JSON failures must be empty for delegated PASS 4 proof.")
    return errors


def validate_pass_summary(path: Path, *, pass_id: str, commit_sha: str) -> list[str]:
    errors: list[str] = []
    if not path.exists():
        return [f"Missing pass summary artifact: {path}"]
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("schema_version") != PASS_PROOF_SCHEMA:
        errors.append(f"{pass_id} summary schema mismatch: {payload.get('schema_version')!r}")
    if payload.get("pass_id") != pass_id:
        errors.append(f"{pass_id} summary pass_id mismatch: {payload.get('pass_id')!r}")
    if str(payload.get("commit_sha") or "").strip() != commit_sha:
        errors.append(
            f"{pass_id} summary commit_sha mismatch: expected {commit_sha}, got {payload.get('commit_sha')!r}"
        )
    if str(payload.get("status") or "").lower() != "success":
        errors.append(f"{pass_id} summary status must be success; got {payload.get('status')!r}")
    return errors


def resolve_artifact_path(proof: dict[str, Any], artifact_path: str) -> Path:
    path_obj = Path(artifact_path)
    if path_obj.is_absolute():
        return path_obj
    artifact_root = str(proof.get("artifact_root") or "").strip()
    if artifact_root:
        root_path = Path(artifact_root)
        if not root_path.is_absolute():
            root_path = (REPO_ROOT / root_path).resolve()
        return (root_path / artifact_path).resolve()
    return (REPO_ROOT / artifact_path).resolve()


def validate_ci_delegation(
    proof: dict[str, Any] | None,
    pass_id: str,
    commit_sha: str,
    required_artifacts: list[dict[str, str]],
    local_failure_output: str,
    local_failure_log_paths: list[str],
) -> tuple[bool, list[str], list[str]]:
    if proof is None:
        return False, ["No CI proof manifest available."], []

    errors: list[str] = []
    if proof.get("schema_version") != CI_PROOF_SCHEMA:
        errors.append(f"CI proof schema_version must be {CI_PROOF_SCHEMA!r}.")
    jobs = normalize_ci_jobs(proof)
    job = (
        jobs.get(pass_id) or jobs.get(pass_id.lower().replace(" ", "")) or jobs.get(pass_id.lower())
    )
    if not job:
        return False, [f"CI proof missing job entry for {pass_id}."], []

    root_sha = str(proof.get("commit_sha") or "").strip()
    job_sha = str(job.get("commit_sha") or root_sha).strip()
    if not root_sha:
        errors.append("CI proof missing top-level commit_sha.")
    if root_sha and root_sha != commit_sha:
        errors.append(f"CI proof commit_sha mismatch: expected {commit_sha}, got {root_sha}.")
    if job_sha != commit_sha:
        errors.append(f"{pass_id} job commit_sha mismatch: expected {commit_sha}, got {job_sha}.")

    status = str(job.get("status") or "").lower()
    conclusion = str(job.get("conclusion") or status).lower()
    if conclusion != "success":
        errors.append(f"{pass_id} job conclusion must be success; got {conclusion or '(missing)'}")

    artifacts = job.get("artifacts")
    if not isinstance(artifacts, list):
        errors.append(f"{pass_id} job artifacts missing or not a list.")
        artifacts = []

    declared_paths: list[str] = []
    artifact_map: dict[str, Path] = {}
    for entry in artifacts:
        if not isinstance(entry, dict):
            continue
        path_value = str(entry.get("path") or "").strip()
        role = str(entry.get("role") or path_value).strip()
        if not path_value:
            continue
        declared_paths.append(path_value)
        artifact_map[role] = resolve_artifact_path(proof, path_value)

    for required in required_artifacts:
        role = required["role"]
        if role not in artifact_map:
            errors.append(f"{pass_id} missing required artifact role: {role}")
            continue
        artifact_path = artifact_map[role]
        if not artifact_path.exists():
            errors.append(f"{pass_id} artifact does not exist locally: {artifact_path}")

    summary_path = artifact_map.get("summary")
    if summary_path:
        errors.extend(validate_pass_summary(summary_path, pass_id=pass_id, commit_sha=commit_sha))
    else:
        errors.append(f"{pass_id} missing summary artifact.")

    if pass_id == "PASS 4":
        receipt_json_path = artifact_map.get("truth_receipt_json")
        receipt_txt_path = artifact_map.get("truth_receipt_txt")
        if receipt_json_path is None or receipt_txt_path is None:
            errors.append("PASS 4 requires truth_receipt_json and truth_receipt_txt artifacts.")
        else:
            errors.extend(
                validate_truth_receipt(receipt_json_path, receipt_txt_path, require_success=True)
            )

    if pass_id == "PASS 6":
        if not is_environment_limit(local_failure_output):
            errors.append(
                "PASS 6 delegation requires local environment capability failure evidence (EPERM/spawn constraint)."
            )

    return (not errors), errors, declared_paths


@dataclass
class PassResult:
    pass_id: str
    title: str
    status: str
    source: str
    commands: list[str] = field(default_factory=list)
    logs: list[str] = field(default_factory=list)
    artifacts: list[str] = field(default_factory=list)
    failures: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    proof_location: str | None = None
    decision_reason: str | None = None


def get_head_sha() -> str:
    completed = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return completed.stdout.strip()


def execute_local_commands(
    pass_id: str, commands: list[list[str]]
) -> tuple[bool, list[str], list[str], str]:
    command_texts: list[str] = []
    logs: list[str] = []
    combined_output: list[str] = []
    for idx, cmd in enumerate(commands, start=1):
        result = run_command(cmd, pass_id, f"step{idx}")
        command_texts.append(command_to_text(cmd))
        logs.append(result["log_path"])
        combined_output.append(result["stdout"] or "")
        combined_output.append(result["stderr"] or "")
        if result["exit_code"] != 0:
            return False, command_texts, logs, "\n".join(combined_output)
    return True, command_texts, logs, "\n".join(combined_output)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run final gauntlet verification passes.")
    parser.add_argument(
        "--ci-proof",
        default=os.environ.get("GAUNTLET_CI_PROOF", ""),
        help="Optional CI proof manifest path for delegated passes.",
    )
    parser.add_argument(
        "--validate-ci-proof-only",
        action="store_true",
        help="Validate a complete downloaded CI proof without running local passes.",
    )
    args = parser.parse_args()

    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    commit_sha = get_head_sha()
    ci_proof_path = Path(args.ci_proof).resolve() if args.ci_proof else None
    ci_proof = load_ci_proof(ci_proof_path)
    if args.validate_ci_proof_only:
        if ci_proof is None:
            print(
                "CI proof validation failed: proof manifest is missing or malformed.",
                file=sys.stderr,
            )
            return 1
        requirements = {
            "PASS 3": [{"role": "summary"}],
            "PASS 4": [
                {"role": "summary"},
                {"role": "truth_receipt_json"},
                {"role": "truth_receipt_txt"},
            ],
            "PASS 5": [{"role": "summary"}],
            "PASS 6": [{"role": "summary"}],
        }
        errors: list[str] = []
        for pass_id, required in requirements.items():
            valid, pass_errors, _ = validate_ci_delegation(
                ci_proof,
                pass_id,
                commit_sha,
                required,
                "spawn EPERM required for CI-only PASS 6 proof validation",
                [],
            )
            if not valid:
                errors.extend(pass_errors)
        if errors:
            print("CI proof validation failed:", file=sys.stderr)
            for error in errors:
                print(f"- {error}", file=sys.stderr)
            return 1
        print(f"CI proof validation passed for exact commit {commit_sha}.")
        return 0
    python_exe = pick_python()

    results: list[PassResult] = []

    pass_definitions: list[dict[str, Any]] = [
        {
            "id": "PASS 1",
            "title": "Runtime / Doc Authority Check",
            "commands": [
                [
                    python_exe,
                    "-m",
                    "pytest",
                    "-q",
                    "services/tests/unit/test_runtime_truth.py",
                    "services/tests/unit/test_audited_chain_contract.py",
                    "tests/test_runtime_docs_policy.py",
                ]
            ],
            "delegable": False,
            "required_artifacts": [],
        },
        {
            "id": "PASS 2",
            "title": "Service / Core Pytest Pass",
            "commands": [[python_exe, "scripts/run_service_truth.py"]],
            "delegable": False,
            "required_artifacts": [],
        },
        {
            "id": "PASS 3",
            "title": "Renderer / Preload Truth Pass",
            "commands": [
                [
                    "cmd",
                    "/c",
                    "pnpm --filter app test -- --run main/__tests__/serviceApi.test.ts renderer/__tests__/AppCritique.test.tsx renderer/__tests__/useCritique.test.ts",
                ]
            ],
            "delegable": True,
            "required_artifacts": [
                {"role": "summary"},
            ],
        },
        {
            "id": "PASS 4",
            "title": "Full Truth-Lane Workflow Run",
            "commands": [["cmd", "/c", "pnpm test:truth"]],
            "delegable": True,
            "required_artifacts": [
                {"role": "summary"},
                {"role": "truth_receipt_json"},
                {"role": "truth_receipt_txt"},
            ],
        },
        {
            "id": "PASS 5",
            "title": "Harness / Smoke Pass",
            "commands": [
                [python_exe, "-m", "pytest", "-q", "services/tests/unit/test_e2e_seam_metadata.py"],
                ["cmd", "/c", "pnpm test:e2e"],
            ],
            "delegable": True,
            "required_artifacts": [
                {"role": "summary"},
            ],
        },
        {
            "id": "PASS 6",
            "title": "Build / Startup Integrity Pass",
            "commands": [
                [python_exe, "scripts/gauntlet_capability_probe.py"],
                ["cmd", "/c", "pnpm --filter app build:renderer"],
                ["cmd", "/c", "pnpm --filter app build:main"],
            ],
            "delegable": True,
            "required_artifacts": [
                {"role": "summary"},
            ],
        },
    ]

    for definition in pass_definitions:
        pass_id = definition["id"]
        title = definition["title"]
        commands = definition["commands"]
        required_artifacts = definition.get("required_artifacts", [])
        local_ok, command_texts, logs, combined_output = execute_local_commands(pass_id, commands)
        pass_result = PassResult(
            pass_id=pass_id,
            title=title,
            status="pass" if local_ok else "fail",
            source="local",
            commands=command_texts,
            logs=logs,
        )

        if local_ok and required_artifacts:
            if pass_id == "PASS 4":
                receipt_errors = validate_truth_receipt(
                    RECEIPT_JSON,
                    RECEIPT_TEXT,
                    require_success=True,
                )
                if receipt_errors:
                    pass_result.status = "fail"
                    pass_result.failures.extend(receipt_errors)
                    pass_result.decision_reason = (
                        "Local truth receipt failed schema/contract checks."
                    )
                else:
                    pass_result.artifacts.extend(
                        [
                            str(RECEIPT_JSON.relative_to(REPO_ROOT)),
                            str(RECEIPT_TEXT.relative_to(REPO_ROOT)),
                        ]
                    )
                    pass_result.proof_location = str(RECEIPT_JSON.relative_to(REPO_ROOT))
                    pass_result.decision_reason = (
                        "Local PASS 4 succeeded with valid truth receipts."
                    )

        if not local_ok:
            pass_result.failures.append(f"{pass_id} local execution failed.")
            if definition.get("delegable", False):
                delegated_ok, delegated_errors, delegated_artifacts = validate_ci_delegation(
                    proof=ci_proof,
                    pass_id=pass_id,
                    commit_sha=commit_sha,
                    required_artifacts=required_artifacts,
                    local_failure_output=combined_output,
                    local_failure_log_paths=logs,
                )
                if delegated_ok:
                    pass_result.status = "delegated"
                    pass_result.source = "ci"
                    pass_result.failures.clear()
                    pass_result.artifacts.extend(delegated_artifacts)
                    pass_result.proof_location = str(ci_proof_path) if ci_proof_path else None
                    pass_result.decision_reason = f"Local {pass_id} failed; strict SHA-locked CI proof satisfied delegation rules."
                    if ci_proof_path:
                        pass_result.notes.append(f"Delegated via {ci_proof_path}")
                else:
                    pass_result.failures.extend(delegated_errors)
                    pass_result.decision_reason = "No valid CI delegation proof."
            else:
                pass_result.decision_reason = "Local execution failure in non-delegable pass."
        elif pass_result.decision_reason is None:
            pass_result.decision_reason = "Local execution passed."
            if logs:
                pass_result.proof_location = logs[-1]

        results.append(pass_result)

    blocking = [result for result in results if result.status == "fail"]
    verdict = "MERGE" if not blocking else "NO-MERGE"
    confidence = "High" if verdict == "MERGE" else "Medium"

    grouped_failures: dict[str, list[str]] = {}
    for result in results:
        if result.status != "fail":
            continue
        grouped_failures.setdefault(result.pass_id, [])
        grouped_failures[result.pass_id].extend(result.failures)

    output = {
        "schema_version": "GauntletVerification v1",
        "started_at": now_iso(),
        "commit_sha": commit_sha,
        "verdict": verdict,
        "confidence": confidence,
        "passes": [
            {
                "id": result.pass_id,
                "title": result.title,
                "status": result.status,
                "source": result.source,
                "commands": result.commands,
                "logs": result.logs,
                "artifacts": result.artifacts,
                "failures": result.failures,
                "notes": result.notes,
                "proof_location": result.proof_location,
                "decision_reason": result.decision_reason,
            }
            for result in results
        ],
        "blocking_issues": grouped_failures,
        "ci_proof_manifest": str(ci_proof_path) if ci_proof_path else None,
    }

    json_path = BUILD_DIR / "latest.json"
    txt_path = BUILD_DIR / "latest.txt"
    json_path.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")

    lines = [
        "Black Skies Verification Gauntlet",
        f"commit_sha: {commit_sha}",
        f"verdict: {verdict}",
        f"confidence: {confidence}",
        "",
    ]
    for result in results:
        lines.extend(
            [
                f"{result.pass_id} - {result.title}",
                f"status: {result.status}",
                f"source: {result.source}",
            ]
        )
        if result.commands:
            lines.append("commands:")
            lines.extend([f"- {command}" for command in result.commands])
        if result.logs:
            lines.append("logs:")
            lines.extend([f"- {entry}" for entry in result.logs])
        if result.artifacts:
            lines.append("artifacts:")
            lines.extend([f"- {entry}" for entry in result.artifacts])
        if result.failures:
            lines.append("failures:")
            lines.extend([f"- {entry}" for entry in result.failures])
        if result.proof_location:
            lines.append(f"proof_location: {result.proof_location}")
        if result.decision_reason:
            lines.append(f"decision_reason: {result.decision_reason}")
        lines.append("")

    txt_path.write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps(output, indent=2))
    print(f"[gauntlet] json: {json_path}")
    print(f"[gauntlet] text: {txt_path}")
    return 0 if verdict == "MERGE" else 1


if __name__ == "__main__":
    raise SystemExit(main())
