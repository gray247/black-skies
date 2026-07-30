import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// The policy is deliberately executable as plain Node.js in clean CI jobs.
// @ts-expect-error JavaScript policy module has no separate declaration file.
import {
  assertStage19PackagingWorkflow,
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

  it("guards the committed packaging workflow", () => {
    expect(() =>
      assertStage19PackagingWorkflow(readFileSync(workflowPath, "utf8"))
    ).not.toThrow();
  });
});
