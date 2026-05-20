import {
  createDraftStateTruthContract,
  createRuntimeSessionTruthContract,
  createRuntimeTruthBoundaryContract,
  createSessionOwnershipContract,
  DRAFT_STATE_CLASSIFICATIONS,
  isDraftStateClassification,
  isRuntimeOwnershipSurface,
  isSessionLifecycleStep,
  RUNTIME_OWNERSHIP_SURFACES,
  SESSION_LIFECYCLE_STEPS,
} from '../../shared/runtimeSessionTruth';

describe('runtime/session truth contract', () => {
  it('declares the canonical session lifecycle and draft classifications', () => {
    expect(SESSION_LIFECYCLE_STEPS).toEqual([
      'bootstrap',
      'session-attached',
      'project-loaded',
      'draft-hydrated',
      'editing',
      'save-export',
      'reload-reopen',
      'recover-fail-closed',
    ]);
    expect(DRAFT_STATE_CLASSIFICATIONS).toEqual([
      'runtime-only',
      'persisted',
      'generated',
      'critiqued',
      'accepted',
      'dirty',
      'unsaved',
      'stale',
      'partial',
      'orphaned',
      'recovery-required',
    ]);
    expect(RUNTIME_OWNERSHIP_SURFACES).toEqual([
      'main-process',
      'renderer',
      'backend-service',
      'persisted-project-files',
    ]);
  });

  it('validates the known lifecycle, draft, and ownership labels', () => {
    expect(isSessionLifecycleStep('editing')).toBe(true);
    expect(isSessionLifecycleStep('not-a-step')).toBe(false);
    expect(isDraftStateClassification('dirty')).toBe(true);
    expect(isDraftStateClassification('not-a-classification')).toBe(false);
    expect(isRuntimeOwnershipSurface('renderer')).toBe(true);
    expect(isRuntimeOwnershipSurface('not-a-surface')).toBe(false);
  });

  it('keeps runtime truth distinct from persisted project truth', () => {
    expect(createRuntimeTruthBoundaryContract()).toEqual({
      runtimeTruth: 'runtime-only',
      projectTruth: 'persisted',
      runtimeOwnershipSurface: 'renderer',
      projectOwnershipSurface: 'persisted-project-files',
    });
  });

  it('keeps process ownership explicit and bounded', () => {
    expect(createSessionOwnershipContract()).toEqual({
      mainProcess: {
        owns: [
          'session bootstrap',
          'session lifecycle coordination',
          'project load/recover classification',
          'persistence gating',
        ],
        doesNotOwn: ['draft authoring', 'content quality claims', 'project truth content'],
      },
      renderer: {
        owns: ['visible authoring session surface', 'local editing state', 'user intent capture'],
        doesNotOwn: ['durable truth promotion', 'silent repair', 'project identity authority'],
      },
      backendService: {
        owns: ['generation', 'critique', 'accept assistance', 'analysis'],
        doesNotOwn: ['session authority', 'project truth authority', 'window authority'],
      },
      persistedProjectFiles: {
        owns: ['project truth', 'durable draft/source files', 'recovery artifacts'],
        doesNotOwn: ['runtime-only state', 'window-local UI state', 'ephemeral caches'],
      },
    });
  });

  it('preserves the requested draft classifications without collapsing them', () => {
    const contract = createDraftStateTruthContract(['generated', 'dirty', 'unsaved', 'stale']);

    expect(contract.classifications).toEqual(['generated', 'dirty', 'unsaved', 'stale']);
  });

  it('assembles the session truth contract from the shared contract pieces', () => {
    const contract = createRuntimeSessionTruthContract({
      sessionLifecycleStep: 'draft-hydrated',
      draftStateClassifications: ['runtime-only', 'partial', 'recovery-required'],
    });

    expect(contract).toEqual({
      sessionLifecycleStep: 'draft-hydrated',
      truthBoundary: {
        runtimeTruth: 'runtime-only',
        projectTruth: 'persisted',
        runtimeOwnershipSurface: 'renderer',
        projectOwnershipSurface: 'persisted-project-files',
      },
      sessionOwnership: {
        mainProcess: {
          owns: [
            'session bootstrap',
            'session lifecycle coordination',
            'project load/recover classification',
            'persistence gating',
          ],
          doesNotOwn: ['draft authoring', 'content quality claims', 'project truth content'],
        },
        renderer: {
          owns: ['visible authoring session surface', 'local editing state', 'user intent capture'],
          doesNotOwn: ['durable truth promotion', 'silent repair', 'project identity authority'],
        },
        backendService: {
          owns: ['generation', 'critique', 'accept assistance', 'analysis'],
          doesNotOwn: ['session authority', 'project truth authority', 'window authority'],
        },
        persistedProjectFiles: {
          owns: ['project truth', 'durable draft/source files', 'recovery artifacts'],
          doesNotOwn: ['runtime-only state', 'window-local UI state', 'ephemeral caches'],
        },
      },
      draftStateTruth: {
        classifications: ['runtime-only', 'partial', 'recovery-required'],
      },
    });
  });

  it('rejects unknown labels instead of normalizing them away', () => {
    expect(() =>
      createDraftStateTruthContract(['generated', 'mystery-state' as never]),
    ).toThrow(/Unknown draft state classification/);
    expect(() =>
      createRuntimeSessionTruthContract({
        sessionLifecycleStep: 'bootstrap',
        draftStateClassifications: ['generated', 'stale'],
      }),
    ).not.toThrow();
  });
});
