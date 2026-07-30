import { vi } from 'vitest';

import type { LayoutBridge } from '../../shared/ipc/layout';
import type { ProjectLoaderApi } from '../../shared/ipc/projectLoader';
import type { ServicesBridge, ServiceResult } from '../../shared/ipc/services';

const unavailable = <T>(): ServiceResult<T> => ({
  ok: false,
  error: {
    code: 'CAPABILITY_UNAVAILABLE',
    message: 'Capability unavailable in this test fixture.',
  },
});

export function createServicesBridgeMock(
  overrides: Partial<ServicesBridge> = {},
): ServicesBridge {
  return {
    checkHealth: vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'CAPABILITY_UNAVAILABLE',
        message: 'Capability unavailable in this test fixture.',
      },
    }),
    buildOutline: vi.fn().mockResolvedValue(unavailable()),
    generateDraft: vi.fn().mockResolvedValue(unavailable()),
    critiqueDraft: vi.fn().mockResolvedValue(unavailable()),
    preflightDraft: vi.fn().mockResolvedValue(unavailable()),
    ...overrides,
  };
}

export function createProjectLoaderMock(
  overrides: Partial<ProjectLoaderApi> = {},
): ProjectLoaderApi {
  return {
    openProjectDialog: vi.fn().mockResolvedValue(null),
    loadProject: vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'UNKNOWN',
        message: 'Project loading is unavailable in this test fixture.',
      },
    }),
    ...overrides,
  };
}

export function createLayoutBridgeMock(overrides: Partial<LayoutBridge> = {}): LayoutBridge {
  return {
    loadLayout: vi.fn().mockResolvedValue({
      layout: null,
      floatingPanes: [],
    }),
    saveLayout: vi.fn().mockResolvedValue(undefined),
    resetLayout: vi.fn().mockResolvedValue(undefined),
    openFloatingPane: vi.fn().mockResolvedValue({ opened: false }),
    closeFloatingPane: vi.fn().mockResolvedValue(undefined),
    listFloatingPanes: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}
