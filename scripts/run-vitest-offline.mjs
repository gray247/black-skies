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
  const offlineRunner = path.join(__dirname, "offline-vitest-runner.mjs");
  const offlineResult = spawnSync(process.execPath, [offlineRunner, ...process.argv.slice(2)], {
    cwd: repoRoot,
    stdio: "inherit"
  });

  if (offlineResult.error) {
    throw offlineResult.error;
  }

  process.exit(offlineResult.status ?? 1);
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
