import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MinimalTwoSurfaceShell from "./MinimalTwoSurfaceShell";

function readScaffoldSource() {
  return readFileSync(resolve(process.cwd(), "renderer/salvage/MinimalTwoSurfaceShell.tsx"), "utf8");
}

function readModelSource() {
  return readFileSync(resolve(process.cwd(), "renderer/salvage/salvageShellModel.ts"), "utf8");
}

describe("MinimalTwoSurfaceShell", () => {
  it("renders distinct Writing Surface and Command Center Surface regions", () => {
    render(<MinimalTwoSurfaceShell />);

    const root = screen.getByTestId("minimal-two-surface-shell");
    const writingSurface = screen.getByTestId("writing-surface");
    const commandCenter = screen.getByTestId("command-center-surface");

    expect(root).toBeInTheDocument();
    expect(writingSurface).toBeInTheDocument();
    expect(commandCenter).toBeInTheDocument();
    expect(writingSurface).not.toBe(commandCenter);
    expect(writingSurface).toHaveAttribute("data-surface-role", "sovereign");
    expect(commandCenter).toHaveAttribute("data-surface-role", "supporting");
  });

  it("renders static project context and keeps the Writing Surface available first", () => {
    render(<MinimalTwoSurfaceShell />);

    const syntheticProjectFrame = screen.getByTestId("synthetic-project-frame");
    const writingSurface = screen.getByTestId("writing-surface");
    const editor = screen.getByLabelText("Writing Surface editor");

    expect(within(syntheticProjectFrame).getByRole("heading", { name: "Synthetic active project context" })).toBeInTheDocument();
    expect(
      within(syntheticProjectFrame).getByText(
        "This shell is attached to one synthetic/minimal active project context so first-slice UI behavior can stay explicit without real project loading.",
      ),
    ).toBeInTheDocument();
    expect(within(syntheticProjectFrame).getByText("Active project title: Signal House Draft")).toBeInTheDocument();
    expect(within(syntheticProjectFrame).getByText("Active project identity: project_signal_house_draft")).toBeInTheDocument();
    expect(within(writingSurface).getByRole("heading", { name: "Writing Surface" })).toBeInTheDocument();
    expect(within(writingSurface).getByText("Direct writing remains available first.")).toBeInTheDocument();
    expect(within(writingSurface).getByLabelText("Current project context")).toBeInTheDocument();
    expect(within(writingSurface).getByText("Signal House Draft")).toBeInTheDocument();
    expect(
      within(writingSurface).getByText(
        "Active project identity matches the synthetic project frame: project_signal_house_draft",
      ),
    ).toBeInTheDocument();
    expect(within(writingSurface).getByText("Selected scene: Scene 02 - Hallway Argument")).toBeInTheDocument();
    expect(within(writingSurface).getByLabelText("Minimal scene navigation")).toBeInTheDocument();
    expect(editor).toBeInTheDocument();
    expect(editor).toBeEnabled();
    expect(editor).toHaveValue("The selected scene opens mid-conflict. Draft prose begins here.");
  });

  it("renders a static scene list on the Command Center and keeps it non-gating", () => {
    render(<MinimalTwoSurfaceShell />);

    const commandCenter = screen.getByTestId("command-center-surface");
    const editor = screen.getByLabelText("Writing Surface editor");

    expect(within(commandCenter).getByRole("heading", { name: "Command Center Surface" })).toBeInTheDocument();
    expect(within(commandCenter).getByText("Supports planning and inspection. It does not gate writing.")).toBeInTheDocument();
    expect(within(commandCenter).getByLabelText("Project status")).toBeInTheDocument();
    expect(within(commandCenter).getByText("Active project identity: project_signal_house_draft")).toBeInTheDocument();
    expect(within(commandCenter).getByLabelText("Command Center authority boundary")).toBeInTheDocument();
    expect(within(commandCenter).getByText("Advisory and status-only. This surface must not mutate manuscript truth.")).toBeInTheDocument();
    expect(within(commandCenter).getByText("No manuscript truth mutation from the Command Center")).toBeInTheDocument();
    expect(within(commandCenter).getByText("No restore/import or project loading")).toBeInTheDocument();
    expect(within(commandCenter).getByText("No AI, routing, critique, rewrite, export, or connectors")).toBeInTheDocument();
    expect(within(commandCenter).getByText("No persistence, recovery, or protected-evidence access")).toBeInTheDocument();
    expect(within(commandCenter).getByLabelText("Static scene list")).toBeInTheDocument();
    expect(within(commandCenter).getByText("Scene 01 - Arrival at Signal House")).toBeInTheDocument();
    expect(within(commandCenter).getByText("Scene 02 - Hallway Argument")).toBeInTheDocument();
    expect(within(commandCenter).getByText("Scene 03 - Basement Lantern")).toBeInTheDocument();
    expect(within(commandCenter).getByText("Selected")).toBeInTheDocument();
    expect(within(commandCenter).getByLabelText("Future Command Center tools")).toBeInTheDocument();
    expect(commandCenter).toHaveAttribute("data-gating", "non-blocking");
    expect(commandCenter).toHaveAttribute("data-mutation-authority", "advisory-only");
    expect(editor).toBeEnabled();
  });

  it("shows the selected scene on the Writing Surface without needing Command Center action", () => {
    render(<MinimalTwoSurfaceShell />);

    const writingSurface = screen.getByTestId("writing-surface");

    expect(
      within(writingSurface).getByText("Current writing focus: Scene 02 - Hallway Argument"),
    ).toBeInTheDocument();
  });

  it("does not introduce a Story Unit gate", () => {
    render(<MinimalTwoSurfaceShell />);

    expect(
      screen.getByText("Story Units are optional later and are not required before writing begins."),
    ).toBeInTheDocument();
  });

  it("supports a narrow local-only prose editing flow with bounded save-state framing", () => {
    render(<MinimalTwoSurfaceShell />);

    const writingSurface = screen.getByTestId("writing-surface");
    const commandCenter = screen.getByTestId("command-center-surface");
    const editor = screen.getByLabelText("Writing Surface editor");

    expect(editor).toHaveValue("The selected scene opens mid-conflict. Draft prose begins here.");
    expect(within(writingSurface).getByText("Save-state: Local draft ready")).toBeInTheDocument();
    expect(within(commandCenter).getByText("Save-state: Local draft ready")).toBeInTheDocument();

    fireEvent.change(editor, { target: { value: "A narrower local draft line." } });

    expect(editor).toHaveValue("A narrower local draft line.");
    expect(within(writingSurface).getByText("Save-state: Unsaved local edits")).toBeInTheDocument();
    expect(within(commandCenter).getByText("Save-state: Unsaved local edits")).toBeInTheDocument();
    expect(
      within(writingSurface).getByText(
        "Edits exist only in local synthetic state. No runtime persistence, recovery, or restore wiring.",
      ),
    ).toBeInTheDocument();
    expect(
      within(writingSurface).getByText(
        "Synthetic/local only editing flow. No persistence or project loading is connected.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark local draft as reviewed" }));

    expect(within(writingSurface).getByText("Save-state: Local draft ready")).toBeInTheDocument();
    expect(within(commandCenter).getByText("Save-state: Local draft ready")).toBeInTheDocument();
  });

  it("stays isolated from runtime wiring, file IO, and non-salvage dependencies", () => {
    const shellSource = readScaffoldSource();
    const modelSource = readModelSource();
    const shellImportLines = shellSource
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("import "));

    expect(shellImportLines).toEqual([
      'import { useState } from "react";',
      'import { MINIMAL_SALVAGE_SHELL_MODEL } from "./salvageShellModel";',
    ]);
    expect(shellSource).not.toMatch(/\b(?:window\.|localStorage|sessionStorage|indexedDB)\b/);
    expect(shellSource).not.toMatch(/\b(?:readFile|writeFile|mkdir|unlink|rename)\b/);
    expect(modelSource).not.toMatch(/\b(?:import |window\.|localStorage|sessionStorage|indexedDB)\b/);
    expect(modelSource).not.toMatch(/\b(?:readFile|writeFile|mkdir|unlink|rename)\b/);
  });
});
