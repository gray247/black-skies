import { assertPipeChildProcessSupport } from './pipe_spawn_preflight.mjs';

export default async function globalSetup() {
  assertPipeChildProcessSupport('Playwright harness validation');
}
