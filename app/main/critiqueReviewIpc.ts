import { createHash } from 'node:crypto';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type {
  AiCritiquePrepareRequest,
  AiCritiquePreview,
  AiCritiqueState,
} from '../shared/ipc/aiCritique.js';
import {
  COMPLETED_CRITIQUE_REVIEW_ACTIONS,
  CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
  CRITIQUE_REVIEW_CHANNELS,
  CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION,
  TERMINAL_CRITIQUE_REVIEW_ACTIONS,
  type CritiqueReviewActionErrorCodeV1,
  type CritiqueReviewActionResultV1,
  type CritiqueReviewFailureClassV1,
  type CritiqueReviewLifecycleStateV1,
  type CritiqueReviewProjectionV1,
  type CritiqueReviewReferenceV1,
  type CritiqueReviewSourceReturnMessageV1,
  type CritiqueReviewSurfaceStateV1,
  type SaveCritiqueReviewFeedbackNoteActionV1,
  type SourceReturnAnchorV1,
} from '../shared/ipc/contextualProductShell.js';
import type {
  ProjectSpineSessionSnapshot,
  ProjectSpineWindowRole,
} from '../shared/ipc/projectSpine.js';
import {
  FeedbackNotesRepository,
  FeedbackNotesRepositoryError,
} from './feedbackNotesRepository.js';

interface PreparedReviewRecord {
  readonly ownerSenderId: number;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
  readonly requestId: string;
  readonly unitId: string;
  readonly selectionFingerprint: string;
  readonly sourceLabel: string;
  readonly selectedCharacterCount: number;
  readonly sourceReturnAnchor: SourceReturnAnchorV1;
  readonly providerDisclosure: string;
  readonly modelDisclosure: string;
  readonly privacyAndCostDisclosure: string;
  state: AiCritiqueState;
  stale: boolean;
  dismissed: boolean;
  resultText: string | null;
  visibleResultFingerprint: string | null;
}

export interface RegisterCritiqueReviewIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly publishState: (state: CritiqueReviewSurfaceStateV1) => void;
  readonly requestSourceReturn: (message: CritiqueReviewSourceReturnMessageV1) => void;
  readonly repositoryFactory?: (projectPath: string) => FeedbackNotesRepository;
}

let options: RegisterCritiqueReviewIpcOptions | null = null;
const records = new Map<string, PreparedReviewRecord>();
let activeRequestId: string | null = null;

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function formatCritiqueReviewResult(state: AiCritiqueState): string | null {
  const result = state.status === 'completed' ? state.result : undefined;
  if (!result) return null;
  return [
    result.content.overview,
    result.content.strengths.length
      ? `Strengths\n${result.content.strengths.map((item) => `- ${item}`).join('\n')}`
      : '',
    result.content.priorities.length
      ? `Priorities\n${result.content.priorities.map((item) => [
          `- Evidence: ${item.evidence}`,
          `  Observation: ${item.observation}`,
          `  Why it matters: ${item.impact}`,
          `  Question: ${item.revisionQuestion}`,
        ].join('\n')).join('\n')}`
      : '',
    result.content.uncertainties.length
      ? `Uncertainties\n${result.content.uncertainties.map((item) => `- ${item}`).join('\n')}`
      : '',
    result.content.limitations.length
      ? `Limitations\n${result.content.limitations.map((item) => `- ${item}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n\n');
}

function isTerminal(state: AiCritiqueState): boolean {
  return ['completed', 'failed', 'cancelled', 'expired', 'invalidated'].includes(state.status);
}

function failureClass(state: AiCritiqueState): CritiqueReviewFailureClassV1 | undefined {
  if (state.status === 'cancelled') return 'request-cancelled';
  if (state.status === 'expired') return 'request-expired';
  if (state.status === 'invalidated') return 'source-changed';
  if (state.status !== 'failed') return undefined;
  switch (state.error?.code) {
    case 'PROVIDER_UNAVAILABLE':
    case 'PROVIDER_TIMEOUT':
    case 'PROVIDER_RATE_LIMIT':
    case 'PROVIDER_QUOTA':
      return 'provider-unavailable';
    case 'PROVIDER_AUTH':
    case 'PROVIDER_REFUSAL':
    case 'PROVIDER_RESPONSE_INVALID':
      return 'provider-rejected';
    default:
      return 'unknown';
  }
}

function projectionFor(record: PreparedReviewRecord): CritiqueReviewProjectionV1 | null {
  if (!isTerminal(record.state)) return null;
  const lifecycleState: CritiqueReviewLifecycleStateV1 = record.stale
    ? 'invalidated'
    : record.state.status as CritiqueReviewLifecycleStateV1;
  const result = lifecycleState === 'completed' ? record.state.result : undefined;
  const limitationText = result?.content.limitations.join(' ') || record.state.error?.message || (
    lifecycleState === 'invalidated'
      ? 'The source context changed after this review was created. The exact prior selection is no longer current.'
      : 'No advisory result is available for this request.'
  );
  return {
    schemaVersion: CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION,
    projectId: record.projectId,
    generation: record.generation,
    requestId: record.requestId,
    unitId: record.unitId,
    selectionFingerprint: record.selectionFingerprint,
    sourceLabel: record.sourceLabel,
    selectedCharacterCount: record.selectedCharacterCount,
    lifecycleState,
    advisoryLabel: 'Advisory critique - the author decides what to keep.',
    providerDisclosure: record.providerDisclosure,
    modelDisclosure: record.modelDisclosure,
    privacyAndCostDisclosure: record.privacyAndCostDisclosure,
    ...(lifecycleState === 'completed' && record.resultText
      ? { resultText: record.resultText, completedAt: result?.completedAt }
      : {}),
    limitationText,
    ...(failureClass({ ...record.state, status: lifecycleState })
      ? { failureClass: failureClass({ ...record.state, status: lifecycleState }) }
      : {}),
    allowedActions: lifecycleState === 'completed'
      ? COMPLETED_CRITIQUE_REVIEW_ACTIONS
      : TERMINAL_CRITIQUE_REVIEW_ACTIONS,
  };
}

function currentRecord(): PreparedReviewRecord | null {
  return activeRequestId ? records.get(activeRequestId) ?? null : null;
}

export function getCritiqueReviewSurfaceState(): CritiqueReviewSurfaceStateV1 {
  const snapshot = options?.getWritingSnapshot();
  const projectId = snapshot?.project?.projectId ?? null;
  const generation = snapshot?.generation ?? 0;
  const record = currentRecord();
  if (!options) {
    return {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId,
      generation,
      availability: 'unavailable',
      message: 'Review is unavailable. Writing and saved project truth remain available.',
    };
  }
  if (!record || record.projectId !== projectId || record.generation !== generation) {
    return {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId,
      generation,
      availability: 'empty',
      message: 'No critique review is waiting in Command Center.',
    };
  }
  if (record.dismissed) {
    return {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId,
      generation,
      availability: 'dismissed',
      dismissedRequestId: record.requestId,
      message: 'The Review presentation was dismissed. The Writing owner was not changed.',
    };
  }
  const projection = projectionFor(record);
  if (!projection) {
    return {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId,
      generation,
      availability: 'empty',
      message: 'The critique request has not produced a Review result yet.',
    };
  }
  return {
    schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
    projectId,
    generation,
    availability: 'available',
    projection,
    sourceReturnAnchor: record.sourceReturnAnchor,
  };
}

function publish(): void {
  options?.publishState(getCritiqueReviewSurfaceState());
}

export function registerPreparedCritiqueReview(
  ownerSenderId: number,
  request: AiCritiquePrepareRequest,
  preview: AiCritiquePreview,
  snapshot: ProjectSpineSessionSnapshot,
): void {
  const project = snapshot.project;
  const unit = project?.units.find((candidate) => candidate.id === request.selection.unitId);
  if (!project || !unit) return;
  records.set(preview.requestId, {
    ownerSenderId,
    projectId: project.projectId,
    projectPath: project.path,
    generation: snapshot.generation,
    requestId: preview.requestId,
    unitId: unit.id,
    selectionFingerprint: request.selection.selectionFingerprint,
    sourceLabel: unit.displayTitle,
    selectedCharacterCount: request.selection.selectedText.length,
    sourceReturnAnchor: {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId: project.projectId,
      generation: snapshot.generation,
      unitId: unit.id,
      editorRevision: request.selection.editorRevision,
      selectionStart: request.selection.selectionStart,
      selectionEnd: request.selection.selectionEnd,
      selectionFingerprint: request.selection.selectionFingerprint,
    },
    providerDisclosure: `Remote advisory provider: ${preview.provider}.`,
    modelDisclosure: `Model: ${preview.model}.`,
    privacyAndCostDisclosure: `Only the author-approved selected passage is transmitted. Maximum calculated cost: $${preview.cost.maximumCalculatedUsd.toFixed(6)}; ${preview.cost.invoiceDisclaimer}`,
    state: { requestId: preview.requestId, status: 'prepared' },
    stale: false,
    dismissed: false,
    resultText: null,
    visibleResultFingerprint: null,
  });
}

export function publishCritiqueReviewOwnerState(ownerSenderId: number, state: AiCritiqueState): void {
  const record = records.get(state.requestId);
  if (!record || record.ownerSenderId !== ownerSenderId) return;
  record.state = state;
  record.resultText = formatCritiqueReviewResult(state);
  record.visibleResultFingerprint = record.resultText ? sha256(record.resultText) : null;
  if (isTerminal(state)) {
    record.dismissed = false;
    activeRequestId = record.requestId;
    publish();
  }
}

export function reconcileCritiqueReviewAuthority(): void {
  const record = currentRecord();
  const snapshot = options?.getWritingSnapshot();
  if (!record || !snapshot) return;
  const projectId = snapshot.project?.projectId ?? null;
  if (record.projectId !== projectId || record.generation !== snapshot.generation) {
    activeRequestId = null;
    publish();
    return;
  }
  if (record.unitId !== snapshot.activeUnitId && !record.stale) {
    record.stale = true;
    publish();
  }
}

function fail<T>(
  code: CritiqueReviewActionErrorCodeV1,
  message: string,
): CritiqueReviewActionResultV1<T> {
  return { ok: false, error: { code, message }, state: getCritiqueReviewSurfaceState() };
}

function validReference(value: unknown): value is CritiqueReviewReferenceV1 {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<CritiqueReviewReferenceV1>;
  return request.schemaVersion === CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION &&
    typeof request.operationId === 'string' && request.operationId.trim().length > 0 &&
    typeof request.projectId === 'string' && request.projectId.trim().length > 0 &&
    Number.isInteger(request.generation) && Number(request.generation) >= 0 &&
    typeof request.requestId === 'string' && request.requestId.trim().length > 0 &&
    typeof request.selectionFingerprint === 'string' && request.selectionFingerprint.trim().length > 0;
}

function requireBoundRecord(
  value: unknown,
): { readonly request: CritiqueReviewReferenceV1; readonly record: PreparedReviewRecord } |
  CritiqueReviewActionResultV1 {
  if (!validReference(value)) return fail('INVALID_REQUEST', 'The Review action is incomplete.');
  const request = value;
  const record = currentRecord();
  if (!record || record.requestId !== request.requestId || record.dismissed) {
    return fail('REVIEW_UNAVAILABLE', 'This Review presentation is no longer available.');
  }
  if (record.projectId !== request.projectId) {
    return fail('STALE_PROJECT', 'The active project changed before the Review action.');
  }
  if (record.generation !== request.generation) {
    return fail('STALE_GENERATION', 'The project generation changed before the Review action.');
  }
  if (record.selectionFingerprint !== request.selectionFingerprint) {
    return fail('INVALID_REQUEST', 'The Review selection binding does not match.');
  }
  return { request, record };
}

function actionSenderAllowed(event: IpcMainInvokeEvent): boolean {
  const role = options?.resolveWindowRole(event.sender.id);
  return role === 'writing' || role === 'command';
}

function installHandler(
  channel: string,
  handler: (event: IpcMainInvokeEvent, value: unknown) => unknown,
): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
}

export function registerCritiqueReviewIpc(nextOptions: RegisterCritiqueReviewIpcOptions): void {
  options = nextOptions;
  installHandler(CRITIQUE_REVIEW_CHANNELS.requestState, (event) => {
    if (!actionSenderAllowed(event)) {
      return fail('WRONG_WINDOW_ROLE', 'This window cannot read the active Review projection.');
    }
    return getCritiqueReviewSurfaceState();
  });
  installHandler(CRITIQUE_REVIEW_CHANNELS.markStale, (event, value) => {
    if (options?.resolveWindowRole(event.sender.id) !== 'writing') {
      return fail('WRONG_WINDOW_ROLE', 'Only the Writing owner may mark Review source context stale.');
    }
    const bound = requireBoundRecord(value);
    if ('ok' in bound) return bound;
    if (bound.record.ownerSenderId !== event.sender.id) {
      return fail('WRONG_WINDOW_ROLE', 'This Writing window does not own the Review result.');
    }
    bound.record.stale = true;
    publish();
    return { ok: true, data: {}, state: getCritiqueReviewSurfaceState() } as const;
  });
  installHandler(CRITIQUE_REVIEW_CHANNELS.dismiss, (event, value) => {
    if (!actionSenderAllowed(event)) {
      return fail('WRONG_WINDOW_ROLE', 'This window cannot dismiss Review presentation.');
    }
    const bound = requireBoundRecord(value);
    if ('ok' in bound) return bound;
    bound.record.dismissed = true;
    publish();
    return { ok: true, data: {}, state: getCritiqueReviewSurfaceState() } as const;
  });
  installHandler(CRITIQUE_REVIEW_CHANNELS.saveFeedbackNote, async (event, value) => {
    if (!actionSenderAllowed(event)) {
      return fail('WRONG_WINDOW_ROLE', 'This window cannot request an advisory note.');
    }
    const request = value as Partial<SaveCritiqueReviewFeedbackNoteActionV1>;
    const bound = requireBoundRecord({
      schemaVersion: request?.schemaVersion,
      operationId: request?.operationId,
      projectId: request?.projectId,
      generation: request?.generation,
      requestId: request?.sourceCritiqueRequestId,
      selectionFingerprint: request?.selectionFingerprint,
    });
    if ('ok' in bound) return bound;
    const body = request?.body?.trim();
    if (
      typeof request?.unitId !== 'string' || request.unitId !== bound.record.unitId ||
      typeof request?.visibleResultFingerprint !== 'string' ||
      request.visibleResultFingerprint !== bound.record.visibleResultFingerprint ||
      !body || body.length > 4_000
    ) return fail('INVALID_REQUEST', 'The advisory note does not match the visible Review result.');
    const snapshot = options?.getWritingSnapshot();
    if (!snapshot?.project || snapshot.project.projectId !== bound.record.projectId) {
      return fail('STALE_PROJECT', 'The active project changed before the note was saved.');
    }
    if (snapshot.generation !== bound.record.generation) {
      return fail('STALE_GENERATION', 'The project generation changed before the note was saved.');
    }
    if (
      bound.record.stale || bound.record.state.status !== 'completed' ||
      !bound.record.state.result || snapshot.activeUnitId !== bound.record.unitId
    ) return fail('SOURCE_STALE', 'The source selection changed before the note was saved.');
    const repository = (options?.repositoryFactory ?? ((projectPath: string) => new FeedbackNotesRepository(projectPath)))(
      bound.record.projectPath,
    );
    try {
      const note = await repository.create({
        projectId: bound.record.projectId,
        unitId: bound.record.unitId,
        sourceCritiqueRequestId: bound.record.requestId,
        selectionFingerprint: bound.record.selectionFingerprint,
        body,
      });
      return { ok: true, data: { noteId: note.id }, state: getCritiqueReviewSurfaceState() } as const;
    } catch (error) {
      const message = error instanceof FeedbackNotesRepositoryError
        ? error.message
        : 'The feedback note could not be saved.';
      return fail('NOTE_WRITE_FAILED', message);
    }
  });
  installHandler(CRITIQUE_REVIEW_CHANNELS.returnToSource, (event, value) => {
    if (!actionSenderAllowed(event)) {
      return fail('WRONG_WINDOW_ROLE', 'This window cannot return to Writing Studio.');
    }
    const bound = requireBoundRecord(value);
    if ('ok' in bound) return bound;
    const snapshot = options?.getWritingSnapshot();
    const exact = Boolean(
      snapshot?.project?.projectId === bound.record.projectId &&
      snapshot.generation === bound.record.generation &&
      snapshot.activeUnitId === bound.record.unitId &&
      !bound.record.stale,
    );
    const message: CritiqueReviewSourceReturnMessageV1 = {
      schemaVersion: CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION,
      projectId: bound.record.projectId,
      generation: bound.record.generation,
      requestId: bound.record.requestId,
      status: exact ? 'exact' : 'stale',
      message: exact
        ? `Returned to the reviewed passage in ${bound.record.sourceLabel}.`
        : `Returned to Writing Studio, but the reviewed passage in ${bound.record.sourceLabel} is no longer current.`,
      ...(exact ? { anchor: bound.record.sourceReturnAnchor } : {}),
    };
    options?.requestSourceReturn(message);
    return {
      ok: true,
      data: { status: message.status },
      state: getCritiqueReviewSurfaceState(),
    } as const;
  });
}

export function resetCritiqueReviewIpcForTests(): void {
  for (const channel of Object.values(CRITIQUE_REVIEW_CHANNELS)) {
    if (
      channel !== CRITIQUE_REVIEW_CHANNELS.stateChanged &&
      channel !== CRITIQUE_REVIEW_CHANNELS.sourceReturnRequested
    ) ipcMain.removeHandler(channel);
  }
  records.clear();
  activeRequestId = null;
  options = null;
}
