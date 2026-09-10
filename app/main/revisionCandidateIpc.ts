import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { createHash } from 'node:crypto';
import path from 'node:path';

import {
  REVISION_CANDIDATE_CHANNELS,
  REVISION_CANDIDATE_MAX_PURPOSE_LENGTH,
  REVISION_CANDIDATE_MAX_TEXT_LENGTH,
  REVISION_CANDIDATE_MAX_SOURCE_LENGTH,
  type CreateLocalAiRevisionCandidateRequest,
  type CreateManualRevisionCandidateRequest,
  type EditRevisionCandidateRequest,
  type ListRevisionCandidatesRequest,
  type RevisionCandidateError,
  type RevisionCandidateProjectBinding,
  type RevisionCandidateResult,
  type RevisionCandidateLifecycle,
  type RevisionCandidateSourceAnchorV1,
  type SetRevisionCandidateLifecycleRequest,
} from '../shared/ipc/revisionCandidates.js';
import {
  type Program7LocalInferenceResponseV1,
  type Program7LocalInferenceRequestV1,
} from '../shared/localInference.js';
import { normalizeManuscriptSource } from '../shared/manuscriptStructure.js';
import { validateProgram7LocalInferenceRequest } from './program7LocalInferenceService.js';
import type {
  ProjectSpineSessionSnapshot,
  ProjectSpineWindowRole,
} from '../shared/ipc/projectSpine.js';
import {
  RevisionCandidateRepository,
  RevisionCandidateRepositoryError,
} from './revisionCandidateRepository.js';

export interface RevisionCandidateLocalInferenceService {
  run(
    request: CreateLocalAiRevisionCandidateRequest['inference'],
    options: { readonly authorInvoked: true },
  ): Promise<Program7LocalInferenceResponseV1>;
}

export interface RegisterRevisionCandidateIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => RevisionCandidateRepository;
  readonly localInferenceService?: RevisionCandidateLocalInferenceService;
}

let options: RegisterRevisionCandidateIpcOptions | null = null;

function fail(code: RevisionCandidateError['code'], message: string): RevisionCandidateResult {
  return { ok: false, error: { code, message } };
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
  };
  return normalize(left) === normalize(right);
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean {
  if (!record(value)) return false;
  const keys = Object.keys(value);
  return (
    keys.length >= required.length &&
    required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
}

function bindingValid(request: unknown): request is RevisionCandidateProjectBinding {
  if (!record(request)) return false;
  const candidate = request as Record<string, any>;
  return (
    typeof candidate.operationId === 'string' &&
    candidate.operationId.trim().length > 0 &&
    typeof candidate.projectId === 'string' &&
    candidate.projectId.trim().length > 0 &&
    typeof candidate.projectPath === 'string' &&
    candidate.projectPath.trim().length > 0 &&
    Number.isInteger(candidate.generation) &&
    candidate.generation >= 0
  );
}

function activeProject(
  event: IpcMainInvokeEvent,
  request: unknown,
  mutation: boolean,
):
  | { snapshot: ProjectSpineSessionSnapshot; repository: RevisionCandidateRepository }
  | RevisionCandidateResult {
  if (!options) return fail('NOT_AUTHORIZED', 'Revision candidates are not registered.');
  const role = options.resolveWindowRole(event.sender.id);
  if (role !== 'writing' && role !== 'command')
    return fail(
      'NOT_AUTHORIZED',
      'Revision candidates are available only in Black Skies project surfaces.',
    );
  if (mutation && role !== 'writing')
    return fail('NOT_AUTHORIZED', 'Revision candidate changes must originate in Writing Studio.');
  if (!bindingValid(request))
    return fail('INVALID_REQUEST', 'The revision candidate request is incomplete.');
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project)
    return fail('NO_ACTIVE_PROJECT', 'Open a project before using revision candidates.');
  if (
    snapshot.project.projectId !== request.projectId ||
    !samePath(snapshot.project.path, request.projectPath) ||
    snapshot.generation !== request.generation
  )
    return fail(
      'STALE_SESSION',
      'The active project changed before the revision candidate request completed.',
    );
  if (request.unitId !== undefined && request.unitId !== snapshot.activeUnitId)
    return fail('INVALID_REQUEST', 'The revision candidate unit is not active.');
  return {
    snapshot,
    repository: (
      options.repositoryFactory ??
      ((projectPath: string) => new RevisionCandidateRepository(projectPath))
    )(snapshot.project.path),
  };
}

function failure(value: ReturnType<typeof activeProject>): value is RevisionCandidateResult {
  return 'ok' in value;
}
function validRevision(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}
function validText(value: unknown, maximum: number, allowEmpty = false): value is string {
  return typeof value === 'string' && (allowEmpty || value.length > 0) && value.length <= maximum;
}
function validSource(
  source: unknown,
): source is CreateManualRevisionCandidateRequest['sourceSnapshot'] {
  if (!exactKeys(source, ['unitId', 'bodySha256', 'text'])) return false;
  const value = source as Record<string, unknown>;
  return (
    validText(value.unitId, 240) &&
    /^[a-f0-9]{64}$/.test(String(value.bodySha256)) &&
    validText(value.text, REVISION_CANDIDATE_MAX_SOURCE_LENGTH)
  );
}
function validProtection(value: unknown): boolean {
  if (!exactKeys(value, ['excluded', 'class'], ['reason'])) return false;
  const protection = value as Record<string, unknown>;
  return (
    typeof protection.excluded === 'boolean' &&
    ['ordinary', 'protected', 'metadata-only', 'ai-excluded'].includes(String(protection.class))
  );
}
function validAnchor(value: unknown): value is RevisionCandidateSourceAnchorV1 | null {
  if (value === null || value === undefined) return value === null || value === undefined;
  if (!exactKeys(value, ['unitId', 'selectionStart', 'selectionEnd', 'selectionFingerprint']))
    return false;
  const anchor = value as Record<string, unknown>;
  return (
    validText(anchor.unitId, 240) &&
    Number.isInteger(anchor.selectionStart) &&
    (anchor.selectionStart as number) >= 0 &&
    Number.isInteger(anchor.selectionEnd) &&
    (anchor.selectionEnd as number) >= (anchor.selectionStart as number) &&
    /^[a-f0-9]{64}$/.test(String(anchor.selectionFingerprint))
  );
}

function validInference(value: unknown): value is Program7LocalInferenceRequestV1 {
  if (
    !record(value) ||
    validateProgram7LocalInferenceRequest(value as unknown as Program7LocalInferenceRequestV1)
  )
    return false;
  return exactKeys(value, [
    'schema',
    'operation',
    'model',
    'requestId',
    'projectId',
    'source',
    'purpose',
    'limits',
    'protection',
  ]);
}

function durableBody(markdown: string): string {
  if (!markdown.startsWith('---')) return markdown;
  const closing = markdown.indexOf('\n---', 3);
  if (closing < 0) return markdown;
  return markdown.slice(closing + 4).replace(/^\r?\n/u, '');
}

function bodyHash(value: string): string {
  return createHash('sha256').update(normalizeManuscriptSource(value), 'utf8').digest('hex');
}

function activeUnitBody(
  snapshot: ProjectSpineSessionSnapshot,
  unitId: string,
): { body: string; hash: string } | null {
  const draft = snapshot.project?.drafts?.[unitId];
  if (typeof draft !== 'string') return null;
  const body = normalizeManuscriptSource(durableBody(draft));
  const hash = bodyHash(body);
  const metric = snapshot.project?.unitMetrics?.[unitId]?.bodySha256;
  if (metric !== undefined && metric !== hash) return null;
  return { body, hash };
}

function sourceAnchorCurrent(
  snapshot: ProjectSpineSessionSnapshot,
  unitId: string,
  sourceBodySha256: string,
  sourceText: string,
  anchor: RevisionCandidateSourceAnchorV1 | null | undefined,
): boolean {
  const current = activeUnitBody(snapshot, unitId);
  if (!current || current.hash !== sourceBodySha256) return false;
  if (anchor === null || anchor === undefined)
    return normalizeManuscriptSource(sourceText) === current.body;
  if (anchor.unitId !== unitId || anchor.selectionEnd > current.body.length) return false;
  const selected = current.body.slice(anchor.selectionStart, anchor.selectionEnd);
  return (
    normalizeManuscriptSource(sourceText) === selected &&
    bodyHash(selected) === anchor.selectionFingerprint
  );
}

function sourceCurrent(
  snapshot: ProjectSpineSessionSnapshot,
  unitId: string,
  sourceBodySha256: string,
): boolean {
  const current = activeUnitBody(snapshot, unitId);
  return current !== null && current.hash === sourceBodySha256;
}
function validLifecycle(value: unknown): value is RevisionCandidateLifecycle {
  return [
    'generated',
    'reviewing',
    'accepted',
    'partially accepted',
    'rejected',
    'parked',
    'abandoned',
    'stale',
  ].includes(String(value));
}

function repoFailure(error: unknown): RevisionCandidateResult {
  if (error instanceof RevisionCandidateRepositoryError) {
    if (error.code === 'STALE') return fail('STALE_CANDIDATES', error.message);
    if (error.code === 'UNKNOWN_CANDIDATE') return fail('UNKNOWN_CANDIDATE', error.message);
    if (error.code === 'PROTECTED_SOURCE') return fail('PROTECTED_SOURCE', error.message);
    if (error.code === 'LOCAL_AI_UNAVAILABLE') return fail('LOCAL_AI_UNAVAILABLE', error.message);
    if (error.code === 'UNAVAILABLE') return fail('CANDIDATES_UNAVAILABLE', error.message);
    return fail('CANDIDATE_WRITE_FAILED', error.message);
  }
  return fail('CANDIDATE_WRITE_FAILED', 'The revision candidate operation could not be completed.');
}

async function list(
  event: IpcMainInvokeEvent,
  request: ListRevisionCandidatesRequest,
): Promise<RevisionCandidateResult> {
  if (!exactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation'], ['unitId']))
    return fail('INVALID_REQUEST', 'The revision candidate list request is invalid.');
  const active = activeProject(event, request, false);
  if (failure(active)) return active;
  try {
    return { ok: true, data: await active.repository.read(active.snapshot.project!.projectId) };
  } catch (error) {
    return repoFailure(error);
  }
}

async function createManual(
  event: IpcMainInvokeEvent,
  request: CreateManualRevisionCandidateRequest,
): Promise<RevisionCandidateResult> {
  if (
    !exactKeys(
      request,
      [
        'operationId',
        'projectId',
        'projectPath',
        'generation',
        'expectedRevision',
        'sourceSnapshot',
        'purpose',
        'protection',
        'candidateText',
      ],
      ['unitId', 'sourceAnchor', 'warnings'],
    )
  )
    return fail('INVALID_REQUEST', 'The manual revision candidate request is invalid.');
  const active = activeProject(event, request, true);
  if (failure(active)) return active;
  if (
    !validRevision(request.expectedRevision) ||
    !validSource(request.sourceSnapshot) ||
    request.sourceSnapshot.unitId !== active.snapshot.activeUnitId ||
    !validAnchor(request.sourceAnchor) ||
    !validText(request.purpose, REVISION_CANDIDATE_MAX_PURPOSE_LENGTH) ||
    !validText(request.candidateText, REVISION_CANDIDATE_MAX_TEXT_LENGTH) ||
    !validProtection(request.protection) ||
    (request.warnings !== undefined &&
      (!Array.isArray(request.warnings) ||
        request.warnings.length > 12 ||
        !request.warnings.every((warning) => validText(warning, 1_000))))
  )
    return fail('INVALID_REQUEST', 'The manual revision candidate is invalid.');
  if (request.protection.excluded || request.protection.class !== 'ordinary')
    return fail(
      'PROTECTED_SOURCE',
      'Protected or excluded source content cannot be persisted as a candidate.',
    );
  if (
    !sourceCurrent(
      active.snapshot,
      request.sourceSnapshot.unitId,
      request.sourceSnapshot.bodySha256,
    )
  )
    return fail('STALE_CANDIDATES', 'The source unit changed; reload before creating a candidate.');
  if (
    !sourceAnchorCurrent(
      active.snapshot,
      request.sourceSnapshot.unitId,
      request.sourceSnapshot.bodySha256,
      request.sourceSnapshot.text,
      request.sourceAnchor,
    )
  )
    return fail('INVALID_REQUEST', 'The manual source anchor is invalid or stale.');
  try {
    return {
      ok: true,
      data: await active.repository.createManual(
        active.snapshot.project!.projectId,
        request.expectedRevision,
        request,
      ),
    };
  } catch (error) {
    return repoFailure(error);
  }
}

async function createLocalAi(
  event: IpcMainInvokeEvent,
  request: CreateLocalAiRevisionCandidateRequest,
): Promise<RevisionCandidateResult> {
  if (
    !exactKeys(
      request,
      ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'inference'],
      ['unitId', 'sourceAnchor'],
    )
  )
    return fail('INVALID_REQUEST', 'The local-AI revision candidate request is invalid.');
  const active = activeProject(event, request, true);
  if (failure(active)) return active;
  if (!options?.localInferenceService)
    return fail(
      'LOCAL_AI_UNAVAILABLE',
      'Local AI is unavailable; create a manual candidate instead.',
    );
  if (
    record(request.inference) &&
    record(request.inference.protection) &&
    (request.inference.protection.excluded === true ||
      request.inference.protection.class !== 'ordinary')
  )
    return fail(
      'PROTECTED_SOURCE',
      'Protected or excluded source content cannot be sent to local AI.',
    );
  if (
    !validRevision(request.expectedRevision) ||
    !validInference(request.inference) ||
    request.inference.projectId !== active.snapshot.project!.projectId ||
    request.inference.source.unitId !== active.snapshot.activeUnitId ||
    request.inference.source.text.length > REVISION_CANDIDATE_MAX_SOURCE_LENGTH ||
    !validAnchor(request.sourceAnchor) ||
    !validAnchor(request.sourceAnchor)
  )
    return fail('INVALID_REQUEST', 'The local-AI candidate request is invalid.');
  if (request.inference.protection.excluded || request.inference.protection.class !== 'ordinary')
    return fail(
      'PROTECTED_SOURCE',
      'Protected or excluded source content cannot be sent to local AI.',
    );
  if (
    !sourceCurrent(
      active.snapshot,
      request.inference.source.unitId,
      request.inference.source.bodySha256,
    )
  )
    return fail('STALE_CANDIDATES', 'The source unit changed; reload before using local AI.');
  if (
    !sourceAnchorCurrent(
      active.snapshot,
      request.inference.source.unitId,
      request.inference.source.bodySha256,
      request.inference.source.text,
      request.sourceAnchor,
    )
  )
    return fail('INVALID_REQUEST', 'The local-AI source anchor is invalid or stale.');
  try {
    const response = await options.localInferenceService.run(request.inference, {
      authorInvoked: true,
    });
    if (response.status !== 'candidate')
      return fail(
        'LOCAL_AI_UNAVAILABLE',
        response.reason || 'Local AI did not return a candidate.',
      );
    return {
      ok: true,
      data: await active.repository.createFromLocalAi(
        active.snapshot.project!.projectId,
        request.expectedRevision,
        request.inference,
        response,
        request.sourceAnchor ?? null,
      ),
    };
  } catch (error) {
    return repoFailure(error);
  }
}

async function edit(
  event: IpcMainInvokeEvent,
  request: EditRevisionCandidateRequest,
): Promise<RevisionCandidateResult> {
  if (
    !exactKeys(
      request,
      [
        'operationId',
        'projectId',
        'projectPath',
        'generation',
        'expectedRevision',
        'candidateId',
        'editedCandidateText',
      ],
      ['unitId'],
    )
  )
    return fail('INVALID_REQUEST', 'The revision candidate edit request is invalid.');
  const active = activeProject(event, request, true);
  if (failure(active)) return active;
  if (
    !validRevision(request.expectedRevision) ||
    !validText(request.candidateId, 240) ||
    !validText(request.editedCandidateText, REVISION_CANDIDATE_MAX_TEXT_LENGTH)
  )
    return fail('INVALID_REQUEST', 'The edited revision candidate is invalid.');
  try {
    return {
      ok: true,
      data: await active.repository.edit(
        active.snapshot.project!.projectId,
        request.expectedRevision,
        request.candidateId,
        request.editedCandidateText,
      ),
    };
  } catch (error) {
    return repoFailure(error);
  }
}

async function setLifecycle(
  event: IpcMainInvokeEvent,
  request: SetRevisionCandidateLifecycleRequest,
): Promise<RevisionCandidateResult> {
  if (
    !exactKeys(
      request,
      [
        'operationId',
        'projectId',
        'projectPath',
        'generation',
        'expectedRevision',
        'candidateId',
        'lifecycle',
      ],
      ['unitId', 'note'],
    )
  )
    return fail('INVALID_REQUEST', 'The revision candidate lifecycle request is invalid.');
  const active = activeProject(event, request, true);
  if (failure(active)) return active;
  if (
    !validRevision(request.expectedRevision) ||
    !validText(request.candidateId, 240) ||
    !validLifecycle(request.lifecycle) ||
    request.lifecycle === 'accepted' ||
    request.lifecycle === 'partially accepted' ||
    (request.note !== undefined && !validText(request.note, 1_000, true))
  )
    return fail('INVALID_REQUEST', 'The revision candidate lifecycle request is invalid.');
  try {
    return {
      ok: true,
      data: await active.repository.setLifecycle(
        active.snapshot.project!.projectId,
        request.expectedRevision,
        request.candidateId,
        request.lifecycle,
        request.note,
      ),
    };
  } catch (error) {
    return repoFailure(error);
  }
}

export function registerRevisionCandidateIpc(
  nextOptions: RegisterRevisionCandidateIpcOptions,
): void {
  options = nextOptions;
  for (const channel of Object.values(REVISION_CANDIDATE_CHANNELS)) ipcMain.removeHandler(channel);
  ipcMain.handle(REVISION_CANDIDATE_CHANNELS.list, (event, request: unknown) =>
    list(event, request as ListRevisionCandidatesRequest),
  );
  ipcMain.handle(REVISION_CANDIDATE_CHANNELS.createManual, (event, request: unknown) =>
    createManual(event, request as CreateManualRevisionCandidateRequest),
  );
  ipcMain.handle(REVISION_CANDIDATE_CHANNELS.createLocalAi, (event, request: unknown) =>
    createLocalAi(event, request as CreateLocalAiRevisionCandidateRequest),
  );
  ipcMain.handle(REVISION_CANDIDATE_CHANNELS.edit, (event, request: unknown) =>
    edit(event, request as EditRevisionCandidateRequest),
  );
  ipcMain.handle(REVISION_CANDIDATE_CHANNELS.setLifecycle, (event, request: unknown) =>
    setLifecycle(event, request as SetRevisionCandidateLifecycleRequest),
  );
}

export function resetRevisionCandidateIpcForTests(): void {
  for (const channel of Object.values(REVISION_CANDIDATE_CHANNELS)) ipcMain.removeHandler(channel);
  options = null;
}
