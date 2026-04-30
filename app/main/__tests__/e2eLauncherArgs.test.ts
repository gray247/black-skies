import { describe, expect, it } from 'vitest';
import { buildPlaywrightArgs, normalizeForwardedArgs } from '../../../scripts/e2e-with-backend.mjs';

describe('e2e launcher boundary', () => {
  it('normalizes separator-prefixed worker args', () => {
    expect(normalizeForwardedArgs(['--', '--workers=1'])).toEqual(['--workers=1']);
    expect(normalizeForwardedArgs(['--workers=1'])).toEqual(['--workers=1']);
  });

  it('rejects explicit selectors in smoke mode', () => {
    expect(() => buildPlaywrightArgs(normalizeForwardedArgs(['gui.flows.spec.ts']), false)).toThrow(
      /smoke launcher does not accept explicit selectors/,
    );
  });

  it('allows explicit selectors in full-suite mode', () => {
    const args = buildPlaywrightArgs(normalizeForwardedArgs(['gui.flows.spec.ts']), true);
    expect(args).toContain('gui.flows.spec.ts');
    expect(args).not.toContain('dock-workspace.spec.ts');
    expect(args).not.toContain('--grep');
  });

  it('keeps default smoke selectors when only options are forwarded', () => {
    const args = buildPlaywrightArgs(normalizeForwardedArgs(['--grep', 'smoke_']), false);
    expect(args).toContain('gui.flows.spec.ts');
    expect(args).toContain('dock-workspace.spec.ts');
    expect(args).toContain('--grep');
    expect(args).toContain('smoke_');
  });
});
