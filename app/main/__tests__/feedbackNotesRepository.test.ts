import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

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
    await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
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
    await expect(readFile(join(projectPath, 'project.json'), 'utf8')).resolves.toBe('{"project":"unchanged"}\n');
    await expect(readFile(join(projectPath, 'outline.json'), 'utf8')).resolves.toBe('{"outline":"unchanged"}\n');
    await expect(new FeedbackNotesRepository(projectPath).list('project-a')).resolves.toEqual([note]);
  });

  it('keeps projects isolated even where a sidecar from another project is present', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, FEEDBACK_NOTES_FILENAME), JSON.stringify({
      schemaVersion: FEEDBACK_NOTE_SCHEMA_VERSION,
      projectId: 'project-b',
      notes: [],
    }));

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
});
