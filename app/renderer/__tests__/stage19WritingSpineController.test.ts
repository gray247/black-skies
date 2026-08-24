import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { ProjectSpineSessionSnapshot } from '../../shared/ipc/projectSpine';
import {
  decideStage19SessionProjection,
  deriveStage19ViewPhase,
  deriveStage19WritingAvailability,
} from '../stage19WritingSpineController';

function snapshot(
  overrides: Partial<ProjectSpineSessionSnapshot> = {},
): ProjectSpineSessionSnapshot {
  return {
    schemaVersion: 1,
    role: 'writing',
    generation: 2,
    revision: 4,
    project: {
      projectId: 'project-a',
      path: 'C:/projects/a',
      title: 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1',
      units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 1 }],
      drafts: { 'unit-a': 'Protected prose.' },
    },
    activeUnitId: 'unit-a',
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'clean', unitId: null, message: null },
    lastError: null,
    recovery: { status: 'none', candidates: [] },
    ...overrides,
  };
}

describe('Stage 19 renderer controller seam', () => {
  it('rejects wrong-role, unbound Command, and older session projections', () => {
    const current = snapshot();
    expect(decideStage19SessionProjection(current, snapshot({ role: 'command' }), 'writing')).toEqual({
      accepted: false,
      reason: 'wrong-window-role',
    });
    expect(decideStage19SessionProjection(current, snapshot({
      role: 'command',
      commandStatus: undefined,
    }), 'command')).toEqual({ accepted: false, reason: 'unbound-command-status' });
    expect(decideStage19SessionProjection(current, snapshot({ generation: 1, revision: 99 }), 'writing')).toEqual({
      accepted: false,
      reason: 'older-generation',
    });
    expect(decideStage19SessionProjection(current, snapshot({ revision: 3 }), 'writing')).toEqual({
      accepted: false,
      reason: 'older-revision',
    });
  });

  it('accepts current and newer projections while identifying generation transitions', () => {
    const current = snapshot();
    expect(decideStage19SessionProjection(current, snapshot({ revision: 5 }), 'writing')).toEqual({
      accepted: true,
      generationChanged: false,
    });
    expect(decideStage19SessionProjection(current, snapshot({ generation: 3, revision: 0 }), 'writing')).toEqual({
      accepted: true,
      generationChanged: true,
    });
    const command = snapshot({
      role: 'command',
      commandStatus: {
        schemaVersion: 1,
        projectId: 'project-a',
        generation: 2,
        revision: 4,
        lifecycle: 'active',
        recovery: 'none',
        save: 'clean',
      },
    });
    expect(decideStage19SessionProjection(command, command, 'command')).toEqual({
      accepted: true,
      generationChanged: false,
    });
  });

  it('derives presentation phases without inventing project truth', () => {
    const writing = snapshot();
    const unavailableCommand = snapshot({ role: 'command', commandStatus: undefined });
    expect(deriveStage19ViewPhase('writing', true, false, writing)).toBe('loading');
    expect(deriveStage19ViewPhase('writing', false, false, writing)).toBe('writing');
    expect(deriveStage19ViewPhase('command', false, true, unavailableCommand)).toBe('command-unavailable');
    expect(deriveStage19ViewPhase('command', false, false, unavailableCommand)).toBe('command-unavailable');
  });

  it('derives editing and export availability from existing owner projections', () => {
    expect(deriveStage19WritingAvailability(snapshot(), new Set())).toEqual({
      activeDirty: false,
      hasLocalUnsaved: false,
      recoveryBlocksEditing: false,
      markdownExportRequiresSave: false,
    });
    expect(deriveStage19WritingAvailability(snapshot({
      saveState: { status: 'dirty', unitId: 'unit-a', message: null },
      recovery: {
        status: 'degraded',
        reason: 'corrupt-artifact',
        message: 'Recovery evidence is corrupt.',
        candidates: [],
      },
    }), new Set(['unit-a']))).toEqual({
      activeDirty: true,
      hasLocalUnsaved: true,
      recoveryBlocksEditing: true,
      markdownExportRequiresSave: true,
    });
  });

  it('keeps the presentation view outside bridge or global authority', () => {
    const viewSource = readFileSync(
      path.resolve(process.cwd(), 'renderer', 'Stage19WritingSpineView.tsx'),
      'utf8',
    );

    expect(viewSource).not.toMatch(/\bwindow\.[A-Za-z_$]/);
    expect(viewSource).not.toMatch(/\b(?:ProjectSpine|AiCritique|FeedbackNotes|LivingOutline)Bridge\b/);
    expect(viewSource).not.toMatch(/createFromCritique|subscribeSession|getSession|captureRecoveryCheckpoint/);
  });
});
