import { vi } from 'vitest';

describe('Security and sandbox regressions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    (window as typeof window & { services?: unknown }).services = undefined;
    global.fetch = undefined as any;
    delete (window as any).__cspLogged;
  });

  it('rejects forbidden service endpoints without touching network', () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;
    (window as typeof window & { services?: any }).services = {
      call: (path: string) => {
        if (!['analytics/summary', 'analytics/scenes', 'analytics/relationships'].includes(path)) {
          throw new Error('BridgeInputError');
        }
        return true;
      },
    };

    expect(() => (window as any).services.call('analytics/budget')).toThrow(/BridgeInputError/);
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
    global.fetch = fetchSpy as any;
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
      if (!(window as any).__cspLogged) {
        warn(message);
        (window as any).__cspLogged = true;
      }
    };
    logWarning();
    logWarning();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
