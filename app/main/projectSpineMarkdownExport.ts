import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const MARKDOWN_TITLE_SYNTAX = /[\\`*_[\]<>#!&~]/g;
// Windows rejects every ASCII control character in a filename.
// eslint-disable-next-line no-control-regex
const WINDOWS_INVALID_FILENAME_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f]/g;
const WINDOWS_DEVICE_NAMES = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const TERMINAL_MARKDOWN_EXTENSIONS = /(?:\.md)+$/i;
const MAX_FILENAME_STEM_CODE_POINTS = 120;

export interface MarkdownExportSourceUnit {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly markdown: string;
}

export interface MarkdownExportSourceSnapshot {
  readonly projectId: string;
  readonly projectTitle: string;
  readonly generation: number;
  readonly revision: number;
  readonly units: readonly MarkdownExportSourceUnit[];
}

export interface MarkdownExportArtifact {
  readonly markdown: string;
  readonly bytes: Buffer;
  readonly sha256: string;
  readonly sourceSnapshotFingerprint: string;
  readonly orderedUnitIds: readonly string[];
  readonly unitCount: number;
}

export interface MarkdownExportFileOperations {
  readonly open: typeof fs.open;
  readonly rename: typeof fs.rename;
  readonly link: typeof fs.link;
  readonly rm: typeof fs.rm;
}

export class MarkdownExportError extends Error {
  constructor(
    readonly code: 'EXPORT_DESTINATION_INVALID' | 'EXPORT_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'MarkdownExportError';
  }
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function collapseTitleLines(value: string): string {
  return value
    .replace(/[ \t]*(?:(?:\r\n|\r|\n|\t)+)[ \t]*/g, ' ')
    .trim();
}

export function renderMarkdownTitle(value: string, fallback: string): string {
  const normalized = collapseTitleLines(value) || fallback;
  return normalized.replace(MARKDOWN_TITLE_SYNTAX, '\\$&');
}

export function extractDurableDraftBody(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== '---') {
    return normalized;
  }
  const closingOffset = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (closingOffset < 0) {
    return normalized;
  }
  return lines.slice(closingOffset + 2).join('\n');
}

function normalizeBodyForOutput(body: string): string {
  const normalized = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (normalized.trim().length === 0) {
    return '';
  }
  return normalized.replace(/\n+$/g, '');
}

function sourceSnapshotProjection(snapshot: MarkdownExportSourceSnapshot): string {
  return JSON.stringify({
    schemaVersion: 1,
    projectId: snapshot.projectId,
    generation: snapshot.generation,
    revision: snapshot.revision,
    units: [...snapshot.units]
      .sort((left, right) => left.order - right.order)
      .map((unit) => ({
        id: unit.id,
        order: unit.order,
        title: unit.title,
        bodySha256: sha256(extractDurableDraftBody(unit.markdown)),
      })),
  });
}

export function buildMarkdownExportArtifact(
  snapshot: MarkdownExportSourceSnapshot,
): MarkdownExportArtifact {
  const orderedUnits = [...snapshot.units].sort((left, right) => left.order - right.order);
  const sections = [
    `# ${renderMarkdownTitle(snapshot.projectTitle, 'Untitled Project')}`,
    ...orderedUnits.map((unit) => {
      const heading = `## ${renderMarkdownTitle(unit.title, 'Untitled')}`;
      const body = normalizeBodyForOutput(extractDurableDraftBody(unit.markdown));
      return body ? `${heading}\n\n${body}` : heading;
    }),
  ];
  const markdown = `${sections.join('\n\n')}\n`;
  const bytes = Buffer.from(markdown, 'utf8');
  return {
    markdown,
    bytes,
    sha256: sha256(bytes),
    sourceSnapshotFingerprint: sha256(sourceSnapshotProjection(snapshot)),
    orderedUnitIds: orderedUnits.map((unit) => unit.id),
    unitCount: orderedUnits.length,
  };
}

function firstFilenameSegment(value: string): string {
  return value.split('.')[0] ?? value;
}

function isReservedFilenameStem(value: string): boolean {
  return WINDOWS_DEVICE_NAMES.test(value) || WINDOWS_DEVICE_NAMES.test(firstFilenameSegment(value));
}

function truncateCodePoints(value: string, limit: number): string {
  return Array.from(value).slice(0, limit).join('');
}

export function suggestMarkdownFilename(projectTitle: string): string {
  let stem = collapseTitleLines(projectTitle)
    .replace(WINDOWS_INVALID_FILENAME_CHARACTERS, '_');
  stem = truncateCodePoints(stem, MAX_FILENAME_STEM_CODE_POINTS).replace(/[ .]+$/g, '');
  if (!stem || isReservedFilenameStem(stem)) {
    stem = 'manuscript';
  }
  return `${stem}.md`;
}

export function normalizeSelectedMarkdownPath(selectedPath: string): string {
  if (typeof selectedPath !== 'string' || !selectedPath.trim()) {
    throw new MarkdownExportError('EXPORT_DESTINATION_INVALID', 'Choose a Markdown export destination.');
  }
  const resolved = path.resolve(selectedPath);
  const basename = path.basename(resolved);
  const existingExtensions = basename.match(TERMINAL_MARKDOWN_EXTENSIONS)?.[0] ?? '';
  const rawStem = existingExtensions ? basename.slice(0, -existingExtensions.length) : basename;
  if (
    !rawStem ||
    Array.from(rawStem).length > MAX_FILENAME_STEM_CODE_POINTS ||
    WINDOWS_INVALID_FILENAME_CHARACTERS.test(rawStem) ||
    /[ .]$/.test(rawStem) ||
    isReservedFilenameStem(rawStem)
  ) {
    throw new MarkdownExportError(
      'EXPORT_DESTINATION_INVALID',
      'Choose a Windows-safe filename with a valid Markdown extension.',
    );
  }
  return path.join(path.dirname(resolved), `${rawStem}.md`);
}

export async function destinationExists(targetPath: string): Promise<boolean> {
  try {
    const target = await fs.stat(targetPath);
    if (!target.isFile()) {
      throw new MarkdownExportError(
        'EXPORT_DESTINATION_INVALID',
        'The selected export destination is not a file.',
      );
    }
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function writeMarkdownAtomic(
  targetPath: string,
  bytes: Buffer,
  allowReplacement: boolean,
  operations: MarkdownExportFileOperations = fs,
): Promise<void> {
  const temporaryPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${randomUUID()}.tmp`,
  );
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await operations.open(temporaryPath, 'wx');
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
    if (allowReplacement) {
      await operations.rename(temporaryPath, targetPath);
    } else {
      await operations.link(temporaryPath, targetPath);
      await operations.rm(temporaryPath);
    }
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await operations.rm(temporaryPath, { force: true }).catch(() => undefined);
    if (error instanceof MarkdownExportError) {
      throw error;
    }
    throw new MarkdownExportError(
      'EXPORT_FAILED',
      error instanceof Error ? `Unable to export Markdown: ${error.message}` : 'Unable to export Markdown.',
    );
  }
}
