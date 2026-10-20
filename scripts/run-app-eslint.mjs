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
  "shared/**/*.ts"
];

const require = createRequire(import.meta.url);

let eslintExecutable;
try {
  eslintExecutable = path.join(path.dirname(require.resolve("eslint/package.json", {
    paths: [
      path.join(appDir, "node_modules"),
      path.join(repoRoot, "node_modules")
    ]
  })), "bin", "eslint.js");
} catch (error) {
  process.stdout.write(
    "Skipping ESLint run: install Node dev dependencies to enable linting.\n"
  );
  process.exit(0);
}

const flatConfigPath = path.join(repoRoot, "eslint.config.js");

const { status, error } = spawnSync(
  process.execPath,
  [eslintExecutable, "--config", flatConfigPath, "--max-warnings", "0", ...lintTargets],
  {
    cwd: appDir,
    env: process.env,
    stdio: "inherit"
  }
);

if (error) {
  throw error;
}

process.exit(status ?? 1);
