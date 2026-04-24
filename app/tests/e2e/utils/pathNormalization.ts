import path from 'node:path';

export function normalizeProjectPath(input: string | null | undefined): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const slashNormalized = trimmed.replace(/\\/g, '/');
  try {
    return path.posix.normalize(slashNormalized);
  } catch {
    return slashNormalized;
  }
}

export function projectPathContractMatch(params: {
  actual: string | null | undefined;
  expected: string | null | undefined;
}): boolean {
  const actual = normalizeProjectPath(params.actual);
  const expected = normalizeProjectPath(params.expected);
  if (!actual || !expected) {
    return false;
  }
  if (actual === expected) {
    return true;
  }
  const actualBase = path.posix.basename(actual);
  const expectedBase = path.posix.basename(expected);
  return actualBase.length > 0 && expectedBase.length > 0 && actualBase === expectedBase;
}

