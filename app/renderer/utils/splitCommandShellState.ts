export const SPLIT_COMMAND_SHELL_STORAGE_KEY = "blackskies.split-command-shell-state";
export const SPLIT_COMMAND_SHELL_SCHEMA_VERSION = 1;

export type AppShellMode = "stable-gui" | "split-command";

export type SplitCommandShellFailureClass =
  | "recoverable-shell-failure"
  | "non-recoverable-shell-failure"
  | "corrupted-shell-persistence"
  | "unsupported-shell-schema"
  | "unsafe-shell-state"
  | "forced-stable-gui-fallback"
  | "degraded-shell-mode";

export interface SplitCommandShellState {
  readonly schemaVersion: number;
  readonly projectPath: string | null;
  readonly selectedSceneId: string | null;
  readonly commandCenterCollapsed: boolean;
  readonly diagnosticsOpen: boolean;
}

export interface SplitCommandShellReadResult {
  readonly status: "empty" | "loaded" | "reset";
  readonly state: SplitCommandShellState;
  readonly failureClass: SplitCommandShellFailureClass | null;
}

export type SplitCommandShellAction =
  | { type: "shell/hydrate"; payload: SplitCommandShellState }
  | { type: "shell/project-changed"; payload: { projectPath: string | null } }
  | { type: "shell/select-scene"; payload: { sceneId: string | null } }
  | {
      type: "shell/set-command-center-collapsed";
      payload: { collapsed: boolean };
    }
  | { type: "shell/set-diagnostics-open"; payload: { open: boolean } };

export function createDefaultSplitCommandShellState(
  projectPath: string | null = null,
): SplitCommandShellState {
  return {
    schemaVersion: SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
    projectPath,
    selectedSceneId: null,
    commandCenterCollapsed: false,
    diagnosticsOpen: false,
  };
}

export function splitCommandShellReducer(
  state: SplitCommandShellState,
  action: SplitCommandShellAction,
): SplitCommandShellState {
  switch (action.type) {
    case "shell/hydrate":
      return normalizeShellState(action.payload, action.payload.projectPath ?? null);
    case "shell/project-changed":
      if (state.projectPath === action.payload.projectPath) {
        return state;
      }
      return createDefaultSplitCommandShellState(action.payload.projectPath);
    case "shell/select-scene":
      return {
        ...state,
        selectedSceneId: action.payload.sceneId,
      };
    case "shell/set-command-center-collapsed":
      return {
        ...state,
        commandCenterCollapsed: action.payload.collapsed,
      };
    case "shell/set-diagnostics-open":
      return {
        ...state,
        diagnosticsOpen: action.payload.open,
      };
    default:
      return state;
  }
}

export function readSplitCommandShellState(
  storage: Storage,
  projectPath: string | null,
): SplitCommandShellReadResult {
  const fallback = createDefaultSplitCommandShellState(projectPath);
  const raw = storage.getItem(SPLIT_COMMAND_SHELL_STORAGE_KEY);
  if (!raw) {
    return { status: "empty", state: fallback, failureClass: null };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const schemaVersion = Number(parsed.schemaVersion);
    if (schemaVersion !== SPLIT_COMMAND_SHELL_SCHEMA_VERSION) {
      storage.removeItem(SPLIT_COMMAND_SHELL_STORAGE_KEY);
      return {
        status: "reset",
        state: fallback,
        failureClass: "unsupported-shell-schema",
      };
    }
    return {
      status: "loaded",
      state: normalizeShellState(parsed as Partial<SplitCommandShellState>, projectPath),
      failureClass: null,
    };
  } catch {
    storage.removeItem(SPLIT_COMMAND_SHELL_STORAGE_KEY);
    return {
      status: "reset",
      state: fallback,
      failureClass: "corrupted-shell-persistence",
    };
  }
}

export function writeSplitCommandShellState(
  storage: Storage,
  state: SplitCommandShellState,
): void {
  storage.setItem(
    SPLIT_COMMAND_SHELL_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
      projectPath: state.projectPath,
      selectedSceneId: state.selectedSceneId,
      commandCenterCollapsed: state.commandCenterCollapsed,
      diagnosticsOpen: state.diagnosticsOpen,
    }),
  );
}

function normalizeShellState(
  candidate: Partial<SplitCommandShellState>,
  projectPath: string | null,
): SplitCommandShellState {
  const candidateProjectPath =
    typeof candidate.projectPath === "string" && candidate.projectPath.length > 0
      ? candidate.projectPath
      : null;
  const sameProject = candidateProjectPath !== null && candidateProjectPath === projectPath;
  return {
    schemaVersion: SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
    projectPath,
    selectedSceneId:
      sameProject && typeof candidate.selectedSceneId === "string" && candidate.selectedSceneId.length > 0
        ? candidate.selectedSceneId
        : null,
    commandCenterCollapsed: candidate.commandCenterCollapsed === true,
    diagnosticsOpen: sameProject && candidate.diagnosticsOpen === true,
  };
}
