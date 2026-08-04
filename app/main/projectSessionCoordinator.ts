import path from 'node:path';
import type { LoadedProject } from '../shared/ipc/projectLoader';
import type {
  ProjectSpineBinding,
  ProjectSpineCommandStatusProjection,
  ProjectSpineError,
  ProjectSpineErrorCode,
  ProjectSpineRecoveryCandidateProjection,
  ProjectSpineSessionSnapshot,
  ProjectSpineWritingRecoveryState,
  ProjectSpineWindowRole,
  RecentProjectReference,
} from '../shared/ipc/projectSpine';
import type {
  ProjectSpineRecoveryCandidate,
  ProjectSpineRecoveryDeletionRequest,
} from './projectSpineRecoveryRepository';

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

export interface ProjectRecoveryDecisionToken extends ProjectStructureToken {
  readonly unitId: string;
}

export interface ProjectActivationResult {
  readonly activation: 'activated' | 'already-active';
  readonly generation: number;
}

export interface ProjectRecoveryCheckpointContext {
  readonly project: LoadedProject & { readonly projectId: string };
  readonly generation: number;
  readonly revision: number;
}

export interface ProjectExportSnapshotContext {
  readonly project: LoadedProject & { readonly projectId: string };
  readonly generation: number;
  readonly revision: number;
}

export interface DiscardedUnsavedBuffers {
  readonly projectId: string;
  readonly generation: number;
  readonly dirtyUnitIds: readonly string[];
  readonly saveState: ProjectSpineSessionSnapshot['saveState'];
  readonly recoveryState: ProjectSpineWritingRecoveryState;
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

function cloneRecoveryState(state: ProjectSpineWritingRecoveryState): ProjectSpineWritingRecoveryState {
  if (state.status === 'degraded') return { ...state, candidates: [] };
  return { ...state, candidates: state.candidates.map((candidate) => ({ ...candidate })) } as ProjectSpineWritingRecoveryState;
}

function recoveryCorrelation(candidate: ProjectSpineRecoveryCandidateProjection): ProjectSpineRecoveryDeletionRequest {
  return {
    projectId: candidate.projectId,
    projectPath: candidate.projectPath,
    unitId: candidate.unitId,
    originSessionId: candidate.originSessionId,
    candidateVersion: candidate.candidateVersion,
    durableBaselineFingerprint: candidate.durableBaselineFingerprint,
  };
}

function sameRecoveryCandidate(
  candidate: ProjectSpineRecoveryCandidateProjection,
  raw: ProjectSpineRecoveryCandidate,
): boolean {
  return candidate.projectId === raw.projectId &&
    canonicalPathKey(candidate.projectPath) === canonicalPathKey(raw.projectPath) &&
    candidate.unitId === raw.unitId &&
    candidate.originSessionId === raw.originSessionId &&
    candidate.candidateVersion === raw.candidateVersion &&
    candidate.durableBaselineFingerprint === raw.durableBaselineFingerprint;
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
  private activeRecoveryDecisionToken: ProjectRecoveryDecisionToken | null = null;
  private recoveryState: ProjectSpineWritingRecoveryState = { status: 'none', candidates: [] };

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

  getRecoveryCheckpointContext(
    binding: ProjectSpineBinding,
    unitId?: string,
  ): ProjectRecoveryCheckpointContext {
    this.assertBinding(binding);
    if (unitId !== undefined && !this.activeProject?.scenes.some((unit) => unit.id === unitId)) {
      throw new ProjectSessionError('UNIT_NOT_FOUND', 'The manuscript unit no longer exists.');
    }
    return {
      project: cloneProject(this.activeProject as LoadedProject & { projectId: string }) as LoadedProject & {
        projectId: string;
      },
      generation: this.generation,
      revision: this.revision,
    };
  }

  assertExportReady(binding: ProjectSpineBinding, expectedRevision: number): void {
    this.assertBinding(binding);
    if (!Number.isInteger(expectedRevision) || expectedRevision !== this.revision) {
      throw new ProjectSessionError('STALE_SESSION', 'The export request belongs to a stale project revision.');
    }
    if (
      this.hasOperationInFlight() ||
      this.dirtyUnitIds.size > 0 ||
      (this.saveState.status !== 'clean' && this.saveState.status !== 'saved') ||
      this.recoveryState.status !== 'none'
    ) {
      throw new ProjectSessionError(
        'EXPORT_BLOCKED',
        'Save the project successfully before exporting.',
      );
    }
  }

  createExportSnapshot(
    binding: ProjectSpineBinding,
    expectedRevision: number,
  ): ProjectExportSnapshotContext {
    this.assertExportReady(binding, expectedRevision);
    return {
      project: cloneProject(this.activeProject as LoadedProject & { readonly projectId: string }) as LoadedProject & {
        readonly projectId: string;
      },
      generation: this.generation,
      revision: this.revision,
    };
  }

  hasUnsavedWork(): boolean {
    return this.dirtyUnitIds.size > 0 ||
      this.saveState.status === 'save-failed' ||
      (this.recoveryState.status === 'accepted-pending-save' && this.recoveryState.candidates.length > 0);
  }

  installRecoveryState(binding: ProjectSpineBinding, state: ProjectSpineWritingRecoveryState): void {
    this.assertBinding(binding);
    this.recoveryState = cloneRecoveryState(state);
    this.revision += 1;
  }

  assertRecoveryMutationAllowed(binding: ProjectSpineBinding): void {
    this.assertBinding(binding);
    if (this.recoveryState.status === 'decision-required' || this.recoveryState.status === 'degraded') {
      throw new ProjectSessionError(
        'RECOVERY_UNAVAILABLE',
        'Resolve the Writing Studio recovery decision before editing this project.',
      );
    }
  }

  beginRecoveryDecision(binding: ProjectSpineBinding, unitId: string): ProjectRecoveryDecisionToken {
    this.assertBinding(binding);
    if (this.activeSaveToken || this.activeStructureToken || this.activeRecoveryDecisionToken) {
      throw new ProjectSessionError('SAVE_IN_PROGRESS', 'Another project operation is already in progress.');
    }
    if (this.recoveryState.status !== 'decision-required') {
      throw new ProjectSessionError('RECOVERY_UNAVAILABLE', 'No recovery decision is currently required.');
    }
    const token = { ...binding, projectPath: path.resolve(binding.projectPath), unitId };
    this.activeRecoveryDecisionToken = token;
    return token;
  }

  selectRecoveryCandidate(
    token: ProjectRecoveryDecisionToken,
    candidate: ProjectSpineRecoveryCandidate,
  ): { readonly remainingDecisionCount: number; readonly acceptedCandidates?: readonly ProjectSpineRecoveryDeletionRequest[] } {
    this.assertRecoveryDecisionToken(token);
    if (this.recoveryState.status !== 'decision-required') {
      throw new ProjectSessionError('RECOVERY_UNAVAILABLE', 'No recovery decision is currently required.');
    }
    const index = this.recoveryState.candidates.findIndex((entry) => sameRecoveryCandidate(entry, candidate));
    if (index < 0) throw new ProjectSessionError('STALE_SESSION', 'The recovery candidate decision is stale.');
    const candidates = this.recoveryState.candidates.map((entry, candidateIndex) =>
      candidateIndex === index ? { ...entry, decision: 'accept-selected' as const } : entry,
    );
    this.recoveryState = { status: 'decision-required', candidates };
    this.revision += 1;
    const remainingDecisionCount = candidates.filter((entry) => entry.decision === 'available').length;
    return {
      remainingDecisionCount,
      ...(remainingDecisionCount === 0
        ? { acceptedCandidates: candidates.map(recoveryCorrelation) }
        : {}),
    };
  }

  rejectRecoveryCandidate(
    token: ProjectRecoveryDecisionToken,
    candidate: ProjectSpineRecoveryCandidate,
  ): { readonly remainingDecisionCount: number; readonly acceptedCandidates?: readonly ProjectSpineRecoveryDeletionRequest[] } {
    this.assertRecoveryDecisionToken(token);
    if (this.recoveryState.status !== 'decision-required') {
      throw new ProjectSessionError('RECOVERY_UNAVAILABLE', 'No recovery decision is currently required.');
    }
    const candidates = this.recoveryState.candidates.filter((entry) => !sameRecoveryCandidate(entry, candidate));
    if (candidates.length === this.recoveryState.candidates.length) {
      throw new ProjectSessionError('STALE_SESSION', 'The recovery candidate decision is stale.');
    }
    this.recoveryState = candidates.length > 0
      ? { status: 'decision-required', candidates }
      : { status: 'none', candidates: [] };
    this.revision += 1;
    const remainingDecisionCount = candidates.filter((entry) => entry.decision === 'available').length;
    return {
      remainingDecisionCount,
      ...(remainingDecisionCount === 0 && candidates.length > 0
        ? { acceptedCandidates: candidates.map(recoveryCorrelation) }
        : {}),
    };
  }

  completeRecoveryAcceptance(
    token: ProjectRecoveryDecisionToken,
    candidates: readonly ProjectSpineRecoveryCandidate[],
  ): void {
    this.assertRecoveryDecisionToken(token);
    if (this.recoveryState.status !== 'decision-required') {
      throw new ProjectSessionError('RECOVERY_UNAVAILABLE', 'Recovery acceptance state is no longer current.');
    }
    const priorByUnit = new Map(this.recoveryState.candidates.map((candidate) => [candidate.unitId, candidate]));
    const projected = candidates.map((candidate) => {
      const prior = priorByUnit.get(candidate.unitId);
      if (!prior) throw new ProjectSessionError('STALE_SESSION', 'Accepted recovery candidates changed before completion.');
      return {
        ...prior,
        originSessionId: candidate.originSessionId,
        priorSessionGeneration: candidate.priorSessionGeneration,
        priorSessionRevision: candidate.priorSessionRevision,
        candidateVersion: candidate.candidateVersion,
        updatedAt: candidate.updatedAt,
        prose: candidate.prose,
        decision: 'accepted-pending-save' as const,
      };
    }).sort((left, right) => left.unitOrder - right.unitOrder);
    this.recoveryState = { status: 'accepted-pending-save', candidates: projected };
    for (const candidate of projected) this.dirtyUnitIds.add(candidate.unitId);
    this.saveState = projected.length > 0
      ? { status: 'dirty', unitId: projected[0].unitId, message: null }
      : { status: 'clean', unitId: null, message: null };
    this.revision += 1;
  }

  finishRecoveryDecision(token: ProjectRecoveryDecisionToken): void {
    this.assertRecoveryDecisionToken(token);
    this.activeRecoveryDecisionToken = null;
  }

  failRecoveryDecision(token: ProjectRecoveryDecisionToken): void {
    if (this.matchesRecoveryDecisionToken(token)) this.activeRecoveryDecisionToken = null;
  }

  noteRecoveryCheckpoint(
    binding: ProjectSpineBinding,
    unitId: string,
    candidate: ProjectSpineRecoveryCandidate | null,
  ): void {
    this.assertBinding(binding);
    if (this.recoveryState.status !== 'accepted-pending-save') {
      // A current-session checkpoint is authoritative evidence that this unit
      // differs from its durable draft. It must keep project switching on the
      // explicit discard path even if a delayed renderer dirty report arrives
      // out of order.
      if (candidate) this.setUnitDirty(binding, unitId, true);
      return;
    }
    const existing = this.recoveryState.candidates.find((entry) => entry.unitId === unitId);
    if (!existing) return;
    const candidates = candidate
      ? this.recoveryState.candidates.map((entry) => entry.unitId === unitId
          ? {
              ...entry,
              originSessionId: candidate.originSessionId,
              priorSessionGeneration: candidate.priorSessionGeneration,
              priorSessionRevision: candidate.priorSessionRevision,
              durableBaselineFingerprint: candidate.durableBaselineFingerprint,
              candidateVersion: candidate.candidateVersion,
              updatedAt: candidate.updatedAt,
              prose: candidate.prose,
            }
          : entry)
      : this.recoveryState.candidates.filter((entry) => entry.unitId !== unitId);
    this.recoveryState = candidates.length > 0
      ? { status: 'accepted-pending-save', candidates }
      : { status: 'none', candidates: [] };
    this.revision += 1;
  }

  noteRecoverySaveReconciliation(
    binding: ProjectSpineBinding,
    unitId: string,
    status: 'retired' | 'rebased' | 'not-present',
    candidate: ProjectSpineRecoveryCandidate | null,
  ): void {
    if (status === 'rebased' && candidate) {
      this.noteRecoveryCheckpoint(binding, unitId, candidate);
    } else if (status === 'retired' || status === 'not-present') {
      this.noteRecoveryCheckpoint(binding, unitId, null);
    }
  }

  discardUnsavedBuffers(projectId: string, generation: number): DiscardedUnsavedBuffers {
    if (!this.activeProject || this.activeProject.projectId !== projectId || this.generation !== generation) {
      throw new ProjectSessionError('STALE_SESSION', 'The close request belongs to a different project session.');
    }
    if (this.hasOperationInFlight()) throw new ProjectSessionError('SAVE_IN_PROGRESS', 'A project operation is still in progress.');
    if (!this.hasUnsavedWork()) throw new ProjectSessionError('UNSAVED_CHANGES', 'There are no unsaved manuscript changes to discard.');
    const discarded = {
      projectId,
      generation,
      dirtyUnitIds: [...this.dirtyUnitIds],
      saveState: { ...this.saveState },
      recoveryState: cloneRecoveryState(this.recoveryState),
    };
    this.dirtyUnitIds.clear();
    this.saveState = { status: 'clean', unitId: null, message: null };
    this.recoveryState = { status: 'none', candidates: [] };
    this.lastError = null;
    this.revision += 1;
    return discarded;
  }

  restoreDiscardedUnsavedBuffers(discarded: DiscardedUnsavedBuffers): void {
    if (!this.activeProject || this.activeProject.projectId !== discarded.projectId || this.generation !== discarded.generation) return;
    this.dirtyUnitIds.clear();
    for (const unitId of discarded.dirtyUnitIds) this.dirtyUnitIds.add(unitId);
    this.saveState = { ...discarded.saveState };
    this.recoveryState = cloneRecoveryState(discarded.recoveryState);
    this.revision += 1;
  }

  hasOperationInFlight(): boolean {
    return this.activeSaveToken !== null || this.activeStructureToken !== null || this.activeRecoveryDecisionToken !== null;
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
      this.clearError();
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
    this.activeRecoveryDecisionToken = null;
    this.recoveryState = { status: 'none', candidates: [] };
    this.saveState = { status: 'clean', unitId: null, message: null };
    this.lastError = null;
    this.activeUnitId = [...normalizedProject.scenes]
      .sort((left, right) => left.order - right.order)[0]?.id ?? null;
    this.upsertRecent(normalizedProject, false);
    return { activation: 'activated', generation: this.generation };
  }

  noteFailure(error: ProjectSpineError, targetPath?: string): void {
    if (this.lastError?.code !== error.code || this.lastError.message !== error.message) {
      this.revision += 1;
    }
    this.lastError = { ...error };
    if (targetPath && error.code === 'PROJECT_NOT_FOUND') {
      this.markRecentStale(targetPath);
    }
  }

  clearError(): void {
    if (this.lastError) {
      this.revision += 1;
    }
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
    this.clearError();
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
    this.clearError();
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
    const acceptedRecoveryPendingSave = this.recoveryState.status === 'accepted-pending-save'
      && this.recoveryState.candidates.some((candidate) => dirtyUnitIds.includes(candidate.unitId));
    const commandStatus = {
      schemaVersion: 1,
      projectId: project?.projectId ?? null,
      generation: this.generation,
      revision: this.revision,
      lifecycle: this.lastError && this.saveState.status !== 'save-failed'
        ? 'operation-failed'
        : project
          ? 'active'
          : 'no-active-project',
      recovery: this.recoveryState.status === 'accepted-pending-save' && !acceptedRecoveryPendingSave
        ? 'none'
        : this.recoveryState.status,
      save: acceptedRecoveryPendingSave && this.saveState.status === 'dirty'
        ? 'accepted-recovery-pending-save'
        : this.saveState.status,
    } satisfies ProjectSpineCommandStatusProjection;

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
      ...(role === 'writing'
        ? { recovery: cloneRecoveryState(this.recoveryState) }
        : { commandStatus }),
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

  private matchesRecoveryDecisionToken(token: ProjectRecoveryDecisionToken): boolean {
    return Boolean(
      this.activeRecoveryDecisionToken &&
      this.activeRecoveryDecisionToken.operationId === token.operationId &&
      this.activeRecoveryDecisionToken.unitId === token.unitId &&
      this.activeRecoveryDecisionToken.generation === token.generation &&
      this.generation === token.generation &&
      this.activeProject?.projectId === token.projectId &&
      canonicalPathKey(this.activeProject.path) === canonicalPathKey(token.projectPath),
    );
  }

  private assertRecoveryDecisionToken(token: ProjectRecoveryDecisionToken): void {
    if (!this.matchesRecoveryDecisionToken(token)) {
      throw new ProjectSessionError('STALE_SESSION', 'Recovery decision result belongs to a stale project session.');
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
