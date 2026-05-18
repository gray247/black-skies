import { describe, expect, it } from "vitest";

import {
  SPLIT_COMMAND_SHELL_STORAGE_KEY,
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
    });

    const sameProject = readSplitCommandShellState(window.localStorage, "/projects/demo");
    const otherProject = readSplitCommandShellState(window.localStorage, "/projects/other");

    expect(sameProject.state.selectedSceneId).toBe("sc_0002");
    expect(otherProject.state.selectedSceneId).toBeNull();
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
