import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildMarkdownExportArtifact,
  destinationExists,
  MarkdownExportError,
  normalizeSelectedMarkdownPath,
  renderMarkdownTitle,
  suggestMarkdownFilename,
  writeMarkdownAtomic,
} from '../projectSpineMarkdownExport';

const temporaryRoots: string[] = [];

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-markdown-export-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Project Spine Markdown export', () => {
  it('renders deterministic exact bytes in authoritative order without front matter', () => {
    const artifact = buildMarkdownExportArtifact({
      projectId: 'proj_export',
      projectTitle: 'Night #\nSky',
      generation: 3,
      revision: 8,
      units: [
        {
          id: 'unit_empty',
          title: '\t',
          order: 2,
          markdown: '---\nid: unit_empty\ntitle: ""\norder: 2\n---\n \t \n',
        },
        {
          id: 'unit_open',
          title: '*Start*',
          order: 1,
          markdown: '---\r\nid: unit_open\r\ntitle: "*Start*"\r\norder: 1\r\n---\r\nAlpha\r\n\r\n',
        },
      ],
    });

    expect(artifact.markdown).toBe(
      '# Night \\# Sky\n\n## \\*Start\\*\n\nAlpha\n\n## Untitled\n',
    );
    expect(artifact.bytes.equals(Buffer.from(artifact.markdown, 'utf8'))).toBe(true);
    expect(artifact.bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))).toBe(false);
    expect(artifact.bytes.includes(0x0d)).toBe(false);
    expect(artifact.orderedUnitIds).toEqual(['unit_open', 'unit_empty']);
    expect(artifact.unitCount).toBe(2);
    expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(artifact.sourceSnapshotFingerprint).toMatch(/^[a-f0-9]{64}$/);

    const repeated = buildMarkdownExportArtifact({
      projectId: 'proj_export',
      projectTitle: 'Night #\nSky',
      generation: 3,
      revision: 8,
      units: [
        {
          id: 'unit_empty',
          title: '\t',
          order: 2,
          markdown: '---\nid: unit_empty\ntitle: ""\norder: 2\n---\n \t \n',
        },
        {
          id: 'unit_open',
          title: '*Start*',
          order: 1,
          markdown: '---\r\nid: unit_open\r\ntitle: "*Start*"\r\norder: 1\r\n---\r\nAlpha\r\n\r\n',
        },
      ],
    });
    expect(repeated).toEqual(artifact);
  });

  it('renders an empty manuscript and escapes only the governed title syntax', () => {
    expect(renderMarkdownTitle(' A\t`B` & C! ', 'fallback')).toBe('A \\`B\\` \\& C\\!');
    expect(buildMarkdownExportArtifact({
      projectId: 'empty',
      projectTitle: '   ',
      generation: 1,
      revision: 1,
      units: [],
    }).markdown).toBe('# Untitled Project\n');
  });

  it.each([
    ['Story: First/Last', 'Story_ First_Last.md'],
    ['CON', 'manuscript.md'],
    ['con.notes', 'manuscript.md'],
    ['  .  ', 'manuscript.md'],
    ['星の夜', '星の夜.md'],
  ])('suggests a deterministic Windows-safe filename for %s', (title, expected) => {
    expect(suggestMarkdownFilename(title)).toBe(expected);
  });

  it('caps suggested filename stems at 120 Unicode code points', () => {
    const suggestion = suggestMarkdownFilename('🌌'.repeat(140));
    expect(Array.from(suggestion.slice(0, -3))).toHaveLength(120);
    expect(suggestion.endsWith('.md')).toBe(true);
  });

  it('normalizes exactly one Markdown extension and rejects unsafe edited names', () => {
    expect(normalizeSelectedMarkdownPath('C:\\exports\\Draft.MD.md')).toMatch(/Draft\.md$/);
    expect(normalizeSelectedMarkdownPath('C:\\exports\\Draft.txt')).toMatch(/Draft\.txt\.md$/);
    for (const unsafe of [
      'C:\\exports\\.md',
      'C:\\exports\\CON.md',
      `C:\\exports\\${'a'.repeat(121)}.md`,
    ]) {
      expect(() => normalizeSelectedMarkdownPath(unsafe)).toThrow(MarkdownExportError);
    }
  });

  it('writes exact bytes atomically and replaces only the selected file', async () => {
    const root = await temporaryRoot();
    const target = join(root, 'manuscript.md');
    await writeFile(target, 'old\n', 'utf8');
    expect(await destinationExists(target)).toBe(true);

    const bytes = Buffer.from('# New\n', 'utf8');
    await writeMarkdownAtomic(target, bytes, true);

    expect(await readFile(target)).toEqual(bytes);
    expect((await readdir(root)).filter((entry) => entry.endsWith('.tmp'))).toEqual([]);
    expect(await destinationExists(join(root, 'missing.md'))).toBe(false);
  });

  it('contains write failure and removes any temporary file', async () => {
    const root = await temporaryRoot();
    const missingParent = join(root, 'missing', 'manuscript.md');

    await expect(writeMarkdownAtomic(missingParent, Buffer.from('text\n'), false)).rejects.toMatchObject({
      code: 'EXPORT_FAILED',
    });
    expect(await readdir(root)).toEqual([]);
  });

  it('never replaces an unconfirmed destination created after selection', async () => {
    const root = await temporaryRoot();
    const target = join(root, 'raced.md');
    await writeFile(target, 'appeared later\n', 'utf8');

    await expect(writeMarkdownAtomic(target, Buffer.from('new\n'), false)).rejects.toMatchObject({
      code: 'EXPORT_FAILED',
    });
    expect(await readFile(target, 'utf8')).toBe('appeared later\n');
    expect((await readdir(root)).filter((entry) => entry.endsWith('.tmp'))).toEqual([]);
  });
});
