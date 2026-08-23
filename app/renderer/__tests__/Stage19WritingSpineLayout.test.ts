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

  it('keeps the Writing Studio shell fixed while the manuscript canvas owns long-document scrolling', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');
    expect(css).toMatch(/\.stage19-spine\s*\{[\s\S]*?overflow-y:\s*auto;/);
    expect(css).toMatch(/\.stage19-spine--writing\s*\{[\s\S]*?overflow:\s*hidden;/);
    expect(css).toMatch(/\.stage19-writing-shell__workspace\s*\{[\s\S]*?overflow:\s*hidden;/);
    expect(css).toMatch(/\.stage19-writing-shell__canvas\s*\{[\s\S]*?overflow-y:\s*auto;/);
    expect(css).toMatch(/\.stage19-writing-shell__rail--left,[\s\S]*?\.stage19-writing-shell__rail--right\s*\{[\s\S]*?height:\s*100%;/);
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
    expect(p3d).toContain('--bs-status-success: #a7f3d0;');
    expect(p3d).toContain('--bs-editor-gutter:');
    expect(p3d).toContain('.stage19-spine--writing[data-stage19-theme="light"]');
    expect(p3d).toContain('--bs-canvas-black: #fbf8f1;');
    expect(p3d).toContain('--bs-text-primary: #24211d;');
    expect(p3d).toContain('.stage19-theme-switch');
    expect(p3d).toMatch(/\.stage19-spine--writing[\s\S]*?background:\s*var\(--bs-canvas-black\);/);
    expect(p3d).toMatch(/\.stage19-spine--writing \.stage19-spine__editor \.cm-scroller[\s\S]*?font-size:\s*19px;[\s\S]*?line-height:\s*1\.65;/);
    expect(p3d).toMatch(/\.stage19-spine--writing \.stage19-spine__editor \.cm-content[\s\S]*?max-width:\s*90ch;/);
    expect(p3d).toMatch(/@media\s*\(max-width:\s*1100px\)/);
    expect(p3d).toMatch(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.stage19-writing-shell__rail--left,[\s\S]*?position:\s*static;[\s\S]*?box-shadow:\s*none;/);
    expect(p3d).toMatch(/@media\s*\(max-width:\s*720px\)/);
    expect(p3d).not.toMatch(/\.stage19-spine--writing \.stage19-spine__surface-host\s*\{\s*display:\s*none;/);
    expect(p3d).toMatch(/@media\s*\(max-width:\s*900px\)[\s\S]*?\.stage19-spine--writing \.stage19-spine__surface-host[\s\S]*?display:\s*flex;/);
    expect(p3d).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition:\s*none;/);
    expect(p3d).not.toMatch(/(?:linear|radial|conic)-gradient\(/);
    expect(p3d).not.toMatch(/#(?:8e7cc3|818cf8|a78bfa)|rgba\(129,\s*140,\s*248|rgba\(142,\s*124,\s*195/i);
  });

  it('keeps Command Center saved state and export success readable in light mode', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');

    expect(css).toContain('--bs-status-success: #166534;');
    expect(css).toMatch(
      /\.stage19-command__status \.stage19-spine__save-state--saved\s*\{[\s\S]*?color:\s*var\(--bs-status-success\);/,
    );
    expect(css).toContain('.stage19-spine--command[data-stage19-theme="light"] .stage19-spine__save-state--saved');
    expect(css).toContain('.stage19-spine--command[data-stage19-theme="light"] .stage19-spine__export-notice--success');
    expect(css).toContain('background: #dcfce7;');
  });

  it('covers the shared Slice 3 semantic states and quiet help surface', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');
    const view = readFileSync(resolve(import.meta.dirname, '..', 'Stage19WritingSpineView.tsx'), 'utf8');

    for (const token of [
      '--stage19-semantic-text',
      '--stage19-semantic-muted',
      '--stage19-semantic-success-text',
      '--stage19-semantic-warning-text',
      '--stage19-semantic-danger-text',
      '--stage19-semantic-disabled',
      '--stage19-semantic-focus',
    ]) {
      expect(css).toContain(token);
    }
    expect(css).toContain('.stage19-story-rail__help-panel');
    expect(css).toContain('.is-derived-context');
    expect(css).toContain('.is-multi-selected');
    expect(view).toContain('Story rail help');
    expect(view).toContain('Select multiple');
    expect(view).toContain('Preview only. Moving this plan never moves your written pages.');
    expect(view).toContain('Body for');
  });

  it('keeps everyday story structure in one direct-manipulation rail', () => {
    const view = readFileSync(resolve(import.meta.dirname, '..', 'Stage19WritingSpineView.tsx'), 'utf8');
    const app = readFileSync(resolve(import.meta.dirname, '..', 'Stage19WritingSpineApp.tsx'), 'utf8');

    expect(view).toContain('aria-label="Story rail"');
    expect(view).toContain('aria-label="Add story content"');
    expect(view).toContain('Unit');
    expect(view).toContain('Note');
    expect(view).toContain('Delete selected story item');
    expect(view).toContain('data-manuscript-unit-anchor="true"');
    expect(view).toContain('data-manuscript-scroll-owner="true"');
    expect(app).toContain('scrollIntoView');
    expect(view).toContain('Double-click or press F2 to rename');
    expect(view).toContain('More options for Unit');
    expect(view).not.toContain('Delete Unit');
    expect(view).not.toContain('Delete Note');
    expect(view).not.toContain('Rename Unit');
    expect(view).not.toContain('Rename Note');
    expect(view).not.toContain('Save options');
    expect(view).not.toContain('Move in story plan');
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

  it('keeps required Writing Studio context readable in both themes and at the scoped text size', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');
    const writingSlice = css.slice(css.indexOf('/* Program 3 / P3-D: scoped literary Writing Studio shell. */'));
    expect(writingSlice).toContain('.stage19-spine--writing .stage19-living-outline__count');
    expect(writingSlice).toContain('.stage19-spine--writing .stage19-story-rail__menu p');
    expect(writingSlice).toContain('color: var(--stage19-semantic-muted);');
    expect(writingSlice).toContain('font-size: 0.8rem;');
    expect(writingSlice).not.toMatch(/\.stage19-spine--writing[\s\S]{0,240}color:\s*var\(--bs-text-muted\)/);

    const luminance = (hex: string): number => {
      const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset + 1, offset + 3), 16) / 255);
      const linear = channels.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
      return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
    };
    const ratio = (foreground: string, background: string): number => {
      const light = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      return (light + 0.05) / (dark + 0.05);
    };
    for (const [canvas, secondary] of [['#000000', '#b9b2a6'], ['#fbf8f1', '#575149']] as const) {
      const node = document.createElement('span');
      node.style.color = secondary;
      node.style.backgroundColor = canvas;
      document.body.append(node);
      const computed = getComputedStyle(node);
      expect(computed.color).toBeTruthy();
      expect(computed.backgroundColor).toBeTruthy();
      expect(ratio(secondary, canvas)).toBeGreaterThanOrEqual(4.5);
      node.remove();
    }
  });
});
