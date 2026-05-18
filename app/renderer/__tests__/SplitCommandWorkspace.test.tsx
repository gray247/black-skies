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

const STRUCTURED_PROJECT: LoadedProject = {
  ...PROJECT,
  outline: {
    ...PROJECT.outline,
    acts: ["Act I", "Act II"],
    chapters: [
      { id: "ch_0001", order: 1, title: "Opening" },
      { id: "ch_0002", order: 2, title: "Escalation" },
    ],
    scenes: [
      {
        id: "sc_0001",
        order: 1,
        title: "Arrival",
        chapter_id: "ch_0001",
        beat_refs: [],
      },
      {
        id: "sc_0002",
        order: 2,
        title: "Signal",
        chapter_id: "ch_0002",
        beat_refs: [],
      },
    ],
  },
  scenes: [
    {
      id: "sc_0001",
      title: "Arrival",
      order: 1,
      chapter_id: "ch_0001",
      goal: "Reach the estate.",
    },
    {
      id: "sc_0002",
      title: "Signal",
      order: 2,
      chapter_id: "ch_0002",
      purpose: "Escalate the signal.",
    },
  ],
  drafts: {
    sc_0001: "Arrival draft preview text.",
    sc_0002: "Signal draft preview text.",
  },
};

function createProjectWithScenes(count: number): LoadedProject {
  const scenes = Array.from({ length: count }, (_, index) => {
    const order = index + 1;
    const id = `sc_${String(order).padStart(4, "0")}`;
    return {
      id,
      title: `Scene ${order}`,
      order,
      chapter_id: "ch_large",
      purpose: `Purpose ${order}`,
    };
  });

  return {
    ...PROJECT,
    scenes,
    outline: {
      ...PROJECT.outline,
      scenes: scenes.map((scene) => ({
        id: scene.id,
        order: scene.order,
        title: scene.title,
        chapter_id: scene.chapter_id,
        beat_refs: [],
      })),
    },
    drafts: {},
  };
}

describe("SplitCommandWorkspace", () => {
  it("renders command and writing zones without replacing the wrapped writing surface", () => {
    const onSelectScene = vi.fn();
    render(
      <SplitCommandWorkspace
        project={STRUCTURED_PROJECT}
        activeSceneId="sc_0001"
        onSelectScene={onSelectScene}
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(screen.getByTestId("split-command-workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Command Center")).toBeInTheDocument();
    expect(screen.getByLabelText("Writing Studio")).toBeInTheDocument();
    expect(screen.getByLabelText("Command Center panels")).toBeInTheDocument();
    expect(screen.getByLabelText("Deterministic command surfaces")).toBeInTheDocument();
    expect(screen.getByTestId("stable-writing-surface")).toHaveTextContent("Stable surface");
    expect(screen.getByTestId("split-command-deferred-note")).toHaveTextContent(
      /deferred to later phases/i,
    );

    const storyNavigation = screen.getByLabelText("Story Navigation");
    expect(within(storyNavigation).getByText("Main outline and scene list")).toBeInTheDocument();
    expect(within(storyNavigation).getByLabelText("Story navigation summary")).toHaveTextContent(
      /Acts/i,
    );
    expect(within(storyNavigation).getByLabelText("Story navigation summary")).toHaveTextContent(
      /Chapters/i,
    );
    expect(within(storyNavigation).getByLabelText("Story navigation summary")).toHaveTextContent(
      /Scenes/i,
    );
    expect(within(storyNavigation).getByLabelText("2 story units")).toHaveTextContent("2");
    expect(within(storyNavigation).getByRole("button", { name: "Select Arrival" })).toBeInTheDocument();
    expect(within(storyNavigation).getByRole("button", { name: "Select Signal" })).toBeInTheDocument();
    expect(within(storyNavigation).getByText("Arrival draft preview text.")).toBeInTheDocument();
    expect(within(storyNavigation).getAllByText("placed")).toHaveLength(2);
    expect(within(storyNavigation).getAllByText("scene")).toHaveLength(2);
    expect(within(storyNavigation).getByText("01")).toBeInTheDocument();
    expect(within(storyNavigation).getByText("Selected")).toBeInTheDocument();
    expect(within(storyNavigation).getByRole("button", { name: "Select Arrival" }).closest("li")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByLabelText("Narrative Overview")).toHaveTextContent(
      /Loaded workspace data only/i,
    );
    expect(screen.getByLabelText("Narrative Overview")).toHaveTextContent(/Story units/i);
    expect(screen.getByLabelText("Narrative Overview")).toHaveTextContent(/Outline source:/i);
    expect(screen.getByLabelText("Structure Overview")).toHaveTextContent(
      /Loaded outline hierarchy only/i,
    );
    expect(screen.getByLabelText("Structure Overview")).toHaveTextContent(/Act I/i);
    expect(screen.getByLabelText("Project Stats")).toHaveTextContent(/Deterministic counts only/i);
    expect(screen.getByLabelText("Project Stats")).toHaveTextContent(/Drafts/i);
    expect(screen.getByLabelText("Global Tools Metadata")).toHaveTextContent(
      /Metadata-only command registry/i,
    );
    expect(screen.getByLabelText("Global Tools Metadata")).toHaveTextContent(
      /No command palette/i,
    );
    expect(screen.queryByLabelText("Narrative Gaps")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("AI Companion")).not.toBeInTheDocument();

    fireEvent.click(within(storyNavigation).getByRole("button", { name: "Select Signal" }));
    expect(onSelectScene).toHaveBeenCalledWith("sc_0002");
  });

  it("renders scene-only structure honestly when no act or chapter structure is loaded", () => {
    render(
      <SplitCommandWorkspace
        project={PROJECT}
        activeSceneId="sc_0001"
        onSelectScene={vi.fn()}
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(screen.getByLabelText("Story Navigation")).toHaveTextContent(
      /Scene-only outline loaded/i,
    );
    expect(screen.getByLabelText("Structure Overview")).toHaveTextContent(
      /Scene-only structure loaded/i,
    );
  });

  it("renders a shell-status notice without turning it into a mutation surface", () => {
    render(
      <SplitCommandWorkspace
        project={PROJECT}
        activeSceneId="sc_0001"
        onSelectScene={vi.fn()}
        shellStatusNote="Split Command reset shell-local state after incompatible persistence."
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(screen.getByTestId("split-command-shell-status")).toHaveTextContent(
      /reset shell-local state/i,
    );
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
    ).toHaveAttribute("aria-current", "page");

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
    ).toHaveAttribute("aria-current", "page");
  });

  it("renders clear empty and large-project states without changing selection behavior", () => {
    const { rerender } = render(
      <SplitCommandWorkspace
        project={null}
        activeSceneId={null}
        onSelectScene={vi.fn()}
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(screen.getByLabelText("Story Navigation")).toHaveTextContent(/No project scenes loaded/i);
    expect(screen.getByLabelText("Narrative Overview")).toHaveTextContent(/None selected/i);

    const largeProject = createProjectWithScenes(75);
    rerender(
      <SplitCommandWorkspace
        project={largeProject}
        activeSceneId="sc_0075"
        onSelectScene={vi.fn()}
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    const storyNavigation = screen.getByLabelText("Story Navigation");
    expect(within(storyNavigation).getByLabelText("75 story units")).toHaveTextContent("75");
    expect(within(storyNavigation).getByRole("button", { name: "Select Scene 75" })).toBeInTheDocument();
    expect(
      within(storyNavigation).getByRole("button", { name: "Select Scene 75" }).closest("li"),
    ).toHaveAttribute("aria-current", "page");
  });

  it("collapses supporting command panels first when the command center is condensed", () => {
    render(
      <SplitCommandWorkspace
        project={PROJECT}
        activeSceneId="sc_0001"
        onSelectScene={vi.fn()}
        commandCenterCollapsed
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(screen.getByTestId("split-command-workspace")).toHaveAttribute(
      "data-command-center-state",
      "condensed",
    );
    expect(screen.getByTestId("split-command-layout-note")).toHaveTextContent(
      /Writing Studio keeps primary workspace width/i,
    );
    expect(screen.getByLabelText("Story Navigation")).toBeInTheDocument();
    expect(screen.getByLabelText("Deterministic command surfaces")).not.toBeVisible();
  });
});
