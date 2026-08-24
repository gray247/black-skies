import { randomUUID, createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  MANUSCRIPT_STRUCTURE_MAX_LABEL_LENGTH,
  MANUSCRIPT_STRUCTURE_SCHEMA_VERSION,
  type ManuscriptStructureAnchorV1,
  type ManuscriptStructureBlockV1,
  type ManuscriptStructureDocumentV1,
  type ManuscriptStructureProposalV1,
  type ManuscriptStructureSnapshotV1,
} from '../shared/ipc/manuscriptStructure.js';
import { discoverManuscriptStructure, normalizeManuscriptSource, setManuscriptStructureFingerprintProvider } from '../shared/manuscriptStructure.js';
import type { OutlineFile } from '../shared/ipc/projectLoader.js';

setManuscriptStructureFingerprintProvider(async (value) => createHash('sha256').update(value, 'utf8').digest('hex'));

export const MANUSCRIPT_STRUCTURE_FILENAME = 'manuscript-structure.json';
export const MANUSCRIPT_INTAKE_FILENAME = 'manuscript-intake.md';
export const MANUSCRIPT_STRUCTURE_APPLY_JOURNAL_FILENAME = 'manuscript-structure-apply-journal.json';
export const MANUSCRIPT_STRUCTURE_APPLY_STAGING_DIRECTORY = '.manuscript-structure-apply';
const MANUSCRIPT_STRUCTURE_APPLY_SCHEMA_VERSION = 'BlackSkiesManuscriptStructureApply v1' as const;
const mutationQueues = new Map<string, Promise<void>>();

export type ManuscriptStructureApplyStep =
  | 'draft-staged'
  | 'outline-staged'
  | 'sidecar-staged'
  | 'journal-prepared'
  | 'journal-committing'
  | 'draft-committed'
  | 'outline-committed'
  | 'sidecar-committed'
  | 'verified';

export interface ManuscriptStructureRepositoryOptions {
  readonly onApplyStep?: (step: ManuscriptStructureApplyStep) => void;
}

export class ManuscriptStructureRepositoryError extends Error {
  constructor(
    readonly code: 'UNAVAILABLE' | 'STALE' | 'UNKNOWN_PROPOSAL' | 'INVALID_BOUNDARY' | 'APPLIED_PROPOSAL' | 'SOURCE_CHANGED_AFTER_APPLY' | 'OVERLAPPING_ACCEPTED_RANGES' | 'INVALID_STRUCTURE' | 'APPLY_FAILED' | 'WRITE_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'ManuscriptStructureRepositoryError';
  }
}

interface ApplyJournalEntry {
  readonly kind: 'draft' | 'outline' | 'sidecar';
  readonly targetPath: string;
  readonly stagedPath: string;
  readonly backupPath: string | null;
  readonly fingerprint: string;
  committed: boolean;
}

interface ApplyJournal {
  readonly schemaVersion: typeof MANUSCRIPT_STRUCTURE_APPLY_SCHEMA_VERSION;
  readonly transactionId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly expectedRevision: number;
  readonly sourceFingerprint: string;
  phase: 'prepared' | 'committing' | 'complete' | 'failed';
  readonly entries: ApplyJournalEntry[];
}

class SimulatedApplyTermination extends Error {
  constructor(readonly step: ManuscriptStructureApplyStep) {
    super(`Simulated Apply interruption after ${step}.`);
    this.name = 'SimulatedApplyTermination';
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function stableId(prefix: string, ...parts: string[]): string {
  return `${prefix}_${sha256(parts.join('\u001f')).slice(0, 16)}`;
}

function normalizeLabel(value: string, fallback: string): string {
  const label = value.replace(/\s+/g, ' ').trim().slice(0, MANUSCRIPT_STRUCTURE_MAX_LABEL_LENGTH);
  return label || fallback;
}

function emptyDocument(projectId: string, fileName = 'manuscript.md', source = ''): ManuscriptStructureDocumentV1 {
  const normalized = normalizeManuscriptSource(source);
  return {
    schemaVersion: MANUSCRIPT_STRUCTURE_SCHEMA_VERSION,
    projectId,
    revision: 0,
    source: {
      fileName,
      sourceFingerprint: sha256(normalized),
      normalizedLength: normalized.length,
      lineEnding: 'lf',
    },
    blocks: [],
    proposals: [],
  };
}

function validateAnchor(value: unknown): value is ManuscriptStructureAnchorV1 {
  if (!value || typeof value !== 'object') return false;
  const anchor = value as Partial<ManuscriptStructureAnchorV1>;
  return anchor.schemaVersion === 1 &&
    (anchor.anchorKind === 'position' || anchor.anchorKind === 'span') &&
    Number.isInteger(anchor.selectionStart) && Number(anchor.selectionStart) >= 0 &&
    Number.isInteger(anchor.selectionEnd) && Number(anchor.selectionEnd) >= Number(anchor.selectionStart) &&
    /^[a-f0-9]{64}$/i.test(String(anchor.sourceFingerprint)) &&
    /^[a-f0-9]{64}$/i.test(String(anchor.selectionFingerprint));
}

function validateDocument(value: unknown, projectId: string): ManuscriptStructureDocumentV1 {
  if (!value || typeof value !== 'object') {
    throw new ManuscriptStructureRepositoryError('UNAVAILABLE', 'The manuscript structure file is not readable.');
  }
  const document = value as Partial<ManuscriptStructureDocumentV1>;
  if (
    document.schemaVersion !== MANUSCRIPT_STRUCTURE_SCHEMA_VERSION ||
    document.projectId !== projectId ||
    !Number.isInteger(document.revision) || Number(document.revision) < 0 ||
    !document.source || typeof document.source.fileName !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(String(document.source.sourceFingerprint)) ||
    !Array.isArray(document.blocks) || !Array.isArray(document.proposals) ||
    !document.blocks.every((block) => block && typeof block.id === 'string' && validateAnchor(block.anchor)) ||
    !document.proposals.every((proposal) => proposal && typeof proposal.id === 'string' && validateAnchor(proposal.anchor)) ||
    new Set(document.proposals.map((proposal) => proposal.id)).size !== document.proposals.length
  ) {
    throw new ManuscriptStructureRepositoryError('UNAVAILABLE', 'The manuscript structure file has an unsupported format.');
  }
  return document as ManuscriptStructureDocumentV1;
}

async function writeAtomic(targetPath: string, contents: string): Promise<void> {
  const temporaryPath = path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporaryPath, contents, 'utf8');
    await fs.rename(temporaryPath, targetPath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function writeDurable(targetPath: string, contents: string): Promise<void> {
  const handle = await fs.open(targetPath, 'w');
  try {
    await handle.writeFile(contents, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeDurableAtomic(targetPath: string, contents: string): Promise<void> {
  const temporaryPath = path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.${randomUUID()}.tmp`);
  try {
    await writeDurable(temporaryPath, contents);
    await fs.rename(temporaryPath, targetPath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function fileFingerprint(targetPath: string): Promise<string | null> {
  try {
    return sha256(await fs.readFile(targetPath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
    throw error;
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function draftForUnit(unitId: string, title: string, order: number, body: string): string {
  const normalizedBody = body.endsWith('\n') ? body : `${body}\n`;
  return `---\nid: ${unitId}\ntitle: ${JSON.stringify(title)}\norder: ${order}\n---\n${normalizedBody}`;
}

export class ManuscriptStructureRepository {
  readonly structurePath: string;
  readonly intakePath: string;
  readonly applyJournalPath: string;
  readonly applyStagingPath: string;

  constructor(
    readonly projectPath: string,
    private readonly now: () => Date = () => new Date(),
    private readonly options: ManuscriptStructureRepositoryOptions = {},
  ) {
    const root = path.resolve(projectPath);
    this.structurePath = path.join(root, MANUSCRIPT_STRUCTURE_FILENAME);
    this.intakePath = path.join(root, MANUSCRIPT_INTAKE_FILENAME);
    this.applyJournalPath = path.join(root, MANUSCRIPT_STRUCTURE_APPLY_JOURNAL_FILENAME);
    this.applyStagingPath = path.join(root, MANUSCRIPT_STRUCTURE_APPLY_STAGING_DIRECTORY);
  }

  private applyStep(step: ManuscriptStructureApplyStep): void {
    try {
      this.options.onApplyStep?.(step);
    } catch {
      throw new SimulatedApplyTermination(step);
    }
  }

  private async writeApplyJournal(journal: ApplyJournal): Promise<void> {
    await writeDurableAtomic(this.applyJournalPath, `${JSON.stringify(journal, null, 2)}\n`);
  }

  private journalPathIsSafe(targetPath: string): boolean {
    const root = path.resolve(this.projectPath);
    const resolved = path.resolve(targetPath);
    return resolved === root || resolved.startsWith(`${root}${path.sep}`);
  }

  private async readApplyJournal(): Promise<ApplyJournal | null> {
    let raw: string;
    try {
      raw = await fs.readFile(this.applyJournalPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
      throw new ManuscriptStructureRepositoryError('APPLY_FAILED', 'The manuscript Apply recovery journal could not be read.');
    }
    try {
      const parsed = JSON.parse(raw) as Partial<ApplyJournal>;
      if (
        parsed.schemaVersion !== MANUSCRIPT_STRUCTURE_APPLY_SCHEMA_VERSION ||
        typeof parsed.transactionId !== 'string' ||
        typeof parsed.projectId !== 'string' ||
        typeof parsed.projectPath !== 'string' ||
        path.resolve(parsed.projectPath) !== path.resolve(this.projectPath) ||
        !Number.isInteger(parsed.expectedRevision) ||
        typeof parsed.sourceFingerprint !== 'string' ||
        (parsed.phase !== 'prepared' && parsed.phase !== 'committing' && parsed.phase !== 'complete' && parsed.phase !== 'failed') ||
        !Array.isArray(parsed.entries) ||
        !parsed.entries.every((entry) => entry &&
          (entry.kind === 'draft' || entry.kind === 'outline' || entry.kind === 'sidecar') &&
          typeof entry.targetPath === 'string' && this.journalPathIsSafe(entry.targetPath) &&
          typeof entry.stagedPath === 'string' && this.journalPathIsSafe(entry.stagedPath) &&
          (entry.backupPath === null || (typeof entry.backupPath === 'string' && this.journalPathIsSafe(entry.backupPath))) &&
          /^[a-f0-9]{64}$/i.test(String(entry.fingerprint)) &&
          typeof entry.committed === 'boolean')
      ) {
        throw new Error('unsupported-journal');
      }
      return parsed as ApplyJournal;
    } catch {
      throw new ManuscriptStructureRepositoryError('APPLY_FAILED', 'The manuscript Apply recovery journal is corrupt or unsupported.');
    }
  }

  private async recoverApplyEntry(entry: ApplyJournalEntry): Promise<void> {
    const targetFingerprint = await fileFingerprint(entry.targetPath);
    if (targetFingerprint === entry.fingerprint) {
      entry.committed = true;
      return;
    }
    if (!(await pathExists(entry.stagedPath))) {
      throw new ManuscriptStructureRepositoryError('APPLY_FAILED', `The staged Apply file is missing for ${path.basename(entry.targetPath)}.`);
    }
    if (targetFingerprint !== null && !entry.backupPath) {
      throw new ManuscriptStructureRepositoryError('APPLY_FAILED', `The new draft target already exists for ${path.basename(entry.targetPath)}.`);
    }
    if (targetFingerprint !== null && entry.backupPath && !(await pathExists(entry.backupPath))) {
      await fs.rename(entry.targetPath, entry.backupPath);
    }
    await fs.rename(entry.stagedPath, entry.targetPath);
    if (await fileFingerprint(entry.targetPath) !== entry.fingerprint) {
      throw new ManuscriptStructureRepositoryError('APPLY_FAILED', `The recovered Apply file does not match its journal fingerprint for ${path.basename(entry.targetPath)}.`);
    }
    entry.committed = true;
  }

  private async rollbackApplyJournal(journal: ApplyJournal): Promise<void> {
    for (const entry of [...journal.entries].reverse()) {
      const targetFingerprint = await fileFingerprint(entry.targetPath);
      if (entry.backupPath && await pathExists(entry.backupPath)) {
        if (targetFingerprint !== null) await fs.rm(entry.targetPath, { force: true });
        await fs.rename(entry.backupPath, entry.targetPath);
      } else if (targetFingerprint === entry.fingerprint) {
        await fs.rm(entry.targetPath, { force: true });
      }
    }
  }

  private async cleanupApplyJournal(journal: ApplyJournal): Promise<void> {
    const transactionDirectory = journal.entries[0] ? path.dirname(journal.entries[0].stagedPath) : null;
    if (transactionDirectory && this.journalPathIsSafe(transactionDirectory)) {
      await fs.rm(transactionDirectory, { recursive: true, force: true });
    }
    await fs.rm(this.applyStagingPath, { recursive: true, force: true });
    await fs.rm(this.applyJournalPath, { force: true });
  }

  private async recoverPendingApply(): Promise<void> {
    const journal = await this.readApplyJournal();
    if (!journal) {
      await fs.rm(this.applyStagingPath, { recursive: true, force: true });
      return;
    }
    if (journal.phase === 'failed') {
      throw new ManuscriptStructureRepositoryError('APPLY_FAILED', 'A previous manuscript Apply could not be recovered. Resolve the recovery journal before continuing.');
    }
    if (journal.phase === 'complete') {
      for (const entry of journal.entries) {
        if (await fileFingerprint(entry.targetPath) !== entry.fingerprint) {
          throw new ManuscriptStructureRepositoryError('APPLY_FAILED', `The completed Apply journal does not match ${path.basename(entry.targetPath)}.`);
        }
      }
      await this.cleanupApplyJournal(journal);
      return;
    }
    try {
      journal.phase = 'committing';
      await this.writeApplyJournal(journal);
      for (const entry of journal.entries) {
        if (entry.committed) continue;
        await this.recoverApplyEntry(entry);
        await this.writeApplyJournal(journal);
      }
      journal.phase = 'complete';
      await this.writeApplyJournal(journal);
      await this.cleanupApplyJournal(journal);
    } catch (error) {
      try {
        await this.rollbackApplyJournal(journal);
        journal.phase = 'failed';
        await this.writeApplyJournal(journal);
      } catch {
        // Preserve the original recovery failure and the durable journal.
      }
      throw error instanceof ManuscriptStructureRepositoryError
        ? error
        : new ManuscriptStructureRepositoryError('APPLY_FAILED', 'The manuscript Apply recovery could not complete.');
    }
  }

  async importSource(projectId: string, fileName: string, source: string): Promise<ManuscriptStructureSnapshotV1> {
    await this.recoverPendingApply();
    const normalized = normalizeManuscriptSource(source);
    const document = emptyDocument(projectId, path.basename(fileName) || 'manuscript.md', normalized);
    await fs.mkdir(path.dirname(this.structurePath), { recursive: true });
    await writeAtomic(this.intakePath, normalized);
    await this.writeDocument(document);
    return this.snapshot(document, normalized);
  }

  async read(projectId: string): Promise<ManuscriptStructureSnapshotV1> {
    const pendingMutation = mutationQueues.get(this.structurePath);
    if (pendingMutation) await pendingMutation;
    return this.readUnsafe(projectId);
  }

  private async readUnsafe(projectId: string): Promise<ManuscriptStructureSnapshotV1> {
    try {
      await this.recoverPendingApply();
      const document = validateDocument(JSON.parse(await fs.readFile(this.structurePath, 'utf8')) as unknown, projectId);
      const source = normalizeManuscriptSource(await fs.readFile(this.intakePath, 'utf8'));
      if (sha256(source) !== document.source.sourceFingerprint) {
        const hasAppliedProposal = document.proposals.some((proposal) => Boolean(proposal.appliedUnitId));
        if (hasAppliedProposal) {
          return {
            availability: 'ready',
            sourceStatus: 'changed-after-apply',
            projectId,
            projectPath: this.projectPath,
            sourceText: source,
            document,
            message: 'The imported manuscript changed after structure was applied. Existing Units and applied structure are preserved; rediscovery and Apply are blocked.',
          };
        }
        const staleDocument: ManuscriptStructureDocumentV1 = {
          ...document,
          proposals: document.proposals.map((proposal) => proposal.state === 'rejected'
            ? proposal
            : { ...proposal, state: 'stale' as const }),
        };
        return { availability: 'ready', sourceStatus: 'changed', projectId, projectPath: this.projectPath, sourceText: source, document: staleDocument, message: 'The imported manuscript changed. Existing proposals are stale; rediscover before accepting or applying structure.' };
      }
      return this.snapshot(document, source);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return { availability: 'degraded', sourceStatus: 'current', projectId, projectPath: this.projectPath, sourceText: '', document: emptyDocument(projectId), message: 'No staged manuscript intake is available.' };
      }
      const message = error instanceof ManuscriptStructureRepositoryError ? error.message : 'The manuscript structure is unavailable.';
      return { availability: 'degraded', sourceStatus: 'current', projectId, projectPath: this.projectPath, sourceText: '', document: emptyDocument(projectId), message };
    }
  }

  async discover(projectId: string, expectedRevision: number): Promise<ManuscriptStructureSnapshotV1> {
    return this.mutate(projectId, expectedRevision, async (document, source) => {
      if (document.proposals.some((proposal) => proposal.appliedUnitId) && sha256(source) !== document.source.sourceFingerprint) {
        throw new ManuscriptStructureRepositoryError('SOURCE_CHANGED_AFTER_APPLY', 'The imported manuscript changed after structure was applied. Rediscovery is blocked until an explicit replacement workflow exists.');
      }
      const discovered = await discoverManuscriptStructure(source, { now: this.now, prior: document });
      const next = {
        ...discovered,
        projectId,
        source: { ...discovered.source, fileName: document.source.fileName },
        revision: document.revision + 1,
      };
      const discoveredIds = new Set(next.proposals.map((proposal) => proposal.id));
      const stale = document.proposals
        .filter((proposal) => !discoveredIds.has(proposal.id) && proposal.state !== 'rejected' && !proposal.appliedUnitId)
        .map((proposal) => ({ ...proposal, state: 'stale' as const, updatedAt: this.now().toISOString() }));
      const priorById = new Map(document.proposals.map((proposal) => [proposal.id, proposal]));
      const immutableApplied = next.proposals.map((proposal) => priorById.get(proposal.id)?.appliedUnitId ? priorById.get(proposal.id)! : proposal);
      return { document: { ...next, proposals: [...immutableApplied, ...stale] }, source };
    }, true);
  }

  async setBoundary(projectId: string, expectedRevision: number, start: number, end: number, label: string): Promise<ManuscriptStructureSnapshotV1> {
    return this.mutate(projectId, expectedRevision, async (document, source) => {
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > source.length) {
        throw new ManuscriptStructureRepositoryError('INVALID_BOUNDARY', 'A manual boundary must be inside the staged manuscript.');
      }
      const appliedRanges = document.proposals.filter((proposal) => proposal.appliedUnitId).map((proposal) => proposal.anchor);
      const conflictingAcceptedRanges = document.proposals.filter((proposal) => proposal.state === 'accepted').map((proposal) => proposal.anchor);
      if ([...appliedRanges, ...conflictingAcceptedRanges].some((anchor) => rangesOverlap(start, end, anchor.selectionStart, anchor.selectionEnd))) {
        throw new ManuscriptStructureRepositoryError('OVERLAPPING_ACCEPTED_RANGES', 'The manual boundary overlaps accepted or applied manuscript prose. Choose a non-overlapping source range.');
      }
      const sourceFingerprint = document.source.sourceFingerprint;
      const anchor = await import('../shared/manuscriptStructure.js').then(({ buildManuscriptStructureAnchor }) => buildManuscriptStructureAnchor(source, start, end, sourceFingerprint));
      const blockId = stableId('block', sourceFingerprint, String(start), String(end), 'manual');
      const proposalId = stableId('proposal', sourceFingerprint, String(start), String(end), 'manual');
      if (document.proposals.some((proposal) => proposal.id === proposalId)) return { document, source };
      const timestamp = this.now().toISOString();
      const block: ManuscriptStructureBlockV1 = { id: blockId, kind: 'manual', label: normalizeLabel(label, `Section ${document.blocks.length + 1}`), order: document.blocks.length + 1, anchor };
      const proposal: ManuscriptStructureProposalV1 = { id: proposalId, label: block.label, state: 'proposed', provenance: 'manual', blockIds: [blockId], anchor, appliedUnitId: null, createdAt: timestamp, updatedAt: timestamp };
      return { document: { ...document, revision: document.revision + 1, blocks: [...document.blocks, block], proposals: [...document.proposals, proposal] }, source };
    });
  }

  async setProposalState(projectId: string, expectedRevision: number, proposalId: string, state: 'accepted' | 'rejected'): Promise<ManuscriptStructureSnapshotV1> {
    return this.mutate(projectId, expectedRevision, async (document, source) => ({
      document: this.updateProposal(document, proposalId, (proposal) => {
        this.assertProposalMutable(proposal);
        return { ...proposal, state, updatedAt: this.now().toISOString() };
      }),
      source,
    }));
  }

  async renameProposal(projectId: string, expectedRevision: number, proposalId: string, label: string): Promise<ManuscriptStructureSnapshotV1> {
    return this.mutate(projectId, expectedRevision, async (document, source) => ({
      document: this.updateProposal(document, proposalId, (proposal) => {
        this.assertProposalMutable(proposal);
        return { ...proposal, label: normalizeLabel(label, proposal.label), updatedAt: this.now().toISOString() };
      }),
      source,
    }));
  }

  async splitGroup(projectId: string, expectedRevision: number, proposalId: string, boundary: number): Promise<ManuscriptStructureSnapshotV1> {
    return this.mutate(projectId, expectedRevision, async (document, source) => {
      const proposal = document.proposals.find((candidate) => candidate.id === proposalId);
      if (!proposal) throw new ManuscriptStructureRepositoryError('UNKNOWN_PROPOSAL', 'The structure proposal no longer exists.');
      this.assertProposalMutable(proposal);
      if (!Number.isInteger(boundary) || boundary <= proposal.anchor.selectionStart || boundary >= proposal.anchor.selectionEnd) {
        throw new ManuscriptStructureRepositoryError('INVALID_BOUNDARY', 'A split boundary must be inside the selected proposal.');
      }
      const { buildManuscriptStructureAnchor } = await import('../shared/manuscriptStructure.js');
      const leftAnchor = await buildManuscriptStructureAnchor(source, proposal.anchor.selectionStart, boundary, document.source.sourceFingerprint);
      const rightAnchor = await buildManuscriptStructureAnchor(source, boundary, proposal.anchor.selectionEnd, document.source.sourceFingerprint);
      const timestamp = this.now().toISOString();
      const leftId = stableId('proposal', proposal.id, 'left', String(boundary));
      const rightId = stableId('proposal', proposal.id, 'right', String(boundary));
      const left: ManuscriptStructureProposalV1 = { ...proposal, id: leftId, label: normalizeLabel(source.slice(leftAnchor.selectionStart, boundary).split(/\s+/).slice(0, 8).join(' '), `${proposal.label} · part 1`), state: 'proposed', provenance: 'split', blockIds: [], anchor: leftAnchor, appliedUnitId: null, createdAt: timestamp, updatedAt: timestamp };
      const right: ManuscriptStructureProposalV1 = { ...proposal, id: rightId, label: normalizeLabel(source.slice(boundary, rightAnchor.selectionEnd).split(/\s+/).slice(0, 8).join(' '), `${proposal.label} · part 2`), state: 'proposed', provenance: 'split', blockIds: [], anchor: rightAnchor, appliedUnitId: null, createdAt: timestamp, updatedAt: timestamp };
      return { document: { ...document, revision: document.revision + 1, proposals: document.proposals.flatMap((candidate) => candidate.id === proposalId ? [{ ...candidate, state: 'stale' as const, updatedAt: timestamp }, left, right] : [candidate]) }, source };
    });
  }

  async mergeGroups(projectId: string, expectedRevision: number, proposalIds: readonly string[]): Promise<ManuscriptStructureSnapshotV1> {
    return this.mutate(projectId, expectedRevision, async (document, source) => {
      const selected = document.proposals.filter((proposal) => proposalIds.includes(proposal.id));
      if (selected.length < 2) throw new ManuscriptStructureRepositoryError('INVALID_BOUNDARY', 'Merge requires at least two proposals.');
      selected.forEach((proposal) => this.assertProposalMutable(proposal));
      const ordered = [...selected].sort((left, right) => left.anchor.selectionStart - right.anchor.selectionStart);
      if (ordered.some((proposal, index) => index > 0 && proposal.anchor.selectionStart !== ordered[index - 1]!.anchor.selectionEnd)) {
        throw new ManuscriptStructureRepositoryError('INVALID_BOUNDARY', 'Merge is limited to explicitly selected adjacent groups.');
      }
      const first = ordered[0]!;
      const last = ordered[ordered.length - 1]!;
      const timestamp = this.now().toISOString();
      const { buildManuscriptStructureAnchor } = await import('../shared/manuscriptStructure.js');
      const anchor = await buildManuscriptStructureAnchor(source, first.anchor.selectionStart, last.anchor.selectionEnd, document.source.sourceFingerprint);
      const merged: ManuscriptStructureProposalV1 = { ...first, id: stableId('proposal', ...ordered.map((proposal) => proposal.id)), label: normalizeLabel(first.label, 'Merged section'), state: 'proposed', provenance: 'merged', blockIds: ordered.flatMap((proposal) => proposal.blockIds), anchor, appliedUnitId: null, createdAt: timestamp, updatedAt: timestamp };
      const firstIndex = document.proposals.findIndex((proposal) => proposal.id === first.id);
      const proposals = document.proposals.filter((proposal) => !proposalIds.includes(proposal.id));
      proposals.splice(firstIndex < 0 ? proposals.length : firstIndex, 0, merged);
      return { document: { ...document, revision: document.revision + 1, proposals }, source };
    });
  }

  async reorderGroups(projectId: string, expectedRevision: number, orderedProposalIds: readonly string[]): Promise<ManuscriptStructureSnapshotV1> {
    return this.mutate(projectId, expectedRevision, async (document, source) => {
      if (document.proposals.some((proposal) => proposal.appliedUnitId)) {
        throw new ManuscriptStructureRepositoryError('APPLIED_PROPOSAL', 'Structure reorder is disabled after any proposal has been applied.');
      }
      if (orderedProposalIds.length !== document.proposals.length || new Set(orderedProposalIds).size !== orderedProposalIds.length || orderedProposalIds.some((id) => !document.proposals.some((proposal) => proposal.id === id))) {
        throw new ManuscriptStructureRepositoryError('INVALID_BOUNDARY', 'Reorder must contain every structure proposal exactly once.');
      }
      const byId = new Map(document.proposals.map((proposal) => [proposal.id, proposal]));
      return { document: { ...document, revision: document.revision + 1, proposals: orderedProposalIds.map((id) => byId.get(id)!) }, source };
    });
  }

  async apply(projectId: string, expectedRevision: number): Promise<ManuscriptStructureSnapshotV1> {
    const prior = mutationQueues.get(this.structurePath) ?? Promise.resolve();
    let release!: () => void;
    const hold = new Promise<void>((resolve) => { release = resolve; });
    const tail = prior.then(() => hold);
    mutationQueues.set(this.structurePath, tail);
    await prior;
    let journal: ApplyJournal | null = null;
    let transactionPathForCleanup: string | null = null;
    try {
      const current = await this.readUnsafe(projectId);
      if (current.availability === 'degraded') throw new ManuscriptStructureRepositoryError('UNAVAILABLE', current.message ?? 'The manuscript structure is unavailable.');
      if (current.sourceStatus === 'changed-after-apply') throw new ManuscriptStructureRepositoryError('SOURCE_CHANGED_AFTER_APPLY', current.message ?? 'The imported manuscript changed after structure was applied.');
      if (current.document.revision !== expectedRevision) throw new ManuscriptStructureRepositoryError('STALE', 'The manuscript structure changed. Reload it before applying.');
      const unresolved = current.document.proposals.filter((proposal) => proposal.state === 'proposed' && !proposal.appliedUnitId);
      if (unresolved.length > 0) {
        throw new ManuscriptStructureRepositoryError('INVALID_STRUCTURE', `Decide ${unresolved.length} remaining section${unresolved.length === 1 ? '' : 's'} before applying structure.`);
      }
      const accepted = current.document.proposals.filter((proposal) => proposal.state === 'accepted');
      if (accepted.length === 0) throw new ManuscriptStructureRepositoryError('APPLY_FAILED', 'Accept at least one structure proposal before applying.');
      validateAcceptedRanges(current.document, current.sourceText);
      const materializable = accepted.filter((proposal) => !proposal.appliedUnitId);
      if (materializable.length === 0) return current;
      const outlinePath = path.join(this.projectPath, 'outline.json');
      const outline = JSON.parse(await fs.readFile(outlinePath, 'utf8')) as OutlineFile;
      const nextScenes = [...outline.scenes];
      const nextProposals = current.document.proposals.map((proposal) => {
        if (proposal.state !== 'accepted' || proposal.appliedUnitId) return proposal;
        const unitId = `unit_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const order = nextScenes.length + 1;
        nextScenes.push({ id: unitId, title: proposal.label, order });
        return { ...proposal, appliedUnitId: unitId, updatedAt: this.now().toISOString() };
      });
      const nextOutline: OutlineFile = { ...outline, scenes: nextScenes };
      const nextDocument: ManuscriptStructureDocumentV1 = { ...current.document, revision: current.document.revision + 1, proposals: nextProposals };
      const transactionId = randomUUID();
      const transactionPath = path.join(this.applyStagingPath, transactionId);
      transactionPathForCleanup = transactionPath;
      const stagedDraftPath = path.join(transactionPath, 'drafts');
      await fs.mkdir(stagedDraftPath, { recursive: true });
      await fs.mkdir(path.join(this.projectPath, 'drafts'), { recursive: true });
      await fs.mkdir(path.join(transactionPath, 'backups'), { recursive: true });
      const entries: ApplyJournalEntry[] = [];
      const addEntry = (kind: ApplyJournalEntry['kind'], targetPath: string, stagedPath: string, contents: string): void => {
        entries.push({
          kind,
          targetPath,
          stagedPath,
          backupPath: kind === 'draft' ? null : path.join(transactionPath, 'backups', path.basename(targetPath)),
          fingerprint: sha256(contents),
          committed: false,
        });
      };
      for (const proposal of nextProposals) {
        if (!proposal.appliedUnitId || current.document.proposals.find((candidate) => candidate.id === proposal.id)?.appliedUnitId) continue;
        const body = current.sourceText.slice(proposal.anchor.selectionStart, proposal.anchor.selectionEnd);
        const order = nextScenes.find((scene) => scene.id === proposal.appliedUnitId)?.order ?? nextScenes.length;
        const draftContents = draftForUnit(proposal.appliedUnitId, proposal.label, order, body);
        addEntry('draft', path.join(this.projectPath, 'drafts', `${proposal.appliedUnitId}.md`), path.join(stagedDraftPath, `${proposal.appliedUnitId}.md`), draftContents);
      }
      addEntry('outline', outlinePath, path.join(transactionPath, 'outline.json'), `${JSON.stringify(nextOutline, null, 2)}\n`);
      addEntry('sidecar', this.structurePath, path.join(transactionPath, MANUSCRIPT_STRUCTURE_FILENAME), `${JSON.stringify(nextDocument, null, 2)}\n`);
      const stagedContents = new Map<string, string>();
      for (const proposal of nextProposals) {
        if (!proposal.appliedUnitId || current.document.proposals.find((candidate) => candidate.id === proposal.id)?.appliedUnitId) continue;
        const body = current.sourceText.slice(proposal.anchor.selectionStart, proposal.anchor.selectionEnd);
        const order = nextScenes.find((scene) => scene.id === proposal.appliedUnitId)?.order ?? nextScenes.length;
        stagedContents.set(path.join(stagedDraftPath, `${proposal.appliedUnitId}.md`), draftForUnit(proposal.appliedUnitId, proposal.label, order, body));
      }
      stagedContents.set(path.join(transactionPath, 'outline.json'), `${JSON.stringify(nextOutline, null, 2)}\n`);
      stagedContents.set(path.join(transactionPath, MANUSCRIPT_STRUCTURE_FILENAME), `${JSON.stringify(nextDocument, null, 2)}\n`);
      for (const entry of entries) {
        await fs.mkdir(path.dirname(entry.stagedPath), { recursive: true });
        const contents = stagedContents.get(entry.stagedPath);
        if (contents === undefined) throw new ManuscriptStructureRepositoryError('APPLY_FAILED', 'A staged Apply file could not be resolved.');
        await writeDurable(entry.stagedPath, contents);
      }
      this.applyStep('draft-staged');
      this.applyStep('outline-staged');
      this.applyStep('sidecar-staged');
      journal = {
        schemaVersion: MANUSCRIPT_STRUCTURE_APPLY_SCHEMA_VERSION,
        transactionId,
        projectId,
        projectPath: path.resolve(this.projectPath),
        expectedRevision,
        sourceFingerprint: current.document.source.sourceFingerprint,
        phase: 'prepared',
        entries,
      };
      await this.writeApplyJournal(journal);
      this.applyStep('journal-prepared');
      journal.phase = 'committing';
      await this.writeApplyJournal(journal);
      this.applyStep('journal-committing');
      for (const entry of entries) {
        await this.recoverApplyEntry(entry);
        await this.writeApplyJournal(journal);
        this.applyStep(entry.kind === 'draft' ? 'draft-committed' : entry.kind === 'outline' ? 'outline-committed' : 'sidecar-committed');
      }
      for (const entry of entries) {
        if (await fileFingerprint(entry.targetPath) !== entry.fingerprint) throw new ManuscriptStructureRepositoryError('APPLY_FAILED', `Apply verification failed for ${path.basename(entry.targetPath)}.`);
      }
      this.applyStep('verified');
      journal.phase = 'complete';
      await this.writeApplyJournal(journal);
      await this.cleanupApplyJournal(journal);
      return this.snapshot(nextDocument, current.sourceText);
    } catch (error) {
      if (error instanceof SimulatedApplyTermination) throw error;
      if (journal && journal.phase !== 'complete') {
        try {
          await this.rollbackApplyJournal(journal);
          await this.cleanupApplyJournal(journal);
        } catch {
          // Leave the journal in place so the next startup exposes recovery instead of guessing.
        }
      }
      if (!journal && transactionPathForCleanup) {
        await fs.rm(transactionPathForCleanup, { recursive: true, force: true }).catch(() => undefined);
      }
      throw error instanceof ManuscriptStructureRepositoryError
        ? error
        : new ManuscriptStructureRepositoryError('APPLY_FAILED', error instanceof Error ? error.message : 'The accepted structure could not be applied.');
    } finally {
      release();
      if (mutationQueues.get(this.structurePath) === tail) mutationQueues.delete(this.structurePath);
    }
  }

  private updateProposal(document: ManuscriptStructureDocumentV1, proposalId: string, update: (proposal: ManuscriptStructureProposalV1) => ManuscriptStructureProposalV1): ManuscriptStructureDocumentV1 {
    if (!document.proposals.some((proposal) => proposal.id === proposalId)) throw new ManuscriptStructureRepositoryError('UNKNOWN_PROPOSAL', 'The structure proposal no longer exists.');
    return { ...document, revision: document.revision + 1, proposals: document.proposals.map((proposal) => proposal.id === proposalId ? update(proposal) : proposal) };
  }

  private assertProposalMutable(proposal: ManuscriptStructureProposalV1): void {
    if (proposal.appliedUnitId) {
      throw new ManuscriptStructureRepositoryError('APPLIED_PROPOSAL', 'An applied structure proposal is immutable.');
    }
  }

  private async mutate(projectId: string, expectedRevision: number, change: (document: ManuscriptStructureDocumentV1, source: string) => Promise<{ document: ManuscriptStructureDocumentV1; source: string }>, allowChangedSource = false): Promise<ManuscriptStructureSnapshotV1> {
    const prior = mutationQueues.get(this.structurePath) ?? Promise.resolve();
    let release!: () => void;
    const hold = new Promise<void>((resolve) => { release = resolve; });
    const tail = prior.then(() => hold);
    mutationQueues.set(this.structurePath, tail);
    await prior;
    try {
      const current = await this.readUnsafe(projectId);
      if (current.availability === 'degraded') throw new ManuscriptStructureRepositoryError('UNAVAILABLE', current.message ?? 'The manuscript structure is unavailable.');
      if (current.sourceStatus === 'changed-after-apply') throw new ManuscriptStructureRepositoryError('SOURCE_CHANGED_AFTER_APPLY', current.message ?? 'The imported manuscript changed after structure was applied.');
      if (current.sourceStatus === 'changed' && !allowChangedSource) throw new ManuscriptStructureRepositoryError('INVALID_STRUCTURE', 'The imported manuscript changed. Rediscover before editing structure.');
      if (current.document.revision !== expectedRevision) throw new ManuscriptStructureRepositoryError('STALE', 'The manuscript structure changed. Reload it before trying again.');
      const next = await change(current.document, current.sourceText);
      if (next.document !== current.document) await this.writeDocument(next.document);
      return this.snapshot(next.document, next.source);
    } finally {
      release();
      if (mutationQueues.get(this.structurePath) === tail) mutationQueues.delete(this.structurePath);
    }
  }

  private async writeDocument(document: ManuscriptStructureDocumentV1): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.structurePath), { recursive: true });
      await writeAtomic(this.structurePath, `${JSON.stringify(document, null, 2)}\n`);
    } catch {
      throw new ManuscriptStructureRepositoryError('WRITE_FAILED', 'The manuscript structure could not be saved.');
    }
  }

  private snapshot(document: ManuscriptStructureDocumentV1, sourceText: string): ManuscriptStructureSnapshotV1 {
    return { availability: 'ready', sourceStatus: 'current', projectId: document.projectId, projectPath: this.projectPath, sourceText, document, message: null };
  }
}

function rangesOverlap(leftStart: number, leftEnd: number, rightStart: number, rightEnd: number): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

function validateAcceptedRanges(document: ManuscriptStructureDocumentV1, source: string): void {
  const accepted = document.proposals.filter((proposal) => proposal.state === 'accepted');
  for (const proposal of accepted) {
    const { selectionStart, selectionEnd, sourceFingerprint } = proposal.anchor;
    if (
      sourceFingerprint !== document.source.sourceFingerprint ||
      sourceFingerprint !== sha256(source) ||
      selectionStart < 0 ||
      selectionEnd <= selectionStart ||
      selectionEnd > source.length
    ) {
      throw new ManuscriptStructureRepositoryError('INVALID_STRUCTURE', 'An accepted structure range is stale, unresolved, or outside the current manuscript source.');
    }
  }
  for (let index = 0; index < accepted.length; index += 1) {
    const left = accepted[index]!.anchor;
    for (let otherIndex = index + 1; otherIndex < accepted.length; otherIndex += 1) {
      const right = accepted[otherIndex]!.anchor;
      if (rangesOverlap(left.selectionStart, left.selectionEnd, right.selectionStart, right.selectionEnd)) {
        throw new ManuscriptStructureRepositoryError('OVERLAPPING_ACCEPTED_RANGES', 'Accepted structure ranges overlap. Resolve the overlapping proposals before applying structure.');
      }
    }
  }
}
