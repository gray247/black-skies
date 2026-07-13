import path from 'node:path';
import type { LoadedProject } from '../shared/ipc/projectLoader';
import type {
  ProjectSpineBinding,
  ProjectSpineError,
  ProjectSpineErrorCode,
  ProjectSpineSessionSnapshot,
  ProjectSpineWindowRole,
  RecentProjectReference,
} from '../shared/ipc/projectSpine';

export class ProjectSessionError extends Error {
  constructor(
    readonly code: ProjectSpineErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ProjectSessionError';
  }
}

export interface ProjectSaveToken {
  readonly generation: number;
  readonly projectId: string;
  readonly projectPath: string;
  readonly unitId: string;
  readonly operationId: string;
}

export interface ProjectStructureToken {
  readonly generation: number;
  readonly projectId: string;
  readonly projectPath: string;
  readonly operationId: string;
}

export interface ProjectActivationResult {
  readonly activation: 'activated' | 'already-active';
  readonly generation: number;
}

export interface DiscardedUnsavedBuffers {
  readonly projectId: string;
  readonly generation: number;
  readonly dirtyUnitIds: readonly string[];
  readonly saveState: ProjectSpineSessionSnapshot['saveState'];
}

function canonicalPathKey(value: string): string {
  const normalized = path.resolve(value);
  return process.platform === 'win32' ? normalized.toLocaleLowerCase('en-US') : normalized;
}

function cloneProject(project: LoadedProject): LoadedProject {
  return {
    ...project,
    outline: {
      ...project.outline,
      acts: [...project.outline.acts],
      chapters: project.outline.chapters.map((chapter) => ({ ...chapter })),
      scenes: project.outline.scenes.map((scene) => ({
        ...scene,
        beat_refs: scene.beat_refs ? [...scene.beat_refs] : undefined,
      })),
    },
    scenes: project.scenes.map((scene) => ({
      ...scene,
      beats: scene.beats ? [...scene.beats] : undefined,
    })),
    drafts: { ...project.drafts },
  };
}

function validateProjectIdentity(project: LoadedProject): asserts project is LoadedProject & { projectId: string } {
  if (!project.projectId?.trim()) {
    throw new ProjectSessionError('PROJECT_INVALID', 'Project metadata is missing a durable project identity.');
  }
  if (!project.path?.trim()) {
    throw new ProjectSessionError('PROJECT_INVALID', 'Project metadata is missing a canonical project path.');
  }
}

function normalizeRecentReferences(
  references: readonly RecentProjectReference[],
): RecentProjectReference[] {
  const seen = new Set<string>();
  const normalized: RecentProjectReference[] = [];
  for (const reference of references) {
    if (!reference?.path?.trim()) {
      continue;
    }
    const key = canonicalPathKey(reference.path);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push({
      path: path.resolve(reference.path),
      title: reference.title?.trim() || path.basename(reference.path),
      lastOpened: Number.isFinite(reference.lastOpened) ? reference.lastOpened : 0,
      stale: reference.stale === true,
    });
  }
  return normalized.sort((left, right) => right.lastOpened - left.lastOpened).slice(0, 10);
}

export class ProjectSessionCoordinator {
  private activeProject: LoadedProject | null = null;
  private activeUnitId: string | null = null;
  private generation = 0;
  private revision = 0;
  private readonly dirtyUnitIds = new Set<string>();
  private saveState: ProjectSpineSessionSnapshot['saveState'] = {
    status: 'clean',
    unitId: null,
    message: null,
  };
  private lastError: ProjectSpineError | null = null;
  private recentProjects: RecentProjectReference[] = [];
  private readonly projectPathById = new Map<string, string>();
  private readonly projectIdByPath = new Map<string, string>();
  private activeSaveToken: ProjectSaveToken | null = null;
  private activeStructureToken: ProjectStructureToken | null = null;

  constructor(recentProjects: readonly RecentProjectReference[] = []) {
    this.recentProjects = normalizeRecentReferences(recentProjects);
  }

  setRecentProjects(references: readonly RecentProjectReference[]): void {
    this.recentProjects = normalizeRecentReferences(references);
  }

  getRecentProjects(): readonly RecentProjectReference[] {
    return this.recentProjects.map((reference) => ({ ...reference }));
  }

  getActiveProject(): LoadedProject | null {
    return this.activeProject ? cloneProject(this.activeProject) : null;
  }

  getGeneration(): number {
    return this.generation;
  }

  hasUnsavedWork(): boolean {
    return this.dirtyUnitIds.size > 0 || this.saveState.status === 'save-failed';
  }

  discardUnsavedBuffers(projectId: string, generation: number): DiscardedUnsavedBuffers {
    if (!this.activeProject || this.activeProject.projectId !== projectId || this.generation !== generation) {
      throw new ProjectSessionError('STALE_SESSION', 'The close request belongs to a different project session.');
    }
    if (this.hasOperationInFlight()) throw new ProjectSessionError('SAVE_IN_PROGRESS', 'A project operation is still in progress.');
    if (!this.hasUnsavedWork()) throw new ProjectSessionError('UNSAVED_CHANGES', 'There are no unsaved manuscript changes to discard.');
    const discarded = { projectId, generation, dirtyUnitIds: [...this.dirtyUnitIds], saveState: { ...this.saveState } };
    this.dirtyUnitIds.clear();
    this.saveState = { status: 'clean', unitId: null, message: null };
    this.lastError = null;
    this.revision += 1;
    return discarded;
  }

  restoreDiscardedUnsavedBuffers(discarded: DiscardedUnsavedBuffers): void {
    if (!this.activeProject || this.activeProject.projectId !== discarded.projectId || this.generation !== discarded.generation) return;
    this.dirtyUnitIds.clear();
    for (const unitId of discarded.dirtyUnitIds) this.dirtyUnitIds.add(unitId);
    this.saveState = { ...discarded.saveState };
    this.revision += 1;
  }

  hasOperationInFlight(): boolean {
    return this.activeSaveToken !== null || this.activeStructureToken !== null;
  }

  activateProject(project: LoadedProject, allowDiscardUnsaved = false): ProjectActivationResult {
    validateProjectIdentity(project);
    const nextPath = path.resolve(project.path);
    const nextPathKey = canonicalPathKey(nextPath);
    const nextProjectId = project.projectId.trim();
    const currentPathKey = this.activeProject ? canonicalPathKey(this.activeProject.path) : null;
    const currentProjectId = this.activeProject?.projectId ?? null;

    if (currentPathKey === nextPathKey && currentProjectId === nextProjectId) {
      this.upsertRecent(project, false);
      this.lastError = null;
      return { activation: 'already-active', generation: this.generation };
    }

    if (this.hasOperationInFlight()) {
      throw new ProjectSessionError(
        'SAVE_IN_PROGRESS',
        'Wait for the current project operation to finish before switching projects.',
      );
    }

    if (this.hasUnsavedWork() && !allowDiscardUnsaved) {
      throw new ProjectSessionError(
        'UNSAVED_CHANGES',
        'The active project has unsaved manuscript changes.',
      );
    }

    const knownPath = this.projectPathById.get(nextProjectId);
    if (knownPath && canonicalPathKey(knownPath) !== nextPathKey) {
      throw new ProjectSessionError(
        'DUPLICATE_PROJECT_IDENTITY',
        `Project identity ${nextProjectId} is already bound to a different project path.`,
      );
    }
    const knownId = this.projectIdByPath.get(nextPathKey);
    if (knownId && knownId !== nextProjectId) {
      throw new ProjectSessionError(
        'PROJECT_IDENTITY_CHANGED',
        'The selected project path now advertises a different durable identity.',
      );
    }

    const normalizedProject = cloneProject({ ...project, path: nextPath });
    this.projectPathById.set(nextProjectId, nextPath);
    this.projectIdByPath.set(nextPathKey, nextProjectId);
    this.activeProject = normalizedProject;
    this.generation += 1;
    this.revision += 1;
    this.dirtyUnitIds.clear();
    this.activeSaveToken = null;
    this.activeStructureToken = null;
    this.saveState = { status: 'clean', unitId: null, message: null };
    this.lastError = null;
    this.activeUnitId = [...normalizedProject.scenes]
      .sort((left, right) => left.order - right.order)[0]?.id ?? null;
    this.upsertRecent(normalizedProject, false);
    return { activation: 'activated', generation: this.generation };
  }

  noteFailure(error: ProjectSpineError, targetPath?: string): void {
    this.lastError = { ...error };
    if (targetPath && error.code === 'PROJECT_NOT_FOUND') {
      this.markRecentStale(targetPath);
    }
  }

  clearError(): void {
    this.lastError = null;
  }

  removeRecent(projectPath: string): void {
    const targetKey = canonicalPathKey(projectPath);
    this.recentProjects = this.recentProjects.filter(
      (reference) => canonicalPathKey(reference.path) !== targetKey,
    );
  }

  markRecentStale(projectPath: string): void {
    const targetKey = canonicalPathKey(projectPath);
    this.recentProjects = this.recentProjects.map((reference) =>
      canonicalPathKey(reference.path) === targetKey
        ? { ...reference, stale: true }
        : reference,
    );
  }

  selectUnit(binding: ProjectSpineBinding, unitId: string | null): void {
    this.assertBinding(binding);
    if (unitId !== null && !this.activeProject?.scenes.some((unit) => unit.id === unitId)) {
      throw new ProjectSessionError('UNIT_NOT_FOUND', 'The selected manuscript unit no longer exists.');
    }
    this.activeUnitId = unitId;
    this.revision += 1;
    this.lastError = null;
  }

  setUnitDirty(binding: ProjectSpineBinding, unitId: string, dirty: boolean): void {
    this.assertBinding(binding);
    if (!this.activeProject?.scenes.some((unit) => unit.id === unitId)) {
      throw new ProjectSessionError('UNIT_NOT_FOUND', 'The edited manuscript unit no longer exists.');
    }
    const wasDirty = this.dirtyUnitIds.has(unitId);
    if (dirty) {
      this.dirtyUnitIds.add(unitId);
      if (this.saveState.status !== 'saving') {
        this.saveState = { status: 'dirty', unitId, message: null };
      }
    } else {
      this.dirtyUnitIds.delete(unitId);
      if (this.saveState.status !== 'saving') {
        this.saveState = this.dirtyUnitIds.size > 0
          ? { status: 'dirty', unitId: this.firstDirtyUnitId(), message: null }
          : { status: 'clean', unitId: null, message: null };
      }
    }
    if (wasDirty !== dirty) {
      this.revision += 1;
    }
    this.lastError = null;
  }

  beginSave(binding: ProjectSpineBinding, unitId: string): ProjectSaveToken {
    this.assertBinding(binding);
    if (!this.activeProject?.scenes.some((unit) => unit.id === unitId)) {
      throw new ProjectSessionError('UNIT_NOT_FOUND', 'The manuscript unit no longer exists.');
    }
    if (this.activeSaveToken || this.activeStructureToken) {
      throw new ProjectSessionError('SAVE_IN_PROGRESS', 'Another project write is already in progress.');
    }
    const token: ProjectSaveToken = {
      generation: this.generation,
      projectId: binding.projectId,
      projectPath: path.resolve(binding.projectPath),
      unitId,
      operationId: binding.operationId,
    };
    this.activeSaveToken = token;
    this.revision += 1;
    this.saveState = { status: 'saving', unitId, message: null };
    this.lastError = null;
    return token;
  }

  completeSave(token: ProjectSaveToken, markdown: string): void {
    this.assertSaveToken(token);
    if (!this.activeProject) {
      throw new ProjectSessionError('STALE_SESSION', 'The project session ended before save completion.');
    }
    this.activeProject = {
      ...this.activeProject,
      drafts: { ...this.activeProject.drafts, [token.unitId]: markdown },
    };
    this.dirtyUnitIds.delete(token.unitId);
    this.activeSaveToken = null;
    this.revision += 1;
    this.saveState = this.dirtyUnitIds.size > 0
      ? { status: 'dirty', unitId: this.firstDirtyUnitId(), message: null }
      : { status: 'saved', unitId: token.unitId, message: null };
    this.lastError = null;
  }

  failSave(token: ProjectSaveToken, message: string): void {
    if (!this.matchesSaveToken(token)) {
      return;
    }
    this.activeSaveToken = null;
    this.revision += 1;
    this.dirtyUnitIds.add(token.unitId);
    this.saveState = { status: 'save-failed', unitId: token.unitId, message };
    this.lastError = { code: 'SAVE_FAILED', message };
  }

  beginStructureMutation(binding: ProjectSpineBinding): ProjectStructureToken {
    this.assertBinding(binding);
    if (this.activeSaveToken || this.activeStructureToken) {
      throw new ProjectSessionError('SAVE_IN_PROGRESS', 'Another project write is already in progress.');
    }
    const token: ProjectStructureToken = {
      generation: this.generation,
      projectId: binding.projectId,
      projectPath: path.resolve(binding.projectPath),
      operationId: binding.operationId,
    };
    this.activeStructureToken = token;
    this.revision += 1;
    return token;
  }

  completeStructureMutation(
    token: ProjectStructureToken,
    project: LoadedProject,
    activeUnitId: string | null,
  ): void {
    this.assertStructureToken(token);
    validateProjectIdentity(project);
    if (
      project.projectId !== token.projectId ||
      canonicalPathKey(project.path) !== canonicalPathKey(token.projectPath)
    ) {
      throw new ProjectSessionError('STALE_SESSION', 'Structural result belongs to a different project.');
    }
    this.activeProject = cloneProject(project);
    this.activeStructureToken = null;
    this.revision += 1;
    this.activeUnitId =
      activeUnitId && project.scenes.some((unit) => unit.id === activeUnitId)
        ? activeUnitId
        : [...project.scenes].sort((left, right) => left.order - right.order)[0]?.id ?? null;
    for (const dirtyUnitId of [...this.dirtyUnitIds]) {
      if (!project.scenes.some((unit) => unit.id === dirtyUnitId)) {
        this.dirtyUnitIds.delete(dirtyUnitId);
      }
    }
    this.saveState = this.dirtyUnitIds.size > 0
      ? { status: 'dirty', unitId: this.firstDirtyUnitId(), message: null }
      : { status: 'saved', unitId: this.activeUnitId, message: null };
    this.lastError = null;
  }

  failStructureMutation(token: ProjectStructureToken, message: string): void {
    if (!this.matchesStructureToken(token)) {
      return;
    }
    this.activeStructureToken = null;
    this.revision += 1;
    this.lastError = { code: 'STRUCTURE_WRITE_FAILED', message };
  }

  snapshot(role: ProjectSpineWindowRole): ProjectSpineSessionSnapshot {
    const project = this.activeProject;
    const orderedUnits = project
      ? [...project.scenes]
          .sort((left, right) => left.order - right.order)
          .map((unit) => ({
            id: unit.id,
            title: unit.title,
            displayTitle: unit.title.trim() || 'Untitled',
            order: unit.order,
          }))
      : [];
    const dirtyUnitIds = orderedUnits
      .map((unit) => unit.id)
      .filter((unitId) => this.dirtyUnitIds.has(unitId));

    return {
      schemaVersion: 1,
      role,
      generation: this.generation,
      revision: this.revision,
      project: project && project.projectId
        ? {
            projectId: project.projectId,
            path: project.path,
            title: project.name,
            schemaVersion: 'ProjectMetadataSchema v1',
            units: orderedUnits,
            ...(role === 'writing' ? { drafts: { ...project.drafts } } : {}),
          }
        : null,
      activeUnitId: this.activeUnitId,
      recentProjects: this.getRecentProjects(),
      dirtyUnitIds,
      saveState: { ...this.saveState },
      lastError: this.lastError ? { ...this.lastError } : null,
    };
  }

  private upsertRecent(project: LoadedProject, stale: boolean): void {
    const projectPath = path.resolve(project.path);
    const projectPathKey = canonicalPathKey(projectPath);
    const next: RecentProjectReference = {
      path: projectPath,
      title: project.name,
      lastOpened: Date.now(),
      stale,
    };
    this.recentProjects = [
      next,
      ...this.recentProjects.filter(
        (reference) => canonicalPathKey(reference.path) !== projectPathKey,
      ),
    ].slice(0, 10);
  }

  private firstDirtyUnitId(): string | null {
    if (!this.activeProject) {
      return null;
    }
    return [...this.activeProject.scenes]
      .sort((left, right) => left.order - right.order)
      .find((unit) => this.dirtyUnitIds.has(unit.id))?.id ?? null;
  }

  private assertBinding(binding: ProjectSpineBinding): void {
    if (!binding?.operationId?.trim()) {
      throw new ProjectSessionError('INVALID_REQUEST', 'A project operation id is required.');
    }
    if (!this.activeProject?.projectId) {
      throw new ProjectSessionError('STALE_SESSION', 'No active project is available for this operation.');
    }
    if (
      binding.generation !== this.generation ||
      binding.projectId !== this.activeProject.projectId ||
      canonicalPathKey(binding.projectPath) !== canonicalPathKey(this.activeProject.path)
    ) {
      throw new ProjectSessionError('STALE_SESSION', 'The operation belongs to a stale project session.');
    }
  }

  private matchesSaveToken(token: ProjectSaveToken): boolean {
    return Boolean(
      this.activeSaveToken &&
      this.activeSaveToken.operationId === token.operationId &&
      this.activeSaveToken.generation === token.generation &&
      this.generation === token.generation &&
      this.activeProject?.projectId === token.projectId &&
      canonicalPathKey(this.activeProject.path) === canonicalPathKey(token.projectPath),
    );
  }

  private assertSaveToken(token: ProjectSaveToken): void {
    if (!this.matchesSaveToken(token)) {
      throw new ProjectSessionError('STALE_SESSION', 'Save result belongs to a stale project session.');
    }
  }

  private matchesStructureToken(token: ProjectStructureToken): boolean {
    return Boolean(
      this.activeStructureToken &&
      this.activeStructureToken.operationId === token.operationId &&
      this.activeStructureToken.generation === token.generation &&
      this.generation === token.generation &&
      this.activeProject?.projectId === token.projectId &&
      canonicalPathKey(this.activeProject.path) === canonicalPathKey(token.projectPath),
    );
  }

  private assertStructureToken(token: ProjectStructureToken): void {
    if (!this.matchesStructureToken(token)) {
      throw new ProjectSessionError(
        'STALE_SESSION',
        'Structural result belongs to a stale project session.',
      );
    }
  }
}

export function toProjectSpineError(error: unknown): ProjectSpineError {
  if (error instanceof ProjectSessionError) {
    return { code: error.code, message: error.message };
  }
  return {
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : String(error),
  };
}
