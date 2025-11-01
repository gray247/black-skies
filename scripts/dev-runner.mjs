#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function createChild(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    ...options,
  });

  child.on('error', (error) => {
    console.error(`[dev-runner] ${command} failed to start`, error);
    process.exit(1);
  });

  return child;
}

const renderer = createChild('pnpm', ['--filter', 'app', 'dev', '--', '--host', '127.0.0.1', '--port', '5173']);
const electron = createChild('node', ['./scripts/electron-dev.mjs'], { env: { ...process.env } });

function shutdown(code = 0) {
  if (!renderer.killed) {
    renderer.kill();
  }
  if (!electron.killed) {
    electron.kill();
  }
  process.exit(code);
}

renderer.on('exit', (code) => {
  if (code !== 0) {
    console.error('[dev-runner] Renderer process exited with code', code);
    shutdown(code ?? 1);
  }
  // renderer completed (e.g., vite closed); terminate Electron too
  shutdown(0);
});

electron.on('exit', (code) => {
  if (code !== 0) {
    console.error('[dev-runner] Electron process exited with code', code);
  }
  shutdown(code ?? 0);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
