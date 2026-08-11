import { describe, expect, it } from 'vitest';

import {
  COMPLETED_CRITIQUE_REVIEW_ACTIONS,
  CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
  CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION,
  TERMINAL_CRITIQUE_REVIEW_ACTIONS,
  normalizeCritiqueReviewSurfaceState,
  type SaveCritiqueReviewFeedbackNoteActionV1,
  type SourceReturnAnchorV1,
  type SurfaceContextV1,
} from '../../shared/ipc/contextualProductShell';
import {
  completedCritiqueReviewFixture,
  critiqueReviewFixtures,
} from './fixtures/critiqueReviewProjection.v1';

describe('Program 3 contextual product shell contracts', () => {
  it('separates logical surface, workspace, and physical placement', () => {
    const sourceReturnAnchor: SourceReturnAnchorV1 = {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId: 'project-review-fixture',
      generation: 7,
      unitId: 'unit-review-fixture',
      editorRevision: 11,
      selectionStart: 120,
      selectionEnd: 962,
      selectionFingerprint: 'sha256:selection-fixture',
    };
    const writing: SurfaceContextV1 = {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId: 'project-review-fixture',
      generation: 7,
      logicalSurface: 'writing',
      workspace: 'manuscript',
      physicalPlacement: 'current-window',
    };
    const command: SurfaceContextV1 = {
      ...writing,
      logicalSurface: 'command',
      workspace: 'review',
      physicalPlacement: 'secondary-window',
      sourceReturnAnchor,
      focusReturnTarget: 'manuscript-selection',
    };

    expect(writing.logicalSurface).toBe('writing');
    expect(command).toMatchObject({ logicalSurface: 'command', workspace: 'review' });
    expect(JSON.stringify(sourceReturnAnchor)).not.toMatch(/selectedText|prose|draft/i);
  });

  it('limits completed and non-completed Review actions', () => {
    expect(completedCritiqueReviewFixture.schemaVersion).toBe(CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION);
    expect(completedCritiqueReviewFixture.allowedActions).toEqual(COMPLETED_CRITIQUE_REVIEW_ACTIONS);
    for (const fixture of critiqueReviewFixtures.filter((candidate) => candidate.lifecycleState !== 'completed')) {
      expect(fixture.allowedActions).toEqual(TERMINAL_CRITIQUE_REVIEW_ACTIONS);
      expect(fixture.allowedActions).not.toContain('copy-result');
      expect(fixture.allowedActions).not.toContain('save-feedback-note');
    }
  });

  it('keeps deterministic Review projections sanitized and presentation-only', () => {
    const serialized = JSON.stringify(critiqueReviewFixtures);
    for (const forbidden of [
      'apiKey',
      'credential',
      'selectedText',
      'providerBodyJson',
      'hiddenContext',
      'manuscript',
      'outline',
      'drafts',
    ]) expect(serialized).not.toContain(`\"${forbidden}\"`);
  });

  it('defines one narrow owner-routed Feedback Note action without mutation bridges', () => {
    const action: SaveCritiqueReviewFeedbackNoteActionV1 = {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      operationId: 'save-review-note-fixture',
      projectId: 'project-review-fixture',
      generation: 7,
      unitId: 'unit-review-fixture',
      sourceCritiqueRequestId: 'critique-review-fixture',
      selectionFingerprint: 'sha256:selection-fixture',
      visibleResultFingerprint: 'sha256:visible-result-fixture',
      body: 'Author-selected note body.',
    };
    const serialized = JSON.stringify(action);

    expect(action).toMatchObject({ projectId: 'project-review-fixture', generation: 7 });
    expect(serialized).not.toMatch(/projectPath|manuscript|outline|acceptedTruth|providerBodyJson/);
  });

  it('fails closed when a Review projection carries prose, credentials, or escalated actions', () => {
    const sourceReturnAnchor: SourceReturnAnchorV1 = {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId: completedCritiqueReviewFixture.projectId,
      generation: completedCritiqueReviewFixture.generation,
      unitId: completedCritiqueReviewFixture.unitId,
      editorRevision: 11,
      selectionStart: 120,
      selectionEnd: 962,
      selectionFingerprint: completedCritiqueReviewFixture.selectionFingerprint,
    };
    const validState = {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId: completedCritiqueReviewFixture.projectId,
      generation: completedCritiqueReviewFixture.generation,
      availability: 'available',
      projection: completedCritiqueReviewFixture,
      sourceReturnAnchor,
    } as const;

    expect(normalizeCritiqueReviewSurfaceState(validState)).toEqual(validState);
    expect(normalizeCritiqueReviewSurfaceState({
      ...validState,
      projection: { ...completedCritiqueReviewFixture, selectedText: 'private prose' },
    })).toBeNull();
    expect(normalizeCritiqueReviewSurfaceState({
      ...validState,
      projection: { ...completedCritiqueReviewFixture, credential: 'secret' },
    })).toBeNull();
    expect(normalizeCritiqueReviewSurfaceState({
      ...validState,
      projection: {
        ...completedCritiqueReviewFixture,
        lifecycleState: 'failed',
        resultText: undefined,
        completedAt: undefined,
        failureClass: 'provider-unavailable',
        allowedActions: COMPLETED_CRITIQUE_REVIEW_ACTIONS,
      },
    })).toBeNull();
  });
});
