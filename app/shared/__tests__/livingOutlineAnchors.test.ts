import { describe, expect, it } from 'vitest';

import { buildLivingOutlineSourceAnchor, resolveLivingOutlineAnchor } from '../livingOutlineAnchors';

describe('Living Outline source-anchor resolution', () => {
  it('keeps an unchanged passage at its exact source offsets without storing prose', async () => {
    const anchor = await buildLivingOutlineSourceAnchor('unit-a', 'alpha beta gamma', 6, 10);
    await expect(resolveLivingOutlineAnchor(anchor, 'alpha beta gamma')).resolves.toEqual({
      status: 'exact', selectionStart: 6, selectionEnd: 10,
    });
    expect(JSON.stringify(anchor)).not.toContain('alpha');
    expect(JSON.stringify(anchor)).not.toContain('beta');
    expect(JSON.stringify(anchor)).not.toContain('gamma');
  });

  it('relocates one cryptographically verified passage after surrounding prose moves', async () => {
    const anchor = await buildLivingOutlineSourceAnchor('unit-a', 'alpha beta gamma', 6, 10);
    await expect(resolveLivingOutlineAnchor(anchor, 'new opening alpha beta gamma')).resolves.toEqual({
      status: 'relocated', selectionStart: 18, selectionEnd: 22,
    });
  });

  it('supports a cursor position with no selected prose', async () => {
    const anchor = await buildLivingOutlineSourceAnchor('unit-a', 'alpha beta gamma', 6, 6);
    expect(anchor.anchorKind).toBe('position');
    await expect(resolveLivingOutlineAnchor(anchor, 'alpha beta gamma')).resolves.toEqual({
      status: 'exact', selectionStart: 6, selectionEnd: 6,
    });
  });

  it('refuses to guess when the passage is missing or context becomes ambiguous', async () => {
    const source = 'before beta after';
    const anchor = await buildLivingOutlineSourceAnchor('unit-a', source, 7, 11);
    await expect(resolveLivingOutlineAnchor(anchor, 'before gamma after')).resolves.toEqual({ status: 'unresolved' });
    await expect(resolveLivingOutlineAnchor(anchor, `new ${source} ${source}`)).resolves.toEqual({ status: 'ambiguous' });
  });

  it('resolves a substantial synthetic source within the bounded performance budget', async () => {
    const source = Array.from({ length: 20_000 }, (_, index) => `line ${index} carries distinct synthetic evidence.\n`).join('');
    const selectedText = 'line 15000 carries distinct synthetic evidence.';
    const selectionStart = source.indexOf(selectedText);
    const anchor = await buildLivingOutlineSourceAnchor(
      'unit-large', source, selectionStart, selectionStart + selectedText.length,
    );
    const moved = `A new opening.\n${source}`;
    const startedAt = performance.now();
    await expect(resolveLivingOutlineAnchor(anchor, moved)).resolves.toEqual({
      status: 'relocated',
      selectionStart: selectionStart + 15,
      selectionEnd: selectionStart + 15 + selectedText.length,
    });
    expect(performance.now() - startedAt).toBeLessThan(1_500);
  });
});
