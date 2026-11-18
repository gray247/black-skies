export interface ProjectSpineDraftSections {
  readonly header: string;
  readonly body: string;
}

/** Parse the same durable Markdown envelope used by Writing Studio editors. */
export function splitProjectSpineDraft(markdown: string): ProjectSpineDraftSections {
  const normalized = markdown.replace(/\r\n?/gu, '\n');
  const firstLineEnd = normalized.indexOf('\n');
  if (firstLineEnd < 0 || normalized.slice(0, firstLineEnd).trim() !== '---') {
    return { header: '', body: normalized };
  }

  // Scan only the front matter. Leave the manuscript body as a source slice.
  let start = firstLineEnd + 1;
  while (start < normalized.length) {
    const lineEnd = normalized.indexOf('\n', start);
    const end = lineEnd < 0 ? normalized.length : lineEnd;
    if (normalized.slice(start, end).trim() === '---') {
      const body = normalized.slice(end + 1).replace(/^\n+/u, '');
      return {
        header: normalized.slice(0, end) + '\n',
        body: body.endsWith('\n') ? body.slice(0, -1) : body,
      };
    }
    start = end + 1;
  }
  return { header: '', body: normalized };
}

export function extractProjectSpineDraftBody(markdown: string): string {
  return splitProjectSpineDraft(markdown).body;
}
