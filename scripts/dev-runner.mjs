#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { request } from 'node:http';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export const DEV_SERVER_URL = 'http://127.0.0.1:5173/';

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

export function rendererResponseLooksHealthy(body) {
  return body.includes('<title>Black Skies</title>') && body.includes('id="root"');
}

export function probeRenderer(url = DEV_SERVER_URL, timeoutMs = 800) {
  return new Promise((resolve) => {
    const requestUrl = new URL(url);
    const probe = request({
      hostname: requestUrl.hostname,
      port: requestUrl.port,
      path: requestUrl.pathname,
      method: 'GET',
      timeout: timeoutMs,
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({
        state: response.statusCode && response.statusCode >= 200 && response.statusCode < 300
          ? rendererResponseLooksHealthy(body) ? 'healthy' : 'occupied'
          : 'occupied',
        statusCode: response.statusCode ?? null,
      }));
    });
    probe.on('timeout', () => probe.destroy(new Error('renderer probe timed out')));
    probe.on('error', () => resolve({ state: 'available', statusCode: null }));
    probe.end();
  });
}

export function portOwner(port = 5173) {
  try {
    if (process.platform === 'win32') {
      const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
      const match = output.match(new RegExp(`\\b127\\.0\\.0\\.1:${port}\\s+[^\\r\\n]*?LISTENING\\s+(\\d+)`, 'i'))
        ?? output.match(new RegExp(`\\b0\\.0\\.0\\.0:${port}\\s+[^\\r\\n]*?LISTENING\\s+(\\d+)`, 'i'))
        ?? output.match(new RegExp(`\\[::\\]:${port}\\s+[^\\r\\n]*?LISTENING\\s+(\\d+)`, 'i'));
      if (!match) return null;
      const pid = Number(match[1]);
      let name = 'unknown process';
      try {
        name = execFileSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8' })
          .trim().split(',')[0]?.replace(/^"|"$/g, '') || name;
      } catch {
        // PID is still useful when process-name lookup is unavailable.
      }
      return { pid, name };
    }
    const output = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp', '-Fc'], { encoding: 'utf8' });
    const pid = Number(output.match(/^p(\d+)/m)?.[1]);
    const name = output.match(/^c(.+)/m)?.[1] ?? 'unknown process';
    return Number.isInteger(pid) ? { pid, name } : null;
  } catch {
    return null;
  }
}

export async function waitForRenderer(url = DEV_SERVER_URL, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await probeRenderer(url);
    if (result.state === 'healthy') return result;
    if (result.state === 'occupied') return result;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return { state: 'timeout', statusCode: null };
}

export async function runDev() {
  const initial = await probeRenderer();
  let renderer = null;
  let rendererOwned = false;
  if (initial.state === 'healthy') {
    console.log('[dev-runner] Reusing the healthy Black Skies renderer at 127.0.0.1:5173.');
  } else if (initial.state === 'occupied') {
    const owner = portOwner();
    const ownerLabel = owner ? `${owner.name} (PID ${owner.pid})` : 'an unidentified process';
    console.error(`[dev-runner] Port 5173 is occupied by ${ownerLabel}; it is not a healthy Black Skies renderer. Stop that process deliberately, then retry.`);
    return 1;
  } else {
    rendererOwned = true;
    renderer = createChild('pnpm', ['--filter', 'app', 'dev', '--', '--host', '127.0.0.1', '--port', '5173']);
    const ready = await waitForRenderer();
    if (ready.state !== 'healthy') {
      const owner = portOwner();
      const ownerLabel = owner ? `${owner.name} (PID ${owner.pid})` : 'no identifiable listener';
      console.error(`[dev-runner] Renderer did not become healthy on port 5173 (${ownerLabel}).`);
      renderer.kill();
      return 1;
    }
  }

  const electron = createChild('node', ['./scripts/electron-dev.mjs'], { env: { ...process.env } });

  return await new Promise((resolve) => {
    let finished = false;
    const shutdown = (code = 0) => {
      if (finished) return;
      finished = true;
      if (rendererOwned && renderer && !renderer.killed) renderer.kill();
      if (!electron.killed) electron.kill();
      resolve(code);
    };
    renderer?.on('exit', (code) => {
      if (code !== 0) {
        console.error('[dev-runner] Renderer process exited with code', code);
        shutdown(code ?? 1);
      } else {
        shutdown(0);
      }
    });
    electron.on('exit', (code) => {
      if (code !== 0) console.error('[dev-runner] Electron process exited with code', code);
      shutdown(code ?? 0);
    });
    process.once('SIGINT', () => shutdown(0));
    process.once('SIGTERM', () => shutdown(0));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runDev().then((code) => process.exit(code)).catch((error) => {
    console.error('[dev-runner] Failed to start development surfaces', error);
    process.exit(1);
  });
}
