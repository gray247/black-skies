#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'app');

function runBuild() {
  const build = spawnSync('pnpm', ['--filter', 'app', 'build:main'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

function startElectron() {
  const electronBin = path.join(
    appRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'electron.cmd' : 'electron',
  );
  const rendererUrl = process.env.ELECTRON_RENDERER_URL ?? 'http://127.0.0.1:5173/';
  let pythonExecutable = process.env.BLACKSKIES_PYTHON;
  if (!pythonExecutable) {
    if (process.platform === 'win32') {
      pythonExecutable = path.join(repoRoot, '.venv', 'Scripts', 'python.exe');
    } else {
      pythonExecutable = path.join(repoRoot, '.venv', 'bin', 'python');
    }
  }

  const child = spawn(electronBin, ['./dist-electron/main/main.js'], {
    cwd: appRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ELECTRON_RENDERER_URL: rendererUrl,
      BLACKSKIES_PYTHON: pythonExecutable,
    },
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}

runBuild();
startElectron();
