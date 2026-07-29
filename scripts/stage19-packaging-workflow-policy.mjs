import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(modulePath), "..");
const workflowPath = path.join(
  repoRoot,
  ".github",
  "workflows",
  "stage19-packaging.yml"
);

export function validateStage19PackagingWorkflow(source) {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const errors = [];
  const onIndex = lines.findIndex((line) => line === "on:");
  if (onIndex < 0) {
    return ["The workflow has no top-level on block."];
  }

  let onEnd = lines.length;
  for (let index = onIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() && !line.startsWith(" ")) {
      onEnd = index;
      break;
    }
  }
  const triggers = lines
    .slice(onIndex + 1, onEnd)
    .map((line) => /^  ([A-Za-z0-9_-]+):/.exec(line)?.[1] ?? null)
    .filter(Boolean);
  if (triggers.length !== 1 || triggers[0] !== "workflow_dispatch") {
    errors.push(
      `Packaging must be explicit manual dispatch only; found triggers: ${triggers.join(", ") || "none"}.`
    );
  }

  const uploadIndexes = lines
    .map((line, index) =>
      /^\s+uses:\s+actions\/upload-artifact@/u.test(line) ? index : -1
    )
    .filter((index) => index >= 0);
  if (uploadIndexes.length === 0) {
    errors.push("The packaging workflow has no artifact upload steps.");
  }
  for (const uploadIndex of uploadIndexes) {
    let stepEnd = lines.length;
    for (let index = uploadIndex + 1; index < lines.length; index += 1) {
      if (/^      - name:/u.test(lines[index])) {
        stepEnd = index;
        break;
      }
    }
    const artifactName = lines
      .slice(uploadIndex + 1, stepEnd)
      .map((line) => /^\s{10}name:\s*(.+)$/u.exec(line)?.[1] ?? null)
      .find(Boolean);
    if (!artifactName?.includes("${{ github.sha }}")) {
      errors.push(
        `Artifact upload at line ${uploadIndex + 1} is not bound to the exact source SHA.`
      );
    }
  }

  return errors;
}

export function assertStage19PackagingWorkflow(source) {
  const errors = validateStage19PackagingWorkflow(source);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  try {
    assertStage19PackagingWorkflow(readFileSync(workflowPath, "utf8"));
    process.stdout.write(
      "STAGE19_PACKAGING_WORKFLOW_POLICY_PASS manual-dispatch-only exact-sha-artifacts\n"
    );
  } catch (error) {
    process.stderr.write(
      `[stage19-packaging-workflow] ${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exit(1);
  }
}
