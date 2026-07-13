import path from 'node:path';
import type { LoadedProject } from '../shared/ipc/projectLoader';
import type {
  ProjectSpineErrorCode,
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
        if (!existing) return { status: 'cleared', candidateVersion: null };
        const deleted = await repository.deleteCandidate(deletionRequest(existing));
        if (!deleted.ok) {
          throw new ProjectSpineRecoveryCheckpointError(
            'RECOVERY_WRITE_FAILED',
            'Recovery protection could not clear the obsolete manuscript checkpoint. Save your work and try again.',
          );
        }
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
      return { status: 'stored', candidateVersion };
    });
  }

  reconcileSuccessfulSave(
    resolveContext: () => ProjectSpineRecoveryCheckpointContext,
    unitId: string,
    submittedProse: string,
  ): Promise<SaveManuscriptUnitResultData['recovery']> {
    return this.enqueue(async () => {
      try {
        const context = resolveContext();
        const fingerprints = baselineFingerprintByUnit(context);
        const repository = this.repositoryFactory(context.project.path);
        const envelope = await this.readCurrentSessionEnvelope(repository, context, fingerprints, unitId);
        const existing = envelope?.candidates.find((candidate) => candidate.unitId === unitId);
        if (!existing) return { status: 'not-present', message: null };

        if (existing.prose === submittedProse) {
          const deleted = await repository.deleteCandidate(deletionRequest(existing));
          if (!deleted.ok) throw new Error(deleted.error.message);
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
