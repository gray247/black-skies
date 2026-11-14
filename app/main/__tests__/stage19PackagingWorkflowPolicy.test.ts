import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// The policy is deliberately executable as plain Node.js in clean CI jobs.
// @ts-expect-error JavaScript policy module has no separate declaration file.
import {
  assertFoundationActionRuntimePolicy,
  assertStage19PackagingWorkflow,
  validateFoundationActionRuntimePolicy,
  validateStage19PackagingWorkflow
} from "../../../scripts/stage19-packaging-workflow-policy.mjs";

const workflowPath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  ".github",
  "workflows",
  "stage19-packaging.yml"
);

function workflow(trigger: string, artifactName = "black-skies-${{ github.sha }}") {
  return `name: Stage 19 Windows Packaging Proof

on:
  ${trigger}

jobs:
  package:
    steps:
      - name: Upload
        uses: actions/upload-artifact@v6
        with:
          name: ${artifactName}
`;
}

describe("Stage 19 packaging workflow policy", () => {
  it("accepts only explicit manual dispatch with SHA-bound artifacts", () => {
    expect(
      validateStage19PackagingWorkflow(workflow("workflow_dispatch: {}"))
    ).toEqual([]);
  });

  it.each(["push: {}", "schedule: {}", "pull_request: {}"])(
    "rejects automatic %s packaging",
    (trigger) => {
      expect(validateStage19PackagingWorkflow(workflow(trigger))).toContainEqual(
        expect.stringContaining("manual dispatch only")
      );
    }
  );

  it("rejects artifact names that omit the exact source SHA", () => {
    expect(
      validateStage19PackagingWorkflow(
        workflow("workflow_dispatch: {}", "black-skies-latest")
      )
    ).toContainEqual(expect.stringContaining("exact source SHA"));
  });

  it.each([
    ["missing validation step", (source: string) => source.replace("id: validate_source", "id: unverified_source")],
    ["unverified SHA assignment", (source: string) => source.replace("$qualificationSha = git rev-parse HEAD", "$qualificationSha = 'latest'")],
    ["unbound output", (source: string) => source.replace('"sha=$qualificationSha"', '"sha=latest"')],
    ["another checkout after validation", (source: string) => source.replace("      - name: Upload qualified RC installer and receipt", "      - name: Another checkout\n        uses: actions/checkout@v7\n      - name: Upload qualified RC installer and receipt")],
  ] as const)("rejects a selected-source artifact with %s", (_label, change) => {
    expect(validateStage19PackagingWorkflow(change(readFileSync(workflowPath, "utf8"))))
      .toContainEqual(expect.stringContaining("exact source SHA"));
  });

  it("guards the committed workflow including its verified selected-source SHA", () => {
    expect(() =>
      assertStage19PackagingWorkflow(readFileSync(workflowPath, "utf8"))
    ).not.toThrow();
  });

  it("rejects stale checkout, Node, and pnpm action runtimes across every foundation workflow", () => {
    expect(() => assertFoundationActionRuntimePolicy()).not.toThrow();
    expect(
      validateFoundationActionRuntimePolicy({
        "Stage 19 Fixed Regression Gate":
          "uses: actions/checkout@v5\nuses: actions/setup-node@v5\nuses: pnpm/action-setup@v4\nuses: actions/download-artifact@v7\nnode-version: '20'",
      })
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("older checkout action runtime"),
        expect.stringContaining("older setup-node action runtime"),
        expect.stringContaining("deprecated pnpm/action-setup runtime"),
        expect.stringContaining("deprecated Node 20 action runtime"),
        expect.stringContaining("deterministic Git initial branch"),
        expect.stringContaining("warning-free GitHub CLI artifact download path"),
      ])
    );
  });

  it("rejects a security workflow that permits lower-severity vulnerabilities", () => {
    const securityWorkflowPath = path.resolve(
      import.meta.dirname,
      "..",
      "..",
      "..",
      ".github",
      "workflows",
      "security.yml"
    );
    const validSecurity = readFileSync(securityWorkflowPath, "utf8");

    expect(
      validateFoundationActionRuntimePolicy({
        "Security Audit": validSecurity.replace(
          'SEVERITIES = {"info", "low", "moderate", "high", "critical"}',
          'SEVERITIES = {"high", "critical"}'
        ),
      })
    ).toContainEqual(expect.stringContaining("every known vulnerability severity"));
  });
});
