import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const appDir = path.join(repoRoot, "app");

const lintTargets = [
  "renderer/**/*.{ts,tsx}",
  "electron/**/*.ts",
  "shared/**/*.ts"
];

const require = createRequire(import.meta.url);

let eslintExecutable;
try {
  eslintExecutable = require.resolve(".bin/eslint", {
    paths: [
      path.join(appDir, "node_modules"),
      path.join(repoRoot, "node_modules")
    ]
  });
} catch (error) {
  process.stdout.write(
    "Skipping ESLint run: install Node dev dependencies to enable linting.\n"
  );
  process.exit(0);
}

const legacyConfigPath = path.join(repoRoot, ".eslintrc.cjs");

const { status, error } = spawnSync(
  eslintExecutable,
  ["--config", legacyConfigPath, ...lintTargets],
  {
    cwd: appDir,
    stdio: "inherit",
    shell: process.platform === "win32"
  }
);

if (error) {
  throw error;
}

process.exit(status ?? 1);
