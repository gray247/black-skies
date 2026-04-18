"""Minimal waiver record helpers for Memory Lab phase gates (Phase 6B)."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from blackskies.services.io import atomic_write_json


@dataclass(frozen=True)
class GateWaiverRecord:
    gate_id: str
    approver: str
    revisit_condition: str
    rationale: str
    mitigation_plan: str
    expires_at: str | None = None



def waiver_records_path(project_root: Path) -> Path:
    return project_root / ".blackskies" / "memory_lab" / "governance" / "waivers.json"



def validate_gate_waiver_record(record: GateWaiverRecord) -> None:
    if not record.gate_id.strip():
        raise ValueError("gate_id is required")
    if not record.approver.strip():
        raise ValueError("approver is required")
    if not record.revisit_condition.strip():
        raise ValueError("revisit_condition is required")
    if not record.rationale.strip():
        raise ValueError("rationale is required")
    if not record.mitigation_plan.strip():
        raise ValueError("mitigation_plan is required")



def load_gate_waiver_records(project_root: Path) -> list[GateWaiverRecord]:
    target = waiver_records_path(project_root)
    if not target.exists() or not target.is_file():
        return []
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    if not isinstance(payload, list):
        return []

    records: list[GateWaiverRecord] = []
    for item in payload:
        record = _waiver_record_from_payload(item)
        if record is None:
            continue
        records.append(record)
    return records



def append_gate_waiver_record(project_root: Path, record: GateWaiverRecord) -> None:
    validate_gate_waiver_record(record)
    records = [asdict(item) for item in load_gate_waiver_records(project_root)]
    records.append(asdict(record))
    atomic_write_json(waiver_records_path(project_root), records)



def has_gate_waiver(project_root: Path, gate_id: str) -> bool:
    return any(item.gate_id == gate_id for item in load_gate_waiver_records(project_root))



def _waiver_record_from_payload(payload: Any) -> GateWaiverRecord | None:
    if not isinstance(payload, dict):
        return None
    try:
        record = GateWaiverRecord(
            gate_id=str(payload["gate_id"]),
            approver=str(payload["approver"]),
            revisit_condition=str(payload["revisit_condition"]),
            rationale=str(payload["rationale"]),
            mitigation_plan=str(payload["mitigation_plan"]),
            expires_at=(str(payload["expires_at"]) if payload.get("expires_at") is not None else None),
        )
        validate_gate_waiver_record(record)
        return record
    except (KeyError, TypeError, ValueError):
        return None
