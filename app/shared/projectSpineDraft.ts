export interface ProjectSpineDraftSections {
  readonly header: string;
  readonly body: string;
}

/** Parse the same durable Markdown envelope used by Writing Studio editors. */
export function splitProjectSpineDraft(markdown: string): ProjectSpineDraftSections {
  const normalized = markdown.replace(/\r\n?/gu, '\n');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== '---') return { header: '', body: normalized };

  const closingOffset = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (closingOffset < 0) return { header: '', body: normalized };

  const closingIndex = closingOffset + 1;
  const framedBody = lines.slice(closingIndex + 1).join('\n').replace(/^(?:\n)+/u, '');
  return {
    header: `${lines.slice(0, closingIndex + 1).join('\n')}\n`,
    body: framedBody.endsWith('\n') ? framedBody.slice(0, -1) : framedBody,
  };
}

export function extractProjectSpineDraftBody(markdown: string): string {
  return splitProjectSpineDraft(markdown).body;
}
