import { dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  MANUSCRIPT_STRUCTURE_CHANNELS,
  type ApplyManuscriptStructureRequest,
  type DiscoverManuscriptStructureRequest,
  type GetManuscriptStructureRequest,
  type ImportMarkdownRequest,
  type ManuscriptStructureFailure,
  type ManuscriptStructureProjectBinding,
  type ManuscriptStructureResult,
  type ManuscriptStructureSuccess,
  type MergeManuscriptStructureGroupsRequest,
  type ProposalMutationRequest,
  type RenameManuscriptStructureProposalRequest,
  type ReorderManuscriptStructureGroupsRequest,
  type SetManuscriptStructureBoundaryRequest,
  type SplitManuscriptStructureGroupRequest,
} from '../shared/ipc/manuscriptStructure.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import { getHarnessDialogPath } from '../shared/modePolicy.js';
import { bootstrapFreshProject } from './projectBootstrap.js';
import { ManuscriptStructureRepository, ManuscriptStructureRepositoryError } from './manuscriptStructureRepository.js';

export interface RegisterManuscriptStructureIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => ManuscriptStructureRepository;
}

let options: RegisterManuscriptStructureIpcOptions | null = null;

function requireWritingRole(event: IpcMainInvokeEvent): void {
  if (options?.resolveWindowRole(event.sender.id) !== 'writing') {
    throw new ManuscriptStructureRepositoryError('UNAVAILABLE', 'Only Writing Studio may manage manuscript structure.');
  }
}

function failure(error: unknown): ManuscriptStructureFailure {
  if (error instanceof ManuscriptStructureRepositoryError) {
    if (error.message.startsWith('Only Writing Studio')) {
      return { ok: false, error: { code: 'NOT_WRITING_STUDIO', message: error.message } };
    }
    if (error.message.includes('active project changed')) {
      return { ok: false, error: { code: 'STALE_SESSION', message: error.message } };
    }
    if (error.message.includes('request is invalid') || error.message.includes('operation id is required')) {
      return { ok: false, error: { code: 'INVALID_REQUEST', message: error.message } };
    }
    const code = error.code === 'UNAVAILABLE'
      ? 'STRUCTURE_UNAVAILABLE'
      : error.code === 'STALE'
        ? 'STALE_STRUCTURE'
        : error.code === 'WRITE_FAILED'
          ? 'STRUCTURE_WRITE_FAILED'
          : error.code;
    return { ok: false, error: { code, message: error.message } };
  }
  return { ok: false, error: { code: 'STRUCTURE_WRITE_FAILED', message: error instanceof Error ? error.message : 'The manuscript structure operation failed.' } };
}

function success(data: Awaited<ReturnType<ManuscriptStructureRepository['read']>>): ManuscriptStructureSuccess {
  return { ok: true, data };
}

function operationId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new ManuscriptStructureRepositoryError('UNAVAILABLE', 'A structure operation id is required.');
  return value.trim();
}

function bindingIsCurrent(binding: ManuscriptStructureProjectBinding): boolean {
  const snapshot = options?.getWritingSnapshot();
  if (!snapshot?.project || snapshot.generation !== binding.generation) return false;
  return snapshot.project.projectId === binding.projectId &&
    path.resolve(snapshot.project.path).toLowerCase() === path.resolve(binding.projectPath).toLowerCase();
}

function requireCurrentBinding(value: unknown): ManuscriptStructureProjectBinding {
  if (!value || typeof value !== 'object') throw new ManuscriptStructureRepositoryError('UNAVAILABLE', 'A project-bound structure request is required.');
  const binding = value as Partial<ManuscriptStructureProjectBinding>;
  if (typeof binding.operationId !== 'string' || typeof binding.projectId !== 'string' || typeof binding.projectPath !== 'string' || !Number.isInteger(binding.generation)) {
    throw new ManuscriptStructureRepositoryError('UNAVAILABLE', 'The project-bound structure request is invalid.');
  }
  operationId(binding.operationId);
  if (!bindingIsCurrent(binding as ManuscriptStructureProjectBinding)) {
    throw new ManuscriptStructureRepositoryError('STALE', 'The active project changed before the structure operation completed.');
  }
  return binding as ManuscriptStructureProjectBinding;
}

function repository(projectPath: string): ManuscriptStructureRepository {
  return options?.repositoryFactory?.(projectPath) ?? new ManuscriptStructureRepository(projectPath);
}

export function registerManuscriptStructureIpc(nextOptions: RegisterManuscriptStructureIpcOptions): void {
  options = nextOptions;
  for (const channel of Object.values(MANUSCRIPT_STRUCTURE_CHANNELS)) ipcMain.removeHandler(channel);

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.chooseMarkdown, async (event) => {
    requireWritingRole(event);
    const harnessPath = getHarnessDialogPath('markdown');
    if (harnessPath) return { canceled: false, filePath: harnessPath };
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    });
    return { canceled: result.canceled, filePath: result.filePaths?.[0] };
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.importMarkdown, async (event, value: ImportMarkdownRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const request = value ?? ({} as ImportMarkdownRequest);
      operationId(request.operationId);
      if (typeof request.parentPath !== 'string' || !request.parentPath.trim() || typeof request.filePath !== 'string' || !request.filePath.trim()) {
        throw new ManuscriptStructureRepositoryError('UNAVAILABLE', 'A Markdown file and destination folder are required.');
      }
      if (!/\.(md|markdown)$/i.test(request.filePath)) {
        throw new ManuscriptStructureRepositoryError('UNAVAILABLE', 'Only Markdown intake is supported.');
      }
      const source = await fs.readFile(request.filePath, 'utf8');
      const title = typeof request.title === 'string' && request.title.trim()
        ? request.title.trim()
        : path.basename(request.filePath).replace(/\.(md|markdown)$/i, '') || 'Imported manuscript';
      const project = await bootstrapFreshProject({ parentPath: request.parentPath, title, initialState: 'empty' });
      return success(await repository(project.projectPath).importSource(project.projectId, path.basename(request.filePath), source));
    } catch (error) {
      return failure(error);
    }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.get, async (event, value: GetManuscriptStructureRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      const current = await repository(binding.projectPath).read(binding.projectId);
      return success(current);
    } catch (error) { return failure(error); }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.discover, async (event, value: DiscoverManuscriptStructureRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      const discovered = await repository(binding.projectPath).discover(binding.projectId, value.expectedRevision);
      return success(discovered);
    } catch (error) { return failure(error); }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.setBoundary, async (event, value: SetManuscriptStructureBoundaryRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      return success(await repository(binding.projectPath).setBoundary(binding.projectId, value.expectedRevision, value.start, value.end, value.label));
    } catch (error) { return failure(error); }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.acceptProposal, async (event, value: ProposalMutationRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      return success(await repository(binding.projectPath).setProposalState(binding.projectId, value.expectedRevision, value.proposalId, 'accepted'));
    } catch (error) { return failure(error); }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.rejectProposal, async (event, value: ProposalMutationRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      return success(await repository(binding.projectPath).setProposalState(binding.projectId, value.expectedRevision, value.proposalId, 'rejected'));
    } catch (error) { return failure(error); }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.renameProposal, async (event, value: RenameManuscriptStructureProposalRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      return success(await repository(binding.projectPath).renameProposal(binding.projectId, value.expectedRevision, value.proposalId, value.label));
    } catch (error) { return failure(error); }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.splitGroup, async (event, value: SplitManuscriptStructureGroupRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      return success(await repository(binding.projectPath).splitGroup(binding.projectId, value.expectedRevision, value.proposalId, value.boundary));
    } catch (error) { return failure(error); }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.mergeGroups, async (event, value: MergeManuscriptStructureGroupsRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      return success(await repository(binding.projectPath).mergeGroups(binding.projectId, value.expectedRevision, value.proposalIds));
    } catch (error) { return failure(error); }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.reorderGroups, async (event, value: ReorderManuscriptStructureGroupsRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      return success(await repository(binding.projectPath).reorderGroups(binding.projectId, value.expectedRevision, value.orderedProposalIds));
    } catch (error) { return failure(error); }
  });

  ipcMain.handle(MANUSCRIPT_STRUCTURE_CHANNELS.apply, async (event, value: ApplyManuscriptStructureRequest): Promise<ManuscriptStructureResult> => {
    try {
      requireWritingRole(event);
      const binding = requireCurrentBinding(value);
      return success(await repository(binding.projectPath).apply(binding.projectId, value.expectedRevision));
    } catch (error) { return failure(error); }
  });
}

export function resetManuscriptStructureIpcForTests(): void {
  for (const channel of Object.values(MANUSCRIPT_STRUCTURE_CHANNELS)) ipcMain.removeHandler(channel);
  options = null;
}
