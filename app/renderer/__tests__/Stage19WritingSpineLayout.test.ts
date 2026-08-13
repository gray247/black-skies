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

  it('keeps one page-level scroll owner and the responsive task-focused Command canvas', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');
    expect(css).toMatch(/\.stage19-spine\s*\{[\s\S]*?overflow-y:\s*auto;/);
    expect(css).toMatch(
      /\.stage19-command-review\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(15rem,\s*22rem\);/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*840px\)[\s\S]*?\.stage19-command-review\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
    expect(css).toMatch(/\.stage19-command__workspace-switcher\s*\{[\s\S]*?overflow-x:\s*auto;/);
    expect(css).not.toContain('.stage19-spine__command-grid');
  });

  it('locks the scoped literary canvas, semantic themes, responsive rails, and reduced-motion behavior', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');
    const marker = '/* Program 3 / P3-D: scoped literary Writing Studio shell. */';
    const p3d = css.slice(css.indexOf(marker));

    expect(p3d).toContain('--bs-canvas-black: #000000;');
    expect(p3d).toContain('--bs-text-primary: #f0ece3;');
    expect(p3d).toContain('--bs-accent-primary: #c2a66a;');
    expect(p3d).toContain('.stage19-spine--writing[data-stage19-theme="light"]');
    expect(p3d).toContain('--bs-canvas-black: #fbf8f1;');
    expect(p3d).toContain('--bs-text-primary: #24211d;');
    expect(p3d).toContain('.stage19-theme-switch');
    expect(p3d).toMatch(/\.stage19-spine--writing[\s\S]*?background:\s*var\(--bs-canvas-black\);/);
    expect(p3d).toMatch(/\.stage19-spine--writing \.stage19-spine__editor \.cm-scroller[\s\S]*?font-size:\s*19px;[\s\S]*?line-height:\s*1\.65;/);
    expect(p3d).toMatch(/\.stage19-spine--writing \.stage19-spine__editor \.cm-content[\s\S]*?max-width:\s*74ch;/);
    expect(p3d).toMatch(/@media\s*\(max-width:\s*1100px\)/);
    expect(p3d).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.stage19-writing-shell__rail--left,[\s\S]*?position:\s*static;[\s\S]*?box-shadow:\s*none;/);
    expect(p3d).toMatch(/@media\s*\(max-width:\s*720px\)/);
    expect(p3d).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition:\s*none;/);
    expect(p3d).not.toMatch(/(?:linear|radial|conic)-gradient\(/);
    expect(p3d).not.toMatch(/#(?:8e7cc3|818cf8|a78bfa)|rgba\(129,\s*140,\s*248|rgba\(142,\s*124,\s*195/i);
  });

  it('keeps everyday story structure in one direct-manipulation rail', () => {
    const view = readFileSync(resolve(import.meta.dirname, '..', 'Stage19WritingSpineView.tsx'), 'utf8');

    expect(view).toContain('aria-label="Story rail"');
    expect(view).toContain('aria-label="Add to story here"');
    expect(view).toContain('Start a new written section');
    expect(view).toContain('Double-click or press F2 to rename');
    expect(view).toContain('More options for written section');
    expect(view).not.toContain('Unit title (optional)');
    expect(view).not.toContain('Selected unit title');
    expect(view).not.toContain('Create unit');
    expect(view).not.toContain('Update title');
    expect(view).not.toContain('Delete unit');
  });

  it('removes the superseded Writing-side critique result presentation', () => {
    const view = readFileSync(resolve(import.meta.dirname, '..', 'Stage19WritingSpineView.tsx'), 'utf8');
    const app = readFileSync(resolve(import.meta.dirname, '..', 'Stage19WritingSpineApp.tsx'), 'utf8');
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');

    expect(view).not.toContain('CritiqueReviewPaneView');
    expect(view).not.toContain('reviewPaneOpen');
    expect(view).not.toContain('openReviewPane');
    expect(app).not.toContain('reviewPaneOpen');
    expect(css).not.toContain('stage19-spine__review-pane');
  });
});
