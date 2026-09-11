import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { createHash } from 'node:crypto';
import path from 'node:path';

import {
  AUTOMATIC_STORY_INTELLIGENCE_LENSES,
  AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
  AutomaticStoryIntelligenceCancelledError,
  analyzeAutomaticStoryIntelligence,
  type AutomaticStoryIntelligenceExcludedUnitV1,
  type AutomaticStoryIntelligenceAnalysisV1,
  type AutomaticStoryIntelligenceFindingV1,
  type AutomaticStoryIntelligenceLensResultV1,
  type AutomaticStoryIntelligenceRunRequestV1,
  type AutomaticStoryIntelligenceRunStateV1,
  type AutomaticStoryIntelligenceSavedUnitV1,
} from '../shared/ipc/automaticStoryIntelligence.js';
import {
  STORY_INTELLIGENCE_CHANNELS,
  type AutomaticStoryIntelligenceCancelRequestV1,
  type AutomaticStoryIntelligenceCancelResultV1,
  type AutomaticStoryIntelligenceResultV1,
  type AutomaticStoryIntelligenceScanRequestV1,
  type CheckStoryIntelligencePermissionRequestV1,
  type GetStoryIntelligenceRequestV1,
  type StoryIntelligenceErrorCodeV1,
  type StoryIntelligenceFailureV1,
  type StoryIntelligenceDocumentV1,
  type StoryIntelligencePermissionResultEnvelopeV1,
  type StoryIntelligenceProjectBindingV1,
  type StoryIntelligenceReadResultV1,
  type WriteStoryIntelligenceRequestV1,
  type StoryIntelligenceWriteResultV1,
} from '../shared/ipc/storyIntelligence.js';
import {
  PERMISSION_OPERATIONS_V1,
  SOURCE_CLASSES_V1,
  checkStoryIntelligencePermission,
  deriveStoryPositionCurrentness,
  validateStoryIntelligenceDocument,
  StoryIntelligenceValidationError,
} from '../shared/storyIntelligencePolicy.js';
import {
  LOCAL_EMOTION_ANALYSIS_SCHEMA_VERSION,
  parseLocalEmotionAnalysisModelText,
  sourceRefWithLocalEmotionAnchor,
} from '../shared/localEmotionInference.js';
import {
  PROGRAM7_LOCAL_INFERENCE_BOUNDS,
  PROGRAM7_LOCAL_INFERENCE_MODEL,
  PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
} from '../shared/localInference.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import { StoryIntelligenceRepository, StoryIntelligenceRepositoryError } from './storyIntelligenceRepository.js';
import type { Program7LocalInferenceService } from './program7LocalInferenceService.js';

export interface RegisterStoryIntelligenceIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => StoryIntelligenceRepository;
  readonly localInferenceService?: Program7LocalInferenceService;
}

let options: RegisterStoryIntelligenceIpcOptions | null = null;
const automaticRuns = new Map<string, AbortController>();

function fail(code: StoryIntelligenceErrorCodeV1, message: string): StoryIntelligenceFailureV1 {
  return { ok: false, error: { code, message } };
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
  };
  return normalize(left) === normalize(right);
}

function validBinding(request: StoryIntelligenceProjectBindingV1): boolean {
  return Boolean(request) &&
    typeof request.operationId === 'string' && request.operationId.trim().length > 0 &&
    typeof request.projectId === 'string' && request.projectId.trim().length > 0 &&
    typeof request.projectPath === 'string' && request.projectPath.trim().length > 0 &&
    Number.isInteger(request.generation) && request.generation >= 0;
}

function validPermissionRequest(request: CheckStoryIntelligencePermissionRequestV1): boolean {
  return validBinding(request) &&
    SOURCE_CLASSES_V1.includes(request.sourceClass) &&
    PERMISSION_OPERATIONS_V1.includes(request.operation);
}

function activeProject(
  event: IpcMainInvokeEvent,
  request: StoryIntelligenceProjectBindingV1,
): { readonly snapshot: ProjectSpineSessionSnapshot; readonly repository: StoryIntelligenceRepository } | StoryIntelligenceFailureV1 {
  const windowRole = options?.resolveWindowRole(event.sender.id);
  if (!options || (windowRole !== 'writing' && windowRole !== 'command')) {
    return fail('NOT_WRITING_STUDIO', 'Story intelligence is available only in the Stage 19 project surfaces.');
  }
  if (!validBinding(request)) return fail('INVALID_REQUEST', 'The story-intelligence request is incomplete.');
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return fail('NO_ACTIVE_PROJECT', 'Open a project before using story intelligence.');
  if (
    snapshot.project.projectId !== request.projectId ||
    !samePath(snapshot.project.path, request.projectPath) ||
    snapshot.generation !== request.generation
  ) return fail('STALE_SESSION', 'The active project changed before the story-intelligence request completed.');
  return {
    snapshot,
    repository: (options.repositoryFactory ?? ((projectPath: string) => new StoryIntelligenceRepository(projectPath)))(snapshot.project.path),
  };
}

function isFailure(value: ReturnType<typeof activeProject>): value is StoryIntelligenceFailureV1 {
  return 'ok' in value;
}

function repositoryFailure(error: unknown): StoryIntelligenceFailureV1 {
  if (error instanceof StoryIntelligenceRepositoryError) {
    if (error.code === 'STALE') return fail('STORY_INTELLIGENCE_STALE', error.message);
    if (error.code === 'UNAVAILABLE') return fail('STORY_INTELLIGENCE_UNAVAILABLE', error.message);
    return fail('STORY_INTELLIGENCE_WRITE_FAILED', error.message);
  }
  return fail('STORY_INTELLIGENCE_WRITE_FAILED', 'The story-intelligence operation could not be completed.');
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function normalizeBody(value: string): string {
  return value.replace(/\r\n?/gu, '\n');
}

function automaticRunKey(projectId: string, runId: string): string {
  return `${projectId}:${runId}`;
}

function automaticRequestIsValid(request: AutomaticStoryIntelligenceScanRequestV1): boolean {
  return Boolean(request) &&
    request.schemaVersion === AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION &&
    typeof request.runId === 'string' && request.runId.trim().length > 0 &&
    typeof request.analysisId === 'string' && request.analysisId.trim().length > 0 &&
    typeof request.requestedAt === 'string' && !Number.isNaN(Date.parse(request.requestedAt)) &&
    (request.origin === 'deterministic' || request.origin === 'local-inference') &&
    Array.isArray(request.lenses) &&
    request.lenses.length === AUTOMATIC_STORY_INTELLIGENCE_LENSES.length &&
    request.lenses.every((lens, index) => lens === AUTOMATIC_STORY_INTELLIGENCE_LENSES[index]);
}

function buildAutomaticRunRequest(
  request: AutomaticStoryIntelligenceScanRequestV1,
  snapshot: ProjectSpineSessionSnapshot,
  document: StoryIntelligenceDocumentV1,
): AutomaticStoryIntelligenceRunRequestV1 {
  const project = snapshot.project!;
  const drafts = project.drafts ?? {};
  const excludedUnits: AutomaticStoryIntelligenceExcludedUnitV1[] = [];
  const units: AutomaticStoryIntelligenceSavedUnitV1[] = [];
  const unitPolicies = new Map(document.unitPolicies.map((policy) => [policy.unitId, policy]));

  for (const unit of project.units) {
    const body = typeof drafts[unit.id] === 'string' ? normalizeBody(drafts[unit.id]!) : '';
    const policy = unitPolicies.get(unit.id);
    if (policy && !policy.enabled) {
      excludedUnits.push({ unitId: unit.id, orderIndex: unit.order, orderBasis: 'manuscript', protectionClass: 'ai-excluded', exclusionReason: 'policy' });
      continue;
    }
    if (!body) {
      excludedUnits.push({ unitId: unit.id, orderIndex: unit.order, orderBasis: 'manuscript', protectionClass: 'ai-excluded', exclusionReason: 'unavailable' });
      continue;
    }
    const bodySha256 = sha256(body);
    const wholeBodyFingerprint = sha256(body);
    const sourceRef = {
      projectId: project.projectId,
      sourceKind: 'manuscript' as const,
      sourceId: unit.id,
      sourceRevision: snapshot.generation,
      sourceFingerprint: bodySha256,
      unitId: unit.id,
      selectionStart: 0,
      selectionEnd: body.length,
      selectionFingerprint: wholeBodyFingerprint,
      bodySha256,
      orderIndex: unit.order,
      orderBasis: 'manuscript' as const,
    };
    units.push({
      unitId: unit.id,
      orderIndex: unit.order,
      orderBasis: 'manuscript',
      body,
      bodySha256,
      protectionClass: 'included',
      enabled: true,
      sourceRef,
      anchor: {
        unitId: unit.id,
        selectionStart: 0,
        selectionEnd: body.length,
        selectionFingerprint: wholeBodyFingerprint,
        bodySha256,
        orderIndex: unit.order,
        orderBasis: 'manuscript',
      },
    });
  }

  return {
    schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
    projectId: project.projectId,
    generation: snapshot.generation,
    runId: request.runId,
    analysisId: request.analysisId,
    requestedAt: request.requestedAt,
    origin: request.origin,
    lenses: request.lenses,
    units,
    excludedUnits,
    ...(request.rerunOf ? { rerunOf: request.rerunOf } : {}),
  };
}

function automaticState(
  request: AutomaticStoryIntelligenceRunRequestV1,
  status: AutomaticStoryIntelligenceRunStateV1['status'],
  analysis: AutomaticStoryIntelligenceRunStateV1['analysis'],
  error: AutomaticStoryIntelligenceRunStateV1['error'],
): AutomaticStoryIntelligenceRunStateV1 {
  const updatedAt = new Date().toISOString();
  return {
    schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
    projectId: request.projectId,
    runId: request.runId,
    analysisId: request.analysisId,
    origin: request.origin,
    status,
    requestedAt: request.requestedAt,
    updatedAt,
    progress: {
      runId: request.runId,
      analysisId: request.analysisId,
      status,
      processedUnitCount: status === 'completed' ? request.units.length : 0,
      totalUnitCount: request.units.length + request.excludedUnits.length,
      includedUnitCount: request.units.length,
      excludedUnitCount: request.excludedUnits.length,
      findingCount: analysis?.findingCount ?? 0,
      currentLens: null,
    },
    ...(request.rerunOf ? { rerunOf: request.rerunOf } : {}),
    analysis,
    error,
    terminalAt: status === 'completed' || status === 'cancelled' || status === 'failed' || status === 'stale'
      ? updatedAt
      : null,
    temporary: true,
    durableTruthMutation: false,
  };
}

async function analyzeAutomaticEmotionWithLocalAi(
  request: AutomaticStoryIntelligenceRunRequestV1,
  signal: AbortSignal,
): Promise<AutomaticStoryIntelligenceAnalysisV1> {
  const service = options?.localInferenceService;
  if (!service) throw new Error('The local emotion-analysis service is not configured.');
  const findings: AutomaticStoryIntelligenceFindingV1[] = [];
  for (const unit of request.units) {
    if (signal.aborted) throw new AutomaticStoryIntelligenceCancelledError();
    const inputLimit = PROGRAM7_LOCAL_INFERENCE_BOUNDS.emotion_analysis.inputChars;
    for (let chunkStart = 0, chunkIndex = 0; chunkStart < unit.body.length; chunkIndex += 1) {
      if (signal.aborted) throw new AutomaticStoryIntelligenceCancelledError();
      const chunk = unit.body.slice(chunkStart, chunkStart + inputLimit);
      const response = await service.run(
        {
          schema: PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
          operation: 'emotion_analysis',
          model: PROGRAM7_LOCAL_INFERENCE_MODEL,
          requestId: `${request.analysisId}:${unit.unitId}:${chunkIndex}`,
          projectId: request.projectId,
          source: {
            unitId: unit.unitId,
            bodySha256: unit.bodySha256,
            text: chunk,
          },
          purpose: 'Provide one temporary, advisory emotional observation for the Emotion Graph.',
          limits: PROGRAM7_LOCAL_INFERENCE_BOUNDS.emotion_analysis,
          protection: { excluded: false, class: 'ordinary' },
        },
        { signal, authorInvoked: true },
      );
      if (response.status === 'no_findings') {
        chunkStart += chunk.length;
        continue;
      }
      if (response.status !== 'candidate') throw new Error(response.reason || 'Local emotion analysis failed.');
      const parsed = parseLocalEmotionAnalysisModelText(response.text, chunk, sha256);
      if (!parsed) throw new Error('The local model returned invalid or ambiguous emotion evidence.');
      const localRef = sourceRefWithLocalEmotionAnchor(unit.sourceRef, parsed.anchor);
      const sourceRef = parsed.anchor
        ? { ...localRef, selectionStart: parsed.anchor.selectionStart + chunkStart, selectionEnd: parsed.anchor.selectionEnd + chunkStart }
        : localRef;
      findings.push({
      schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
      findingId: `${request.analysisId}:emotion:${unit.unitId}:${chunkIndex}`,
      projectId: request.projectId,
      analysisId: request.analysisId,
      lens: 'emotion',
      summary: `${parsed.output.emotion}: ${parsed.output.summary}`,
      emotionLabel: parsed.output.emotion,
      intensityBand: parsed.output.intensity,
      ...(parsed.output.subject ? { subjectLabel: parsed.output.subject } : {}),
      evidenceClass: 'inferred',
      confidenceBand: parsed.output.confidence,
      uncertainty: parsed.output.confidence === 'high' ? 'low' : 'medium',
      evidenceSummary: parsed.anchor
        ? `Local AI advisory observation from ${PROGRAM7_LOCAL_INFERENCE_MODEL}. Exact source quote: “${parsed.anchor.text}”.`
        : `Local AI advisory observation from ${PROGRAM7_LOCAL_INFERENCE_MODEL}. The model supplied no unique source quote; review the source unit.`,
      positionRefs: [sourceRef],
      provenance: {
        sourceOwner: 'Local AI emotion analysis',
        origin: 'local-inference',
        visibility: 'included',
        citationRequired: true,
        protectionClass: unit.protectionClass,
      },
      temporary: true,
      durableTruthMutation: false,
      });
      chunkStart += chunk.length;
    }
  }
  const lensResults: AutomaticStoryIntelligenceLensResultV1[] = request.lenses.map((lens) => ({
    lens,
    findings: lens === 'emotion' ? findings : [],
  }));
  return {
    schemaVersion: AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION,
    projectId: request.projectId,
    generation: request.generation,
    runId: request.runId,
    analysisId: request.analysisId,
    origin: 'local-inference',
    lenses: request.lenses,
    includedUnitCount: request.units.length,
    excludedUnitCount: request.excludedUnits.length,
    findingCount: findings.length,
    excludedUnits: request.excludedUnits,
    lensResults,
    temporary: true,
    durableTruthMutation: false,
    createdAt: request.requestedAt,
  };
}

async function automaticScan(
  event: IpcMainInvokeEvent,
  request: AutomaticStoryIntelligenceScanRequestV1,
): Promise<AutomaticStoryIntelligenceResultV1> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!automaticRequestIsValid(request)) return fail('INVALID_REQUEST', 'The automatic manuscript scan request is invalid.');
  const key = automaticRunKey(request.projectId, request.runId);
  if (automaticRuns.has(key)) return fail('INVALID_REQUEST', 'A scan with this run id is already active.');
  try {
    const document = await active.repository.read(active.snapshot.project!.projectId);
    if ((!document.settings.analysisPolicy.deterministicEnabled && request.origin === 'deterministic') ||
      (!document.settings.analysisPolicy.optionalInferenceEnabled && request.origin === 'local-inference') ||
      !document.settings.analysisPolicy.allowedSourceClasses.includes('included') ||
      document.settings.analysisPolicy.excludedSourceClasses.includes('included')) {
      return fail('STORY_INTELLIGENCE_DENIED', request.origin === 'local-inference'
        ? 'Optional local interpretation is disabled by this project policy.'
        : 'Deterministic manuscript scanning is disabled by this project policy.');
    }
    const runRequest = buildAutomaticRunRequest(request, active.snapshot, document);
    if (runRequest.units.length === 0) return fail('STORY_INTELLIGENCE_UNAVAILABLE', 'No saved manuscript units are available to scan.');
    const controller = new AbortController();
    automaticRuns.set(key, controller);
    try {
      const analysis = request.origin === 'local-inference'
        ? await analyzeAutomaticEmotionWithLocalAi(runRequest, controller.signal)
        : await analyzeAutomaticStoryIntelligence(runRequest, {
            sha256,
            now: request.requestedAt,
            isCancelled: () => controller.signal.aborted,
          });
      const current = activeProject(event, request);
      if (isFailure(current)) {
        return { ok: true, data: automaticState(runRequest, 'stale', null, { code: 'stale', message: current.error.message }) };
      }
      return { ok: true, data: automaticState(runRequest, 'completed', analysis, null) };
    } catch (error) {
      if (error instanceof AutomaticStoryIntelligenceCancelledError || controller.signal.aborted) {
        return { ok: true, data: automaticState(runRequest, 'cancelled', null, { code: 'cancelled', message: 'The automatic manuscript scan was cancelled.' }) };
      }
      return { ok: true, data: automaticState(runRequest, 'failed', null, {
        code: 'failed',
        message: request.origin === 'local-inference' && error instanceof Error
          ? error.message.slice(0, 240)
          : 'The automatic manuscript scan failed.',
      }) };
    } finally {
      automaticRuns.delete(key);
    }
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function automaticCancel(
  event: IpcMainInvokeEvent,
  request: AutomaticStoryIntelligenceCancelRequestV1,
): Promise<AutomaticStoryIntelligenceCancelResultV1> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!request || request.schemaVersion !== AUTOMATIC_STORY_INTELLIGENCE_SCHEMA_VERSION ||
    typeof request.runId !== 'string' || typeof request.analysisId !== 'string' ||
    typeof request.reason !== 'string' || request.reason.trim().length === 0) {
    return fail('INVALID_REQUEST', 'The automatic manuscript cancellation request is invalid.');
  }
  const controller = automaticRuns.get(automaticRunKey(request.projectId, request.runId));
  if (controller) controller.abort();
  return { ok: true, data: { accepted: Boolean(controller), runId: request.runId } };
}

function conversionSnapshotKey(snapshot: ProjectSpineSessionSnapshot): string {
  return JSON.stringify({
    role: snapshot.role,
    generation: snapshot.generation,
    revision: snapshot.revision,
    project: snapshot.project && {
      projectId: snapshot.project.projectId,
      path: snapshot.project.path,
      units: snapshot.project.units,
      unitMetrics: snapshot.project.unitMetrics,
    },
    activeUnitId: snapshot.activeUnitId,
    dirtyUnitIds: snapshot.dirtyUnitIds,
    saveState: snapshot.saveState,
    lastError: snapshot.lastError,
    recovery: snapshot.recovery,
  });
}

function conversionSnapshotIsStable(snapshot: ProjectSpineSessionSnapshot): boolean {
  return snapshot.role === 'writing' &&
    snapshot.dirtyUnitIds.length === 0 &&
    (snapshot.saveState.status === 'clean' || snapshot.saveState.status === 'saved');
}

function signalIsCurrentAgainstSnapshot(
  signal: StoryIntelligenceDocumentV1['durableSignals'][number],
  snapshot: ProjectSpineSessionSnapshot,
): boolean {
  if (signal.currentness !== 'current' || signal.positionRefs.length === 0 || !snapshot.project) return false;
  const project = snapshot.project;
  return signal.positionRefs.every((reference) => {
    const unit = project.units.find((candidate) =>
      reference.unitId === candidate.id || reference.sourceId === candidate.id,
    );
    const bodySha256 = unit ? project.unitMetrics?.[unit.id]?.bodySha256 : undefined;
    if (!unit || !bodySha256) return false;
    return deriveStoryPositionCurrentness(reference, {
      available: true,
      sourceRevision: snapshot.generation,
      sourceFingerprint: bodySha256,
    }) === 'current';
  });
}

async function read(event: IpcMainInvokeEvent, request: GetStoryIntelligenceRequestV1): Promise<StoryIntelligenceReadResultV1> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  try {
    return { ok: true, data: await active.repository.read(active.snapshot.project!.projectId) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function write(event: IpcMainInvokeEvent, request: WriteStoryIntelligenceRequestV1): Promise<StoryIntelligenceWriteResultV1> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!Number.isInteger(request.expectedRevision) || request.expectedRevision < 0) {
    return fail('INVALID_REQUEST', 'The story-intelligence expected revision is invalid.');
  }
  try {
    const initialSnapshotKey = conversionSnapshotKey(active.snapshot);
    const validated = validateStoryIntelligenceDocument(request.document, active.snapshot.project!.projectId);
    const current = await active.repository.read(active.snapshot.project!.projectId);
    const converting = validated.durableSignals.filter((signal) => {
      const prior = current.durableSignals.find((candidate) => candidate.signalId === signal.signalId);
      return signal.lifecycle === 'converted' && prior?.lifecycle !== 'converted';
    });
    if (converting.length === 0) {
      return { ok: true, data: await active.repository.write(active.snapshot.project!.projectId, request.expectedRevision, validated) };
    }
    if (!conversionSnapshotIsStable(active.snapshot) || conversionSnapshotKey(options!.getWritingSnapshot()) !== initialSnapshotKey) {
      return fail('STORY_INTELLIGENCE_STALE', 'The Writing Studio manuscript changed or is being saved; reload it before converting a signal.');
    }
    if (converting.some((signal) => {
      const prior = current.durableSignals.find((candidate) => candidate.signalId === signal.signalId);
      return !prior ||
        !signalIsCurrentAgainstSnapshot(prior, active.snapshot) ||
        !signalIsCurrentAgainstSnapshot(signal, active.snapshot);
    })) {
      return fail('STORY_INTELLIGENCE_STALE', 'This signal is stale against the saved manuscript and cannot be converted.');
    }
    if (conversionSnapshotKey(options!.getWritingSnapshot()) !== initialSnapshotKey) {
      return fail('STORY_INTELLIGENCE_STALE', 'The Writing Studio manuscript changed during signal conversion; reload it before trying again.');
    }
    const saved = await active.repository.write(active.snapshot.project!.projectId, request.expectedRevision, validated);
    if (conversionSnapshotKey(options!.getWritingSnapshot()) !== initialSnapshotKey) {
      return fail('STORY_INTELLIGENCE_STALE', 'The Writing Studio manuscript changed during signal conversion; reload it before trying again.');
    }
    return { ok: true, data: saved };
  } catch (error) {
    if (error instanceof StoryIntelligenceValidationError) return fail('INVALID_REQUEST', 'The story-intelligence document is invalid.');
    return repositoryFailure(error);
  }
}

async function checkPermission(
  event: IpcMainInvokeEvent,
  request: CheckStoryIntelligencePermissionRequestV1,
): Promise<StoryIntelligencePermissionResultEnvelopeV1> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!validPermissionRequest(request)) return { ok: false, error: { code: 'INVALID_REQUEST', message: 'The story-intelligence permission request is invalid.' } };
  try {
    const document = await active.repository.read(active.snapshot.project!.projectId);
    const result = checkStoryIntelligencePermission(
      request.sourceClass,
      request.operation,
      document.settings.analysisPolicy,
    );
    return { ok: true, data: result };
  } catch (error) {
    return repositoryFailure(error);
  }
}

export function registerStoryIntelligenceIpc(nextOptions: RegisterStoryIntelligenceIpcOptions): void {
  options = nextOptions;
  for (const channel of Object.values(STORY_INTELLIGENCE_CHANNELS)) ipcMain.removeHandler(channel);
  ipcMain.handle(STORY_INTELLIGENCE_CHANNELS.read, (event, request: unknown) => read(event, request as GetStoryIntelligenceRequestV1));
  ipcMain.handle(STORY_INTELLIGENCE_CHANNELS.write, (event, request: unknown) => write(event, request as WriteStoryIntelligenceRequestV1));
  ipcMain.handle(STORY_INTELLIGENCE_CHANNELS.checkPermission, (event, request: unknown) => checkPermission(event, request as CheckStoryIntelligencePermissionRequestV1));
  ipcMain.handle(STORY_INTELLIGENCE_CHANNELS.automaticScan, (event, request: unknown) => automaticScan(event, request as AutomaticStoryIntelligenceScanRequestV1));
  ipcMain.handle(STORY_INTELLIGENCE_CHANNELS.automaticCancel, (event, request: unknown) => automaticCancel(event, request as AutomaticStoryIntelligenceCancelRequestV1));
}

export function resetStoryIntelligenceIpcForTests(): void {
  for (const channel of Object.values(STORY_INTELLIGENCE_CHANNELS)) ipcMain.removeHandler(channel);
  for (const controller of automaticRuns.values()) controller.abort();
  automaticRuns.clear();
  options = null;
}
