import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
    scenes: [
      { id: "sc_0002", order: 2, title: "Signal", chapter_id: "ch_1", beat_refs: [] },
      { id: "sc_0001", order: 1, title: "Arrival", chapter_id: "ch_1", beat_refs: [] },
    ],
  },
  scenes: [
    {
      id: "sc_0002",
      title: "Signal",
      order: 2,
      chapter_id: "ch_1",
      purpose: "Escalate the signal.",
    },
    {
      id: "sc_0001",
      title: "Arrival",
      order: 1,
      chapter_id: "ch_1",
      goal: "Reach the estate.",
    },
  ],
  drafts: {
    sc_0001: "Arrival draft preview text.",
  },
};

describe("SplitCommandWorkspace", () => {
  it("renders command and writing zones without replacing the wrapped writing surface", () => {
    const onSelectScene = vi.fn();
    render(
      <SplitCommandWorkspace
        project={PROJECT}
        activeSceneId="sc_0001"
        onSelectScene={onSelectScene}
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(screen.getByTestId("split-command-workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Command Center")).toBeInTheDocument();
    expect(screen.getByLabelText("Writing Studio")).toBeInTheDocument();
    expect(screen.getByLabelText("Command Center panels")).toBeInTheDocument();
    expect(screen.getByLabelText("Future command surfaces")).toBeInTheDocument();
    expect(screen.getByTestId("stable-writing-surface")).toHaveTextContent("Stable surface");

    const storyNavigation = screen.getByLabelText("Story Navigation");
    expect(within(storyNavigation).getByText("Main outline")).toBeInTheDocument();
    expect(within(storyNavigation).getByLabelText("2 story units")).toHaveTextContent("2");
    expect(within(storyNavigation).getByText("Arrival")).toBeInTheDocument();
    expect(within(storyNavigation).getByText("Signal")).toBeInTheDocument();
    expect(within(storyNavigation).getByText("Arrival draft preview text.")).toBeInTheDocument();
    expect(within(storyNavigation).getAllByText("placed")).toHaveLength(2);
    expect(within(storyNavigation).getAllByText("scene")).toHaveLength(2);
    expect(within(storyNavigation).getByText("01")).toBeInTheDocument();
    expect(within(storyNavigation).getByText("Selected")).toBeInTheDocument();
    expect(within(storyNavigation).getByText("Arrival").closest("li")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByLabelText("Narrative Overview")).toHaveTextContent(/Loaded workspace data only/i);
    expect(screen.getByLabelText("Narrative Overview")).toHaveTextContent(/Story units/i);
    expect(screen.getByLabelText("Narrative Overview")).toHaveTextContent(/Arrival/i);
    expect(screen.getByLabelText("Narrative Gaps")).toHaveTextContent(/Placeholder surface/i);
    expect(screen.getByLabelText("AI Companion")).toHaveTextContent(/Placeholder surface/i);
    expect(screen.getByLabelText("Global Tools")).toHaveTextContent(/Display-only command metadata/i);
    expect(screen.getByLabelText("Global Tools")).toHaveTextContent(/Generate Active Scene/i);
    expect(screen.getByLabelText("Global Tools")).toHaveTextContent(/No command palette/i);

    fireEvent.click(within(storyNavigation).getByRole("button", { name: "Select Signal" }));
    expect(onSelectScene).toHaveBeenCalledWith("sc_0002");
  });

  it("updates the active marker from the shared activeSceneId prop", () => {
    const { rerender } = render(
      <SplitCommandWorkspace
        project={PROJECT}
        activeSceneId="sc_0001"
        onSelectScene={vi.fn()}
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    const storyNavigation = screen.getByLabelText("Story Navigation");
    expect(
      within(storyNavigation).getByRole("button", { name: "Select Arrival" }).closest("li"),
    ).toHaveAttribute("aria-current", "true");

    rerender(
      <SplitCommandWorkspace
        project={PROJECT}
        activeSceneId="sc_0002"
        onSelectScene={vi.fn()}
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(
      within(storyNavigation).getByRole("button", { name: "Select Signal" }).closest("li"),
    ).toHaveAttribute("aria-current", "true");
  });
});
