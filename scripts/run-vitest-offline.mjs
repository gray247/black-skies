import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertPipeChildProcessSupport } from './pipe_spawn_preflight.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const appDir = path.join(repoRoot, 'app');
const require = createRequire(import.meta.url);

async function runVitest() {
  assertPipeChildProcessSupport('Vitest renderer/unit validation');

  let parseCLI;
  let startVitest;
  let vitestConfig;
  try {
    const vitestNodeModule = require.resolve('vitest/node', {
      paths: [path.join(appDir, 'node_modules'), path.join(repoRoot, 'node_modules')],
    });
    ({ parseCLI, startVitest } = await import(pathToFileURL(vitestNodeModule).href));
    const vitestConfigModule = await import(new URL('../app/vitest.config.mjs', import.meta.url).href);
    vitestConfig = vitestConfigModule.default ?? vitestConfigModule;
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

  const { filter, options } = parseCLI(['vitest', ...process.argv.slice(2)], {
    allowUnknownOptions: true,
  });
  options.config = false;
  options.root = appDir;
  options.run = true;
  const ctx = await startVitest('test', filter, options, vitestConfig);
  if (!ctx?.shouldKeepServer()) {
    await ctx?.exit();
  }
  return ctx?.config.exitCode ?? 0;
}

const exitCode = await runVitest();
process.exit(exitCode);
