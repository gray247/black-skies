import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

beforeAll(() => {
  if (typeof document === 'undefined') {
    return;
  }
  if (!document.getElementById('modal-root')) {
    const modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  }
});

beforeEach(() => {
  // Ensure a global window.bridge exists for tests
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.window = global.window || {};
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.window.bridge = global.window.bridge || {};

  // minimal stable mocks used widely by renderer tests
  // keep these lightweight; individual tests can override as needed
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.bridge.listSnapshots = window.bridge.listSnapshots || vi.fn().mockResolvedValue([]);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.bridge.revealPath = window.bridge.revealPath || vi.fn().mockResolvedValue(true);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.bridge.getLastVerification =
    window.bridge.getLastVerification || vi.fn().mockResolvedValue(null);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.bridge.runBackupVerification =
    window.bridge.runBackupVerification || vi.fn().mockResolvedValue({ ok: true });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.bridge.restoreFromZip =
    window.bridge.restoreFromZip ||
    vi.fn().mockResolvedValue({
      ok: true,
      data: {
        status: 'ok',
        restored_path: '/tmp',
        restored_project_slug: 'demo_restored',
      },
    });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.bridge.exportProject =
    window.bridge.exportProject || vi.fn().mockResolvedValue({ status: 'ok', path: 'exports/' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  if (typeof document === 'undefined') {
    return;
  }
  const modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    modalRoot.remove();
  }
});
