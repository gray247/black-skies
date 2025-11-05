import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateReopenRequest,
  openDiagnostics,
  performRestoreSnapshot,
  resolveReopenConsumption,
  validateDiagnostics,
  validateRestoreSnapshot,
} from "../renderer/recovery/actions.mjs";

function createProjectSummary() {
  return {
    projectId: "demo_project",
    path: "/projects/demo",
    unitScope: "scene",
    unitIds: ["sc_0001"],
  };
}

function createRecoveryStatus() {
  return {
    project_id: "demo_project",
    status: "needs-recovery",
    needs_recovery: true,
    pending_unit_id: "sc_0001",
    draft_id: "dr_001",
    started_at: "2025-09-29T01:01:59Z",
    last_snapshot: {
      snapshot_id: "20250929T010203Z",
      label: "accept",
      created_at: "2025-09-29T01:02:03Z",
      path: "history/snapshots/20250929T010203Z_accept",
      includes: ["drafts"],
    },
    message: null,
    failure_reason: null,
  };
}

test("performRestoreSnapshot returns updated recovery status on success", async () => {
  const status = createRecoveryStatus();
  const services = {
    async restoreSnapshot() {
      return {
        ok: true,
        data: status,
        traceId: "trace-restore-success",
      };
    },
  };

  const projectSummary = createProjectSummary();
  const validation = validateRestoreSnapshot({ services, projectSummary });
  assert.equal(validation.canProceed, true);

  const result = await performRestoreSnapshot(validation.input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.recoveryStatus, status);
  assert.equal(result.toast.title, "Restored earlier version.");
  assert.equal(result.toast.traceId, "trace-restore-success");
});

test("validateRestoreSnapshot surfaces toast when services are offline", () => {
  const validation = validateRestoreSnapshot({ services: undefined, projectSummary: null });
  assert.equal(validation.canProceed, false);
  assert.ok(validation.toast);
  assert.equal(validation.toast?.title, "Services unavailable");
});

test("performRestoreSnapshot returns error toast for failed response", async () => {
  const services = {
    async restoreSnapshot() {
      return {
        ok: false,
        error: { message: "Snapshot restore failed", traceId: "trace-error" },
        traceId: "trace-error",
      };
    },
  };

  const projectSummary = createProjectSummary();
  const validation = validateRestoreSnapshot({ services, projectSummary });
  const result = await performRestoreSnapshot(validation.input);
  assert.equal(result.ok, false);
  assert.equal(result.toast.title, "Restore failed");
  assert.equal(result.toast.traceId, "trace-error");
});

test("evaluateReopenRequest blocks when recovery action is busy", () => {
  const evaluation = evaluateReopenRequest({
    lastProjectPath: "/projects/demo",
    reopenInFlight: false,
    recoveryAction: "restore",
    nextRequestId: 5,
  });
  assert.equal(evaluation.canProceed, false);
  assert.equal(evaluation.toast, undefined);
});

test("evaluateReopenRequest requires a remembered project", () => {
  const evaluation = evaluateReopenRequest({
    lastProjectPath: null,
    reopenInFlight: false,
    recoveryAction: "idle",
    nextRequestId: 2,
  });
  assert.equal(evaluation.canProceed, false);
  assert.ok(evaluation.toast);
  assert.equal(evaluation.toast?.title, "No project to reopen");
});

test("evaluateReopenRequest returns request payload when allowed", () => {
  const evaluation = evaluateReopenRequest({
    lastProjectPath: "/projects/demo",
    reopenInFlight: false,
    recoveryAction: "idle",
    nextRequestId: 3,
  });
  assert.equal(evaluation.canProceed, true);
  assert.deepEqual(evaluation.input?.request, {
    path: "/projects/demo",
    requestId: 3,
  });
});

test("resolveReopenConsumption emits an error toast when reopening fails", () => {
  const resolution = resolveReopenConsumption({
    currentRequestId: 4,
    event: { requestId: 4, status: "error" },
  });
  assert.equal(resolution.matched, true);
  assert.equal(resolution.shouldClear, true);
  assert.ok(resolution.toast);
  assert.equal(resolution.toast?.title, "Reopen failed");
});

test("validateDiagnostics surfaces toast when bridge is offline", () => {
  const validation = validateDiagnostics({ diagnostics: undefined });
  assert.equal(validation.canProceed, false);
  assert.ok(validation.toast);
  assert.equal(validation.toast?.title, "Diagnostics unavailable");
});

test("openDiagnostics returns error toast when folder cannot be opened", async () => {
  const diagnostics = {
    async openDiagnosticsFolder() {
      return { ok: false, error: "missing diagnostics directory" };
    },
  };

  const validation = validateDiagnostics({ diagnostics });
  assert.equal(validation.canProceed, true);

  const result = await openDiagnostics(validation.input);
  assert.equal(result.ok, false);
  assert.ok(result.toast);
  assert.equal(result.toast?.title, "Diagnostics folder unavailable");
});

test("openDiagnostics succeeds silently when folder is available", async () => {
  const diagnostics = {
    async openDiagnosticsFolder() {
      return { ok: true, path: "/history/diagnostics" };
    },
  };

  const validation = validateDiagnostics({ diagnostics });
  const result = await openDiagnostics(validation.input);
  assert.equal(result.ok, true);
  assert.equal(result.toast, undefined);
});
