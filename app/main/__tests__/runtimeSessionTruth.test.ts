import {
  createDraftSessionStateContract,
  createRuntimeSessionTruthContract,
  createRuntimeTruthBoundaryContract,
  createSessionLifecycleContract,
  createSessionOwnershipContract,
  DRAFT_STATE_CLASSIFICATIONS,
  DRAFT_SESSION_STATE_CLASSIFICATIONS,
  isDraftStateClassification,
  isDraftSessionStateClassification,
  isRuntimeOwnershipSurface,
  isSessionLifecycleState,
  isSessionLifecycleStep,
  RUNTIME_OWNERSHIP_SURFACES,
  SESSION_LIFECYCLE_STATES,
  SESSION_LIFECYCLE_STEPS,
} from '../../shared/runtimeSessionTruth';

describe('runtime/session truth contract', () => {
  it('declares the canonical session lifecycle and draft classifications', () => {
    expect(SESSION_LIFECYCLE_STATES).toEqual([
      'bootstrap',
      'session-attached',
      'project-loaded',
      'draft-hydrated',
      'editing',
      'save-export',
      'reload-reopen',
      'recover-fail-closed',
    ]);
    expect(SESSION_LIFECYCLE_STEPS).toEqual(SESSION_LIFECYCLE_STATES);
    expect(DRAFT_SESSION_STATE_CLASSIFICATIONS).toEqual([
      'runtime-only',
      'persisted',
      'dirty',
      'unsaved',
      'stale',
      'partial',
      'recovery-required',
    ]);
    expect(DRAFT_STATE_CLASSIFICATIONS).toEqual(DRAFT_SESSION_STATE_CLASSIFICATIONS);
    expect(RUNTIME_OWNERSHIP_SURFACES).toEqual([
      'main-process',
      'renderer',
      'backend-service',
      'persisted-project-files',
    ]);
  });

  it('validates the known lifecycle, draft, and ownership labels', () => {
    expect(isSessionLifecycleState('editing')).toBe(true);
    expect(isSessionLifecycleStep('editing')).toBe(true);
    expect(isSessionLifecycleStep('not-a-step')).toBe(false);
    expect(isDraftSessionStateClassification('dirty')).toBe(true);
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

  it('keeps the session lifecycle contract explicit and bounded', () => {
    expect(createSessionLifecycleContract('draft-hydrated')).toEqual({
      currentState: 'draft-hydrated',
      states: [
        'bootstrap',
        'session-attached',
        'project-loaded',
        'draft-hydrated',
        'editing',
        'save-export',
        'reload-reopen',
        'recover-fail-closed',
      ],
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
    const contract = createDraftSessionStateContract(['runtime-only', 'dirty', 'unsaved', 'stale']);

    expect(contract.classifications).toEqual(['runtime-only', 'dirty', 'unsaved', 'stale']);
  });

  it('assembles the session truth contract from the shared contract pieces', () => {
    const contract = createRuntimeSessionTruthContract({
      sessionLifecycleState: 'draft-hydrated',
      draftSessionStateClassifications: ['runtime-only', 'partial', 'recovery-required'],
    });

    expect(contract).toEqual({
      runtimeTruthBoundary: {
        runtimeTruth: 'runtime-only',
        projectTruth: 'persisted',
        runtimeOwnershipSurface: 'renderer',
        projectOwnershipSurface: 'persisted-project-files',
      },
      sessionLifecycle: {
        currentState: 'draft-hydrated',
        states: [
          'bootstrap',
          'session-attached',
          'project-loaded',
          'draft-hydrated',
          'editing',
          'save-export',
          'reload-reopen',
          'recover-fail-closed',
        ],
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
      draftSessionState: {
        classifications: ['runtime-only', 'partial', 'recovery-required'],
      },
    });
  });

  it('rejects unknown labels instead of normalizing them away', () => {
    expect(() =>
      createDraftSessionStateContract(['dirty', 'mystery-state' as never]),
    ).toThrow(/Unknown draft\/session state classification/);
    expect(() =>
      createRuntimeSessionTruthContract({
        sessionLifecycleState: 'bootstrap',
        draftSessionStateClassifications: ['runtime-only', 'stale'],
      }),
    ).not.toThrow();
  });
});
