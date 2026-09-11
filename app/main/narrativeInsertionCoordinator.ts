import path from 'node:path';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import {
  calculateNarrativeInsertion,
  type NarrativeInsertionCalculationRequestV1,
  type NarrativeInsertionCalculationV1,
  type NarrativeInsertionCandidateSelectionV1,
  type NarrativeInsertionModeV1,
  type NarrativeInsertionRiskV1,
} from '../shared/narrativeInsertion.js';
import type {
  RevisionCandidateV1,
  RevisionCandidatesSnapshotV1,
} from '../shared/ipc/revisionCandidates.js';
import { RevisionCandidateRepository } from './revisionCandidateRepository.js';

export interface CalculateNarrativeInsertionRequestV1 {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
  readonly candidateId: string;
  readonly mode: NarrativeInsertionModeV1;
  readonly candidateSelection?: NarrativeInsertionCandidateSelectionV1;
  readonly triggeredRisks?: readonly NarrativeInsertionRiskV1[];
  readonly acknowledgedRisks?: readonly NarrativeInsertionRiskV1[];
}

export type NarrativeInsertionCoordinatorErrorCode =
  | 'NOT_STAGE19_SURFACE'
  | 'NO_ACTIVE_PROJECT'
  | 'STALE_SESSION'
  | 'INVALID_REQUEST'
  | 'CANDIDATES_UNAVAILABLE'
  | 'UNKNOWN_CANDIDATE'
  | 'STALE_CANDIDATE';

export interface NarrativeInsertionCoordinatorError {
  readonly code: NarrativeInsertionCoordinatorErrorCode;
  readonly message: string;
}

export type NarrativeInsertionCoordinatorResult =
  | { readonly ok: true; readonly data: NarrativeInsertionCalculationV1 }
  | { readonly ok: false; readonly error: NarrativeInsertionCoordinatorError };

export interface NarrativeInsertionCoordinatorOptions {
  readonly resolveWindowRole?: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => RevisionCandidateRepository;
}

const MODES: readonly NarrativeInsertionModeV1[] = [
  'accept-all',
  'accept-selected-text',
  'accept-edited-before-acceptance',
];
const RISKS: readonly NarrativeInsertionRiskV1[] = [
  'canon',
  'continuity',
  'protected-content',
  'source-staleness',
];

function fail(
  code: NarrativeInsertionCoordinatorErrorCode,
  message: string,
): NarrativeInsertionCoordinatorResult {
  return { ok: false, error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
  };
  return normalize(left) === normalize(right);
}

function bindingValid(value: unknown): value is CalculateNarrativeInsertionRequestV1 {
  if (!isRecord(value)) return false;
  return typeof value.operationId === 'string' && value.operationId.trim().length > 0 &&
    typeof value.projectId === 'string' && value.projectId.trim().length > 0 &&
    typeof value.projectPath === 'string' && value.projectPath.trim().length > 0 &&
    Number.isInteger(value.generation) && Number(value.generation) >= 0 &&
    typeof value.candidateId === 'string' && value.candidateId.trim().length > 0 &&
    MODES.includes(value.mode as NarrativeInsertionModeV1) &&
    (value.candidateSelection === undefined || (
      isRecord(value.candidateSelection) &&
      Number.isInteger(value.candidateSelection.selectionStart) &&
      Number.isInteger(value.candidateSelection.selectionEnd)
    )) &&
    (value.triggeredRisks === undefined || validRisks(value.triggeredRisks)) &&
    (value.acknowledgedRisks === undefined || validRisks(value.acknowledgedRisks));
}

function validRisks(value: unknown): value is readonly NarrativeInsertionRiskV1[] {
  return Array.isArray(value) && value.every((risk) => RISKS.includes(risk as NarrativeInsertionRiskV1));
}

function durableBody(markdown: string): string {
  const normalized = markdown.replace(/\r\n?/gu, '\n');
  if (!normalized.startsWith('---')) return normalized;
  const closing = normalized.indexOf('\n---', 3);
  if (closing < 0) return normalized;
  return normalized.slice(closing + 4).replace(/^\n/u, '');
}

function activeProject(
  senderId: number,
  request: unknown,
  options: NarrativeInsertionCoordinatorOptions,
): { readonly snapshot: ProjectSpineSessionSnapshot; readonly repository: RevisionCandidateRepository } | NarrativeInsertionCoordinatorResult {
  const role = options.resolveWindowRole?.(senderId);
  if (options.resolveWindowRole && role !== 'writing' && role !== 'command') {
    return fail('NOT_STAGE19_SURFACE', 'Narrative insertion is available only in the Stage 19 project surfaces.');
  }
  if (!bindingValid(request)) return fail('INVALID_REQUEST', 'The narrative insertion request is invalid.');
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return fail('NO_ACTIVE_PROJECT', 'Open a project before calculating insertion.');
  if (
    snapshot.project.projectId !== request.projectId ||
    !samePath(snapshot.project.path, request.projectPath) ||
    snapshot.generation !== request.generation
  ) return fail('STALE_SESSION', 'The project changed before insertion was calculated.');
  return {
    snapshot,
    repository: (options.repositoryFactory ?? ((projectPath: string) => new RevisionCandidateRepository(projectPath)))(snapshot.project.path),
  };
}

function candidateForCalculation(candidate: RevisionCandidateV1): NarrativeInsertionCalculationRequestV1['candidate'] {
  return {
    projectId: candidate.projectId,
    unitId: candidate.unitId,
    sourceSnapshot: candidate.sourceSnapshot,
    sourceAnchor: candidate.sourceAnchor,
    candidateText: candidate.candidateText,
    editedCandidateText: candidate.editedCandidateText,
    protection: candidate.protection,
  };
}

export class NarrativeInsertionCoordinator {
  constructor(private readonly options: NarrativeInsertionCoordinatorOptions) {}

  async calculate(
    senderId: number,
    request: CalculateNarrativeInsertionRequestV1,
  ): Promise<NarrativeInsertionCoordinatorResult> {
    const active = activeProject(senderId, request, this.options);
    if ('ok' in active) return active;
    let saved: RevisionCandidatesSnapshotV1;
    try {
      saved = await active.repository.read(active.snapshot.project!.projectId);
    } catch {
      return fail('CANDIDATES_UNAVAILABLE', 'Saved revision candidates could not be loaded.');
    }
    if (saved.availability !== 'ready') return fail('CANDIDATES_UNAVAILABLE', saved.message ?? 'Saved revision candidates are unavailable.');
    const candidate = saved.document.candidates.find((item) => item.id === request.candidateId);
    if (!candidate) return fail('UNKNOWN_CANDIDATE', 'The revision candidate does not exist.');
    if (candidate.currentness !== 'current' || candidate.lifecycle === 'stale') {
      return fail('STALE_CANDIDATE', 'The revision candidate is stale and cannot be inserted.');
    }
    const currentDraft = active.snapshot.project?.drafts?.[candidate.unitId];
    if (typeof currentDraft !== 'string') return fail('STALE_CANDIDATE', 'The candidate source unit is unavailable.');
    const calculation = await calculateNarrativeInsertion({
      candidate: candidateForCalculation(candidate),
      currentBody: durableBody(currentDraft),
      mode: request.mode,
      candidateSelection: request.candidateSelection,
      triggeredRisks: request.triggeredRisks,
      acknowledgedRisks: request.acknowledgedRisks,
    });
    return { ok: true, data: calculation };
  }
}

export function createNarrativeInsertionCoordinator(
  options: NarrativeInsertionCoordinatorOptions,
): NarrativeInsertionCoordinator {
  return new NarrativeInsertionCoordinator(options);
}
