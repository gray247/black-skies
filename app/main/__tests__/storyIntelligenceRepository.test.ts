import fs, { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  STORY_INTELLIGENCE_HISTORY_LIMIT,
  STORY_INTELLIGENCE_SCHEMA_VERSION,
  type StoryIntelligenceDocumentV1,
} from '../../shared/ipc/storyIntelligence';
import { createDefaultStoryIntelligenceDocument } from '../../shared/storyIntelligencePolicy';
import {
  STORY_INTELLIGENCE_FILENAME,
  StoryIntelligenceRepository,
  StoryIntelligenceRepositoryError,
} from '../storyIntelligenceRepository';

const temporaryRoots: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-story-intelligence-'));
  temporaryRoots.push(root);
  return root;
}

function nextDocument(projectId: string, revision: number, index = 0): StoryIntelligenceDocumentV1 {
  const now = new Date(`2026-08-31T12:00:${String(index).padStart(2, '0')}.000Z`).toISOString();
  const base = createDefaultStoryIntelligenceDocument(projectId, new Date(now));
  return {
    ...base,
    revision,
    history: revision === 0 ? [] : [{
      eventId: `event-${index}`,
      projectId,
      eventType: 'settings-updated',
      subjectId: 'settings',
      actor: 'author',
      createdAt: now,
    }],
    updatedAt: now,
  };
}

describe('Story Intelligence project-local sidecar', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('returns defaults without creating a file, then reopens a metadata-only document', async () => {
    const projectPath = await temporaryProject();
    await writeFile(join(projectPath, 'project.json'), '{"project":"unchanged"}\n');
    await writeFile(join(projectPath, 'draft.md'), 'prose remains unchanged\n');
    const repository = new StoryIntelligenceRepository(projectPath, () => new Date('2026-08-31T12:00:00.000Z'));

    await expect(repository.read('project-a')).resolves.toMatchObject({
      schemaVersion: STORY_INTELLIGENCE_SCHEMA_VERSION,
      projectId: 'project-a',
      revision: 0,
      history: [],
    });
    const saved = await repository.write('project-a', 0, nextDocument('project-a', 1));
    await expect(new StoryIntelligenceRepository(projectPath).read('project-a')).resolves.toEqual(saved);
    await expect(readFile(join(projectPath, 'project.json'), 'utf8')).resolves.toBe('{"project":"unchanged"}\n');
    await expect(readFile(join(projectPath, 'draft.md'), 'utf8')).resolves.toBe('prose remains unchanged\n');
  });

  it('rejects project mismatches and malformed data without changing the sidecar', async () => {
    const projectPath = await temporaryProject();
    const filePath = join(projectPath, STORY_INTELLIGENCE_FILENAME);
    const saved = JSON.stringify({ ...nextDocument('project-a', 1), forbiddenRawFinding: 'no' });
    await writeFile(filePath, saved);

    await expect(new StoryIntelligenceRepository(projectPath).read('project-a')).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    } satisfies Partial<StoryIntelligenceRepositoryError>);
    await expect(new StoryIntelligenceRepository(projectPath).read('project-b')).rejects.toMatchObject({
      code: 'UNAVAILABLE',
    } satisfies Partial<StoryIntelligenceRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe(saved);
  });

  it('rejects stale revisions without overwriting the current document', async () => {
    const projectPath = await temporaryProject();
    const repository = new StoryIntelligenceRepository(projectPath);
    const first = await repository.write('project-a', 0, nextDocument('project-a', 1));

    await expect(repository.write('project-a', 0, nextDocument('project-a', 1, 1))).rejects.toMatchObject({
      code: 'STALE',
    } satisfies Partial<StoryIntelligenceRepositoryError>);
    await expect(repository.read('project-a')).resolves.toEqual(first);
  });

  it('serializes concurrent writers so exactly one revision-zero writer wins', async () => {
    const projectPath = await temporaryProject();
    const first = new StoryIntelligenceRepository(projectPath);
    const second = new StoryIntelligenceRepository(projectPath);

    const results = await Promise.allSettled([
      first.write('project-a', 0, nextDocument('project-a', 1, 1)),
      second.write('project-a', 0, nextDocument('project-a', 1, 2)),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(await new StoryIntelligenceRepository(projectPath).read('project-a')).toMatchObject({ revision: 1 });
  });

  it('reports atomic replacement failures and leaves the prior file intact', async () => {
    const projectPath = await temporaryProject();
    const repository = new StoryIntelligenceRepository(projectPath);
    const first = await repository.write('project-a', 0, nextDocument('project-a', 1));
    const filePath = join(projectPath, STORY_INTELLIGENCE_FILENAME);
    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('synthetic rename failure'));

    await expect(repository.write('project-a', 1, nextDocument('project-a', 2, 2))).rejects.toMatchObject({
      code: 'WRITE_FAILED',
    } satisfies Partial<StoryIntelligenceRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe(`${JSON.stringify(first, null, 2)}\n`);
  });

  it('keeps the retention contract bounded to metadata-only history', () => {
    expect(STORY_INTELLIGENCE_HISTORY_LIMIT).toBe(200);
    expect(STORY_INTELLIGENCE_FILENAME).toBe('story-intelligence.json');
  });
});
