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
  it("separates writing and command authority by production window role", () => {
    const { rerender } = render(
      <SplitCommandWorkspace
        windowRole="primary"
        project={PROJECT}
        activeSceneId="sc_0001"
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(screen.getByTestId("split-command-workspace")).toHaveAttribute(
      "data-window-role",
      "primary",
    );
    expect(screen.getByTestId("split-command-workspace")).toHaveClass(
      "split-command--dedicated",
    );
    expect(screen.getByTestId("split-command-workspace")).toHaveAttribute(
      "data-primary-scroll-owner",
      "workspace-body",
    );
    expect(screen.getByLabelText("Writing Studio")).toHaveAttribute(
      "data-surface-role",
      "sovereign",
    );
    expect(screen.getByTestId("stable-writing-surface")).toBeInTheDocument();
    expect(screen.queryByLabelText("Command Center")).not.toBeInTheDocument();

    rerender(
      <SplitCommandWorkspace
        windowRole="secondary"
        project={PROJECT}
        activeSceneId="sc_0001"
        onSelectScene={vi.fn()}
        writingStudio={<div data-testid="stable-writing-surface">Stable surface</div>}
      />,
    );

    expect(screen.getByTestId("split-command-workspace")).toHaveAttribute(
      "data-window-role",
      "secondary",
    );
    expect(screen.getByLabelText("Command Center")).toHaveAttribute(
      "data-mutation-authority",
      "advisory-only",
    );
    expect(screen.queryByLabelText("Writing Studio")).not.toBeInTheDocument();
    expect(screen.queryByTestId("stable-writing-surface")).not.toBeInTheDocument();
  });

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
    expect(screen.getByLabelText("Command Center")).toHaveAttribute(
      "data-mutation-authority",
      "advisory-only",
    );
    expect(screen.getByLabelText("Command Center")).toHaveAttribute("data-gating", "non-blocking");
    expect(screen.getByLabelText("Writing Studio")).toHaveAttribute("data-surface-role", "sovereign");
    expect(screen.getByTestId("split-command-project-identity")).toHaveTextContent(
      "Active project identity: proj_demo",
    );
    expect(screen.getByLabelText("Writing Studio contract")).toBeInTheDocument();
    expect(screen.getByLabelText("Writing Studio surfaces")).toBeInTheDocument();
    expect(screen.getByLabelText("Writing Workspace snapshot")).toBeInTheDocument();
    expect(screen.getByLabelText("Writing Workspace support")).toBeInTheDocument();
    expect(screen.getByLabelText("Command Center panels")).toBeInTheDocument();
    expect(screen.getByLabelText("Deterministic command surfaces")).toBeInTheDocument();
    expect(screen.getByTestId("stable-writing-surface")).toHaveTextContent("Stable surface");
    expect(screen.getByLabelText("Writing Studio contract")).toHaveTextContent(
      /Deterministic writing-side inventory/i,
    );
    expect(screen.getByLabelText("Writing Studio contract")).toHaveTextContent(
      /Wrapped stable writing surface only/i,
    );
    expect(screen.getByLabelText("Writing Workspace snapshot")).toHaveTextContent(
      /Deterministic writer-facing context/i,
    );
    expect(screen.getByLabelText("Writing Workspace snapshot")).toHaveTextContent(
      /Notes, quick insert, writing tools, and intelligence-driven assistance remain deferred/i,
    );
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
    expect(screen.getByLabelText("Intelligence Readiness")).toHaveTextContent(
      /Future intelligence surfaces stay deferred until their authority is proven/i,
    );
    expect(screen.getByLabelText("Intelligence Readiness")).toHaveTextContent(
      /Current project only/i,
    );
    expect(screen.getByLabelText("Intelligence Readiness")).toHaveTextContent(
      /generated \/ verified \/ speculative \/ deferred \/ unavailable/i,
    );
    expect(screen.getByLabelText("Intelligence Readiness")).toHaveTextContent(
      /Generated claims stay generated unless verified separately/i,
    );
    expect(screen.getByLabelText("Intelligence Readiness")).toHaveTextContent(
      /No AI certainty, hidden inference, or story-quality judgment is active here/i,
    );
    expect(screen.getByLabelText("Intelligence panel admission rules")).toHaveTextContent(
      /Owner required before a panel can leave deferred status/i,
    );
    expect(screen.getByLabelText("Intelligence panel admission rules")).toHaveTextContent(
      /Authority level and provenance sources must be explicit/i,
    );
    expect(screen.getByLabelText("Intelligence panel admission rules")).toHaveTextContent(
      /Separate panels need a reason not to stay embedded, status-only, or deferred/i,
    );
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
    expect(screen.getByLabelText("Intelligence Readiness")).toHaveTextContent(
      /Unavailable/i,
    );
    expect(screen.getByLabelText("Intelligence panel admission rules")).toHaveTextContent(
      /Owner required before a panel can leave deferred status/i,
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
      /Tertiary command surfaces collapse first/i,
    );
    expect(screen.getByLabelText("Story Navigation")).toBeInTheDocument();
    expect(screen.getByLabelText("Narrative Overview")).toBeVisible();
    expect(screen.getByLabelText("Structure Overview")).toBeVisible();
    expect(screen.getByLabelText("Project Stats")).not.toBeVisible();
    expect(screen.getByLabelText("Global Tools Metadata")).not.toBeVisible();
  });
});
