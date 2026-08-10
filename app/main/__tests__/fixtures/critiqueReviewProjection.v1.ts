import {
  COMPLETED_CRITIQUE_REVIEW_ACTIONS,
  CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION,
  TERMINAL_CRITIQUE_REVIEW_ACTIONS,
  type CritiqueReviewProjectionV1,
} from '../../../shared/ipc/contextualProductShell';

const base = {
  schemaVersion: CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION,
  projectId: 'project-review-fixture',
  generation: 7,
  requestId: 'critique-review-fixture',
  unitId: 'unit-review-fixture',
  selectionFingerprint: 'sha256:selection-fixture',
  sourceLabel: 'Chapter 4 - The Signal',
  selectedCharacterCount: 842,
  advisoryLabel: 'Advisory critique - the author decides what to keep.',
  providerDisclosure: 'This critique was produced by the approved remote provider.',
  modelDisclosure: 'Model: deterministic test fixture.',
  privacyAndCostDisclosure: 'Fixture only. No provider call, credential, transmission, or charge occurred.',
  limitationText: 'The critique may be incomplete or mistaken and cannot change the manuscript.',
} as const;

export const completedCritiqueReviewFixture: CritiqueReviewProjectionV1 = {
  ...base,
  lifecycleState: 'completed',
  resultText: 'The scene establishes urgency. Clarify why the signal changes Mara\'s decision.',
  completedAt: '2026-08-10T12:00:00.000Z',
  allowedActions: COMPLETED_CRITIQUE_REVIEW_ACTIONS,
};

export const failedCritiqueReviewFixture: CritiqueReviewProjectionV1 = {
  ...base,
  lifecycleState: 'failed',
  failureClass: 'provider-unavailable',
  allowedActions: TERMINAL_CRITIQUE_REVIEW_ACTIONS,
};

export const cancelledCritiqueReviewFixture: CritiqueReviewProjectionV1 = {
  ...base,
  lifecycleState: 'cancelled',
  failureClass: 'request-cancelled',
  allowedActions: TERMINAL_CRITIQUE_REVIEW_ACTIONS,
};

export const expiredCritiqueReviewFixture: CritiqueReviewProjectionV1 = {
  ...base,
  lifecycleState: 'expired',
  failureClass: 'request-expired',
  allowedActions: TERMINAL_CRITIQUE_REVIEW_ACTIONS,
};

export const invalidatedCritiqueReviewFixture: CritiqueReviewProjectionV1 = {
  ...base,
  lifecycleState: 'invalidated',
  failureClass: 'source-changed',
  allowedActions: TERMINAL_CRITIQUE_REVIEW_ACTIONS,
};

export const critiqueReviewFixtures = [
  completedCritiqueReviewFixture,
  failedCritiqueReviewFixture,
  cancelledCritiqueReviewFixture,
  expiredCritiqueReviewFixture,
  invalidatedCritiqueReviewFixture,
] as const;
