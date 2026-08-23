import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const appDir = path.join(repoRoot, "app");
const require = createRequire(import.meta.url);
const allowDirty = process.argv.includes("--allow-dirty");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const unitFiles = [
  "shared/__tests__/manuscriptStructure.test.ts",
  "main/__tests__/manuscriptStructureRepository.test.ts",
  "main/__tests__/manuscriptStructureIpc.test.ts",
  "shared/__tests__/livingOutlineAnchors.test.ts",
  "renderer/__tests__/Stage19WritingSpineApp.test.tsx",
  "renderer/__tests__/companionOrientation.test.ts",
  "renderer/__tests__/Stage19WritingSpineLayout.test.ts",
  "renderer/__tests__/ManuscriptStructureView.test.tsx",
  "renderer/__tests__/manuscriptStructurePerformance.test.tsx",
  "renderer/__tests__/stage19WritingSpineController.test.ts",
  "renderer/__tests__/DraftEditor.test.tsx",
  "renderer/__tests__/splitCommandShellState.test.ts",
  "main/__tests__/splitCommandWindowPlacement.test.ts",
  "main/__tests__/splitCommandSecondaryLaunchHook.test.ts",
  "main/__tests__/splitCommandPreload.test.ts",
  "main/__tests__/splitCommandAuthority.test.ts",
  "main/__tests__/projectSpineRepository.test.ts",
  "main/__tests__/projectSpineRecoveryRepository.test.ts",
  "main/__tests__/projectSpineRecoveryCheckpoints.test.ts",
  "main/__tests__/projectSpineMarkdownExport.test.ts",
  "main/__tests__/projectSpineIpc.test.ts",
  "main/__tests__/optionalServiceStartup.test.ts",
  "main/__tests__/pythonExecutablePolicy.test.ts",
  "main/__tests__/python311LanePolicy.test.ts",
  "main/__tests__/packagedRuntimePolicy.test.ts",
  "main/__tests__/stage19PreloadChannels.test.ts",
  "main/__tests__/stage19PackageVerifier.test.ts",
  "main/__tests__/stage19_22QualificationWitness.test.ts",
  "main/__tests__/stage19InternalBaselineIdentity.test.ts",
  "main/__tests__/runVitestOfflineExitCode.test.ts",
  "main/__tests__/stage19PackagingWorkflowPolicy.test.ts",
  "main/__tests__/stage19NsisCompatibilityPatch.test.ts",
  "main/__tests__/stage19AcceptanceWitness.test.ts",
  "main/__tests__/aiCritiqueQualification.test.ts",
  "main/__tests__/aiCritiqueIpc.test.ts",
  "main/__tests__/aiCritiqueGateway.test.ts",
  "main/__tests__/aiCritiqueCoordinator.test.ts",
  "main/__tests__/aiCritiqueQualificationArtifacts.test.ts",
  "main/__tests__/feedbackNotesRepository.test.ts",
  "main/__tests__/feedbackNotesIpc.test.ts",
  "main/__tests__/contextualProductShellContracts.test.ts",
  "main/__tests__/critiqueReviewIpc.test.ts",
  "main/__tests__/program3SurfacePerformanceProtocol.test.ts",
  "main/__tests__/program3CombinedInstalledQualification.test.ts",
  "main/__tests__/livingOutlineRepository.test.ts",
  "main/__tests__/livingOutlineIpc.test.ts",
  "main/__tests__/runtimeSessionTruthMain.test.ts",
  "main/__tests__/runtimeSessionTruth.test.ts",
  "main/__tests__/truthLaneRuntimeBoundary.test.ts"
];

const electronFiles = [
  "tests/e2e/stage19-project-spine.spec.ts",
  "tests/e2e/stage19-recovery.spec.ts",
  "tests/e2e/stage19-command-center-integrity.spec.ts",
  "tests/e2e/stage19-ai-critique.spec.ts",
  "tests/e2e/stage19-gate1-workflows.spec.ts",
  "tests/e2e/stage19-surface-host.spec.ts",
  "tests/e2e/stage19-writing-shell.spec.ts",
  "tests/e2e/stage19-accessibility.spec.ts",
  "tests/e2e/stage19-performance.spec.ts",
  "tests/e2e/stage19-program3-performance.spec.ts",
  "tests/e2e/stage19-program3-presentation.spec.ts",
  "tests/e2e/stage19-program3-visual.spec.ts",
  "tests/e2e/stage19-companion-orientation.spec.ts"
];

const electronPreflightFiles = [
  "tests/e2e/stage19-surface-host-preflight.spec.ts"
];

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      PLAYWRIGHT_DISABLE_ANIMATIONS: "1",
      PLAYWRIGHT_RETRIES: "0",
      ...options.env
    },
    encoding: options.capture ? "utf8" : undefined,
    stdio: options.capture ? "pipe" : "inherit",
    shell: process.platform === "win32" && command.toLowerCase().endsWith(".cmd")
  });
}

function fail(message, result) {
  process.stderr.write(`\n[stage19] FAIL: ${message}\n`);
  if (result?.error) {
    process.stderr.write(`${result.error.stack ?? result.error.message}\n`);
  }
  process.exit(result?.status && result.status > 0 ? result.status : 1);
}

function phase(label, command, args, options) {
  const startedAt = Date.now();
  process.stdout.write(`\n[stage19] ${label}\n`);
  const result = run(command, args, options);
  if (result.error || result.status !== 0) {
    fail(`${label} did not pass.`, result);
  }
  process.stdout.write(`[stage19] PASS ${label} (${((Date.now() - startedAt) / 1000).toFixed(1)}s)\n`);
}

function assertWorktreePolicy() {
  const result = run("git", ["status", "--porcelain", "--untracked-files=all"], {
    capture: true
  });
  if (result.error || result.status !== 0) {
    fail("The worktree state could not be inspected.", result);
  }
  const status = result.stdout.trim();
  if (status && !allowDirty) {
    process.stderr.write(`${status}\n`);
    fail("The fixed CI/RC gate requires a clean worktree. Use --allow-dirty only while developing the gate.");
  }
  process.stdout.write(
    `[stage19] worktree=${status ? "DIRTY_DEVELOPMENT_OVERRIDE" : "CLEAN"}\n`
  );
}

function electronCommand(files) {
  const args = [
    "--dir",
    "app",
    "exec",
    "playwright",
    "test",
    ...files,
    "--project=electron",
    "--workers=1",
    "--reporter=list",
    "--trace=retain-on-failure"
  ];
  if (process.platform !== "linux" || process.env.DISPLAY) {
    return { command: pnpm, args };
  }
  const xvfb = run("which", ["xvfb-run"], { capture: true });
  if (xvfb.status !== 0) {
    fail("Linux Stage 19 Electron verification requires xvfb-run when DISPLAY is absent.", xvfb);
  }
  return { command: "xvfb-run", args: ["-a", pnpm, ...args] };
}

process.stdout.write(
  `[stage19] fixed regression gate; allowDirty=${allowDirty}; protectedEvidence=NOT_USED\n`
);

assertWorktreePolicy();
phase("Repository tracked-path hygiene", "python", [
  "scripts/check_repo_hygiene.py",
  "--tracked"
]);
phase("Foundation reachability and coverage policy", process.execPath, [
  "scripts/verify-foundation-inventory.mjs"
]);
phase("Git diff hygiene", "git", ["diff", "--check"]);
phase("Packaging workflow manual-dispatch policy", process.execPath, [
  "scripts/stage19-packaging-workflow-policy.mjs"
]);
phase("First-party app lint with zero-warning ceiling", process.execPath, [
  "scripts/run-app-eslint.mjs"
]);
phase("Active Stage 19 lint with zero-warning ceiling", process.execPath, [
  "scripts/run-stage19-eslint.mjs"
]);
phase("Full app TypeScript boundary", pnpm, [
  "--dir",
  "app",
  "run",
  "typecheck:all"
]);
phase("Renderer and main production build", pnpm, [
  "--dir",
  "app",
  "run",
  "build:production"
]);
phase("Critical unit, component, and contract matrix", pnpm, [
  "--filter",
  "app",
  "test",
  "--",
  "--run",
  "--maxWorkers=1",
  ...unitFiles
]);
const electronPreflight = electronCommand(electronPreflightFiles);
phase(
  "Critical Stage 19 Electron startup preflight",
  electronPreflight.command,
  electronPreflight.args,
);
const electron = electronCommand(electronFiles);
phase("Critical Stage 19 Electron matrix", electron.command, electron.args);

process.stdout.write(
  `\nSTAGE19_REGRESSION_PASS\nworktree=${allowDirty ? "DEVELOPMENT_OVERRIDE" : "CLEAN_RC_ELIGIBLE"}\nprotectedEvidence=NOT_USED\n`
);
