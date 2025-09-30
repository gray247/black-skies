#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filePath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(filePath);
const repoRoot = path.resolve(scriptDir, '..');
const appDir = path.join(repoRoot, 'app');
const args = process.argv.slice(2);

const candidateBins = new Set();

if (process.env.VITEST_BINARY) {
  candidateBins.add(process.env.VITEST_BINARY);
}

const vitestExecutableName = process.platform === 'win32' ? 'vitest.cmd' : 'vitest';

candidateBins.add(path.join(appDir, 'node_modules', '.bin', vitestExecutableName));
candidateBins.add(path.join(repoRoot, 'node_modules', '.bin', vitestExecutableName));

const vitestBinary = Array.from(candidateBins).find((candidate) => existsSync(candidate));

if (!vitestBinary) {
  console.warn(
    'Vitest binary not found. Skipping renderer tests. Install Node dependencies to enable Vitest execution.'
  );
  process.exit(0);
}

const vitestArgs = ['run', ...args];
const spawnOptions = { stdio: 'inherit', shell: process.platform === 'win32' };

const child = spawn(vitestBinary, vitestArgs, spawnOptions);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('Failed to launch Vitest binary:', error);
  process.exit(1);
});
