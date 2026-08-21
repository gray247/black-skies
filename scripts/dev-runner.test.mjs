import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { portOwner, probeRenderer, rendererResponseLooksHealthy, waitForRenderer } from './dev-runner.mjs';

test('recognizes the Black Skies Vite document as healthy', () => {
  assert.equal(rendererResponseLooksHealthy('<title>Black Skies</title><div id="root"></div>'), true);
  assert.equal(rendererResponseLooksHealthy('<title>Another app</title><div id="root"></div>'), false);
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
