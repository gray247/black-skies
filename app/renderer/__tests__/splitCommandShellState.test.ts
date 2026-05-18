import { describe, expect, it } from "vitest";

import {
  SPLIT_COMMAND_SHELL_STORAGE_KEY,
  SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
  createDefaultSplitCommandShellState,
  readSplitCommandShellState,
  splitCommandShellReducer,
  writeSplitCommandShellState,
} from "../utils/splitCommandShellState";

describe("splitCommandShellState", () => {
  it("keeps shell persistence isolated per project path", () => {
    const state = createDefaultSplitCommandShellState("/projects/demo");
    writeSplitCommandShellState(window.localStorage, {
      ...state,
      selectedSceneId: "sc_0002",
      diagnosticsOpen: true,
    });

    const sameProject = readSplitCommandShellState(window.localStorage, "/projects/demo");
    const otherProject = readSplitCommandShellState(window.localStorage, "/projects/other");

    expect(sameProject.state.selectedSceneId).toBe("sc_0002");
    expect(sameProject.state.diagnosticsOpen).toBe(true);
    expect(otherProject.state.selectedSceneId).toBeNull();
    expect(otherProject.state.diagnosticsOpen).toBe(false);
  });

  it("resets corrupted persistence safely", () => {
    window.localStorage.setItem(SPLIT_COMMAND_SHELL_STORAGE_KEY, "{not-json");

    const result = readSplitCommandShellState(window.localStorage, "/projects/demo");

    expect(result.status).toBe("reset");
    expect(result.failureClass).toBe("corrupted-shell-persistence");
    expect(result.state).toEqual(createDefaultSplitCommandShellState("/projects/demo"));
    expect(window.localStorage.getItem(SPLIT_COMMAND_SHELL_STORAGE_KEY)).toBeNull();
  });

  it("resets unsupported schema safely", () => {
    window.localStorage.setItem(
      SPLIT_COMMAND_SHELL_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 999,
        projectPath: "/projects/demo",
        selectedSceneId: "sc_0004",
      }),
    );

    const result = readSplitCommandShellState(window.localStorage, "/projects/demo");

    expect(result.status).toBe("reset");
    expect(result.failureClass).toBe("unsupported-shell-schema");
    expect(result.state.selectedSceneId).toBeNull();
    expect(window.localStorage.getItem(SPLIT_COMMAND_SHELL_STORAGE_KEY)).toBeNull();
  });

  it("loads valid same-project shell state without changing schema ownership", () => {
    window.localStorage.setItem(
      SPLIT_COMMAND_SHELL_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
        projectPath: "/projects/demo",
        selectedSceneId: "sc_0004",
        commandCenterCollapsed: true,
        diagnosticsOpen: true,
      }),
    );

    const result = readSplitCommandShellState(window.localStorage, "/projects/demo");

    expect(result.status).toBe("loaded");
    expect(result.failureClass).toBeNull();
    expect(result.state).toEqual({
      schemaVersion: SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
      projectPath: "/projects/demo",
      selectedSceneId: "sc_0004",
      commandCenterCollapsed: true,
      diagnosticsOpen: true,
    });
  });

  it("mutates shell-owned selection only through named shell actions", () => {
    const initial = createDefaultSplitCommandShellState("/projects/demo");
    const selected = splitCommandShellReducer(initial, {
      type: "shell/select-scene",
      payload: { sceneId: "sc_0003" },
    });
    const projectChanged = splitCommandShellReducer(selected, {
      type: "shell/project-changed",
      payload: { projectPath: "/projects/other" },
    });

    expect(selected.selectedSceneId).toBe("sc_0003");
    expect(projectChanged.projectPath).toBe("/projects/other");
    expect(projectChanged.selectedSceneId).toBeNull();
  });
});
