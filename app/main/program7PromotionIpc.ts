import { createHash } from 'node:crypto';
import path from 'node:path';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import {
  calculateNarrativeInsertion,
  NARRATIVE_INSERTION_MAX_TEXT_LENGTH,
  type NarrativeInsertionCalculationRequestV1,
} from '../shared/narrativeInsertion.js';
import {
  PROGRAM7_PROMOTION_CHANNELS,
  PROGRAM7_PROMOTION_MAX_ITEMS,
  PROGRAM7_PROMOTION_MAX_TEXT_LENGTH,
  type Program7AuthorIntentPromotionPayloadV1,
  type Program7DeferredPromotionPackageV1,
  type Program7DeferredPromotionPayloadV1,
  type Program7NarrativeInsertionPromotionPayloadV1,
  type Program7OutlinePromotionPayloadV1,
  type Program7PromotionDestinationInputV1,
  type Program7PromotionDestinationV1,
  type Program7PromotionHandoffRequestV1,
  type Program7PromotionHandoffResultV1,
  type Program7PromotionItemV1,
  type Program7PromotionOutcomeV1,
  type Program7PromotionOwnerResultV1,
  type Program7PromotionProtectionV1,
  type Program7PromotionSourceV1,
} from '../shared/ipc/program7Promotion.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';

export interface RegisterProgram7PromotionIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly acceptAuthorIntent?: (input: Program7PromotionDestinationInputV1) => Promise<Program7PromotionOwnerResultV1>;
  readonly acceptOutline?: (input: Program7PromotionDestinationInputV1) => Promise<Program7PromotionOwnerResultV1>;
}

export type Program7PromotionErrorCode =
  | 'NOT_WRITING_STUDIO'
  | 'NO_ACTIVE_PROJECT'
  | 'STALE_SESSION'
  | 'INVALID_REQUEST'
  | 'PROTECTED_SOURCE'
  | 'IDEMPOTENCY_CONFLICT';

export interface Program7PromotionError {
  readonly code: Program7PromotionErrorCode;
  readonly message: string;
}

export type Program7PromotionIpcResult =
  | { readonly ok: true; readonly data: Program7PromotionHandoffResultV1 }
  | { readonly ok: false; readonly error: Program7PromotionError };

const destinations: readonly Program7PromotionDestinationV1[] = [
  'author-intent',
  'outline',
  'narrative-insertion',
  'character',
  'lore',
];
const sourceKinds = ['ideation-seed', 'ideation-branch', 'revision-candidate', 'feedback-note', 'manual'] as const;
const protectionClasses = ['ordinary', 'protected', 'metadata-only', 'ai-excluded'] as const;
const foundationPostures = ['blank', 'unknown', 'undecided', 'answered'] as const;
const outlineKinds = ['fragment', 'gap', 'container'] as const;
const outlineStates = ['authored', 'planned', 'inferred', 'proposed'] as const;

function fail(code: Program7PromotionErrorCode, message: string): Program7PromotionIpcResult {
  return { ok: false, error: { code, message } };
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value: unknown, required: readonly string[], optional: readonly string[] = []): boolean {
  if (!record(value)) return false;
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key));
}

function bounded(value: unknown, maximum: number, required = false): value is string {
  return typeof value === 'string' && value.length <= maximum && (!required || value.trim().length > 0);
}

function id(value: unknown, maximum = 240): value is string {
  return bounded(value, maximum, true);
}

function sha256(value: string): string {
  return createHash('sha256').update(value.replace(/\r\n?/gu, '\n'), 'utf8').digest('hex');
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stable(item)).join(',')}]`;
  if (record(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
  };
  return normalize(left) === normalize(right);
}

function validProtection(value: unknown): value is Program7PromotionProtectionV1 {
  if (!exactKeys(value, ['excluded', 'class'])) return false;
  const protection = value as Record<string, unknown>;
  return typeof protection.excluded === 'boolean' &&
    protectionClasses.includes(protection.class as Program7PromotionProtectionV1['class']) &&
    (!(protection.excluded === true) || protection.class !== 'ordinary');
}

function validSource(value: unknown): value is Program7PromotionSourceV1 {
  if (!exactKeys(value, ['kind', 'sourceId', 'sourceRevision', 'sourceFingerprint', 'selectedTextSha256', 'provenance', 'protection'])) return false;
  const source = value as Record<string, unknown>;
  const provenance = source.provenance;
  return sourceKinds.includes(source.kind as Program7PromotionSourceV1['kind']) &&
    id(source.sourceId) && Number.isInteger(source.sourceRevision) && Number(source.sourceRevision) >= 0 &&
    /^[a-f0-9]{64}$/iu.test(String(source.sourceFingerprint)) &&
    /^[a-f0-9]{64}$/iu.test(String(source.selectedTextSha256)) &&
    exactKeys(provenance, ['origin', 'sourceReference', 'authorRequested']) &&
    ['author', 'manual', 'local-ai', 'mixed'].includes(String((provenance as Record<string, unknown>).origin)) &&
    ((provenance as Record<string, unknown>).sourceReference === null || bounded((provenance as Record<string, unknown>).sourceReference, 1_000)) &&
    typeof (provenance as Record<string, unknown>).authorRequested === 'boolean' &&
    validProtection(source.protection);
}

function validOutlineAnchor(value: unknown): boolean {
  if (value === null) return true;
  if (!exactKeys(value, [
    'schemaVersion', 'unitId', 'anchorKind', 'selectionStart', 'selectionEnd',
    'selectionSearchFingerprint', 'sourceFingerprint', 'selectionFingerprint',
    'prefixLength', 'prefixSearchFingerprint', 'prefixFingerprint',
    'suffixLength', 'suffixSearchFingerprint', 'suffixFingerprint',
  ])) return false;
  const anchor = value as Record<string, unknown>;
  return anchor.schemaVersion === 1 && id(anchor.unitId) &&
    (anchor.anchorKind === 'position' || anchor.anchorKind === 'span') &&
    Number.isInteger(anchor.selectionStart) && Number(anchor.selectionStart) >= 0 &&
    Number.isInteger(anchor.selectionEnd) && Number(anchor.selectionEnd) >= Number(anchor.selectionStart) &&
    (anchor.anchorKind === 'position' ? Number(anchor.selectionStart) === Number(anchor.selectionEnd) : Number(anchor.selectionEnd) > Number(anchor.selectionStart)) &&
    /^[a-f0-9]{64}$/iu.test(String(anchor.sourceFingerprint)) &&
    /^[a-f0-9]{64}$/iu.test(String(anchor.selectionFingerprint)) &&
    /^[a-f0-9]{8}$/iu.test(String(anchor.selectionSearchFingerprint)) &&
    Number.isInteger(anchor.prefixLength) && Number(anchor.prefixLength) >= 0 && Number(anchor.prefixLength) <= 32 &&
    /^[a-f0-9]{8}$/iu.test(String(anchor.prefixSearchFingerprint)) &&
    /^[a-f0-9]{64}$/iu.test(String(anchor.prefixFingerprint)) &&
    Number.isInteger(anchor.suffixLength) && Number(anchor.suffixLength) >= 0 && Number(anchor.suffixLength) <= 32 &&
    /^[a-f0-9]{8}$/iu.test(String(anchor.suffixSearchFingerprint)) &&
    /^[a-f0-9]{64}$/iu.test(String(anchor.suffixFingerprint));
}

function validNarrativeAnchor(value: unknown): boolean {
  if (value === null) return true;
  if (!exactKeys(value, ['unitId', 'selectionStart', 'selectionEnd', 'selectionFingerprint'])) return false;
  const anchor = value as Record<string, unknown>;
  return id(anchor.unitId) && Number.isInteger(anchor.selectionStart) && Number(anchor.selectionStart) >= 0 &&
    Number.isInteger(anchor.selectionEnd) && Number(anchor.selectionEnd) >= Number(anchor.selectionStart) &&
    /^[a-f0-9]{64}$/iu.test(String(anchor.selectionFingerprint));
}

function validNarrativeCalculation(value: unknown): value is NarrativeInsertionCalculationRequestV1 {
  if (!exactKeys(value, ['candidate', 'currentBody', 'mode'], ['candidateSelection', 'triggeredRisks', 'acknowledgedRisks'])) return false;
  const calculation = value as Record<string, unknown>;
  if (!bounded(calculation.currentBody, 2_000_000) || !record(calculation.candidate)) return false;
  const candidate = calculation.candidate;
  if (!exactKeys(candidate, ['projectId', 'unitId', 'sourceSnapshot', 'sourceAnchor', 'candidateText', 'editedCandidateText'], ['protection'])) return false;
  const candidateValue = candidate as Record<string, unknown>;
  const snapshot = candidateValue.sourceSnapshot;
  if (!exactKeys(snapshot, ['unitId', 'bodySha256', 'text'])) return false;
  const snapshotValue = snapshot as Record<string, unknown>;
  if (!id(candidateValue.projectId) || !id(candidateValue.unitId) || !id(snapshotValue.unitId) ||
    !bounded(snapshotValue.text, 2_000_000) || !/^[a-f0-9]{64}$/iu.test(String(snapshotValue.bodySha256)) ||
    !bounded(candidateValue.candidateText, NARRATIVE_INSERTION_MAX_TEXT_LENGTH) ||
    !(candidateValue.editedCandidateText === null || bounded(candidateValue.editedCandidateText, NARRATIVE_INSERTION_MAX_TEXT_LENGTH)) ||
    !validNarrativeAnchor(candidateValue.sourceAnchor) ||
    (candidateValue.protection !== undefined && !validProtection(candidateValue.protection))) return false;
  if (!['accept-all', 'accept-selected-text', 'accept-edited-before-acceptance'].includes(String(calculation.mode))) return false;
  if (calculation.candidateSelection !== undefined && (!record(calculation.candidateSelection) ||
    !exactKeys(calculation.candidateSelection, ['selectionStart', 'selectionEnd']) ||
    !Number.isInteger((calculation.candidateSelection as Record<string, unknown>).selectionStart) ||
    !Number.isInteger((calculation.candidateSelection as Record<string, unknown>).selectionEnd))) return false;
  for (const key of ['triggeredRisks', 'acknowledgedRisks']) {
    const risks = calculation[key];
    if (risks !== undefined && (!Array.isArray(risks) || !risks.every((risk) => ['canon', 'continuity', 'protected-content', 'source-staleness'].includes(String(risk))))) return false;
  }
  return true;
}

function validPayload(value: unknown): value is Program7PromotionItemV1['payload'] {
  if (!record(value) || typeof value.destination !== 'string') return false;
  if (value.destination === 'author-intent') {
    return exactKeys(value, ['destination', 'questionId', 'posture', 'text']) && id(value.questionId) &&
      foundationPostures.includes(value.posture as Program7AuthorIntentPromotionPayloadV1['posture']) && bounded(value.text, PROGRAM7_PROMOTION_MAX_TEXT_LENGTH);
  }
  if (value.destination === 'outline') {
    return exactKeys(value, ['destination', 'label', 'body', 'kind', 'state', 'manuscriptUnitId', 'sourceAnchor']) &&
      bounded(value.label, 240, true) && bounded(value.body, 4_000) && outlineKinds.includes(value.kind as Program7OutlinePromotionPayloadV1['kind']) &&
      outlineStates.includes(value.state as Program7OutlinePromotionPayloadV1['state']) &&
      (value.manuscriptUnitId === null || id(value.manuscriptUnitId)) && validOutlineAnchor(value.sourceAnchor);
  }
  if (value.destination === 'narrative-insertion') {
    return exactKeys(value, ['destination', 'calculation']) && validNarrativeCalculation(value.calculation);
  }
  if (value.destination === 'character' || value.destination === 'lore') {
    return exactKeys(value, ['destination', 'label', 'summary'], ['selectedText']) &&
      bounded(value.label, 240, true) && bounded(value.summary, PROGRAM7_PROMOTION_MAX_TEXT_LENGTH, true) &&
      (value.selectedText === undefined || bounded(value.selectedText, PROGRAM7_PROMOTION_MAX_TEXT_LENGTH));
  }
  return false;
}

function validItem(value: unknown): value is Program7PromotionItemV1 {
  if (!exactKeys(value, ['itemId', 'destination', 'source', 'payload', 'ownerAcceptance'])) return false;
  const item = value as Record<string, unknown>;
  const acceptance = item.ownerAcceptance as Record<string, unknown>;
  return id(item.itemId) && destinations.includes(item.destination as Program7PromotionDestinationV1) &&
    validSource(item.source) && validPayload(item.payload) &&
    exactKeys(acceptance, ['accepted', 'actor', 'acceptanceId']) &&
    acceptance.accepted === true && acceptance.actor === 'author' && id(acceptance.acceptanceId, 320);
}

function validRequest(value: unknown): value is Program7PromotionHandoffRequestV1 {
  if (!exactKeys(value, ['operationId', 'projectId', 'projectPath', 'generation', 'items'])) return false;
  const request = value as Record<string, unknown>;
  if (!id(request.operationId, 160) || !id(request.projectId) || !bounded(request.projectPath, 2_000, true) ||
    !Number.isInteger(request.generation) || Number(request.generation) < 0 || !Array.isArray(request.items) ||
    request.items.length === 0 || request.items.length > PROGRAM7_PROMOTION_MAX_ITEMS || !request.items.every(validItem)) return false;
  return new Set(request.items.map((item) => (item as Program7PromotionItemV1).itemId)).size === request.items.length;
}

function activeProject(
  senderId: number,
  request: unknown,
  options: RegisterProgram7PromotionIpcOptions,
): { readonly request: Program7PromotionHandoffRequestV1; readonly snapshot: ProjectSpineSessionSnapshot } | Program7PromotionIpcResult {
  if (options.resolveWindowRole(senderId) !== 'writing') return fail('NOT_WRITING_STUDIO', 'Promotion acceptance must originate in Writing Studio.');
  if (!validRequest(request)) return fail('INVALID_REQUEST', 'The Program 7 promotion handoff request is invalid.');
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return fail('NO_ACTIVE_PROJECT', 'Open a project before accepting a promotion handoff.');
  if (snapshot.project.projectId !== request.projectId || !samePath(snapshot.project.path, request.projectPath) || snapshot.generation !== request.generation) {
    return fail('STALE_SESSION', 'The active project changed before the promotion handoff completed.');
  }
  return { request, snapshot };
}

function outcome(
  item: Program7PromotionItemV1,
  status: Program7PromotionOutcomeV1['status'],
  message: string,
  artifactId: string | null = null,
  extras: Pick<Program7PromotionOutcomeV1, 'narrativeCalculation' | 'deferredPackage'> = {},
): Program7PromotionOutcomeV1 {
  return { itemId: item.itemId, destination: item.destination, status, source: item.source, artifactId, message, ...extras };
}

function deferredPackage(item: Program7PromotionItemV1, payload: Program7DeferredPromotionPayloadV1): Program7DeferredPromotionPackageV1 {
  const safeText = item.source.protection.excluded || item.source.protection.class !== 'ordinary' ? null : payload.selectedText ?? null;
  return {
    schemaVersion: 'BlackSkiesProgram7Promotion v1',
    itemId: item.itemId,
    destination: payload.destination,
    source: item.source,
    label: payload.label,
    summary: payload.summary,
    selectedText: safeText,
    contentAvailable: safeText !== null,
    status: 'deferred',
    reason: 'destination-owner-required',
  };
}

function ownerFailure(item: Program7PromotionItemV1, destination: string): Program7PromotionOutcomeV1 {
  return outcome(item, 'failed', `The ${destination} destination owner is unavailable; no destination write occurred.`);
}

export class Program7PromotionCoordinator {
  private readonly completed = new Map<string, { readonly requestHash: string; readonly result: Program7PromotionIpcResult }>();
  private readonly inFlight = new Map<string, { readonly requestHash: string; readonly result: Promise<Program7PromotionIpcResult> }>();

  constructor(private readonly options: RegisterProgram7PromotionIpcOptions) {}

  async handoff(senderId: number, request: unknown): Promise<Program7PromotionIpcResult> {
    const active = activeProject(senderId, request, this.options);
    if ('ok' in active) return active;
    const requestHash = sha256(stable(active.request));
    const cached = this.completed.get(active.request.operationId);
    if (cached) {
      return cached.requestHash === requestHash
        ? cached.result
        : fail('IDEMPOTENCY_CONFLICT', 'That operation ID was already used for a different promotion handoff.');
    }
    const running = this.inFlight.get(active.request.operationId);
    if (running) {
      return running.requestHash === requestHash
        ? running.result
        : fail('IDEMPOTENCY_CONFLICT', 'That operation ID is already running with a different promotion handoff.');
    }
    const result = this.execute(active.request);
    this.inFlight.set(active.request.operationId, { requestHash, result });
    try {
      const resolved = await result;
      this.completed.set(active.request.operationId, { requestHash, result: resolved });
      while (this.completed.size > 256) this.completed.delete(this.completed.keys().next().value as string);
      return resolved;
    } finally {
      if (this.inFlight.get(active.request.operationId)?.result === result) this.inFlight.delete(active.request.operationId);
    }
  }

  private async execute(request: Program7PromotionHandoffRequestV1): Promise<Program7PromotionIpcResult> {
    const outcomes: Program7PromotionOutcomeV1[] = [];
    for (const item of request.items) outcomes.push(await this.route(request, item));
    const failures = outcomes.filter((item) => item.status === 'failed').length;
    const status: Program7PromotionHandoffResultV1['status'] = failures === 0 ? 'complete' : failures === outcomes.length ? 'failed' : 'partial';
    return {
      ok: true,
      data: {
        schemaVersion: 'BlackSkiesProgram7Promotion v1',
        operationId: request.operationId,
        projectId: request.projectId,
        status,
        outcomes,
        message: status === 'complete'
          ? 'Every promotion item was routed or explicitly deferred.'
          : status === 'partial'
            ? 'Some promotion items were routed or deferred; at least one destination failed.'
            : 'No promotion item reached a destination owner or deferred handoff.',
      },
    };
  }

  private async route(request: Program7PromotionHandoffRequestV1, item: Program7PromotionItemV1): Promise<Program7PromotionOutcomeV1> {
    if (item.source.protection.excluded || item.source.protection.class !== 'ordinary') {
      if (item.destination !== 'character' && item.destination !== 'lore') {
        return outcome(item, 'failed', 'Protected or excluded source material cannot be routed into this destination.');
      }
      const payload = item.payload as Program7DeferredPromotionPayloadV1;
      if (payload.selectedText !== undefined) return outcome(item, 'failed', 'Protected or excluded deferred material must omit raw selected text.');
    }
    if (item.destination === 'character' || item.destination === 'lore') {
      const packageValue = deferredPackage(item, item.payload as Program7DeferredPromotionPayloadV1);
      return outcome(item, 'deferred', 'Deferred until the destination owner exists; no character or lore truth was written.', null, { deferredPackage: packageValue });
    }
    if (item.destination === 'narrative-insertion') {
      const payload = item.payload as Program7NarrativeInsertionPromotionPayloadV1;
      const calculation = await calculateNarrativeInsertion(payload.calculation);
      if (calculation.status !== 'ready') return outcome(item, 'failed', calculation.message, null, { narrativeCalculation: calculation });
      const selectedText = payload.calculation.candidate.sourceAnchor
        ? payload.calculation.candidate.sourceSnapshot.text.slice(payload.calculation.candidate.sourceAnchor.selectionStart, payload.calculation.candidate.sourceAnchor.selectionEnd)
        : payload.calculation.candidate.sourceSnapshot.text;
      if (sha256(selectedText) !== item.source.selectedTextSha256 || payload.calculation.candidate.sourceSnapshot.bodySha256 !== item.source.sourceFingerprint) {
        return outcome(item, 'failed', 'The promotion provenance does not match the narrative insertion source calculation.', null, { narrativeCalculation: calculation });
      }
      return outcome(item, 'routed', 'The prose reached Narrative Insertion calculation; ProjectSpine acceptance is still required.', null, { narrativeCalculation: calculation });
    }
    const owner = item.destination === 'author-intent' ? this.options.acceptAuthorIntent : this.options.acceptOutline;
    if (!owner) return ownerFailure(item, item.destination);
    let result: Program7PromotionOwnerResultV1;
    try {
      result = await owner({ request, item });
    } catch {
      return outcome(item, 'failed', `The ${item.destination} destination owner failed; no full handoff success is claimed.`);
    }
    return result.ok
      ? outcome(item, 'routed', result.receipt.message, result.receipt.artifactId)
      : outcome(item, 'failed', result.message);
  }
}

let coordinator: Program7PromotionCoordinator | null = null;

export function registerProgram7PromotionIpc(options: RegisterProgram7PromotionIpcOptions): void {
  coordinator = new Program7PromotionCoordinator(options);
  ipcMain.removeHandler(PROGRAM7_PROMOTION_CHANNELS.handoff);
  ipcMain.handle(PROGRAM7_PROMOTION_CHANNELS.handoff, (event: IpcMainInvokeEvent, request: unknown) =>
    coordinator!.handoff(event.sender.id, request),
  );
}

export function resetProgram7PromotionIpcForTests(): void {
  ipcMain.removeHandler(PROGRAM7_PROMOTION_CHANNELS.handoff);
  coordinator = null;
}
