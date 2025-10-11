export interface SplitSceneMarkdownResult {
  frontMatterLines: string[];
  bodyLines: string[];
}

export function splitSceneMarkdown(markdown: string): SplitSceneMarkdownResult {
  if (!markdown) {
    return { frontMatterLines: [], bodyLines: [] };
  }

  const lines = markdown.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return { frontMatterLines: [], bodyLines: lines };
  }

  let index = 1;
  while (index < lines.length && lines[index].trim() !== '---') {
    index += 1;
  }

  if (index >= lines.length) {
    return { frontMatterLines: lines, bodyLines: [] };
  }

  const frontMatterLines = lines.slice(0, index + 1);
  const bodyLines = lines.slice(index + 1);
  return { frontMatterLines, bodyLines };
}

export function extractSceneBody(markdown: string): string {
  const { bodyLines } = splitSceneMarkdown(markdown);
  return bodyLines.join('\n');
}

export function mergeSceneMarkdown(original: string, nextBody: string): string {
  const { frontMatterLines } = splitSceneMarkdown(original);
  const bodyLines = nextBody.split(/\r?\n/);
  if (frontMatterLines.length === 0) {
    return bodyLines.join('\n');
  }
  return [...frontMatterLines, ...bodyLines].join('\n');
}
