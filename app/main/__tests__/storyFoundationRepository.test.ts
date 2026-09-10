import fs, { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  STORY_FOUNDATION_QUESTIONS,
  STORY_FOUNDATION_SCHEMA_VERSION,
} from '../../shared/ipc/storyFoundation';
import {
  STORY_FOUNDATION_FILENAME,
  StoryFoundationRepository,
  StoryFoundationRepositoryError,
} from '../storyFoundationRepository';

const temporaryRoots: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-story-foundation-'));
  temporaryRoots.push(root);
  return root;
}

function repository(projectPath: string): StoryFoundationRepository {
  let sequence = 0;
  return new StoryFoundationRepository(
    projectPath,
    () => new Date('2026-09-09T12:00:00.000Z'),
    () => `id-${++sequence}`,
  );
}

describe('Story Foundation project-local authored truth owner', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('exposes the exact bounded thirteen-question dossier set', () => {
    expect(STORY_FOUNDATION_QUESTIONS).toHaveLength(13);
    expect(STORY_FOUNDATION_QUESTIONS.map((question) => question.prompt)).toEqual([
      'What kind of project or story is this right now?',
      'If you can say it simply, what is it about?',
      'What do you want the reader to feel, notice, or leave with?',
      'What tone or tonal range feels right?',
      'If you have a reader in mind, who is it?',
      'How planned or exploratory do you want this project to be right now?',
      'What matters most for this project not to lose?',
      'What creative or story boundaries, red lines, or sensitivities matter here?',
      'What should Black Skies avoid assuming about this project?',
      'What are you deliberately leaving unknown or undecided?',
      'What are you hoping this project will help you discover?',
      'If this draft were working for you, what would success look like?',
      'Is there anything you want future tools to treat as guidance, not truth?',
    ]);
  });

  it('treats a missing optional sidecar as ready without gating writing', async () => {
    const projectPath = await temporaryProject();
    await expect(repository(projectPath).read('project-a')).resolves.toEqual({
      availability: 'ready',
      document: {
        schemaVersion: STORY_FOUNDATION_SCHEMA_VERSION,
        questionSetVersion: 1,
        projectId: 'project-a',
        revision: 0,
        entries: [],
      },
      questions: STORY_FOUNDATION_QUESTIONS,
      message: null,
    });
  });

  it('persists explicit blank, unknown, undecided, and answered postures as author provenance', async () => {
    const projectPath = await temporaryProject();
    const store = repository(projectPath);
    await store.setAnswer('project-a', 0, { questionId: 'project-kind', posture: 'blank', text: '' });
    await store.setAnswer('project-a', 1, { questionId: 'aboutness', posture: 'unknown', text: 'Still discovering.' });
    await store.setAnswer('project-a', 2, { questionId: 'tone', posture: 'undecided', text: '' });
    const result = await store.setAnswer('project-a', 3, {
      questionId: 'reader-experience', posture: 'answered', text: '  Quiet dread and recognition.  ',
    });

    expect(result.document.entries.map((entry) => [
      entry.questionId,
      entry.versions[0]?.posture,
      entry.versions[0]?.text,
      entry.versions[0]?.provenance,
    ])).toEqual([
      ['project-kind', 'blank', '', 'author'],
      ['aboutness', 'unknown', 'Still discovering.', 'author'],
      ['tone', 'undecided', '', 'author'],
      ['reader-experience', 'answered', 'Quiet dread and recognition.', 'author'],
    ]);
    await expect(new StoryFoundationRepository(projectPath).read('project-a')).resolves.toEqual(result);
  });

  it('preserves superseded versions and explicit revision history', async () => {
    const projectPath = await temporaryProject();
    const store = repository(projectPath);
    const first = await store.setAnswer('project-a', 0, {
      questionId: 'tone', posture: 'answered', text: 'Gothic restraint.',
    });
    const revised = await store.setAnswer('project-a', 1, {
      questionId: 'tone', posture: 'answered', text: 'Gothic restraint with dry humor.',
    });
    const entry = revised.document.entries[0]!;

    expect(entry.currentVersionId).not.toBe(first.document.entries[0]!.currentVersionId);
    expect(entry.versions).toHaveLength(2);
    expect(entry.versions[0]?.supersededAt).toBe('2026-09-09T12:00:00.000Z');
    expect(entry.versions[1]?.supersededAt).toBeNull();
    expect(entry.history.map((event) => event.action)).toEqual(['created', 'superseded', 'revised']);
  });

  it('archives and restores without deleting answers or allowing hidden revision while archived', async () => {
    const projectPath = await temporaryProject();
    const store = repository(projectPath);
    await store.setAnswer('project-a', 0, {
      questionId: 'boundaries', posture: 'answered', text: 'Do not romanticize coercion.',
    });
    const archived = await store.archiveAnswer('project-a', 1, 'boundaries');
    expect(archived.document.entries[0]?.lifecycle).toBe('archived');
    await expect(store.setAnswer('project-a', 2, {
      questionId: 'boundaries', posture: 'answered', text: 'Changed while hidden.',
    })).rejects.toMatchObject({ code: 'ARCHIVED' } satisfies Partial<StoryFoundationRepositoryError>);
    const restored = await store.restoreAnswer('project-a', 2, 'boundaries');
    expect(restored.document.entries[0]?.lifecycle).toBe('active');
    expect(restored.document.entries[0]?.versions[0]?.text).toBe('Do not romanticize coercion.');
    expect(restored.document.entries[0]?.history.map((event) => event.action)).toEqual([
      'created', 'archived', 'restored',
    ]);
  });

  it('rejects stale and concurrent mutations without losing either durable winner', async () => {
    const projectPath = await temporaryProject();
    const first = repository(projectPath);
    const second = repository(projectPath);
    const attempts = await Promise.allSettled([
      first.setAnswer('project-a', 0, { questionId: 'project-kind', posture: 'answered', text: 'Novel' }),
      second.setAnswer('project-a', 0, { questionId: 'tone', posture: 'answered', text: 'Quiet' }),
    ]);
    expect(attempts.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((result) => result.status === 'rejected')).toHaveLength(1);
    await expect(first.setAnswer('project-a', 0, {
      questionId: 'success', posture: 'answered', text: 'Stale write',
    })).rejects.toMatchObject({ code: 'STALE' } satisfies Partial<StoryFoundationRepositoryError>);
    await expect(new StoryFoundationRepository(projectPath).read('project-a')).resolves.toMatchObject({
      availability: 'ready', document: { revision: 1, entries: [{ questionId: expect.any(String) }] },
    });
  });

  it('keeps malformed or wrong-project bytes intact and reports degradation', async () => {
    const projectPath = await temporaryProject();
    const filePath = join(projectPath, STORY_FOUNDATION_FILENAME);
    await writeFile(filePath, '{not valid JSON');
    const store = repository(projectPath);

    await expect(store.read('project-a')).resolves.toMatchObject({ availability: 'degraded', document: { entries: [] } });
    await expect(store.setAnswer('project-a', 0, {
      questionId: 'aboutness', posture: 'answered', text: 'Do not overwrite.',
    })).rejects.toMatchObject({ code: 'UNAVAILABLE' } satisfies Partial<StoryFoundationRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe('{not valid JSON');

    const wrongProject = `${JSON.stringify({
      schemaVersion: STORY_FOUNDATION_SCHEMA_VERSION,
      questionSetVersion: 1,
      projectId: 'project-b',
      revision: 0,
      entries: [],
    })}\n`;
    await writeFile(filePath, wrongProject);
    await expect(store.read('project-a')).resolves.toMatchObject({ availability: 'degraded' });
    await expect(readFile(filePath, 'utf8')).resolves.toBe(wrongProject);
  });

  it('leaves the prior document intact when atomic replacement fails', async () => {
    const projectPath = await temporaryProject();
    const store = repository(projectPath);
    await store.setAnswer('project-a', 0, {
      questionId: 'tone', posture: 'answered', text: 'Quiet dread.',
    });
    const filePath = join(projectPath, STORY_FOUNDATION_FILENAME);
    const before = await readFile(filePath, 'utf8');
    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('synthetic rename failure'));

    await expect(store.setAnswer('project-a', 1, {
      questionId: 'tone', posture: 'answered', text: 'This must not replace the prior answer.',
    })).rejects.toMatchObject({ code: 'WRITE_FAILED' } satisfies Partial<StoryFoundationRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe(before);
  });

  it('rejects invalid repository inputs before writing durable state', async () => {
    const projectPath = await temporaryProject();
    const store = repository(projectPath);
    const invalid = [
      { questionId: 'not-a-question', posture: 'answered', text: 'Value' },
      { questionId: 'aboutness', posture: 'not-a-posture', text: 'Value' },
      { questionId: 'aboutness', posture: 'answered', text: '   ' },
      { questionId: 'aboutness', posture: 'blank', text: 'Not blank' },
      { questionId: 'aboutness', posture: 'answered', text: 'x'.repeat(12_001) },
    ];
    for (const input of invalid) {
      await expect(store.setAnswer('project-a', 0, input as never)).rejects.toBeInstanceOf(StoryFoundationRepositoryError);
    }
    await expect(readFile(join(projectPath, STORY_FOUNDATION_FILENAME), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('degrades structurally false history and unknown persisted fields', async () => {
    const projectPath = await temporaryProject();
    const store = repository(projectPath);
    const created = await store.setAnswer('project-a', 0, {
      questionId: 'tone', posture: 'answered', text: 'Quiet',
    });
    const filePath = join(projectPath, STORY_FOUNDATION_FILENAME);
    const invalidHistory = {
      ...created.document,
      entries: created.document.entries.map((entry) => ({
        ...entry,
        history: [...entry.history, {
          id: 'extra-event', action: 'restored', versionId: entry.currentVersionId,
          occurredAt: '2026-09-09T12:00:00.000Z',
        }],
      })),
    };
    await writeFile(filePath, `${JSON.stringify(invalidHistory)}\n`);
    await expect(store.read('project-a')).resolves.toMatchObject({ availability: 'degraded' });

    await writeFile(filePath, `${JSON.stringify({ ...created.document, unexpected: true })}\n`);
    await expect(store.read('project-a')).resolves.toMatchObject({ availability: 'degraded' });
  });
});
