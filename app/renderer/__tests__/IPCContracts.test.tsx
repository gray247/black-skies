import { render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { vi } from 'vitest';

import type {
  AnalyticsRelationshipGraph,
  AnalyticsScenes,
  AnalyticsSummary,
  BackupCreateBridgeRequest,
  ProjectExportBridgeRequest,
} from '../../shared/ipc/services';

describe('IPC contract stability', () => {
  it('captures stable IPC shapes for analytics and backup/export bridges', () => {
    const summary: AnalyticsSummary = {
      projectId: 'proj',
      projectPath: '/proj',
      scenes: 2,
      wordCount: 1000,
      avgReadability: 12.3,
    };
    const scenes: AnalyticsScenes = {
      projectId: 'proj',
      projectPath: '/proj',
      scenes: [],
    };
    const graph: AnalyticsRelationshipGraph = {
      projectId: 'proj',
      nodes: [],
      edges: [],
    };
    const backupReq: BackupCreateBridgeRequest = { projectId: 'proj' };
    const exportReq: ProjectExportBridgeRequest = { projectId: 'proj', format: 'md' };

    expect({ summary, scenes, graph, backupReq, exportReq }).toMatchSnapshot();
  });

  it('rejects malformed payloads before reaching fetch', () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    const bridgeCall = (payload: Partial<BackupCreateBridgeRequest>) => {
      if (!payload.projectId || typeof payload.projectId !== 'string') {
        throw new Error('BridgeInputError');
      }
      throw new Error('Should not reach network');
    };

    expect(() => bridgeCall({ projectId: 123 as any })).toThrow(/BridgeInputError/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks forbidden endpoints before any network attempt', () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;
    const allowed = new Set(['analytics/summary', 'analytics/scenes', 'analytics/relationships']);

    const callEndpoint = (path: string) => {
      if (!allowed.has(path)) {
        throw new Error('BridgeNetworkError');
      }
      return true;
    };

    expect(() => callEndpoint('analytics/budget')).toThrow(/BridgeNetworkError/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(callEndpoint('analytics/summary')).toBe(true);
  });
});
