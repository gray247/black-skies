import path from 'node:path';
import type { LoadedProject } from '../shared/ipc/projectLoader';
import type {
  ProjectSpineErrorCode,
  ProjectSpineRecoveryCandidateProjection,
  ProjectSpineRecoveryDegradedReason,
  ProjectSpineWritingRecoveryState,
  RecoveryCandidateDecisionRequest,
  RecoveryCandidateDecisionResultData,
  RecoveryCheckpointResultData,
  SaveManuscriptUnitResultData,
} from '../shared/ipc/projectSpine';
import {
  createRecoveryContentFingerprint,
  PROJECT_SPINE_RECOVERY_SCHEMA_VERSION,
  ProjectSpineRecoveryRepository,
  type ProjectSpineRecoveryCandidate,
  type ProjectSpineRecoveryDeletionRequest,
  type ProjectSpineRecoveryEnvelope,
} from './projectSpineRecoveryRepository';

export interface ProjectSpineRecoveryCheckpointContext {
  readonly project: LoadedProject & { readonly projectId: string };
  readonly generation: number;
  readonly revision: number;
}

export class ProjectSpineRecoveryCheckpointError extends Error {
  constructor(
    readonly code: Extract<
      ProjectSpineErrorCode,
      'RECOVERY_UNAVAILABLE' | 'RECOVERY_WRITE_FAILED' | 'RECOVERY_CLEANUP_FAILED'
    >,
    message: string,
  ) {
    super(message);
    this.name = 'ProjectSpineRecoveryCheckpointError';
  }
}

export interface ProjectSpineRecoveryCheckpointServiceOptions {
  readonly repositoryFactory?: (projectPath: string) => ProjectSpineRecoveryRepository;
  readonly now?: () => string;
}

function canonicalPathKey(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
}

function sameCanonicalPath(left: string, right: string): boolean {
  return canonicalPathKey(left) === canonicalPathKey(right);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function extractRecoveryProse(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== '---') return normalized;
  const closingOffset = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (closingOffset < 0) return normalized;
  return lines.slice(closingOffset + 2).join('\n');
}

function baselineFingerprintByUnit(
  context: ProjectSpineRecoveryCheckpointContext,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    context.project.scenes.map((unit) => [
      unit.id,
      createRecoveryContentFingerprint(extractRecoveryProse(context.project.drafts[unit.id] ?? '')),
    ]),
  );
}

function deletionRequest(candidate: ProjectSpineRecoveryCandidate): ProjectSpineRecoveryDeletionRequest {
  return {
    projectId: candidate.projectId,
    projectPath: candidate.projectPath,
    unitId: candidate.unitId,
    originSessionId: candidate.originSessionId,
    candidateVersion: candidate.candidateVersion,
    durableBaselineFingerprint: candidate.durableBaselineFingerprint,
  };
}

function sameDeletionCorrelation(
  left: ProjectSpineRecoveryDeletionRequest,
  right: ProjectSpineRecoveryDeletionRequest,
): boolean {
  return left.projectId === right.projectId &&
    sameCanonicalPath(left.projectPath, right.projectPath) &&
    left.unitId === right.unitId &&
    left.originSessionId === right.originSessionId &&
    left.candidateVersion === right.candidateVersion &&
    left.durableBaselineFingerprint === right.durableBaselineFingerprint;
}

function hasSingleOriginSession(envelope: ProjectSpineRecoveryEnvelope): boolean {
  return new Set(envelope.candidates.map((candidate) => candidate.originSessionId)).size <= 1;
}

function candidateProjection(
  context: ProjectSpineRecoveryCheckpointContext,
  candidate: ProjectSpineRecoveryCandidate,
  decision: ProjectSpineRecoveryCandidateProjection['decision'],
): ProjectSpineRecoveryCandidateProjection {
  const unit = context.project.scenes.find((entry) => entry.id === candidate.unitId)!;
  return {
    projectId: candidate.projectId,
    projectPath: candidate.projectPath,
    unitId: candidate.unitId,
    unitTitle: unit.title,
    unitOrder: unit.order,
    originSessionId: candidate.originSessionId,
    priorSessionGeneration: candidate.priorSessionGeneration,
    priorSessionRevision: candidate.priorSessionRevision,
    durableBaselineFingerprint: candidate.durableBaselineFingerprint,
    candidateVersion: candidate.candidateVersion,
    updatedAt: candidate.updatedAt,
    prose: candidate.prose,
    decision,
  };
}

function degradedReason(code: string): ProjectSpineRecoveryDegradedReason {
  switch (code) {
    case 'CORRUPT_ARTIFACT': return 'corrupt-artifact';
    case 'UNSUPPORTED_SCHEMA': return 'unsupported-schema';
    case 'PROJECT_MISMATCH': return 'project-mismatch';
    case 'PATH_MISMATCH': return 'path-mismatch';
    case 'UNKNOWN_UNIT': return 'unknown-unit';
    case 'BASELINE_MISMATCH': return 'baseline-mismatch';
    case 'STALE_CANDIDATE': return 'stale-candidate';
    case 'ACTIVE_SESSION_CANDIDATE': return 'active-session-candidate';
    default: return 'read-failed';
  }
}

export interface ProjectSpineRecoveryAcceptSelection {
  readonly remainingDecisionCount: number;
  readonly acceptedCandidates?: readonly ProjectSpineRecoveryDeletionRequest[];
}

export class ProjectSpineRecoveryCheckpointService {
  private readonly repositoryFactory: (projectPath: string) => ProjectSpineRecoveryRepository;
  private readonly now: () => string;
  private readonly versionHighWater = new Map<string, number>();
  private queue: Promise<void> = Promise.resolve();

  constructor(
    readonly originSessionId: string,
    options: ProjectSpineRecoveryCheckpointServiceOptions = {},
  ) {
    if (!originSessionId?.trim()) {
      throw new TypeError('A recovery origin session id is required.');
    }
    this.repositoryFactory = options.repositoryFactory ?? ((projectPath) => new ProjectSpineRecoveryRepository(projectPath));
    this.now = options.now ?? (() => new Date().toISOString());
  }

  capture(
    resolveContext: () => ProjectSpineRecoveryCheckpointContext,
    unitId: string,
    prose: string,
    onStored?: (candidate: ProjectSpineRecoveryCandidate | null) => void,
  ): Promise<RecoveryCheckpointResultData> {
    return this.enqueue(async () => {
      if (!unitId?.trim() || typeof prose !== 'string') {
        throw new ProjectSpineRecoveryCheckpointError(
          'RECOVERY_UNAVAILABLE',
          'Recovery protection could not validate this manuscript checkpoint.',
        );
      }
      const context = resolveContext();
      const fingerprints = baselineFingerprintByUnit(context);
      if (!Object.prototype.hasOwnProperty.call(fingerprints, unitId)) {
        throw new ProjectSpineRecoveryCheckpointError(
          'RECOVERY_UNAVAILABLE',
          'Recovery protection could not find this manuscript unit in the active project.',
        );
      }
      const repository = this.repositoryFactory(context.project.path);
      const envelope = await this.readCurrentSessionEnvelope(
        repository,
        context,
        fingerprints,
        unitId,
      );
      const existing = envelope?.candidates.find((candidate) => candidate.unitId === unitId);
      const durableProse = extractRecoveryProse(context.project.drafts[unitId] ?? '');

      if (prose === durableProse) {
        if (!existing) {
          onStored?.(null);
          return { status: 'cleared', candidateVersion: null };
        }
        const deleted = await repository.deleteCandidate(deletionRequest(existing));
        if (!deleted.ok) {
          throw new ProjectSpineRecoveryCheckpointError(
            'RECOVERY_WRITE_FAILED',
            'Recovery protection could not clear the obsolete manuscript checkpoint. Save your work and try again.',
          );
        }
        onStored?.(null);
        return { status: 'cleared', candidateVersion: null };
      }

      const candidateVersion = this.nextCandidateVersion(context, unitId, existing?.candidateVersion);
      const timestamp = this.now();
      const candidate: ProjectSpineRecoveryCandidate = {
        schemaVersion: PROJECT_SPINE_RECOVERY_SCHEMA_VERSION,
        projectId: context.project.projectId,
        projectPath: path.resolve(context.project.path),
        unitId,
        originSessionId: this.originSessionId,
        priorSessionGeneration: context.generation,
        priorSessionRevision: context.revision,
        durableBaselineFingerprint: fingerprints[unitId],
        prose,
        candidateVersion,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      const nextEnvelope: ProjectSpineRecoveryEnvelope = {
        schemaVersion: PROJECT_SPINE_RECOVERY_SCHEMA_VERSION,
        projectId: context.project.projectId,
        projectPath: path.resolve(context.project.path),
        createdAt: envelope?.createdAt ?? timestamp,
        updatedAt: timestamp,
        candidates: [
          ...(envelope?.candidates.filter((entry) => entry.unitId !== unitId) ?? []),
          candidate,
        ],
      };
      const written = await repository.write(nextEnvelope, {
        mode: 'checkpoint-write',
        projectId: context.project.projectId,
        projectPath: context.project.path,
        activeSessionId: this.originSessionId,
        durableBaselineFingerprintByUnit: fingerprints,
      });
      if (!written.ok) {
        throw new ProjectSpineRecoveryCheckpointError(
          'RECOVERY_WRITE_FAILED',
          'Recovery protection could not store the latest manuscript checkpoint. Your live prose is still open; save it and try again.',
        );
      }
      this.commitCandidateVersion(context, unitId, candidateVersion);
      onStored?.(candidate);
      return { status: 'stored', candidateVersion };
    });
  }

  detectPriorSessionRecovery(
    resolveContext: () => ProjectSpineRecoveryCheckpointContext,
  ): Promise<ProjectSpineWritingRecoveryState> {
    return this.enqueue(async () => {
      const initialContext = resolveContext();
      const repository = this.repositoryFactory(initialContext.project.path);
      const readResult = await repository.read();
      const context = resolveContext();
      if (!readResult.ok) {
        return {
          status: 'degraded',
          reason: degradedReason(readResult.error.code),
          message: readResult.error.message,
          candidates: [],
        };
      }
      if (readResult.data.status === 'missing' || readResult.data.envelope.candidates.length === 0) {
        return { status: 'none', candidates: [] };
      }
      const validated = repository.validate(readResult.data.envelope, {
        mode: 'prior-session-recovery',
        projectId: context.project.projectId,
        projectPath: context.project.path,
        activeSessionId: this.originSessionId,
        durableBaselineFingerprintByUnit: baselineFingerprintByUnit(context),
      });
      if (!validated.ok) {
        return {
          status: 'degraded',
          reason: degradedReason(validated.error.code),
          message: validated.error.message,
          candidates: [],
        };
      }
      if (!hasSingleOriginSession(validated.data.envelope)) {
        return {
          status: 'degraded',
          reason: 'corrupt-artifact',
          message: 'The recovery artifact combines candidates from multiple origin sessions.',
          candidates: [],
        };
      }
      const candidates = validated.data.envelope.candidates
        .map((candidate) => candidateProjection(context, candidate, 'available'))
        .sort((left, right) => left.unitOrder - right.unitOrder);
      return { status: 'decision-required', candidates };
    });
  }

  acceptPriorSessionCandidate(
    resolveContext: () => ProjectSpineRecoveryCheckpointContext,
    request: RecoveryCandidateDecisionRequest,
    onVerified: (candidate: ProjectSpineRecoveryCandidate) => ProjectSpineRecoveryAcceptSelection,
    onRebound: (candidates: readonly ProjectSpineRecoveryCandidate[]) => void,
  ): Promise<RecoveryCandidateDecisionResultData> {
    return this.enqueue(async () => {
      const { context, repository, envelope } = await this.readPriorSessionEnvelope(resolveContext);
      const candidate = this.requireExactCandidate(envelope, request);
      const selection = onVerified(candidate);
      if (selection.remainingDecisionCount > 0) {
        return {
          decision: 'accepted',
          resolution: 'decisions-remaining',
          unitId: candidate.unitId,
          remainingDecisionCount: selection.remainingDecisionCount,
        };
      }
      const accepted = selection.acceptedCandidates ?? [];
      await this.rebindAcceptedEnvelope(context, repository, envelope, accepted, onRebound);
      return {
        decision: 'accepted',
        resolution: 'accepted-ready-to-apply',
        unitId: candidate.unitId,
        remainingDecisionCount: 0,
      };
    });
  }

  rejectPriorSessionCandidate(
    resolveContext: () => ProjectSpineRecoveryCheckpointContext,
    request: RecoveryCandidateDecisionRequest,
    onDeleted: (candidate: ProjectSpineRecoveryCandidate) => ProjectSpineRecoveryAcceptSelection,
    onRebound: (candidates: readonly ProjectSpineRecoveryCandidate[]) => void,
  ): Promise<RecoveryCandidateDecisionResultData> {
    return this.enqueue(async () => {
      const { repository, envelope } = await this.readPriorSessionEnvelope(resolveContext);
      const candidate = this.requireExactCandidate(envelope, request);
      const deleted = await repository.deleteCandidate(deletionRequest(candidate));
      if (!deleted.ok || !deleted.data.deleted) {
        throw new ProjectSpineRecoveryCheckpointError(
          'RECOVERY_CLEANUP_FAILED',
          'The rejected recovery candidate could not be removed. Editing remains blocked; try rejecting again.',
        );
      }
      resolveContext();
      const selection = onDeleted(candidate);
      if (selection.remainingDecisionCount === 0 && (selection.acceptedCandidates?.length ?? 0) > 0) {
        const remaining = await this.readPriorSessionEnvelope(resolveContext);
        await this.rebindAcceptedEnvelope(
          remaining.context,
          remaining.repository,
          remaining.envelope,
          selection.acceptedCandidates!,
          onRebound,
        );
      }
      return {
        decision: 'rejected',
        resolution: selection.remainingDecisionCount > 0
          ? 'decisions-remaining'
          : (selection.acceptedCandidates?.length ?? 0) > 0
            ? 'accepted-ready-to-apply'
            : 'resolved-without-recovery',
        unitId: candidate.unitId,
        remainingDecisionCount: selection.remainingDecisionCount,
      };
    });
  }

  reconcileSuccessfulSave(
    resolveContext: () => ProjectSpineRecoveryCheckpointContext,
    unitId: string,
    submittedProse: string,
    onReconciled?: (
      status: SaveManuscriptUnitResultData['recovery']['status'],
      candidate: ProjectSpineRecoveryCandidate | null,
    ) => void,
  ): Promise<SaveManuscriptUnitResultData['recovery']> {
    return this.enqueue(async () => {
      try {
        const context = resolveContext();
        const fingerprints = baselineFingerprintByUnit(context);
        const repository = this.repositoryFactory(context.project.path);
        const envelope = await this.readCurrentSessionEnvelope(repository, context, fingerprints, unitId);
        const existing = envelope?.candidates.find((candidate) => candidate.unitId === unitId);
        if (!existing) {
          onReconciled?.('not-present', null);
          return { status: 'not-present', message: null };
        }

        if (existing.prose === submittedProse) {
          const deleted = await repository.deleteCandidate(deletionRequest(existing));
          if (!deleted.ok) throw new Error(deleted.error.message);
          onReconciled?.('retired', null);
          return { status: 'retired', message: null };
        }

        const candidateVersion = this.nextCandidateVersion(context, unitId, existing.candidateVersion);
        const timestamp = this.now();
        const rebased: ProjectSpineRecoveryCandidate = {
          ...existing,
          priorSessionGeneration: context.generation,
          priorSessionRevision: context.revision,
          durableBaselineFingerprint: fingerprints[unitId],
          candidateVersion,
          updatedAt: timestamp,
        };
        const nextEnvelope: ProjectSpineRecoveryEnvelope = {
          ...envelope!,
          updatedAt: timestamp,
          candidates: envelope!.candidates.map((candidate) =>
            candidate.unitId === unitId ? rebased : candidate,
          ),
        };
        const written = await repository.write(nextEnvelope, {
          mode: 'checkpoint-write',
          projectId: context.project.projectId,
          projectPath: context.project.path,
          activeSessionId: this.originSessionId,
          durableBaselineFingerprintByUnit: fingerprints,
        });
        if (!written.ok) throw new Error(written.error.message);
        this.commitCandidateVersion(context, unitId, candidateVersion);
        onReconciled?.('rebased', rebased);
        return { status: 'rebased', message: null };
      } catch (error) {
        return {
          status: 'degraded',
          message: `Your manuscript was saved, but recovery protection could not be refreshed. Keep editing or save again to retry. (${errorMessage(error)})`,
        };
      }
    });
  }

  withIntentionalCleanup<T>(
    resolveContext: () => ProjectSpineRecoveryCheckpointContext,
    unitIds: readonly string[] | null,
    action: () => Promise<T>,
  ): Promise<T> {
    return this.enqueue(async () => {
      const context = resolveContext();
      const repository = this.repositoryFactory(context.project.path);
      const readResult = await repository.read();
      if (!readResult.ok) {
        throw new ProjectSpineRecoveryCheckpointError(
          'RECOVERY_CLEANUP_FAILED',
          'Recovery evidence could not be inspected, so the requested discard was not performed. Try again.',
        );
      }
      const originalEnvelope = readResult.data.status === 'present' ? readResult.data.envelope : null;
      try {
        this.assertEnvelopeIdentity(originalEnvelope, context);
      } catch {
        throw new ProjectSpineRecoveryCheckpointError(
          'RECOVERY_CLEANUP_FAILED',
          'Recovery evidence does not match the active project, so the requested discard was not performed.',
        );
      }
      const selectedUnitIds = unitIds ? new Set(unitIds) : null;
      const targets = originalEnvelope?.candidates.filter(
        (candidate) =>
          candidate.originSessionId === this.originSessionId &&
          (!selectedUnitIds || selectedUnitIds.has(candidate.unitId)),
      ) ?? [];
      if (targets.length > 0) {
        const deleted = await repository.deleteCandidates(targets.map(deletionRequest));
        if (!deleted.ok) {
          throw new ProjectSpineRecoveryCheckpointError(
            'RECOVERY_CLEANUP_FAILED',
            'Recovery evidence could not be cleared, so the requested discard was not performed. Try again.',
          );
        }
      }

      try {
        return await action();
      } catch (actionError) {
        if (targets.length > 0 && originalEnvelope) {
          const fingerprints = baselineFingerprintByUnit(context);
          const restored = await repository.write(originalEnvelope, {
            mode: 'checkpoint-write',
            projectId: context.project.projectId,
            projectPath: context.project.path,
            activeSessionId: this.originSessionId,
            durableBaselineFingerprintByUnit: fingerprints,
          });
          if (!restored.ok) {
            throw new ProjectSpineRecoveryCheckpointError(
              'RECOVERY_CLEANUP_FAILED',
              `The requested action failed and recovery protection could not be restored. Your live prose remains open. (${errorMessage(actionError)})`,
            );
          }
        }
        throw actionError;
      }
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.queue.then(operation, operation);
    this.queue = run.then(() => undefined, () => undefined);
    return run;
  }

  private async readPriorSessionEnvelope(
    resolveContext: () => ProjectSpineRecoveryCheckpointContext,
  ): Promise<{
    readonly context: ProjectSpineRecoveryCheckpointContext;
    readonly repository: ProjectSpineRecoveryRepository;
    readonly envelope: ProjectSpineRecoveryEnvelope;
  }> {
    const initialContext = resolveContext();
    const repository = this.repositoryFactory(initialContext.project.path);
    const readResult = await repository.read();
    const context = resolveContext();
    if (!readResult.ok || readResult.data.status !== 'present') {
      throw new ProjectSpineRecoveryCheckpointError(
        'RECOVERY_UNAVAILABLE',
        readResult.ok
          ? 'The recovery candidate is no longer available.'
          : `The recovery artifact cannot be inspected safely. (${readResult.error.message})`,
      );
    }
    const validated = repository.validate(readResult.data.envelope, {
      mode: 'prior-session-recovery',
      projectId: context.project.projectId,
      projectPath: context.project.path,
      activeSessionId: this.originSessionId,
      durableBaselineFingerprintByUnit: baselineFingerprintByUnit(context),
    });
    if (!validated.ok) {
      throw new ProjectSpineRecoveryCheckpointError(
        'RECOVERY_UNAVAILABLE',
        `The recovery artifact cannot be used safely. (${validated.error.message})`,
      );
    }
    if (!hasSingleOriginSession(validated.data.envelope)) {
      throw new ProjectSpineRecoveryCheckpointError(
        'RECOVERY_UNAVAILABLE',
        'The recovery artifact combines candidates from multiple origin sessions.',
      );
    }
    return { context, repository, envelope: validated.data.envelope };
  }

  private requireExactCandidate(
    envelope: ProjectSpineRecoveryEnvelope,
    request: RecoveryCandidateDecisionRequest,
  ): ProjectSpineRecoveryCandidate {
    const requested: ProjectSpineRecoveryDeletionRequest = {
      projectId: request?.projectId,
      projectPath: request?.projectPath,
      unitId: request?.unitId,
      originSessionId: request?.originSessionId,
      candidateVersion: request?.candidateVersion,
      durableBaselineFingerprint: request?.durableBaselineFingerprint,
    };
    const candidate = envelope.candidates.find((entry) =>
      sameDeletionCorrelation(deletionRequest(entry), requested),
    );
    if (!candidate) {
      throw new ProjectSpineRecoveryCheckpointError(
        'RECOVERY_UNAVAILABLE',
        'The recovery choice is stale or does not match the authoritative candidate.',
      );
    }
    return candidate;
  }

  private async rebindAcceptedEnvelope(
    context: ProjectSpineRecoveryCheckpointContext,
    repository: ProjectSpineRecoveryRepository,
    envelope: ProjectSpineRecoveryEnvelope,
    accepted: readonly ProjectSpineRecoveryDeletionRequest[],
    onRebound: (candidates: readonly ProjectSpineRecoveryCandidate[]) => void,
  ): Promise<void> {
    if (
      accepted.length === 0 ||
      accepted.length !== envelope.candidates.length ||
      envelope.candidates.some((entry) =>
        !accepted.some((correlation) => sameDeletionCorrelation(deletionRequest(entry), correlation)),
      )
    ) {
      throw new ProjectSpineRecoveryCheckpointError(
        'RECOVERY_UNAVAILABLE',
        'Recovery choices no longer match the authoritative recovery artifact.',
      );
    }
    const timestamp = this.now();
    const reboundCandidates = envelope.candidates.map((entry) => {
      const candidateVersion = this.nextCandidateVersion(context, entry.unitId, entry.candidateVersion);
      return {
        ...entry,
        originSessionId: this.originSessionId,
        priorSessionGeneration: context.generation,
        priorSessionRevision: context.revision,
        candidateVersion,
        updatedAt: timestamp,
      };
    });
    const written = await repository.write({
      ...envelope,
      updatedAt: timestamp,
      candidates: reboundCandidates,
    }, {
      mode: 'checkpoint-write',
      projectId: context.project.projectId,
      projectPath: context.project.path,
      activeSessionId: this.originSessionId,
      durableBaselineFingerprintByUnit: baselineFingerprintByUnit(context),
    });
    if (!written.ok) {
      throw new ProjectSpineRecoveryCheckpointError(
        'RECOVERY_WRITE_FAILED',
        'Accepted recovery candidates could not be rebound safely. Editing remains blocked; try the recovery choice again.',
      );
    }
    for (const rebound of reboundCandidates) {
      this.commitCandidateVersion(context, rebound.unitId, rebound.candidateVersion);
    }
    onRebound(reboundCandidates);
  }

  private async readCurrentSessionEnvelope(
    repository: ProjectSpineRecoveryRepository,
    context: ProjectSpineRecoveryCheckpointContext,
    fingerprints: Readonly<Record<string, string>>,
    allowStaleBaselineForUnit?: string,
  ): Promise<ProjectSpineRecoveryEnvelope | null> {
    const readResult = await repository.read();
    if (!readResult.ok) {
      throw new ProjectSpineRecoveryCheckpointError(
        'RECOVERY_UNAVAILABLE',
        'Recovery protection cannot use the existing recovery artifact. Your live prose remains unchanged.',
      );
    }
    if (readResult.data.status === 'missing') return null;
    const envelope = readResult.data.envelope;
    this.assertEnvelopeIdentity(envelope, context);
    for (const candidate of envelope.candidates) {
      if (candidate.originSessionId !== this.originSessionId) {
        throw new ProjectSpineRecoveryCheckpointError(
          'RECOVERY_UNAVAILABLE',
          'Earlier recovery evidence must be resolved before new checkpoints can be stored. Your live prose remains unchanged.',
        );
      }
      if (!Object.prototype.hasOwnProperty.call(fingerprints, candidate.unitId)) {
        throw new ProjectSpineRecoveryCheckpointError(
          'RECOVERY_UNAVAILABLE',
          'The existing recovery artifact references a manuscript unit that is no longer active.',
        );
      }
      if (
        candidate.unitId !== allowStaleBaselineForUnit &&
        candidate.durableBaselineFingerprint !== fingerprints[candidate.unitId]
      ) {
        throw new ProjectSpineRecoveryCheckpointError(
          'RECOVERY_UNAVAILABLE',
          'The existing recovery artifact no longer matches the durable manuscript.',
        );
      }
      this.commitCandidateVersion(context, candidate.unitId, candidate.candidateVersion);
    }
    return envelope;
  }

  private assertEnvelopeIdentity(
    envelope: ProjectSpineRecoveryEnvelope | null,
    context: ProjectSpineRecoveryCheckpointContext,
  ): void {
    if (!envelope) return;
    if (envelope.projectId !== context.project.projectId) {
      throw new ProjectSpineRecoveryCheckpointError(
        'RECOVERY_UNAVAILABLE',
        'The recovery artifact belongs to a different project.',
      );
    }
    if (!sameCanonicalPath(envelope.projectPath, context.project.path)) {
      throw new ProjectSpineRecoveryCheckpointError(
        'RECOVERY_UNAVAILABLE',
        'The recovery artifact belongs to a different project path.',
      );
    }
  }

  private versionKey(context: ProjectSpineRecoveryCheckpointContext, unitId: string): string {
    return `${canonicalPathKey(context.project.path)}\n${context.project.projectId}\n${unitId}\n${this.originSessionId}`;
  }

  private nextCandidateVersion(
    context: ProjectSpineRecoveryCheckpointContext,
    unitId: string,
    artifactVersion = 0,
  ): number {
    return Math.max(this.versionHighWater.get(this.versionKey(context, unitId)) ?? 0, artifactVersion) + 1;
  }

  private commitCandidateVersion(
    context: ProjectSpineRecoveryCheckpointContext,
    unitId: string,
    candidateVersion: number,
  ): void {
    const key = this.versionKey(context, unitId);
    this.versionHighWater.set(key, Math.max(this.versionHighWater.get(key) ?? 0, candidateVersion));
  }
}
