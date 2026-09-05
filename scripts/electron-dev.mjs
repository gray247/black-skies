#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { tmpdir } from 'node:os';

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

export function createDevUserDataDirectory() {
  return mkdtempSync(path.join(tmpdir(), 'black-skies-dev-user-data-'));
}

export function buildElectronArgs(userDataDirectory, { disableGpu = false } = {}) {
  return [
    ...(disableGpu ? ['--disable-gpu'] : []),
    `--user-data-dir=${userDataDirectory}`,
    './dist-electron/main/main.js',
  ];
}

export function cleanupDevUserDataDirectory(userDataDirectory) {
  rmSync(userDataDirectory, { recursive: true, force: true });
}

export function buildElectronEnvironment(rendererUrl, userDataDirectory, pythonExecutable, baseEnvironment = process.env) {
  const env = {
    ...baseEnvironment,
    ELECTRON_RENDERER_URL: rendererUrl,
    BLACKSKIES_DEV_LOG_BASE: userDataDirectory,
  };
  if (pythonExecutable && existsSync(pythonExecutable)) {
    env.BLACKSKIES_PYTHON = pythonExecutable;
  } else {
    delete env.BLACKSKIES_PYTHON;
  }
  return env;
}

export function startElectron() {
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

  if (pythonExecutable && existsSync(pythonExecutable)) {
    pythonExecutable = path.resolve(pythonExecutable);
  }

  const userDataDirectory = createDevUserDataDirectory();
  const env = buildElectronEnvironment(rendererUrl, userDataDirectory, pythonExecutable);
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    cleanupDevUserDataDirectory(userDataDirectory);
  };

  const child = spawn(electronBin, buildElectronArgs(userDataDirectory, {
    disableGpu: process.env.BLACKSKIES_DISABLE_GPU === '1',
  }), {
    cwd: appRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env,
  });

  child.on('error', (error) => {
    cleanup();
    console.error('[electron-dev] Electron failed to start', error);
    process.exit(1);
  });
  child.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runBuild();
  startElectron();
}
