import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import test from 'node:test';

import {
  portOwner,
  probeRenderer,
  rendererResponseLooksHealthy,
  rendererWorkspaceIdentity,
  waitForRenderer,
} from './dev-runner.mjs';
import {
  buildElectronEnvironment,
  buildElectronArgs,
  cleanupDevUserDataDirectory,
  createDevUserDataDirectory,
} from './electron-dev.mjs';

test('recognizes the Black Skies Vite document as healthy', () => {
  const identity = rendererWorkspaceIdentity();
  const marker = `<meta name="black-skies-workspace" content="${identity}">`;
  assert.equal(rendererResponseLooksHealthy(`<title>Black Skies</title>${marker}<div id="root"></div>`), true);
  assert.equal(rendererResponseLooksHealthy(`<title>Another app</title>${marker}<div id="root"></div>`), false);
  assert.equal(rendererResponseLooksHealthy('<title>Black Skies</title><div id="root"></div>'), false);
  assert.equal(
    rendererResponseLooksHealthy(
      '<title>Black Skies</title><meta name="black-skies-workspace" content="another-checkout"><div id="root"></div>',
    ),
    false,
  );
});

test('classifies an unused renderer port as available', async () => {
  const result = await probeRenderer('http://127.0.0.1:51739/', 100);
  assert.equal(result.state, 'available');
});

test('classifies a different HTTP application as occupied and identifies its listener', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end('<title>Another application</title>');
  });
  await new Promise((resolve) => server.listen(51739, '127.0.0.1', resolve));
  try {
    const result = await probeRenderer('http://127.0.0.1:51739/', 100);
    assert.equal(result.state, 'occupied');
    if (process.platform === 'win32') {
      const owner = portOwner(51739);
      assert.ok(owner?.pid);
      assert.ok(owner?.name);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('waits without claiming an unavailable port is healthy', async () => {
  const result = await waitForRenderer('http://127.0.0.1:51739/', 150);
  assert.equal(result.state, 'timeout');
});

test('uses a unique disposable user-data directory for development Electron launches', () => {
  const first = createDevUserDataDirectory();
  const second = createDevUserDataDirectory();
  try {
    assert.notEqual(first, second);
    assert.equal(buildElectronArgs(first)[0], `--user-data-dir=${first}`);
    assert.equal(buildElectronArgs(second)[0], `--user-data-dir=${second}`);
    assert.equal(buildElectronArgs(first).includes('--disable-gpu'), false);
    assert.equal(buildElectronArgs(first, { disableGpu: true })[0], '--disable-gpu');
    assert.equal(buildElectronArgs(first).at(-1), './dist-electron/main/main.js');
  } finally {
    cleanupDevUserDataDirectory(first);
    cleanupDevUserDataDirectory(second);
  }
  assert.equal(existsSync(first), false);
  assert.equal(existsSync(second), false);
});

test('reserves the disposable profile for development logging', () => {
  const userDataDirectory = createDevUserDataDirectory();
  try {
    const env = buildElectronEnvironment('http://127.0.0.1:5173/', userDataDirectory, undefined, {
      EXISTING_ENV: 'preserved',
    });
    assert.equal(env.EXISTING_ENV, 'preserved');
    assert.equal(env.BLACKSKIES_DEV_LOG_BASE, userDataDirectory);
    assert.equal(env.ELECTRON_RENDERER_URL, 'http://127.0.0.1:5173/');
  } finally {
    cleanupDevUserDataDirectory(userDataDirectory);
  }
});
