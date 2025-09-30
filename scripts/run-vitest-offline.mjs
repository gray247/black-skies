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

let vitestExecutable;
try {
  vitestExecutable = require.resolve(".bin/vitest", {
    paths: [
      path.join(appDir, "node_modules"),
      path.join(repoRoot, "node_modules")
    ]
  });
} catch (error) {
  process.stdout.write(
    "Skipping Vitest run: install Node dev dependencies to enable renderer tests.\n"
  );
  process.exit(0);
}

const vitestArgs = ["run", ...process.argv.slice(2)];
const { status, error } = spawnSync(vitestExecutable, vitestArgs, {
  cwd: appDir,
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (error) {
  throw error;
}

process.exit(status ?? 1);
