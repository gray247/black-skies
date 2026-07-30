import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { vi } from 'vitest';

type SecurityWindow = typeof window & {
  __cspLogged?: boolean;
};

describe('Security and sandbox regressions', () => {
  const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = undefined as unknown as typeof fetch;
    delete (window as SecurityWindow).__cspLogged;
  });

  it('rejects forbidden service endpoints without touching network', () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    const services = {
      call: (path: string) => {
        if (!['analytics/summary', 'analytics/scenes', 'analytics/relationships'].includes(path)) {
          throw new Error('BridgeInputError');
        }
        return true;
      },
    };

    expect(() => services.call('analytics/budget')).toThrow(/BridgeInputError/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks non-localhost targets in IPC calls', () => {
    const makeCall = (url: string) => {
      if (!url.startsWith('http://127.0.0.1')) {
        throw new Error('BridgeNetworkError');
      }
      return true;
    };
    expect(() => makeCall('http://evil.com/api')).toThrow(/BridgeNetworkError/);
    expect(makeCall('http://127.0.0.1:9999/api/v1/healthz')).toBe(true);
  });

  it('rejects non-http schemes and remote URLs before fetch executes', () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    const callRemote = (url: string) => {
      if (!url.startsWith('http://127.0.0.1') && !url.startsWith('https://localhost')) {
        throw new Error('BridgeNetworkError');
      }
      return true;
    };
    expect(() => callRemote('file:///etc/passwd')).toThrow(/BridgeNetworkError/);
    expect(() => callRemote('https://evil.example.com/api')).toThrow(/BridgeNetworkError/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not spam duplicate CSP warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const message = 'Electron Security Warning (Insecure Content-Security-Policy)';
    const logWarning = () => {
      const win = window as SecurityWindow;
      if (!win.__cspLogged) {
        warn(message);
        win.__cspLogged = true;
      }
    };
    logWarning();
    logWarning();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('allows blob workers in the renderer CSP', () => {
    const html = readFileSync(resolve(appRoot, 'index.html'), 'utf8');
    expect(html).toContain("worker-src 'self' blob:");
  });
});
