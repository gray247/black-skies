import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const PROJECT_SPINE_RECOVERY_SCHEMA_VERSION = 1 as const;
export const PROJECT_SPINE_RECOVERY_DIRECTORY = 'recovery';
export const PROJECT_SPINE_RECOVERY_FILENAME = 'project-spine-recovery-v1.json';

export type ProjectSpineRecoveryValidationMode =
  | 'checkpoint-write'
  | 'prior-session-recovery';

export interface ProjectSpineRecoveryCandidate {
  readonly schemaVersion: typeof PROJECT_SPINE_RECOVERY_SCHEMA_VERSION;
  readonly projectId: string;
  readonly projectPath: string;
  readonly unitId: string;
  readonly originSessionId: string;
  readonly priorSessionGeneration: number;
  readonly priorSessionRevision: number;
  readonly durableBaselineFingerprint: string;
  readonly prose: string;
  readonly candidateVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProjectSpineRecoveryEnvelope {
  readonly schemaVersion: typeof PROJECT_SPINE_RECOVERY_SCHEMA_VERSION;
  readonly projectId: string;
  readonly projectPath: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly candidates: readonly ProjectSpineRecoveryCandidate[];
}

export interface ProjectSpineRecoveryValidationContext {
  readonly mode: ProjectSpineRecoveryValidationMode;
  readonly projectId: string;
  readonly projectPath: string;
  readonly activeSessionId: string;
  readonly durableBaselineFingerprintByUnit: Readonly<Record<string, string>>;
  readonly minimumCandidateVersionByUnit?: Readonly<Record<string, number>>;
}

export interface ProjectSpineRecoveryDeletionRequest {
  readonly projectId: string;
  readonly projectPath: string;
  readonly unitId: string;
  readonly originSessionId: string;
  readonly candidateVersion: number;
  readonly durableBaselineFingerprint: string;
}

export type ProjectSpineRecoveryRepositoryErrorCode =
  | 'INVALID_REQUEST'
  | 'CORRUPT_ARTIFACT'
  | 'UNSUPPORTED_SCHEMA'
  | 'PROJECT_MISMATCH'
  | 'PATH_MISMATCH'
  | 'UNKNOWN_UNIT'
  | 'BASELINE_MISMATCH'
  | 'STALE_CANDIDATE'
  | 'ACTIVE_SESSION_CANDIDATE'
  | 'SESSION_MISMATCH'
  | 'CANDIDATE_NOT_FOUND'
  | 'READ_FAILED'
  | 'WRITE_FAILED'
  | 'DELETE_FAILED';

export interface ProjectSpineRecoveryRepositoryError {
  readonly code: ProjectSpineRecoveryRepositoryErrorCode;
  readonly message: string;
}

export type ProjectSpineRecoveryRepositoryResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: ProjectSpineRecoveryRepositoryError };

export type ProjectSpineRecoveryReadResult = ProjectSpineRecoveryRepositoryResult<
  | { readonly status: 'missing'; readonly envelope: null }
  | { readonly status: 'present'; readonly envelope: ProjectSpineRecoveryEnvelope }
>;

export type ProjectSpineRecoveryValidationResult = ProjectSpineRecoveryRepositoryResult<{
  readonly envelope: ProjectSpineRecoveryEnvelope;
}>;

export type ProjectSpineRecoveryWriteResult = ProjectSpineRecoveryRepositoryResult<{
  readonly artifactPath: string;
  readonly envelope: ProjectSpineRecoveryEnvelope;
}>;

export type ProjectSpineRecoveryDeleteResult = ProjectSpineRecoveryRepositoryResult<{
  readonly deleted: boolean;
  readonly remainingCandidates: number;
}>;

export interface ProjectSpineRecoveryRepositoryOptions {
  readonly replaceFile?: (temporaryPath: string, targetPath: string) => Promise<void>;
  readonly deleteArtifact?: (targetPath: string) => Promise<void>;
  readonly temporaryId?: () => string;
  readonly now?: () => string;
}

type UnknownRecord = Record<string, unknown>;

const SHA256_FINGERPRINT = /^[a-f0-9]{64}$/;

function success<T>(data: T): ProjectSpineRecoveryRepositoryResult<T> {
  return { ok: true, data };
}

function failure(
  code: ProjectSpineRecoveryRepositoryErrorCode,
  message: string,
): ProjectSpineRecoveryRepositoryResult<never> {
  return { ok: false, error: { code, message } };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(record: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonnegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
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

function parseCandidate(
  value: unknown,
): ProjectSpineRecoveryRepositoryResult<ProjectSpineRecoveryCandidate> {
  if (!isRecord(value)) {
    return failure('CORRUPT_ARTIFACT', 'A recovery candidate is not an object.');
  }
  if (!hasOwn(value, 'schemaVersion')) {
    return failure('CORRUPT_ARTIFACT', 'A recovery candidate is missing its schema version.');
  }
  if (value.schemaVersion !== PROJECT_SPINE_RECOVERY_SCHEMA_VERSION) {
    return failure('UNSUPPORTED_SCHEMA', 'A recovery candidate uses an unsupported schema version.');
  }
  if (
    !isNonemptyString(value.projectId) ||
    !isNonemptyString(value.projectPath) ||
    !path.isAbsolute(value.projectPath) ||
    !isNonemptyString(value.unitId) ||
    !isNonemptyString(value.originSessionId) ||
    !isNonnegativeInteger(value.priorSessionGeneration) ||
    !isNonnegativeInteger(value.priorSessionRevision) ||
    typeof value.durableBaselineFingerprint !== 'string' ||
    !SHA256_FINGERPRINT.test(value.durableBaselineFingerprint) ||
    typeof value.prose !== 'string' ||
    !isPositiveInteger(value.candidateVersion) ||
    !isIsoTimestamp(value.createdAt) ||
    !isIsoTimestamp(value.updatedAt)
  ) {
    return failure('CORRUPT_ARTIFACT', 'A recovery candidate is malformed or incomplete.');
  }

  return success({
    schemaVersion: PROJECT_SPINE_RECOVERY_SCHEMA_VERSION,
    projectId: value.projectId,
    projectPath: value.projectPath,
    unitId: value.unitId,
    originSessionId: value.originSessionId,
    priorSessionGeneration: value.priorSessionGeneration,
    priorSessionRevision: value.priorSessionRevision,
    durableBaselineFingerprint: value.durableBaselineFingerprint,
    prose: value.prose,
    candidateVersion: value.candidateVersion,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  });
}

function parseEnvelope(
  value: unknown,
): ProjectSpineRecoveryRepositoryResult<ProjectSpineRecoveryEnvelope> {
  if (!isRecord(value)) {
    return failure('CORRUPT_ARTIFACT', 'The recovery artifact is not an object.');
  }
  if (!hasOwn(value, 'schemaVersion')) {
    return failure('CORRUPT_ARTIFACT', 'The recovery artifact is missing its schema version.');
  }
  if (value.schemaVersion !== PROJECT_SPINE_RECOVERY_SCHEMA_VERSION) {
    return failure('UNSUPPORTED_SCHEMA', 'The recovery artifact uses an unsupported schema version.');
  }
  if (
    !isNonemptyString(value.projectId) ||
    !isNonemptyString(value.projectPath) ||
    !path.isAbsolute(value.projectPath) ||
    !isIsoTimestamp(value.createdAt) ||
    !isIsoTimestamp(value.updatedAt) ||
    !Array.isArray(value.candidates)
  ) {
    return failure('CORRUPT_ARTIFACT', 'The recovery artifact is malformed or incomplete.');
  }

  const candidates: ProjectSpineRecoveryCandidate[] = [];
  const unitIds = new Set<string>();
  for (const candidateValue of value.candidates) {
    const parsedCandidate = parseCandidate(candidateValue);
    if (!parsedCandidate.ok) return parsedCandidate;
    if (unitIds.has(parsedCandidate.data.unitId)) {
      return failure('CORRUPT_ARTIFACT', 'The recovery artifact contains duplicate unit candidates.');
    }
    unitIds.add(parsedCandidate.data.unitId);
    candidates.push(parsedCandidate.data);
  }

  return success({
    schemaVersion: PROJECT_SPINE_RECOVERY_SCHEMA_VERSION,
    projectId: value.projectId,
    projectPath: value.projectPath,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    candidates,
  });
}

export function createRecoveryContentFingerprint(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export class ProjectSpineRecoveryRepository {
  readonly projectPath: string;
  readonly recoveryDirectory: string;
  readonly artifactPath: string;

  private readonly replaceFile: (temporaryPath: string, targetPath: string) => Promise<void>;
  private readonly deleteArtifact: (targetPath: string) => Promise<void>;
  private readonly temporaryId: () => string;
  private readonly now: () => string;

  constructor(projectPath: string, options: ProjectSpineRecoveryRepositoryOptions = {}) {
    if (!projectPath?.trim()) {
      throw new TypeError('A project path is required for the recovery repository.');
    }
    this.projectPath = path.resolve(projectPath);
    this.recoveryDirectory = path.join(this.projectPath, PROJECT_SPINE_RECOVERY_DIRECTORY);
    this.artifactPath = path.join(this.recoveryDirectory, PROJECT_SPINE_RECOVERY_FILENAME);
    this.replaceFile = options.replaceFile ?? ((temporaryPath, targetPath) => fs.rename(temporaryPath, targetPath));
    this.deleteArtifact = options.deleteArtifact ?? ((targetPath) => fs.rm(targetPath));
    this.temporaryId = options.temporaryId ?? randomUUID;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async read(): Promise<ProjectSpineRecoveryReadResult> {
    let raw: string;
    try {
      raw = await fs.readFile(this.artifactPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return success({ status: 'missing', envelope: null });
      }
      return failure('READ_FAILED', `Unable to read the recovery artifact: ${errorMessage(error)}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return failure('CORRUPT_ARTIFACT', 'The recovery artifact does not contain valid JSON.');
    }
    const envelope = parseEnvelope(parsed);
    if (!envelope.ok) return envelope;
    return success({ status: 'present', envelope: envelope.data });
  }

  validate(
    envelope: unknown,
    context: ProjectSpineRecoveryValidationContext,
  ): ProjectSpineRecoveryValidationResult {
    const parsed = parseEnvelope(envelope);
    if (!parsed.ok) return parsed;
    if (
      !context ||
      (context.mode !== 'checkpoint-write' && context.mode !== 'prior-session-recovery') ||
      !isNonemptyString(context.projectId) ||
      !isNonemptyString(context.projectPath) ||
      !path.isAbsolute(context.projectPath) ||
      !isNonemptyString(context.activeSessionId) ||
      !isRecord(context.durableBaselineFingerprintByUnit)
    ) {
      return failure('INVALID_REQUEST', 'The recovery validation context is invalid.');
    }
    if (context.projectId !== parsed.data.projectId) {
      return failure('PROJECT_MISMATCH', 'The recovery artifact belongs to a different project.');
    }
    if (
      !sameCanonicalPath(context.projectPath, this.projectPath) ||
      !sameCanonicalPath(parsed.data.projectPath, this.projectPath)
    ) {
      return failure('PATH_MISMATCH', 'The recovery artifact belongs to a different project path.');
    }

    const normalizedCandidates: ProjectSpineRecoveryCandidate[] = [];
    for (const candidate of parsed.data.candidates) {
      if (candidate.projectId !== context.projectId) {
        return failure('PROJECT_MISMATCH', 'A recovery candidate belongs to a different project.');
      }
      if (!sameCanonicalPath(candidate.projectPath, this.projectPath)) {
        return failure('PATH_MISMATCH', 'A recovery candidate belongs to a different project path.');
      }
      if (!hasOwn(context.durableBaselineFingerprintByUnit as UnknownRecord, candidate.unitId)) {
        return failure('UNKNOWN_UNIT', 'A recovery candidate references an unknown manuscript unit.');
      }
      if (
        context.durableBaselineFingerprintByUnit[candidate.unitId] !==
        candidate.durableBaselineFingerprint
      ) {
        return failure('BASELINE_MISMATCH', 'A recovery candidate no longer matches the durable manuscript.');
      }
      const minimumVersion = context.minimumCandidateVersionByUnit?.[candidate.unitId];
      if (minimumVersion !== undefined) {
        if (!isPositiveInteger(minimumVersion)) {
          return failure('INVALID_REQUEST', 'A minimum recovery candidate version is invalid.');
        }
        if (candidate.candidateVersion < minimumVersion) {
          return failure('STALE_CANDIDATE', 'A newer recovery candidate is already authoritative.');
        }
      }
      if (
        context.mode === 'checkpoint-write' &&
        candidate.originSessionId !== context.activeSessionId
      ) {
        return failure('SESSION_MISMATCH', 'A checkpoint candidate belongs to a different session.');
      }
      if (
        context.mode === 'prior-session-recovery' &&
        candidate.originSessionId === context.activeSessionId
      ) {
        return failure('ACTIVE_SESSION_CANDIDATE', 'Active-session work is not prior-session recovery.');
      }
      normalizedCandidates.push({ ...candidate, projectPath: this.projectPath });
    }

    return success({
      envelope: {
        ...parsed.data,
        projectPath: this.projectPath,
        candidates: normalizedCandidates,
      },
    });
  }

  async write(
    envelope: ProjectSpineRecoveryEnvelope,
    context: ProjectSpineRecoveryValidationContext & { readonly mode: 'checkpoint-write' },
  ): Promise<ProjectSpineRecoveryWriteResult> {
    const validated = this.validate(envelope, context);
    if (!validated.ok) return validated;
    try {
      await this.writeEnvelopeAtomically(validated.data.envelope);
    } catch (error) {
      return failure('WRITE_FAILED', `Unable to write the recovery artifact: ${errorMessage(error)}`);
    }
    return success({ artifactPath: this.artifactPath, envelope: validated.data.envelope });
  }

  async deleteCandidate(
    request: ProjectSpineRecoveryDeletionRequest,
  ): Promise<ProjectSpineRecoveryDeleteResult> {
    const readResult = await this.read();
    if (!readResult.ok) return readResult;
    if (readResult.data.status === 'missing') {
      return success({ deleted: false, remainingCandidates: 0 });
    }
    const envelope = readResult.data.envelope;
    if (request.projectId !== envelope.projectId) {
      return failure('PROJECT_MISMATCH', 'The deletion request belongs to a different project.');
    }
    if (
      !isNonemptyString(request.projectPath) ||
      !path.isAbsolute(request.projectPath) ||
      !sameCanonicalPath(request.projectPath, this.projectPath) ||
      !sameCanonicalPath(envelope.projectPath, this.projectPath)
    ) {
      return failure('PATH_MISMATCH', 'The deletion request belongs to a different project path.');
    }

    const candidateIndex = envelope.candidates.findIndex(
      (candidate) =>
        candidate.projectId === request.projectId &&
        sameCanonicalPath(candidate.projectPath, request.projectPath) &&
        candidate.unitId === request.unitId &&
        candidate.originSessionId === request.originSessionId &&
        candidate.candidateVersion === request.candidateVersion &&
        candidate.durableBaselineFingerprint === request.durableBaselineFingerprint,
    );
    if (candidateIndex < 0) {
      return failure('CANDIDATE_NOT_FOUND', 'No recovery candidate matches the deletion request.');
    }

    const remainingCandidates = envelope.candidates.filter((_, index) => index !== candidateIndex);
    if (remainingCandidates.length === 0) {
      try {
        await this.deleteArtifact(this.artifactPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
          return success({ deleted: false, remainingCandidates: 0 });
        }
        return failure('DELETE_FAILED', `Unable to delete the recovery artifact: ${errorMessage(error)}`);
      }
      return success({ deleted: true, remainingCandidates: 0 });
    }

    const updatedEnvelope: ProjectSpineRecoveryEnvelope = {
      ...envelope,
      updatedAt: this.now(),
      candidates: remainingCandidates,
    };
    try {
      await this.writeEnvelopeAtomically(updatedEnvelope);
    } catch (error) {
      return failure('DELETE_FAILED', `Unable to update the recovery artifact: ${errorMessage(error)}`);
    }
    return success({ deleted: true, remainingCandidates: remainingCandidates.length });
  }

  private async writeEnvelopeAtomically(envelope: ProjectSpineRecoveryEnvelope): Promise<void> {
    await fs.mkdir(this.recoveryDirectory, { recursive: true });
    const safeTemporaryId = this.temporaryId().replace(/[^a-zA-Z0-9-]/g, '') || randomUUID();
    const temporaryPath = path.join(
      this.recoveryDirectory,
      `.${PROJECT_SPINE_RECOVERY_FILENAME}.${safeTemporaryId}.tmp`,
    );
    let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
    try {
      handle = await fs.open(temporaryPath, 'wx');
      await handle.writeFile(`${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
      await handle.sync();
      await handle.close();
      handle = null;
      await this.replaceFile(temporaryPath, this.artifactPath);
    } catch (error) {
      await handle?.close().catch(() => undefined);
      await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }
}
