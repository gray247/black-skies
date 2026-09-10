import fs, { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FEEDBACK_NOTE_SCHEMA_VERSION } from '../../shared/ipc/feedbackNotes';
import {
  FEEDBACK_NOTES_FILENAME,
  FeedbackNotesRepository,
  FeedbackNotesRepositoryError,
} from '../feedbackNotesRepository';

const temporaryRoots: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-feedback-notes-'));
  temporaryRoots.push(root);
  return root;
}

const source = {
  projectId: 'project-a',
  unitId: 'unit-a',
  sourceCritiqueRequestId: 'critique-a',
  selectionFingerprint: 'selection-a',
  body: 'Keep the storm imagery, but clarify who heard the signal.',
};

describe('Feedback Notes sidecar', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
    );
  });

  it('writes a minimal project-local advisory note without touching project content files', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, 'project.json'), '{"project":"unchanged"}\n');
    await writeFile(join(projectPath, 'outline.json'), '{"outline":"unchanged"}\n');
    const repository = new FeedbackNotesRepository(
      projectPath,
      () => new Date('2026-08-07T12:00:00.000Z'),
    );

    const note = await repository.create(source);

    expect(note).toMatchObject({
      projectId: 'project-a',
      unitId: 'unit-a',
      sourceCritiqueRequestId: 'critique-a',
      selectionFingerprint: 'selection-a',
      advisory: true,
      body: source.body,
      createdAt: '2026-08-07T12:00:00.000Z',
    });
    const sidecar = JSON.parse(await readFile(join(projectPath, FEEDBACK_NOTES_FILENAME), 'utf8'));
    expect(sidecar).toEqual({
      schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION,
      projectId: 'project-a',
      notes: [note],
    });
    await expect(readFile(join(projectPath, 'project.json'), 'utf8')).resolves.toBe(
      '{"project":"unchanged"}\n',
    );
    await expect(readFile(join(projectPath, 'outline.json'), 'utf8')).resolves.toBe(
      '{"outline":"unchanged"}\n',
    );
    await expect(new FeedbackNotesRepository(projectPath).list('project-a')).resolves.toEqual([
      note,
    ]);
  });

  it('keeps projects isolated even where a sidecar from another project is present', async () => {
    const projectPath = await temporaryProject();
    await writeFile(
      join(projectPath, FEEDBACK_NOTES_FILENAME),
      JSON.stringify({
        schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION,
        projectId: 'project-b',
        notes: [],
      }),
    );

    await expect(new FeedbackNotesRepository(projectPath).create(source)).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    } satisfies Partial<FeedbackNotesRepositoryError>);
  });

  it('reports malformed note data honestly while leaving the sidecar untouched', async () => {
    const projectPath = await temporaryProject();
    const filePath = join(projectPath, FEEDBACK_NOTES_FILENAME);
    await writeFile(filePath, '{not valid JSON');

    await expect(new FeedbackNotesRepository(projectPath).create(source)).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    } satisfies Partial<FeedbackNotesRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe('{not valid JSON');
  });

  it('serializes concurrent creates across repository instances without losing a note', async () => {
    const projectPath = await temporaryProject();
    const creates = Array.from({ length: 24 }, (_, index) =>
      new FeedbackNotesRepository(
        projectPath,
        () => new Date(`2026-08-07T12:00:${String(index).padStart(2, '0')}.000Z`),
      ).create({
        ...source,
        sourceCritiqueRequestId: `critique-${index}`,
        selectionFingerprint: `selection-${index}`,
        body: `Author-selected note ${index}.`,
      }),
    );

    const created = await Promise.all(creates);
    const saved = await new FeedbackNotesRepository(projectPath).list('project-a');

    expect(saved).toHaveLength(24);
    expect(new Set(saved.map((note) => note.id))).toEqual(new Set(created.map((note) => note.id)));
    expect(saved.map((note) => note.sourceCritiqueRequestId)).toEqual(
      Array.from({ length: 24 }, (_, index) => `critique-${index}`),
    );
  });

  it('reports one failed write honestly without poisoning the next queued create', async () => {
    const projectPath = await temporaryProject();
    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('synthetic rename failure'));
    const firstRepository = new FeedbackNotesRepository(projectPath);
    const secondRepository = new FeedbackNotesRepository(projectPath);

    const first = firstRepository.create(source);
    const second = secondRepository.create({
      ...source,
      sourceCritiqueRequestId: 'critique-after-failure',
      selectionFingerprint: 'selection-after-failure',
      body: 'This note must survive the prior failed write.',
    });

    await expect(first).rejects.toMatchObject({
      code: 'WRITE_FAILED',
    } satisfies Partial<FeedbackNotesRepositoryError>);
    await expect(second).resolves.toMatchObject({
      sourceCritiqueRequestId: 'critique-after-failure',
    });
    await expect(new FeedbackNotesRepository(projectPath).list('project-a')).resolves.toHaveLength(
      1,
    );
  });

  it('reads legacy v1 losslessly and migrates it only on the first revision mutation', async () => {
    const projectPath = await temporaryProject();
    const legacy = {
      schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION,
      projectId: 'project-a',
      futureEnvelopeField: { preserved: true },
      notes: [
        {
          ...source,
          id: 'legacy-a',
          createdAt: '2026-08-07T12:00:00.000Z',
          advisory: true,
          futureNoteField: 'keep me',
        },
      ],
    };
    const filePath = join(projectPath, FEEDBACK_NOTES_FILENAME);
    await writeFile(filePath, `${JSON.stringify(legacy)}\n`);

    await expect(new FeedbackNotesRepository(projectPath).list('project-a')).resolves.toEqual(
      legacy.notes,
    );
    expect(await readFile(filePath, 'utf8')).toBe(`${JSON.stringify(legacy)}\n`);

    const repository = new FeedbackNotesRepository(
      projectPath,
      () => new Date('2026-08-07T12:01:00.000Z'),
    );
    const migrated = await repository.createRevisionItem({
      projectId: 'project-a',
      unitId: 'unit-a',
      body: 'A deliberate revision item.',
    });
    expect(migrated.document.revision).toBe(1);
    const saved = JSON.parse(await readFile(filePath, 'utf8'));
    expect(saved.futureEnvelopeField).toEqual({ preserved: true });
    expect(saved.notes[0]).toMatchObject({
      id: 'legacy-a',
      futureNoteField: 'keep me',
      advisory: true,
    });
    expect(saved.notes[1]).toMatchObject({
      kind: 'revision_item',
      advisory: false,
      lifecycle: 'active',
    });
  });

  it('refuses a stale optimistic revision without changing the document', async () => {
    const projectPath = await temporaryProject();
    const repository = new FeedbackNotesRepository(projectPath);
    const first = await repository.createRevisionItem({
      projectId: 'project-a',
      unitId: 'unit-a',
      body: 'First revision.',
    });
    const before = await readFile(join(projectPath, FEEDBACK_NOTES_FILENAME), 'utf8');

    await expect(
      repository.createRevisionItem(
        { projectId: 'project-a', unitId: 'unit-a', body: 'Stale revision.' },
        0,
      ),
    ).rejects.toMatchObject({ code: 'STALE' });
    await expect(readFile(join(projectPath, FEEDBACK_NOTES_FILENAME), 'utf8')).resolves.toBe(
      before,
    );
    expect(first.document.revision).toBe(1);
  });

  it('serializes concurrent revision mutations and preserves both items', async () => {
    const projectPath = await temporaryProject();
    const repository = new FeedbackNotesRepository(projectPath);
    const first = await repository.createRevisionItem({
      projectId: 'project-a',
      unitId: 'unit-a',
      body: 'First.',
    });
    const secondRepository = new FeedbackNotesRepository(projectPath);
    const [left, right] = await Promise.all(
      [
        repository.setLifecycle('project-a', first.document.revision, first.note!.id, 'parked'),
        secondRepository.setLifecycle(
          'project-a',
          first.document.revision,
          first.note!.id,
          'dismissed',
        ),
      ].map(async (operation) => operation.catch((error: unknown) => error)),
    );

    const outcomes = [left, right];
    expect(outcomes.filter((value) => !(value instanceof Error))).toHaveLength(1);
    expect(
      outcomes
        .filter((value) => value instanceof Error)
        .some((value) => (value as { code?: string }).code === 'STALE'),
    ).toBe(true);
    expect(await repository.listAll('project-a')).toHaveLength(1);
  });

  it('keeps lifecycle history out of active projection and creates a distinct recurrence', async () => {
    const projectPath = await temporaryProject();
    const repository = new FeedbackNotesRepository(projectPath);
    const created = await repository.createRevisionItem({
      projectId: 'project-a',
      unitId: 'unit-a',
      body: 'Concern to resolve.',
    });
    const parked = await repository.park(
      'project-a',
      created.document.revision,
      created.note!.id,
      'revisit later',
    );
    expect(parked.note).toMatchObject({ lifecycle: 'parked' });
    expect(await repository.listActive('project-a')).toEqual([]);
    expect(await repository.listHistory('project-a')).toHaveLength(1);
    expect(parked.note!.dispositionHistory).toHaveLength(1);

    const resolved = await repository.resolve(
      'project-a',
      parked.document.revision,
      created.note!.id,
    );
    const recurrence = await repository.createRecurrence(
      'project-a',
      resolved.document.revision,
      created.note!.id,
      {
        projectId: 'project-a',
        unitId: 'unit-a',
        body: 'The concern appears again.',
      },
    );
    expect(recurrence.note!.id).not.toBe(created.note!.id);
    expect(recurrence.note).toMatchObject({
      relatedRevisionItemId: created.note!.id,
      lifecycle: 'active',
    });
    expect(await repository.listActive('project-a')).toEqual([recurrence.note]);
    expect(await repository.listHistory('project-a')).toContainEqual(
      expect.objectContaining({ id: created.note!.id, lifecycle: 'resolved' }),
    );
  });

  it('keeps the legacy advisory list separate from revision-item projections', async () => {
    const projectPath = await temporaryProject();
    const repository = new FeedbackNotesRepository(projectPath);
    const advisory = await repository.create(source);
    const revision = await repository.createRevisionItem({
      projectId: 'project-a',
      unitId: 'unit-a',
      body: 'Revision work.',
    });

    await expect(repository.list('project-a')).resolves.toEqual([advisory]);
    await expect(repository.listAll('project-a')).resolves.toEqual([advisory, revision.note]);
    await expect(repository.listActive('project-a')).resolves.toEqual([revision.note]);
  });

  it('only allows recurrence from resolved history and never reopens the resolved item', async () => {
    const projectPath = await temporaryProject();
    const repository = new FeedbackNotesRepository(projectPath);
    const active = await repository.createRevisionItem({
      projectId: 'project-a',
      unitId: 'unit-a',
      body: 'Active concern.',
    });
    await expect(
      repository.createRecurrence('project-a', active.document.revision, active.note!.id, {
        projectId: 'project-a',
        unitId: 'unit-a',
        body: 'Invalid recurrence.',
      }),
    ).rejects.toMatchObject({ code: 'INVALID' });

    const parked = await repository.park('project-a', active.document.revision, active.note!.id);
    await expect(
      repository.createRecurrence('project-a', parked.document.revision, active.note!.id, {
        projectId: 'project-a',
        unitId: 'unit-a',
        body: 'Invalid parked recurrence.',
      }),
    ).rejects.toMatchObject({ code: 'INVALID' });

    const resolved = await repository.resolve(
      'project-a',
      parked.document.revision,
      active.note!.id,
    );
    const recurrence = await repository.createRecurrence(
      'project-a',
      resolved.document.revision,
      active.note!.id,
      {
        projectId: 'project-a',
        unitId: 'unit-a',
        body: 'A later recurrence.',
      },
    );
    expect(recurrence.note!.id).not.toBe(active.note!.id);
    expect(await repository.listHistory('project-a')).toContainEqual(
      expect.objectContaining({ id: active.note!.id, lifecycle: 'resolved' }),
    );
  });

  it('leaves an existing document intact when a revision write fails', async () => {
    const projectPath = await temporaryProject();
    const repository = new FeedbackNotesRepository(projectPath);
    const created = await repository.createRevisionItem({
      projectId: 'project-a',
      unitId: 'unit-a',
      body: 'Prior item.',
    });
    const before = await readFile(join(projectPath, FEEDBACK_NOTES_FILENAME), 'utf8');
    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('synthetic rename failure'));

    await expect(
      repository.resolve('project-a', created.document.revision, created.note!.id),
    ).rejects.toMatchObject({ code: 'WRITE_FAILED' });
    await expect(readFile(join(projectPath, FEEDBACK_NOTES_FILENAME), 'utf8')).resolves.toBe(
      before,
    );
  });
});
