import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MinimalTwoSurfaceShell from "./MinimalTwoSurfaceShell";

function readScaffoldSource() {
  return readFileSync(resolve(process.cwd(), "renderer/salvage/MinimalTwoSurfaceShell.tsx"), "utf8");
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

  it("keeps the Writing Surface available first with project context and minimal scene navigation", () => {
    render(<MinimalTwoSurfaceShell />);

    const writingSurface = screen.getByTestId("writing-surface");
    const editor = screen.getByLabelText("Writing Surface editor");

    expect(within(writingSurface).getByRole("heading", { name: "Writing Surface" })).toBeInTheDocument();
    expect(within(writingSurface).getByText("Direct writing remains available first.")).toBeInTheDocument();
    expect(within(writingSurface).getByLabelText("Current project context")).toBeInTheDocument();
    expect(within(writingSurface).getByLabelText("Minimal scene navigation")).toBeInTheDocument();
    expect(editor).toBeInTheDocument();
    expect(editor).toBeEnabled();
  });

  it("keeps the Command Center separate, contextual, and non-gating", () => {
    render(<MinimalTwoSurfaceShell />);

    const commandCenter = screen.getByTestId("command-center-surface");
    const editor = screen.getByLabelText("Writing Surface editor");

    expect(within(commandCenter).getByRole("heading", { name: "Command Center Surface" })).toBeInTheDocument();
    expect(within(commandCenter).getByText("Supports planning and inspection. It does not gate writing.")).toBeInTheDocument();
    expect(within(commandCenter).getByLabelText("Future Command Center tools")).toBeInTheDocument();
    expect(commandCenter).toHaveAttribute("data-gating", "non-blocking");
    expect(editor).toBeEnabled();
  });

  it("does not introduce a Story Unit gate", () => {
    render(<MinimalTwoSurfaceShell />);

    expect(
      screen.getByText("Story Units are optional later and are not required before writing begins."),
    ).toBeInTheDocument();
  });

  it("stays isolated from runtime wiring and forbidden dependencies", () => {
    const source = readScaffoldSource();

    expect(source).not.toMatch(/\b(?:CompanionOverlay|projectLoader|useRecovery|ipcRenderer|window\.services|window\.projectLoader)\b/);
    expect(source).not.toMatch(/\b(?:evaluateStaticQualitativeFixtures|Narrative Foundation Integration|StoryNavigationPanel|ProjectHome)\b/);
    expect(source).not.toMatch(/\b(?:migration|migrate|persisted|persistence|Memory Lab|AI Companion)\b/);
  });
});
