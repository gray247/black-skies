import { describe, expect, it } from 'vitest';
import { buildFirstWindowDiagnostics } from '../../tests/e2e/electronFirstWindowDiagnostics';

describe('buildFirstWindowDiagnostics', () => {
  it('emits expected launch/process/env/window diagnostics shape when firstWindow fails', () => {
    const diagnostics = buildFirstWindowDiagnostics({
      reason: 'timeout',
      timeoutMs: 30_000,
      processState: {
        pid: 4242,
        exited: true,
        exitCode: 1,
        exitSignal: null,
      },
      currentWindowCount: 0,
      launchContext: {
        appDir: '/tmp/app',
        entryPoint: '/tmp/app/dist-electron/main/main.js',
        rendererUrl: 'file:///tmp/app/dist/index.html',
        packagedEntry: '/tmp/app/dist-electron/main/main.js',
        packagedEntryExists: true,
        devFallback: '/tmp/app/main/main.ts',
        devFallbackExists: true,
        rendererIndex: '/tmp/app/dist/index.html',
        rendererIndexExists: true,
        launchEnv: {
          ELECTRON_RENDERER_URL: 'file:///tmp/app/dist/index.html',
          PLAYWRIGHT: '1',
          BLACKSKIES_SERVICES_PORT: '9999',
          BLACKSKIES_E2E_PORT: '9999',
          BLACKSKIES_E2E_MODE: '1',
          BLACKSKIES_E2E_EXTERNAL_SERVICE: '1',
          BLACKSKIES_ENABLE_HARNESS_HOOKS: '1',
        },
      },
      output: {
        stdout: 'stdout output',
        stderr: 'stderr output',
      },
      fallbackAppDir: '/fallback',
      fallbackEnv: {},
    });

    expect(diagnostics.electronProcessPid).toBe(4242);
    expect(diagnostics.electronProcessExited).toBe(true);
    expect(diagnostics.electronExitCode).toBe(1);
    expect(diagnostics.electronExitSignal).toBeNull();
    expect(diagnostics.currentWindowCount).toBe(0);

    expect(diagnostics.entryPoint).toContain('main.js');
    expect(diagnostics.packagedEntryExists).toBe(true);
    expect(diagnostics.devFallbackExists).toBe(true);
    expect(diagnostics.rendererIndexExists).toBe(true);

    expect(diagnostics.launchEnv.PLAYWRIGHT).toBe('1');
    expect(diagnostics.launchEnv.BLACKSKIES_SERVICES_PORT).toBe('9999');
    expect(diagnostics.stdout).toBe('stdout output');
    expect(diagnostics.stderr).toBe('stderr output');
  });
});
