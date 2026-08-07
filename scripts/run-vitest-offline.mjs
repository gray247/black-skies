import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { assertPipeChildProcessSupport } from './pipe_spawn_preflight.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const appDir = path.join(repoRoot, 'app');
function runVitest() {
  assertPipeChildProcessSupport('Vitest renderer/unit validation');

  let vitestCli;
  try {
    vitestCli = path.join(appDir, 'node_modules', 'vitest', 'vitest.mjs');
    if (!existsSync(vitestCli)) throw new Error('Vitest CLI is unavailable.');
  } catch (error) {
    const offlineRunner = path.join(__dirname, 'offline-vitest-runner.mjs');
    const offlineResult = spawnSync(process.execPath, [offlineRunner, ...process.argv.slice(2)], {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    if (offlineResult.error) {
      throw offlineResult.error;
    }

    return offlineResult.status ?? 1;
  }

  const result = spawnSync(
    process.execPath,
    [vitestCli, 'run', ...process.argv.slice(2).filter((argument) => argument !== '--run')],
    { cwd: appDir, stdio: 'inherit', env: process.env },
  );
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
}

const exitCode = runVitest();
process.exit(exitCode);
