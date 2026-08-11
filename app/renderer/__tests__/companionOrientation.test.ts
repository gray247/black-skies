import { describe, expect, it } from 'vitest';

import {
  COMPANION_ORIENTATION_SCHEMA_VERSION,
  deriveCompanionOrientationResult,
  routeCompanionRequest,
} from '../../shared/companionOrientation';
import type { LivingOutlineSnapshotV1 } from '../../shared/ipc/livingOutline';
import type { ProjectSpineSessionSnapshot } from '../../shared/ipc/projectSpine';

function snapshot(overrides: Partial<ProjectSpineSessionSnapshot> = {}): ProjectSpineSessionSnapshot {
  return {
    schemaVersion: 1,
    role: 'writing',
    generation: 4,
    revision: 7,
    project: {
      projectId: 'project-a',
      path: 'C:/projects/a',
      title: 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1',
      units: [
        { id: 'unit-a', title: 'Opening', displayTitle: 'Opening', order: 1 },
        { id: 'unit-b', title: 'Return', displayTitle: 'Return', order: 2 },
      ],
      drafts: { 'unit-a': 'This prose must never enter a Companion result.' },
    },
    activeUnitId: 'unit-a',
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'saved', unitId: null, message: null },
    lastError: null,
    recovery: { status: 'none', candidates: [] },
    ...overrides,
  };
}

function outline(): LivingOutlineSnapshotV1 {
  return {
    availability: 'ready',
    message: null,
    document: {
      schemaVersion: 'BlackSkiesLivingOutline v1',
      projectId: 'project-a',
      revision: 2,
      items: [{
        id: 'outline-a',
        label: 'An outline label is not prose',
        kind: 'fragment',
        state: 'authored',
        manuscriptUnitId: 'unit-a',
        createdAt: '2026-08-11T12:00:00.000Z',
        updatedAt: '2026-08-11T12:00:00.000Z',
      }],
    },
  };
}

describe('minimal Companion orientation route', () => {
  it.each(['Where am I?', 'where was I.', '  WHAT am I working on  '])(
    'routes the supported local orientation phrase %s',
    (text) => {
      expect(routeCompanionRequest(text, {
        requestId: 'request-a', projectId: 'project-a', generation: 4,
      })).toMatchObject({
        schemaVersion: COMPANION_ORIENTATION_SCHEMA_VERSION,
        route: 'orientation',
        projectId: 'project-a',
        generation: 4,
      });
    },
  );

  it('does not pretend an unsupported request was understood or call a fallback route', () => {
    const request = routeCompanionRequest('Explain the protagonist motivation', {
      requestId: 'request-a', projectId: 'project-a', generation: 4,
    });
    expect(request.route).toBe('not-routed');
    expect(deriveCompanionOrientationResult(request, snapshot(), outline())).toEqual(expect.objectContaining({
      status: 'not-routed',
      sourceFacts: [],
      limitationText: expect.stringContaining('No AI or provider was called.'),
      allowedActions: ['return-to-writing', 'dismiss'],
    }));
  });

  it('returns owner-labelled local orientation facts without manuscript prose or durable action', () => {
    const request = routeCompanionRequest('Where am I?', {
      requestId: 'request-a', projectId: 'project-a', generation: 4,
    });
    const result = deriveCompanionOrientationResult(request, snapshot(), outline());
    const rendered = JSON.stringify(result);

    expect(result).toEqual(expect.objectContaining({
      status: 'available',
      allowedActions: ['return-to-writing', 'dismiss'],
      sourceFacts: expect.arrayContaining([
        expect.objectContaining({ owner: 'Project session', currentness: 'current' }),
        expect.objectContaining({ owner: 'Manuscript unit', value: 'Opening · unit 1 of 2' }),
        expect.objectContaining({ owner: 'Living Outline', value: '1 outline item placed with the current writing' }),
      ]),
    }));
    expect(rendered).not.toContain('This prose must never enter a Companion result.');
    expect(rendered).not.toContain('C:/projects/a');
    expect(rendered).not.toContain('drafts');
  });

  it('is honest when the outline is degraded, a unit is missing, or the project generation is stale', () => {
    const request = routeCompanionRequest('Where was I?', {
      requestId: 'request-a', projectId: 'project-a', generation: 4,
    });
    const degraded = deriveCompanionOrientationResult(request, snapshot({ activeUnitId: null }), {
      availability: 'degraded',
      message: 'Outline sidecar could not be read.',
      document: { ...outline().document, items: [] },
    });
    expect(degraded).toEqual(expect.objectContaining({ status: 'available' }));
    expect(degraded.sourceFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ owner: 'Manuscript unit', currentness: 'unavailable' }),
      expect.objectContaining({ owner: 'Living Outline', currentness: 'unavailable', value: 'Outline sidecar could not be read.' }),
    ]));

    const stale = deriveCompanionOrientationResult(request, snapshot({ generation: 5 }), outline());
    expect(stale).toEqual(expect.objectContaining({
      status: 'unavailable',
      sourceFacts: [],
      limitationText: expect.stringContaining('project changed'),
    }));
  });
});
