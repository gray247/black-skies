import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveStage19RendererRole } from '../utils/stage19RendererRole';

describe('Stage 19 dedicated renderer entry and layout contract', () => {
  it('routes the accepted Electron roles to separate dedicated hosts', () => {
    expect(resolveStage19RendererRole('primary')).toBe('writing');
    expect(resolveStage19RendererRole('secondary')).toBe('command');
    expect(resolveStage19RendererRole(undefined)).toBeNull();
  });

  it('keeps one page-level scroll owner and a responsive desktop Command Center grid', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');
    expect(css).toMatch(/\.stage19-spine\s*\{[\s\S]*?overflow-y:\s*auto;/);
    expect(css).toMatch(
      /\.stage19-spine__command-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*24rem\),\s*1fr\)\);/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?\.stage19-spine__writing-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
    expect(css).not.toMatch(/\.stage19-spine__command-grid[\s\S]{0,300}max-width:\s*24rem/);
  });

  it('locks the scoped P3-D literary canvas, responsive rails, and reduced-motion behavior', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');
    const marker = '/* Program 3 / P3-D: scoped literary Writing Studio shell. */';
    const p3d = css.slice(css.indexOf(marker));

    expect(p3d).toContain('--bs-canvas-black: #000000;');
    expect(p3d).toContain('--bs-text-primary: #e9e6df;');
    expect(p3d).toContain('--bs-accent-primary: #8e7cc3;');
    expect(p3d).toMatch(/\.stage19-spine--writing[\s\S]*?background:\s*var\(--bs-canvas-black\);/);
    expect(p3d).toMatch(/\.stage19-spine--writing \.stage19-spine__editor \.cm-scroller[\s\S]*?font-size:\s*19px;[\s\S]*?line-height:\s*1\.65;/);
    expect(p3d).toMatch(/\.stage19-spine--writing \.stage19-spine__editor \.cm-content[\s\S]*?max-width:\s*74ch;/);
    expect(p3d).toMatch(/@media\s*\(max-width:\s*1100px\)/);
    expect(p3d).toMatch(/@media\s*\(max-width:\s*720px\)/);
    expect(p3d).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition:\s*none;/);
    expect(p3d).not.toMatch(/(?:linear|radial|conic)-gradient\(/);
  });
});
