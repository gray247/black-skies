#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const electronEntryPoint = resolve(projectRoot, 'dist-electron', 'main.js');
const PNPM_COMMAND = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

let viteProcess = null;
let electronProcess = null;
let shuttingDown = false;
let launchingElectron = false;
let rendererUrl = 'http://127.0.0.1:5173/';

function spawnProcess(command, args, options) {
  return spawn(command, args, {
    cwd: projectRoot,
    ...options,
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, {
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const reason = typeof code === 'number' ? `exit code ${code}` : `signal ${signal ?? 'unknown'}`;
      reject(new Error(`${command} ${args.join(' ')} failed with ${reason}`));
    });
  });
}

function killChild(child) {
  if (!child) {
    return;
  }

  if (!child.killed) {
    child.kill();
  }
}

async function launchElectron() {
  if (electronProcess || launchingElectron) {
    return;
  }

  launchingElectron = true;

  try {
    await runCommand(PNPM_COMMAND, ['--filter', 'app', 'build:main']);

    if (!existsSync(electronEntryPoint)) {
      throw new Error(`Electron entry point not found at ${electronEntryPoint}`);
    }

    electronProcess = spawnProcess(PNPM_COMMAND, ['exec', 'electron', electronEntryPoint], {
      stdio: 'inherit',
      env: {
        ...process.env,
        ELECTRON_RENDERER_URL: rendererUrl,
      },
    });

    electronProcess.on('exit', (code, signal) => {
      electronProcess = null;
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;
      killChild(viteProcess);

      const exitCode = typeof code === 'number' ? code : 1;
      if (signal) {
        console.error(`Electron exited due to signal ${signal}`);
      }
      process.exit(exitCode);
    });

    electronProcess.on('error', (error) => {
      console.error('Failed to start Electron:', error);
      shuttingDown = true;
      killChild(viteProcess);
      process.exit(1);
    });
  } catch (error) {
    console.error('Unable to launch Electron:', error);
    shuttingDown = true;
    killChild(viteProcess);
    process.exit(1);
  } finally {
    launchingElectron = false;
  }
}

function setupSignalHandlers() {
  const handleSignal = (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    killChild(electronProcess);
    killChild(viteProcess);

    if (signal === 'SIGINT') {
      process.exit(0);
    }
  };

  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);
}

function startVite() {
  viteProcess = spawnProcess(PNPM_COMMAND, ['--filter', 'app', 'dev'], {
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  viteProcess.stdout?.on('data', (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);

    if (launchingElectron || electronProcess) {
      return;
    }

    const urlMatch = text.match(/https?:\/\/127\.0\.0\.1:\d+\/?/);
    if (urlMatch) {
      rendererUrl = urlMatch[0].endsWith('/') ? urlMatch[0] : `${urlMatch[0]}/`;
      void launchElectron();
    }
  });

  viteProcess.stderr?.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  viteProcess.on('exit', (code, signal) => {
    viteProcess = null;
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    killChild(electronProcess);

    if (typeof code === 'number') {
      process.exit(code);
      return;
    }

    if (signal) {
      console.error(`Vite exited due to signal ${signal}`);
    }
    process.exit(1);
  });

  viteProcess.on('error', (error) => {
    console.error('Failed to start Vite:', error);
    shuttingDown = true;
    killChild(electronProcess);
    process.exit(1);
  });
}

setupSignalHandlers();
startVite();
