import { spawnSync } from 'node:child_process';

export function assertPipeChildProcessSupport(context) {
  const probe = spawnSync(process.execPath, ['-e', 'process.exit(0)'], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  if (!probe.error) {
    return;
  }

  if (probe.error.code === 'EPERM') {
    throw new Error(
      `[${context}] This workspace blocks pipe-based child-process spawn on Windows. ` +
        'Playwright workers and Vitest/esbuild service startup both depend on pipe channels, ' +
        'so this validation lane cannot run here until the environment allows pipe-based child processes.',
    );
  }

  throw probe.error;
}
