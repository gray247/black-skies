#!/usr/bin/env node

/**
 * Placeholder Electron shell launcher for offline development.
 * Replace with the real Electron bootstrap when wiring up the desktop shell.
 */

import process from 'node:process';

const rendererUrl = process.env.ELECTRON_RENDERER_URL ?? 'http://127.0.0.1:5173/';

console.log('[electron] Starting placeholder Electron shell.');
console.log('[electron] Renderer dev server URL:', rendererUrl);
console.log('[electron] TODO: Replace scripts/electron-dev-placeholder.mjs with the real Electron main process.');

const keepAlive = setInterval(() => {
  // Keep the placeholder process running until the dev server exits.
}, 60_000);

function shutdown(signal) {
  console.log(`[electron] Received ${signal}. Shutting down placeholder shell.`);
  clearInterval(keepAlive);
  process.exit(0);
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
