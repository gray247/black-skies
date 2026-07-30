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

const lintTargets = [
  "renderer/Stage19WritingSpineApp.tsx",
  "renderer/DraftEditor.tsx",
  "main/main.ts",
  "main/preload.ts",
  "main/projectSpineIpc.ts",
  "main/projectSpineRecoveryRepository.ts",
  "main/projectSpineRecoveryCheckpoints.ts",
  "main/projectSpineMarkdownExport.ts",
  "main/aiCritiqueIpc.ts",
  "main/aiCritiqueCoordinator.ts",
  "main/aiCritiqueGateway.ts",
  "main/optionalServiceStartup.ts",
  "main/pythonExecutablePolicy.ts",
  "main/packagedRuntimePolicy.ts",
  "main/stage19Preload.ts",
  "scripts/stage19-installed-smoke.mjs",
  "scripts/stage19-package-verify.mjs",
  "shared/ipc/projectSpine.ts",
  "shared/ipc/aiCritique.ts",
  "shared/splitCommandAuthority.ts",
  "tests/e2e/stage19-project-spine.spec.ts",
  "tests/e2e/stage19-electron-support.ts",
  "tests/e2e/stage19-recovery.spec.ts",
  "tests/e2e/stage19-command-center-integrity.spec.ts",
  "tests/e2e/stage19-ai-critique.spec.ts",
  "tests/e2e/stage19-accessibility.spec.ts",
  "tests/e2e/stage19-performance.spec.ts"
];

const eslintExecutable = require.resolve(".bin/eslint", {
  paths: [
    path.join(appDir, "node_modules"),
    path.join(repoRoot, "node_modules")
  ]
});

const result = spawnSync(
  eslintExecutable,
  [
    "--config",
    path.join(repoRoot, "eslint.config.js"),
    "--max-warnings",
    "0",
    ...lintTargets
  ],
  {
    cwd: appDir,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32"
  }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
