import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';

import {
  IDEATION_CHANNELS,
  type AddPremiseVersionRequest,
  type BranchLifecycleRequest,
  type CaptureIdeaSeedRequest,
  type CombineSeedsRequest,
  type CopyBranchRequest,
  type CreateBranchRequest,
  type FilterLibraryRequest,
  type GetIdeationRequest,
  type IdeationError,
  type IdeationProjectBinding,
  type IdeationResult,
  type MergeBranchesRequest,
  type PreparePromotionRequest,
  type RequestAiAlternativesRequest,
  type SplitBranchRequest,
  type TestPremiseRequest,
  type UpdateIdeaSeedRequest,
} from '../shared/ipc/ideation.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import { IdeationRepository, IdeationRepositoryError } from './ideationRepository.js';

export interface RegisterIdeationIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => IdeationRepository;
}

let options: RegisterIdeationIpcOptions | null = null;

function fail(code: IdeationError['code'], message: string): IdeationResult {
  return { ok: false, error: { code, message } };
}
function hasExactKeys(value: unknown, keys: readonly string[]): boolean {
  if (!value || typeof value !== 'object') return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function samePath(left: string, right: string): boolean {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
  };
  return normalize(left) === normalize(right);
}
function validBinding(request: IdeationProjectBinding): boolean {
  return Boolean(
    request &&
    typeof request.operationId === 'string' && request.operationId.length > 0 && request.operationId.length <= 160 &&
    typeof request.projectId === 'string' && request.projectId.length > 0 && request.projectId.length <= 240 &&
    typeof request.projectPath === 'string' && request.projectPath.length > 0 && request.projectPath.length <= 2_000 &&
    Number.isInteger(request.generation) && request.generation >= 0,
  );
}
function boundedString(value: unknown, maximum: number, required = false): value is string { return typeof value === 'string' && value.length <= maximum && (!required || value.trim().length > 0); }
function validRevision(value: unknown): value is number { return Number.isInteger(value) && (value as number) >= 0; }
function validId(value: unknown): value is string { return boundedString(value, 240, true) && /^[A-Za-z0-9_-]+$/.test(value); }
function validStringArray(value: unknown, maximum = 64): value is readonly string[] { return Array.isArray(value) && value.length <= maximum && value.every((item) => boundedString(item, 240, true)); }
function validUnknowns(value: unknown): boolean { return Array.isArray(value) && value.length <= 64 && value.every((item) => hasExactKeys(item, ['id', 'statement', 'posture', 'revisitCondition']) && validId((item as any).id) && boundedString((item as any).statement, 20_000, true) && ['unknown', 'intentional-ambiguity', 'conflict', 'exploratory'].includes((item as any).posture) && ((item as any).revisitCondition === null || boundedString((item as any).revisitCondition, 20_000))); }
function validAnswers(value: unknown): boolean { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length <= 13 && Object.entries(value as Record<string, unknown>).every(([key, answer]) => validId(key) && boundedString(answer, 20_000)); }
function validContributions(value: unknown): boolean { return Array.isArray(value) && value.length <= 64 && value.every((item) => hasExactKeys(item, ['seedId', 'importance', 'classification', 'sourceVersionId', 'note']) && validId((item as any).seedId) && ['anchor', 'essential', 'supporting', 'desirable', 'optional', 'experimental'].includes((item as any).importance) && ['central', 'supporting', 'transformed', 'background', 'thematic', 'reserved', 'rejected', 'unresolved'].includes((item as any).classification) && ((item as any).sourceVersionId === null || validId((item as any).sourceVersionId)) && ((item as any).note === null || boundedString((item as any).note, 20_000))); }
function activeProject(event: IpcMainInvokeEvent, request: IdeationProjectBinding, mutation: boolean): { snapshot: ProjectSpineSessionSnapshot; repository: IdeationRepository } | IdeationResult {
  if (!options) return fail('NOT_AUTHORIZED', 'Ideation is not registered.');
  const role = options.resolveWindowRole(event.sender.id);
  if (role !== 'writing' && role !== 'command') return fail('NOT_AUTHORIZED', 'Ideation is available only in Black Skies project surfaces.');
  if (mutation && role !== 'writing') return fail('NOT_AUTHORIZED', 'Ideation changes must originate in Writing Studio.');
  if (!validBinding(request)) return fail('INVALID_REQUEST', 'The Ideation request is incomplete.');
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return fail('NO_ACTIVE_PROJECT', 'Open a project before using Ideation.');
  if (snapshot.project.projectId !== request.projectId || !samePath(snapshot.project.path, request.projectPath) || snapshot.generation !== request.generation) {
    return fail('STALE_SESSION', 'The active project changed before the Ideation request completed.');
  }
  return { snapshot, repository: (options.repositoryFactory ?? ((projectPath: string) => new IdeationRepository(projectPath)))(snapshot.project.path) };
}
function isFailure(value: ReturnType<typeof activeProject>): value is IdeationResult { return 'ok' in value; }
function repositoryFailure(error: unknown): IdeationResult {
  if (error instanceof IdeationRepositoryError) {
    const map: Partial<Record<IdeationRepositoryError['code'], IdeationError['code']>> = {
      UNAVAILABLE: 'IDEATION_UNAVAILABLE', WRITE_FAILED: 'IDEATION_WRITE_FAILED', STALE: 'STALE_IDEATION',
      UNKNOWN_SEED: 'UNKNOWN_SEED', UNKNOWN_BRANCH: 'UNKNOWN_BRANCH', ARCHIVED_BRANCH: 'ARCHIVED_BRANCH',
      INVALID_LINEAGE: 'INVALID_LINEAGE', INVALID: 'INVALID_REQUEST', AI_NOT_REQUESTED: 'AI_NOT_REQUESTED',
      AI_UNAVAILABLE: 'AI_UNAVAILABLE',
    };
    return fail(map[error.code] ?? 'IDEATION_WRITE_FAILED', error.message);
  }
  return fail('IDEATION_WRITE_FAILED', 'The Ideation operation could not be completed.');
}
async function get(event: IpcMainInvokeEvent, request: GetIdeationRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation'])) return fail('INVALID_REQUEST', 'The Ideation request is incomplete.');
  const active = activeProject(event, request, false); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.read(active.snapshot.project!.projectId) }; } catch (error) { return repositoryFailure(error); }
}
async function captureSeed(event: IpcMainInvokeEvent, request: CaptureIdeaSeedRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'title', 'body', 'kind', 'tags', 'protected']) || !validRevision((request as any)?.expectedRevision) || !boundedString((request as any)?.title, 20_000, true) || !boundedString((request as any)?.body, 20_000) || !validStringArray((request as any)?.tags) || typeof (request as any)?.protected !== 'boolean') return fail('INVALID_REQUEST', 'The Idea Seed request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.captureSeed(active.snapshot.project!.projectId, request.expectedRevision, request) }; } catch (error) { return repositoryFailure(error); }
}
async function updateSeed(event: IpcMainInvokeEvent, request: UpdateIdeaSeedRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'seedId', 'title', 'body', 'kind', 'tags']) || !validRevision((request as any)?.expectedRevision) || !validId((request as any)?.seedId) || !boundedString((request as any)?.title, 20_000, true) || !boundedString((request as any)?.body, 20_000) || !validStringArray((request as any)?.tags)) return fail('INVALID_REQUEST', 'The Idea Seed revision request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.updateSeed(active.snapshot.project!.projectId, request.expectedRevision, request) }; } catch (error) { return repositoryFailure(error); }
}
async function branch(event: IpcMainInvokeEvent, request: CreateBranchRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'name', 'seedIds', 'premise', 'unknowns']) || !validRevision((request as any)?.expectedRevision) || !boundedString((request as any)?.name, 500, true) || !validStringArray((request as any)?.seedIds) || !boundedString((request as any)?.premise, 20_000, true) || !validUnknowns((request as any)?.unknowns)) return fail('INVALID_REQUEST', 'The branch request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.createBranch(active.snapshot.project!.projectId, request.expectedRevision, request) }; } catch (error) { return repositoryFailure(error); }
}
async function copy(event: IpcMainInvokeEvent, request: CopyBranchRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'branchId', 'name']) || !validRevision((request as any)?.expectedRevision) || !validId((request as any)?.branchId) || !boundedString((request as any)?.name, 500, true)) return fail('INVALID_REQUEST', 'The branch copy request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.copyBranch(active.snapshot.project!.projectId, request.expectedRevision, request.branchId, request.name) }; } catch (error) { return repositoryFailure(error); }
}
async function merge(event: IpcMainInvokeEvent, request: MergeBranchesRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'branchIds', 'name', 'premise']) || !validRevision((request as any)?.expectedRevision) || !validStringArray((request as any)?.branchIds) || !boundedString((request as any)?.name, 500, true) || !boundedString((request as any)?.premise, 20_000, true)) return fail('INVALID_REQUEST', 'The branch merge request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.mergeBranches(active.snapshot.project!.projectId, request.expectedRevision, request.branchIds, request.name, request.premise) }; } catch (error) { return repositoryFailure(error); }
}
async function split(event: IpcMainInvokeEvent, request: SplitBranchRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'branchId', 'name', 'premise', 'seedIds']) || !validRevision((request as any)?.expectedRevision) || !validId((request as any)?.branchId) || !boundedString((request as any)?.name, 500, true) || !boundedString((request as any)?.premise, 20_000, true) || !validStringArray((request as any)?.seedIds)) return fail('INVALID_REQUEST', 'The branch split request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.splitBranch(active.snapshot.project!.projectId, request.expectedRevision, request) }; } catch (error) { return repositoryFailure(error); }
}
async function lifecycle(event: IpcMainInvokeEvent, request: BranchLifecycleRequest, restore: boolean): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'branchId']) || !validRevision((request as any)?.expectedRevision) || !validId((request as any)?.branchId)) return fail('INVALID_REQUEST', 'The branch lifecycle request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: restore ? await active.repository.restoreBranch(active.snapshot.project!.projectId, request.expectedRevision, request.branchId) : await active.repository.archiveBranch(active.snapshot.project!.projectId, request.expectedRevision, request.branchId) }; } catch (error) { return repositoryFailure(error); }
}
async function premise(event: IpcMainInvokeEvent, request: AddPremiseVersionRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'branchId', 'text', 'unresolvedAreas']) || !validRevision((request as any)?.expectedRevision) || !validId((request as any)?.branchId) || !boundedString((request as any)?.text, 20_000, true) || !validUnknowns((request as any)?.unresolvedAreas)) return fail('INVALID_REQUEST', 'The Premise Version request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.addPremiseVersion(active.snapshot.project!.projectId, request.expectedRevision, request) }; } catch (error) { return repositoryFailure(error); }
}
async function test(event: IpcMainInvokeEvent, request: TestPremiseRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'branchId', 'answers', 'purpose']) || !validRevision((request as any)?.expectedRevision) || !validId((request as any)?.branchId) || !validAnswers((request as any)?.answers) || ((request as any)?.purpose !== null && !boundedString((request as any)?.purpose, 1_000))) return fail('INVALID_REQUEST', 'The premise test request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.testPremise(active.snapshot.project!.projectId, request.expectedRevision, request) }; } catch (error) { return repositoryFailure(error); }
}
async function combine(event: IpcMainInvokeEvent, request: CombineSeedsRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'seedIds', 'name', 'premise', 'contributions']) || !validRevision((request as any)?.expectedRevision) || !validStringArray((request as any)?.seedIds) || !boundedString((request as any)?.name, 500, true) || !boundedString((request as any)?.premise, 20_000, true) || !validContributions((request as any)?.contributions)) return fail('INVALID_REQUEST', 'The combination request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.combineSeeds(active.snapshot.project!.projectId, request.expectedRevision, request) }; } catch (error) { return repositoryFailure(error); }
}
async function filter(event: IpcMainInvokeEvent, request: FilterLibraryRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'filters']) || !hasExactKeys((request as any)?.filters, ['lifecycle', 'kind', 'tag', 'provenance', 'includeArchived'].filter((key) => (request as any)?.filters?.[key] !== undefined)) || ((request as any)?.filters?.tag !== undefined && !boundedString((request as any)?.filters?.tag, 240)) || ((request as any)?.filters?.includeArchived !== undefined && typeof (request as any)?.filters?.includeArchived !== 'boolean')) return fail('INVALID_REQUEST', 'The library filter request is incomplete.');
  const active = activeProject(event, request, false); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.filterLibrary(active.snapshot.project!.projectId, request.filters) }; } catch (error) { return repositoryFailure(error); }
}
async function promote(event: IpcMainInvokeEvent, request: PreparePromotionRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'branchId', 'destination', 'seedIds', 'selectedText']) || !validRevision((request as any)?.expectedRevision) || !validId((request as any)?.branchId) || !['author-intent', 'outline', 'story-unit', 'narrative-insertion', 'character', 'lore', 'memory'].includes((request as any)?.destination) || !validStringArray((request as any)?.seedIds) || !boundedString((request as any)?.selectedText, 20_000, true)) return fail('INVALID_REQUEST', 'The promotion package request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.preparePromotion(active.snapshot.project!.projectId, request.expectedRevision, request) }; } catch (error) { return repositoryFailure(error); }
}
async function ai(event: IpcMainInvokeEvent, request: RequestAiAlternativesRequest): Promise<IdeationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'branchId', 'authorRequested', 'purpose']) || !validRevision((request as any)?.expectedRevision) || !validId((request as any)?.branchId) || (request as any)?.authorRequested !== true || !boundedString((request as any)?.purpose, 1_000, true)) return fail('INVALID_REQUEST', 'The local-AI alternative request is incomplete.');
  const active = activeProject(event, request, true); if (isFailure(active)) return active;
  try { return { ok: true, data: await active.repository.requestAiAlternatives(active.snapshot.project!.projectId, request.expectedRevision, request) }; } catch (error) { return repositoryFailure(error); }
}

export function registerIdeationIpc(nextOptions: RegisterIdeationIpcOptions): void {
  options = nextOptions;
  Object.values(IDEATION_CHANNELS).forEach((channel) => ipcMain.removeHandler(channel));
  ipcMain.handle(IDEATION_CHANNELS.get, (event, request: unknown) => get(event, request as GetIdeationRequest));
  ipcMain.handle(IDEATION_CHANNELS.captureSeed, (event, request: unknown) => captureSeed(event, request as CaptureIdeaSeedRequest));
  ipcMain.handle(IDEATION_CHANNELS.updateSeed, (event, request: unknown) => updateSeed(event, request as UpdateIdeaSeedRequest));
  ipcMain.handle(IDEATION_CHANNELS.createBranch, (event, request: unknown) => branch(event, request as CreateBranchRequest));
  ipcMain.handle(IDEATION_CHANNELS.copyBranch, (event, request: unknown) => copy(event, request as CopyBranchRequest));
  ipcMain.handle(IDEATION_CHANNELS.mergeBranches, (event, request: unknown) => merge(event, request as MergeBranchesRequest));
  ipcMain.handle(IDEATION_CHANNELS.splitBranch, (event, request: unknown) => split(event, request as SplitBranchRequest));
  ipcMain.handle(IDEATION_CHANNELS.archiveBranch, (event, request: unknown) => lifecycle(event, request as BranchLifecycleRequest, false));
  ipcMain.handle(IDEATION_CHANNELS.restoreBranch, (event, request: unknown) => lifecycle(event, request as BranchLifecycleRequest, true));
  ipcMain.handle(IDEATION_CHANNELS.addPremiseVersion, (event, request: unknown) => premise(event, request as AddPremiseVersionRequest));
  ipcMain.handle(IDEATION_CHANNELS.testPremise, (event, request: unknown) => test(event, request as TestPremiseRequest));
  ipcMain.handle(IDEATION_CHANNELS.combineSeeds, (event, request: unknown) => combine(event, request as CombineSeedsRequest));
  ipcMain.handle(IDEATION_CHANNELS.filterLibrary, (event, request: unknown) => filter(event, request as FilterLibraryRequest));
  ipcMain.handle(IDEATION_CHANNELS.preparePromotion, (event, request: unknown) => promote(event, request as PreparePromotionRequest));
  ipcMain.handle(IDEATION_CHANNELS.requestAiAlternatives, (event, request: unknown) => ai(event, request as RequestAiAlternativesRequest));
}
export function resetIdeationIpcForTests(): void {
  Object.values(IDEATION_CHANNELS).forEach((channel) => ipcMain.removeHandler(channel));
  options = null;
}
