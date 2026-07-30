import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { resetRendererTestState } from './testCleanup';

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
  // Renderer globals are declared in types/global.d.ts. Individual tests install
  // only the bridge surfaces their owning contract exercises.
});

afterEach(() => {
  resetRendererTestState();
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
