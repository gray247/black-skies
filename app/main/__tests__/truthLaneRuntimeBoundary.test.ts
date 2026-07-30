import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = path.resolve(import.meta.dirname, '..', '..', '..');

describe('truth-lane runtime boundary', () => {
  it('isolates the legacy dock truth lane from repository split-window configuration', () => {
    const source = readFileSync(
      path.join(repositoryRoot, 'scripts', 'truth-with-backend.mjs'),
      'utf8',
    );

    expect(source).toContain("'  enable_docking: true'");
    expect(source).toContain("'  experimental_split_command_workspace: false'");
    expect(source).toContain('BLACKSKIES_CONFIG_PATH: runtimeConfigPath');
  });

  it('forbids inherited provider and local-model execution', () => {
    const source = readFileSync(
      path.join(repositoryRoot, 'scripts', 'truth-with-backend.mjs'),
      'utf8',
    );

    expect(source).toContain("BLACKSKIES_MODEL_ROUTING_POLICY: 'local_only'");
    expect(source).toContain("BLACKSKIES_MODEL_ROUTER_PROVIDER_CALLS_ENABLED: '0'");
    expect(source).toContain("BLACKSKIES_LOCAL_LLM_AVAILABLE: '1'");
    expect(source).toContain('delete backendEnv.OPENAI_API_KEY');
    expect(source).toContain('delete backendEnv.BLACKSKIES_OPENAI_API_KEY');
    expect(source).toContain('delete backendEnv.BLACK_SKIES_OPENAI_API_KEY');
  });
});
