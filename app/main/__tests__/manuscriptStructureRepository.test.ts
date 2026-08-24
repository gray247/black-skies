import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { access } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vitest';

import { buildBlankOutline } from '../projectBootstrap';
import {
  MANUSCRIPT_INTAKE_FILENAME,
  MANUSCRIPT_STRUCTURE_APPLY_JOURNAL_FILENAME,
  MANUSCRIPT_STRUCTURE_APPLY_STAGING_DIRECTORY,
  MANUSCRIPT_STRUCTURE_FILENAME,
  ManuscriptStructureRepository,
  ManuscriptStructureRepositoryError,
  type ManuscriptStructureApplyStep,
} from '../manuscriptStructureRepository';

const temporaryRoots: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-manuscript-structure-'));
  temporaryRoots.push(root);
  return root;
}

async function captureProjectFiles(projectPath: string): Promise<Record<string, string>> {
  const files = ['outline.json', MANUSCRIPT_INTAKE_FILENAME, MANUSCRIPT_STRUCTURE_FILENAME];
  const draftsPath = join(projectPath, 'drafts');
  const draftNames = await readdir(draftsPath).catch(() => [] as string[]);
  for (const draftName of draftNames) files.push(join('drafts', draftName));
  const entries: Record<string, string> = {};
  for (const file of files) entries[file] = await readFile(join(projectPath, file), 'utf8').catch(() => '<missing>');
  return entries;
}

async function appliedProject(): Promise<{
  projectPath: string;
  repository: ManuscriptStructureRepository;
  snapshot: Awaited<ReturnType<ManuscriptStructureRepository['apply']>>;
  appliedProposalId: string;
  unappliedProposalId: string;
}> {
  const projectPath = await temporaryProject();
  await writeFile(join(projectPath, 'outline.json'), JSON.stringify(buildBlankOutline('project-a')));
  const repository = new ManuscriptStructureRepository(projectPath, () => new Date('2026-08-22T00:00:00.000Z'));
  let snapshot = await repository.importSource(
    'project-a',
    'source.md',
    '# One\nFirst paragraph\n\n# Two\nSecond paragraph',
  );
  snapshot = await repository.discover('project-a', snapshot.document.revision);
  const [first, second] = snapshot.document.proposals;
  if (!first || !second) throw new Error('Expected two deterministic heading proposals.');
  snapshot = await repository.setProposalState('project-a', snapshot.document.revision, first.id, 'accepted');
  snapshot = await repository.setProposalState('project-a', snapshot.document.revision, second.id, 'rejected');
  const applied = await repository.apply('project-a', snapshot.document.revision);
  return {
    projectPath,
    repository,
    snapshot: applied,
    appliedProposalId: first.id,
    unappliedProposalId: second.id,
  };
}

describe('Manuscript Structure project-local repository', () => {
  afterEach(async () => {
    await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('imports normalized Markdown into a sidecar without creating Units', async () => {
    const projectPath = await temporaryProject();
    const repository = new ManuscriptStructureRepository(projectPath);
    const imported = await repository.importSource('project-a', 'source.md', 'one\r\ntwo');
    expect(imported.sourceText).toBe('one\ntwo');
    expect(imported.document.proposals).toHaveLength(0);
    expect(await readFile(join(projectPath, MANUSCRIPT_INTAKE_FILENAME), 'utf8')).toBe('one\ntwo');
    expect(JSON.parse(await readFile(join(projectPath, MANUSCRIPT_STRUCTURE_FILENAME), 'utf8')).schemaVersion).toBe('BlackSkiesManuscriptStructure v1');
  });

  it('persists rejection, supports manual split and applies only accepted groups', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, 'outline.json'), JSON.stringify(buildBlankOutline('project-a')));
    const repository = new ManuscriptStructureRepository(projectPath, () => new Date('2026-08-22T00:00:00.000Z'));
    let snapshot = await repository.importSource('project-a', 'source.md', '# One\nFirst\n\n# Two\nSecond');
    snapshot = await repository.discover('project-a', snapshot.document.revision);
    const [first, second] = snapshot.document.proposals;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    snapshot = await repository.setProposalState('project-a', snapshot.document.revision, first!.id, 'rejected');
    snapshot = await repository.setProposalState('project-a', snapshot.document.revision, second!.id, 'accepted');
    const applied = await repository.apply('project-a', snapshot.document.revision);
    expect(applied.document.proposals.find((proposal) => proposal.id === first!.id)?.state).toBe('rejected');
    const appliedSecond = applied.document.proposals.find((proposal) => proposal.id === second!.id);
    expect(appliedSecond?.appliedUnitId).toMatch(/^unit_/);
    expect(applied.document.proposals.filter((proposal) => proposal.appliedUnitId)).toHaveLength(1);
    expect(JSON.parse(await readFile(join(projectPath, 'outline.json'), 'utf8')).scenes).toHaveLength(1);
    expect(await readFile(join(projectPath, 'drafts', `${appliedSecond!.appliedUnitId}.md`), 'utf8')).toContain('# Two\nSecond');
    const reopened = await new ManuscriptStructureRepository(projectPath).read('project-a');
    expect(reopened.document.proposals.find((proposal) => proposal.id === first!.id)?.state).toBe('rejected');
  });

  it('rejects direct Apply with an unresolved current proposal before any filesystem write', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, 'outline.json'), JSON.stringify(buildBlankOutline('project-a')));
    const repository = new ManuscriptStructureRepository(projectPath);
    let snapshot = await repository.importSource('project-a', 'source.md', '# One\nFirst\n\n# Two\nSecond');
    snapshot = await repository.discover('project-a', snapshot.document.revision);
    snapshot = await repository.setProposalState('project-a', snapshot.document.revision, snapshot.document.proposals[0]!.id, 'accepted');
    const before = await captureProjectFiles(projectPath);

    await expect(repository.apply('project-a', snapshot.document.revision))
      .rejects.toMatchObject<ManuscriptStructureRepositoryError>({ code: 'INVALID_STRUCTURE' });
    await expect(repository.apply('project-a', snapshot.document.revision))
      .rejects.toThrow('Decide 1 remaining section before applying structure.');
    expect(await captureProjectFiles(projectPath)).toEqual(before);
    expect((await repository.read('project-a')).document.revision).toBe(snapshot.document.revision);
  });

  it('rejects stale revisions and source crossover instead of guessing', async () => {
    const projectPath = await temporaryProject();
    const repository = new ManuscriptStructureRepository(projectPath);
    const imported = await repository.importSource('project-a', 'source.md', '# One');
    await expect(repository.discover('project-a', imported.document.revision + 1)).rejects.toThrow('changed');
    await expect(repository.read('project-b')).resolves.toMatchObject({ availability: 'degraded' });
  });

  it('exposes changed intake as stale without silently re-importing it', async () => {
    const projectPath = await temporaryProject();
    const repository = new ManuscriptStructureRepository(projectPath);
    let snapshot = await repository.importSource('project-a', 'source.md', '# One');
    snapshot = await repository.discover('project-a', snapshot.document.revision);
    await writeFile(join(projectPath, MANUSCRIPT_INTAKE_FILENAME), '# Changed');

    const reopened = await repository.read('project-a');
    expect(reopened.availability).toBe('ready');
    expect(reopened.message).toContain('stale');
    expect(reopened.document.proposals[0]?.state).toBe('stale');
    expect(reopened.sourceText).toBe('# Changed');
    expect(reopened.document.source.sourceFingerprint).toBe(snapshot.document.source.sourceFingerprint);
    expect(reopened.document.revision).toBe(snapshot.document.revision);
  });

  it('reports source change after Apply without mutating applied proposals or permitting rediscovery', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, 'outline.json'), JSON.stringify(buildBlankOutline('project-a')));
    let repository = new ManuscriptStructureRepository(projectPath);
    let snapshot = await repository.importSource('project-a', 'source.md', '# One\nExact prose');
    snapshot = await repository.discover('project-a', snapshot.document.revision);
    snapshot = await repository.setProposalState('project-a', snapshot.document.revision, snapshot.document.proposals[0]!.id, 'accepted');
    const applied = await repository.apply('project-a', snapshot.document.revision);
    await writeFile(join(projectPath, MANUSCRIPT_INTAKE_FILENAME), '# One\nChanged prose');

    const reopened = await new ManuscriptStructureRepository(projectPath).read('project-a');
    expect(reopened.sourceStatus).toBe('changed-after-apply');
    expect(reopened.document.proposals[0]).toEqual(applied.document.proposals[0]);
    await expect(new ManuscriptStructureRepository(projectPath).discover('project-a', reopened.document.revision))
      .rejects.toMatchObject<ManuscriptStructureRepositoryError>({ code: 'SOURCE_CHANGED_AFTER_APPLY' });
  });

  it('rejects overlapping accepted ranges before Apply writes anything', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, 'outline.json'), JSON.stringify(buildBlankOutline('project-a')));
    let repository = new ManuscriptStructureRepository(projectPath);
    let snapshot = await repository.importSource('project-a', 'source.md', '# One\nExact prose');
    snapshot = await repository.discover('project-a', snapshot.document.revision);
    const first = snapshot.document.proposals[0]!;
    snapshot = await repository.setBoundary('project-a', snapshot.document.revision, first.anchor.selectionStart, first.anchor.selectionStart + 4, 'Overlapping');
    const manual = snapshot.document.proposals.find((proposal) => proposal.provenance === 'manual')!;
    snapshot = await repository.setProposalState('project-a', snapshot.document.revision, first.id, 'accepted');
    snapshot = await repository.setProposalState('project-a', snapshot.document.revision, manual.id, 'accepted');
    const before = await captureProjectFiles(projectPath);
    await expect(repository.apply('project-a', snapshot.document.revision))
      .rejects.toMatchObject<ManuscriptStructureRepositoryError>({ code: 'OVERLAPPING_ACCEPTED_RANGES' });
    expect(await captureProjectFiles(projectPath)).toEqual(before);
    expect((await repository.read('project-a')).document.revision).toBe(snapshot.document.revision);
  });

  it('rejects a post-Apply manual boundary intersecting applied prose without file changes', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, 'outline.json'), JSON.stringify(buildBlankOutline('project-a')));
    let repository = new ManuscriptStructureRepository(projectPath);
    let snapshot = await repository.importSource('project-a', 'source.md', '# One\nExact prose');
    snapshot = await repository.discover('project-a', snapshot.document.revision);
    snapshot = await repository.setProposalState('project-a', snapshot.document.revision, snapshot.document.proposals[0]!.id, 'accepted');
    const applied = await repository.apply('project-a', snapshot.document.revision);
    const appliedProposal = applied.document.proposals.find((proposal) => proposal.appliedUnitId)!;
    const before = await captureProjectFiles(projectPath);
    await expect(repository.setBoundary('project-a', applied.document.revision, appliedProposal.anchor.selectionStart, appliedProposal.anchor.selectionStart + 1, 'Inside applied'))
      .rejects.toMatchObject<ManuscriptStructureRepositoryError>({ code: 'OVERLAPPING_ACCEPTED_RANGES' });
    expect(await captureProjectFiles(projectPath)).toEqual(before);
    expect((await repository.read('project-a')).document.revision).toBe(applied.document.revision);
  });

  it('recovers every durable Apply interruption point without duplicate Units', async () => {
    const steps: ManuscriptStructureApplyStep[] = [
      'draft-staged', 'outline-staged', 'sidecar-staged', 'journal-prepared',
      'journal-committing', 'draft-committed', 'outline-committed',
      'sidecar-committed', 'verified',
    ];
    for (const interruptedStep of steps) {
      const projectPath = await temporaryProject();
      await writeFile(join(projectPath, 'outline.json'), JSON.stringify(buildBlankOutline('project-a')));
      let snapshot = await new ManuscriptStructureRepository(projectPath).importSource('project-a', 'source.md', '# One\nExact prose');
      snapshot = await new ManuscriptStructureRepository(projectPath).discover('project-a', snapshot.document.revision);
      snapshot = await new ManuscriptStructureRepository(projectPath).setProposalState('project-a', snapshot.document.revision, snapshot.document.proposals[0]!.id, 'accepted');
      const interrupted = new ManuscriptStructureRepository(projectPath, () => new Date(), {
        onApplyStep: (step) => { if (step === interruptedStep) throw new Error('terminate'); },
      });
      await expect(interrupted.apply('project-a', snapshot.document.revision)).rejects.toThrow();

      const recovered = await new ManuscriptStructureRepository(projectPath).read('project-a');
      expect(recovered.availability).toBe('ready');
      expect(recovered.document.proposals.filter((proposal) => proposal.appliedUnitId)).toHaveLength(interruptedStep === 'draft-staged' || interruptedStep === 'outline-staged' || interruptedStep === 'sidecar-staged' ? 0 : 1);
      const outline = JSON.parse(await readFile(join(projectPath, 'outline.json'), 'utf8')) as { scenes: Array<{ id: string }> };
      const drafts = await readFile(join(projectPath, 'manuscript-structure.json'), 'utf8');
      expect(outline.scenes).toHaveLength(interruptedStep === 'draft-staged' || interruptedStep === 'outline-staged' || interruptedStep === 'sidecar-staged' ? 0 : 1);
      expect(drafts).not.toContain('terminate');
      expect(await readFile(join(projectPath, MANUSCRIPT_STRUCTURE_APPLY_JOURNAL_FILENAME), 'utf8').catch(() => '')).toBe('');
      await expect(access(join(projectPath, MANUSCRIPT_STRUCTURE_APPLY_STAGING_DIRECTORY))).rejects.toThrow();
    }
  });

  it('does not rewrite an already-applied accepted proposal', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, 'outline.json'), JSON.stringify(buildBlankOutline('project-a')));
    let repository = new ManuscriptStructureRepository(projectPath);
    let snapshot = await repository.importSource('project-a', 'source.md', '# One\nExact prose');
    snapshot = await repository.discover('project-a', snapshot.document.revision);
    snapshot = await repository.setProposalState('project-a', snapshot.document.revision, snapshot.document.proposals[0]!.id, 'accepted');
    const applied = await repository.apply('project-a', snapshot.document.revision);
    const reopened = await new ManuscriptStructureRepository(projectPath).read('project-a');
    const repeated = await new ManuscriptStructureRepository(projectPath).apply('project-a', reopened.document.revision);
    expect(repeated.document.revision).toBe(applied.document.revision);
    expect(JSON.parse(await readFile(join(projectPath, 'outline.json'), 'utf8')).scenes).toHaveLength(1);
  });

  it.each([
    ['accept', async (repository: ManuscriptStructureRepository, revision: number, appliedId: string) => repository.setProposalState('project-a', revision, appliedId, 'accepted')],
    ['reject', async (repository: ManuscriptStructureRepository, revision: number, appliedId: string) => repository.setProposalState('project-a', revision, appliedId, 'rejected')],
    ['rename', async (repository: ManuscriptStructureRepository, revision: number, appliedId: string) => repository.renameProposal('project-a', revision, appliedId, 'Changed label')],
    ['split', async (repository: ManuscriptStructureRepository, revision: number, appliedId: string, _otherId: string, snapshot: Awaited<ReturnType<ManuscriptStructureRepository['apply']>>) => {
      const proposal = snapshot.document.proposals.find((candidate) => candidate.id === appliedId)!;
      const boundary = snapshot.sourceText.indexOf('\n', proposal.anchor.selectionStart) + 1;
      return repository.splitGroup('project-a', revision, appliedId, boundary);
    }],
    ['merge', async (repository: ManuscriptStructureRepository, revision: number, appliedId: string, otherId: string) => repository.mergeGroups('project-a', revision, [appliedId, otherId])],
    ['reorder', async (repository: ManuscriptStructureRepository, revision: number, _appliedId: string, _otherId: string, snapshot: Awaited<ReturnType<ManuscriptStructureRepository['apply']>>) => repository.reorderGroups('project-a', revision, snapshot.document.proposals.map((proposal) => proposal.id).reverse())],
  ] as const)('rejects %s of applied proposals without changing files or revision', async (_name, mutate) => {
    const { projectPath, repository, snapshot, appliedProposalId, unappliedProposalId } = await appliedProject();
    const before = await captureProjectFiles(projectPath);

    await expect(mutate(repository, snapshot.document.revision, appliedProposalId, unappliedProposalId, snapshot))
      .rejects.toMatchObject<ManuscriptStructureRepositoryError>({ code: 'APPLIED_PROPOSAL' });

    expect(await captureProjectFiles(projectPath)).toEqual(before);
    expect((await repository.read('project-a')).document.revision).toBe(snapshot.document.revision);
  });

  it('preserves an applied proposal byte-for-byte during unchanged-source rediscovery', async () => {
    const { repository, snapshot, appliedProposalId } = await appliedProject();
    const appliedProposal = snapshot.document.proposals.find((proposal) => proposal.id === appliedProposalId)!;

    const rediscovered = await repository.discover('project-a', snapshot.document.revision);

    expect(rediscovered.document.proposals.find((proposal) => proposal.id === appliedProposalId)).toEqual(appliedProposal);
  });

  it('persists only proposal-sidecar ordering and increments only its revision', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, 'outline.json'), JSON.stringify(buildBlankOutline('project-a')));
    const repository = new ManuscriptStructureRepository(projectPath);
    let snapshot = await repository.importSource('project-a', 'source.md', '# One\nFirst\n\n# Two\nSecond');
    snapshot = await repository.discover('project-a', snapshot.document.revision);
    const before = await captureProjectFiles(projectPath);
    const reversed = snapshot.document.proposals.map((proposal) => proposal.id).reverse();

    const reordered = await repository.reorderGroups('project-a', snapshot.document.revision, reversed);
    const after = await captureProjectFiles(projectPath);

    expect(reordered.document.revision).toBe(snapshot.document.revision + 1);
    expect(reordered.document.proposals.map((proposal) => proposal.id)).toEqual(reversed);
    expect(after[MANUSCRIPT_INTAKE_FILENAME]).toBe(before[MANUSCRIPT_INTAKE_FILENAME]);
    expect(after['outline.json']).toBe(before['outline.json']);
    expect(Object.entries(after).filter(([name]) => name.startsWith('drafts/')))
      .toEqual(Object.entries(before).filter(([name]) => name.startsWith('drafts/')));
    expect(after[MANUSCRIPT_STRUCTURE_FILENAME]).not.toBe(before[MANUSCRIPT_STRUCTURE_FILENAME]);
  });
});
