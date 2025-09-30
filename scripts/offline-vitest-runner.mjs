import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const offlineTestsDir = path.join(repoRoot, "app", "offline-tests");

const testMap = new Map([
  ["AppRecovery.test.tsx", path.join(offlineTestsDir, "AppRecovery.offline.test.mjs")],
]);

function collectTargets(args) {
  if (args.length === 0) {
    return Array.from(new Set(testMap.values()));
  }

  const targets = [];
  for (const arg of args) {
    const mapped = testMap.get(arg);
    if (mapped) {
      targets.push(mapped);
    }
  }
  return targets;
}

const cliArgs = process.argv.slice(2);
const targets = collectTargets(cliArgs);

if (targets.length === 0) {
  process.stdout.write(
    "No offline renderer tests mapped for the requested pattern. Install Node dev dependencies to run the full Vitest suite.\n",
  );
  process.exit(0);
}

const result = spawnSync(process.execPath, ["--test", ...targets], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);

