import { isErrorLike } from "../../shared/util/isErrorLike.mjs";

const SERVICES_UNAVAILABLE_TOAST = {
  tone: "error",
  title: "Writing tools offline.",
  description: "Reconnect the writing tools before restoring snapshots.",
};

const LOAD_PROJECT_FIRST_TOAST = {
  tone: "warning",
  title: "Open a story to start writing.",
  description: "Select a story to restore its latest snapshot.",
};

const NO_PROJECT_TO_REOPEN_TOAST = {
  tone: "warning",
  title: "No project to reopen",
  description: "Open a project before trying to reopen it.",
};

const DIAGNOSTICS_UNAVAILABLE_TOAST = {
  tone: "error",
  title: "Diagnostics unavailable",
  description: "Electron bridge is offline; cannot open diagnostics.",
};

const DIAGNOSTICS_FOLDER_UNAVAILABLE_TOAST = {
  tone: "error",
  title: "Diagnostics folder unavailable",
};

const REOPEN_FAILED_TOAST = {
  tone: "error",
  title: "Reopen failed",
  description: "Unable to reopen the most recent project.",
};

export function validateRestoreSnapshot(options) {
  if (!options.services) {
    return { canProceed: false, toast: SERVICES_UNAVAILABLE_TOAST };
  }
  if (!options.projectSummary) {
    return { canProceed: false, toast: LOAD_PROJECT_FIRST_TOAST };
  }
  return {
    canProceed: true,
    input: {
      services: options.services,
      projectSummary: options.projectSummary,
    },
  };
}

export async function performRestoreSnapshot(input) {
  try {
    const result = await input.services.restoreSnapshot({
      projectId: input.projectSummary.projectId,
    });

    if (result.ok) {
      return {
        ok: true,
        recoveryStatus: result.data,
        toast: {
          tone: "success",
          title: "Restored earlier version.",
          description: "Latest snapshot restored successfully.",
         traceId: result.traceId ?? null,
       },
      };
    }

    return {
      ok: false,
      toast: {
        tone: "error",
        title: "Restore failed",
        description: result.error.message,
        traceId: result.traceId ?? result.error.traceId ?? null,
      },
    };
  } catch (error) {
    return {
      ok: false,
      toast: {
        tone: "error",
        title: "Restore failed",
        description: isErrorLike(error) ? error.message : String(error),
      },
    };
  }
}

export function evaluateReopenRequest(options) {
  if (options.recoveryAction !== "idle" || options.reopenInFlight) {
    return { canProceed: false };
  }
  if (!options.lastProjectPath) {
    return { canProceed: false, toast: NO_PROJECT_TO_REOPEN_TOAST };
  }

  return {
    canProceed: true,
    input: {
      request: {
        path: options.lastProjectPath,
        requestId: options.nextRequestId,
      },
    },
  };
}

export function resolveReopenConsumption(options) {
  if (
    options.currentRequestId === null ||
    options.currentRequestId !== options.event.requestId
  ) {
    return { matched: false, shouldClear: false };
  }

  if (options.event.status === "error") {
    return { matched: true, shouldClear: true, toast: REOPEN_FAILED_TOAST };
  }

  return { matched: true, shouldClear: true };
}

export function validateDiagnostics(options) {
  if (!options.diagnostics) {
    return { canProceed: false, toast: DIAGNOSTICS_UNAVAILABLE_TOAST };
  }
  return { canProceed: true, input: { diagnostics: options.diagnostics } };
}

export async function openDiagnostics(input) {
  try {
    const result = await input.diagnostics.openDiagnosticsFolder();
    if (!result.ok) {
      return {
        ok: false,
        toast: {
          ...DIAGNOSTICS_FOLDER_UNAVAILABLE_TOAST,
          description: result.error,
        },
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      toast: {
        tone: "error",
        title: "Diagnostics open failed",
        description: isErrorLike(error) ? error.message : String(error),
      },
    };
  }
}
