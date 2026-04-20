import { describe, expect, it } from 'vitest';

import { resolveSceneDraftText } from '../hooks/useCritique';

describe('resolveSceneDraftText', () => {
  it('prefers draft edits over project drafts', () => {
    const text = resolveSceneDraftText(
      'sc_0001',
      { sc_0001: ' Edited override text ' },
      { sc_0001: 'Original draft text' },
    );
    expect(text).toBe('Edited override text');
  });

  it('falls back to project draft when no edit exists', () => {
    const text = resolveSceneDraftText('sc_0001', {}, { sc_0001: '  Original draft text  ' });
    expect(text).toBe('Original draft text');
  });
});
