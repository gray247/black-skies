import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LoadedProject } from "../../shared/ipc/projectLoader";
import SplitCommandWorkspace from "../components/workspace/SplitCommandWorkspace";

const PROJECT: LoadedProject = {
  path: "/projects/demo",
  projectId: "proj_demo",
  name: "Demo Project",
  outline: {
    schema_version: "OutlineSchema v1",
    outline_id: "out_demo",
    acts: [],
    chapters: [],
    scenes: [{ id: "sc_0001", order: 1, title: "Arrival", chapter_id: "ch_1", beat_refs: [] }],
  },
  scenes: [{ id: "sc_0001", title: "Arrival", order: 1, chapter_id: "ch_1" }],
  drafts: {},
};

describe("SplitCommandWorkspace", () => {
  it("renders command and writing zones without replacing the wrapped writing surface", () => {
    render(
      <SplitCommandWorkspace
        project={PROJECT}
        activeSceneId="sc_0001"
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(screen.getByTestId("split-command-workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Command Center")).toBeInTheDocument();
    expect(screen.getByLabelText("Writing Studio")).toBeInTheDocument();
    expect(screen.getByTestId("stable-writing-surface")).toHaveTextContent("Stable surface");

    const storyNavigation = screen.getByLabelText("Story Navigation");
    expect(within(storyNavigation).getByText("Arrival")).toBeInTheDocument();
    expect(within(storyNavigation).getByText("placed")).toBeInTheDocument();
    expect(screen.getAllByText(/Placeholder only/i).length).toBeGreaterThan(0);
  });
});
