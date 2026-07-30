import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..', '..', '..');

describe('Python 3.11 lane policy', () => {
  it.each([
    'scripts/run_service_truth.py',
    'scripts/verify_gauntlet.py',
  ])('%s honors PYTHON and prefers .venv311', (relativePath) => {
    const source = readFileSync(path.join(repositoryRoot, relativePath), 'utf8');

    expect(source).toContain('os.environ.get("PYTHON", "").strip()');
    expect(source).toContain('.venv311');
  });

  it('keeps service-truth pytest roots on the configured short temp boundary', () => {
    const source = readFileSync(
      path.join(repositoryRoot, 'scripts', 'run_service_truth.py'),
      'utf8',
    );

    expect(source).toContain('BLACKSKIES_TEST_TEMP_ROOT');
    expect(source).toContain('"black-skies-service-truth"');
    expect(source).not.toContain('REPO_ROOT / "codex_temp"');
  });

  it('passes app-workspace-relative test paths to the gauntlet Vitest lane', () => {
    const source = readFileSync(
      path.join(repositoryRoot, 'scripts', 'verify_gauntlet.py'),
      'utf8',
    );

    expect(source).toContain(
      '--run main/__tests__/serviceApi.test.ts renderer/__tests__/AppCritique.test.tsx renderer/__tests__/useCritique.test.ts',
    );
    expect(source).not.toContain('--run app/main/__tests__/serviceApi.test.ts');
  });
});
