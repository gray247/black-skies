import { describe, expect, it } from 'vitest';
import type { LoadedProject } from '../../shared/ipc/projectLoader';
import {
  ProjectSessionCoordinator,
  ProjectSessionError,
} from '../projectSessionCoordinator';

function project(
  projectId: string,
  projectPath: string,
  title = projectId,
  unitIds: readonly string[] = ['unit_1'],
): LoadedProject {
  return {
    path: projectPath,
    projectId,
    name: title,
    outline: {
      schema_version: 'OutlineSchema v1',
      outline_id: `outline_${projectId}`,
      project_id: projectId,
      acts: [],
      chapters: [],
      scenes: unitIds.map((id, index) => ({ id, title: `Unit ${index + 1}`, order: index + 1 })),
    },
    scenes: unitIds.map((id, index) => ({ id, title: `Unit ${index + 1}`, order: index + 1 })),
    drafts: Object.fromEntries(unitIds.map((id) => [id, `---\nid: ${id}\ntitle: Unit\norder: 1\n---\nBody\n`])),
  };
}

function binding(coordinator: ProjectSessionCoordinator, active: LoadedProject, operationId: string) {
  return {
    projectId: active.projectId!,
    projectPath: active.path,
    generation: coordinator.getGeneration(),
    operationId,
  };
}

describe('ProjectSessionCoordinator', () => {
  it('activates one canonical project and produces role-projected snapshots', () => {
    const coordinator = new ProjectSessionCoordinator();
    const active = project('proj_a', 'C:\\projects\\a', 'Project A');

    expect(coordinator.activateProject(active)).toEqual({ activation: 'activated', generation: 1 });

    const writing = coordinator.snapshot('writing');
    const command = coordinator.snapshot('command');
    expect(writing.project).toMatchObject({ projectId: 'proj_a', title: 'Project A' });
    expect(writing.project?.drafts).toEqual(active.drafts);
    expect(command.project).toMatchObject({ projectId: 'proj_a', title: 'Project A' });
    expect(command.project?.drafts).toBeUndefined();
    expect(writing.activeUnitId).toBe('unit_1');
  });

  it('treats opening the exact active identity and path as an idempotent no-op', () => {
    const coordinator = new ProjectSessionCoordinator();
    const active = project('proj_a', 'C:\\projects\\a');
    coordinator.activateProject(active);
    coordinator.setUnitDirty(binding(coordinator, active, 'dirty-a'), 'unit_1', true);

    expect(coordinator.activateProject(active)).toEqual({ activation: 'already-active', generation: 1 });
    expect(coordinator.snapshot('writing').dirtyUnitIds).toEqual(['unit_1']);
  });

  it('fails closed when a known durable identity appears at a different path', () => {
    const coordinator = new ProjectSessionCoordinator();
    coordinator.activateProject(project('proj_duplicate', 'C:\\projects\\a'));

    expect(() =>
      coordinator.activateProject(project('proj_duplicate', 'C:\\projects\\clone'), true),
    ).toThrowError(ProjectSessionError);
    try {
      coordinator.activateProject(project('proj_duplicate', 'C:\\projects\\clone'), true);
    } catch (error) {
      expect(error).toMatchObject({ code: 'DUPLICATE_PROJECT_IDENTITY' });
    }
    expect(coordinator.snapshot('writing').project?.path).toContain('projects\\a');
  });

  it('requires explicit discard before switching away from dirty work', () => {
    const coordinator = new ProjectSessionCoordinator();
    const projectA = project('proj_a', 'C:\\projects\\a');
    coordinator.activateProject(projectA);
    coordinator.setUnitDirty(binding(coordinator, projectA, 'dirty-a'), 'unit_1', true);

    expect(() => coordinator.activateProject(project('proj_b', 'C:\\projects\\b'))).toThrowError(
      expect.objectContaining({ code: 'UNSAVED_CHANGES' }),
    );
    expect(coordinator.snapshot('writing').project?.projectId).toBe('proj_a');

    coordinator.activateProject(project('proj_b', 'C:\\projects\\b'), true);
    expect(coordinator.snapshot('writing')).toMatchObject({
      generation: 2,
      dirtyUnitIds: [],
      saveState: { status: 'clean' },
      project: { projectId: 'proj_b' },
    });
  });

  it('advances revisions for dirty, save, and selection state so renderers can reject stale snapshots', () => {
    const coordinator = new ProjectSessionCoordinator();
    const active = project('proj_a', 'C:\\projects\\a');
    coordinator.activateProject(active);
    const initialRevision = coordinator.snapshot('writing').revision;
    coordinator.setUnitDirty(binding(coordinator, active, 'dirty-a'), 'unit_1', true);
    const dirtyRevision = coordinator.snapshot('writing').revision;
    const token = coordinator.beginSave(binding(coordinator, active, 'save-a'), 'unit_1');
    const savingRevision = coordinator.snapshot('writing').revision;
    coordinator.completeSave(token, active.drafts.unit_1);
    const savedRevision = coordinator.snapshot('writing').revision;
    coordinator.selectUnit(binding(coordinator, active, 'select-a'), 'unit_1');

    expect(dirtyRevision).toBeGreaterThan(initialRevision);
    expect(savingRevision).toBeGreaterThan(dirtyRevision);
    expect(savedRevision).toBeGreaterThan(savingRevision);
    expect(coordinator.snapshot('writing').revision).toBeGreaterThan(savedRevision);
    expect(coordinator.snapshot('writing')).toMatchObject({ dirtyUnitIds: [], saveState: { status: 'saved' } });
  });

  it('provides recovery context only for the exact active project, generation, path, and unit', () => {
    const coordinator = new ProjectSessionCoordinator();
    const active = project('proj_recovery', 'C:\\projects\\recovery');
    coordinator.activateProject(active);
    const exact = binding(coordinator, active, 'checkpoint');

    expect(coordinator.getRecoveryCheckpointContext(exact, 'unit_1')).toMatchObject({
      project: { projectId: 'proj_recovery', path: active.path },
      generation: 1,
    });
    expect(() => coordinator.getRecoveryCheckpointContext({ ...exact, generation: 0 }, 'unit_1'))
      .toThrowError(expect.objectContaining({ code: 'STALE_SESSION' }));
    expect(() => coordinator.getRecoveryCheckpointContext(exact, 'unit_missing'))
      .toThrowError(expect.objectContaining({ code: 'UNIT_NOT_FOUND' }));
  });

  it('projects recovery only to Writing Studio and preserves accepted evidence through discard compensation', () => {
    const coordinator = new ProjectSessionCoordinator();
    const active = project('proj_recovery', 'C:\\projects\\recovery');
    coordinator.activateProject(active);
    const sessionBinding = binding(coordinator, active, 'detect');
    const priorCandidate = {
      projectId: active.projectId!,
      projectPath: active.path,
      unitId: 'unit_1',
      unitTitle: 'Unit 1',
      unitOrder: 1,
      originSessionId: 'origin-prior',
      priorSessionGeneration: 1,
      priorSessionRevision: 2,
      durableBaselineFingerprint: 'a'.repeat(64),
      candidateVersion: 1,
      updatedAt: '2026-07-13T00:00:00.000Z',
      prose: 'Recovered prose',
      decision: 'available' as const,
    };
    coordinator.installRecoveryState(sessionBinding, {
      status: 'decision-required',
      candidates: [priorCandidate],
    });

    expect(coordinator.snapshot('writing').recovery).toMatchObject({ status: 'decision-required' });
    expect(coordinator.snapshot('command')).not.toHaveProperty('recovery');
    expect(() => coordinator.assertRecoveryMutationAllowed(sessionBinding)).toThrowError(
      expect.objectContaining({ code: 'RECOVERY_UNAVAILABLE' }),
    );

    const token = coordinator.beginRecoveryDecision(
      { ...sessionBinding, operationId: 'accept' },
      'unit_1',
    );
    const rawPrior = {
      schemaVersion: 1 as const,
      projectId: priorCandidate.projectId,
      projectPath: priorCandidate.projectPath,
      unitId: priorCandidate.unitId,
      originSessionId: priorCandidate.originSessionId,
      priorSessionGeneration: priorCandidate.priorSessionGeneration,
      priorSessionRevision: priorCandidate.priorSessionRevision,
      durableBaselineFingerprint: priorCandidate.durableBaselineFingerprint,
      prose: priorCandidate.prose,
      candidateVersion: priorCandidate.candidateVersion,
      createdAt: priorCandidate.updatedAt,
      updatedAt: priorCandidate.updatedAt,
    };
    expect(coordinator.selectRecoveryCandidate(token, rawPrior)).toMatchObject({
      remainingDecisionCount: 0,
      acceptedCandidates: [expect.objectContaining({ unitId: 'unit_1' })],
    });
    coordinator.completeRecoveryAcceptance(token, [{
      ...rawPrior,
      originSessionId: 'origin-current',
      candidateVersion: 2,
    }]);
    coordinator.finishRecoveryDecision(token);
    expect(coordinator.snapshot('writing')).toMatchObject({
      dirtyUnitIds: ['unit_1'],
      recovery: {
        status: 'accepted-pending-save',
        candidates: [{ prose: 'Recovered prose', originSessionId: 'origin-current', candidateVersion: 2 }],
      },
    });

    const discarded = coordinator.discardUnsavedBuffers(active.projectId!, coordinator.getGeneration());
    expect(coordinator.snapshot('writing').recovery).toEqual({ status: 'none', candidates: [] });
    coordinator.restoreDiscardedUnsavedBuffers(discarded);
    expect(coordinator.snapshot('writing').recovery).toMatchObject({ status: 'accepted-pending-save' });
  });

  it('rejects late save completion after the bound session changes', () => {
    const coordinator = new ProjectSessionCoordinator();
    const projectA = project('proj_a', 'C:\\projects\\a');
    coordinator.activateProject(projectA);
    coordinator.setUnitDirty(binding(coordinator, projectA, 'dirty-a'), 'unit_1', true);
    const token = coordinator.beginSave(binding(coordinator, projectA, 'save-a'), 'unit_1');

    coordinator.failSave(token, 'simulated failure');
    coordinator.activateProject(project('proj_b', 'C:\\projects\\b'), true);

    expect(() => coordinator.completeSave(token, 'late Project A content')).toThrowError(
      expect.objectContaining({ code: 'STALE_SESSION' }),
    );
    expect(coordinator.snapshot('writing').project?.projectId).toBe('proj_b');
  });

  it('removes only a recent reference and marks missing references stale', () => {
    const coordinator = new ProjectSessionCoordinator([
      { path: 'C:\\projects\\a', title: 'A', lastOpened: 2, stale: false },
      { path: 'C:\\projects\\b', title: 'B', lastOpened: 1, stale: false },
    ]);

    coordinator.markRecentStale('C:\\projects\\a');
    expect(coordinator.getRecentProjects()[0]).toMatchObject({ title: 'A', stale: true });
    coordinator.removeRecent('C:\\projects\\a');
    expect(coordinator.getRecentProjects()).toEqual([
      expect.objectContaining({ title: 'B', stale: false }),
    ]);
  });
});
