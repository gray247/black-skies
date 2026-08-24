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

  it('keeps imported structure review on the manuscript canvas without a nested source scroller', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');
    const view = readFileSync(resolve(import.meta.dirname, '..', 'Stage19WritingSpineView.tsx'), 'utf8');

    expect(view).toContain('Imported manuscript — structure review');
    expect(view).toContain('Read-only until accepted structure is applied.');
    expect(view).toContain('data-imported-manuscript-source="true"');
    expect(view).toContain('data-imported-proposal-id={range.id}');
    expect(view).toContain('aria-pressed={selected}');
    expect(view).not.toContain('dangerouslySetInnerHTML');
    expect(css).toMatch(/\.stage19-imported-manuscript\s*\{[\s\S]*?width:\s*min\(100%,\s*126ch\);/);
    expect(css).toMatch(/\.stage19-imported-manuscript__source\s*\{[\s\S]*?font-size:\s*19px;[\s\S]*?line-height:\s*1\.65;[\s\S]*?white-space:\s*pre-wrap;/);
    expect(css).not.toMatch(/\.stage19-imported-manuscript__source\s*\{[^}]*overflow(?:-y)?:\s*(?:auto|scroll)/);
    expect(css).toContain('.stage19-imported-manuscript__proposal.is-selected');
    expect(css).toContain('.stage19-imported-manuscript__proposal:focus-visible');
    expect(css).toContain('.stage19-spine--writing.is-focus-mode .stage19-imported-manuscript__header');
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
    expect(p3d).toMatch(/\.stage19-spine--writing \.stage19-spine__editor \.cm-content[\s\S]*?max-width:\s*126ch;/);
    expect(p3d).toMatch(/\.stage19-spine--writing \.stage19-spine__editor-card[\s\S]*?width:\s*min\(100%,\s*104rem\);/);
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
    expect(writingSlice).toMatch(/\.stage19-spine--writing \.stage19-spine__lifecycle-help,[\s\S]*?color:\s*var\(--bs-text-secondary\);/);
    expect(writingSlice).toMatch(/\.stage19-spine--writing \.stage19-ai__credential label[\s\S]*?color:\s*var\(--bs-text-secondary\);/);
    expect(writingSlice).not.toMatch(/\.stage19-spine--writing[\s\S]{0,240}color:\s*var\(--bs-text-muted\)/);

    for (const selector of [
      '.stage19-living-outline__rename button',
      '.stage19-living-outline__advanced > label',
      '.stage19-living-outline__relationship strong,',
      '.stage19-story-rail__add-menu button',
      '.stage19-story-rail__add-menu p',
      '.stage19-story-rail__menu',
      '.stage19-story-rail__dirty',
      '.stage19-story-rail__unit-rename button',
    ]) {
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(writingSlice, selector).toMatch(
        new RegExp(`${escapedSelector}[\\s\\S]{0,180}?\\{[^}]*font-size:\\s*0\\.8rem;`),
      );
    }

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
    for (const [secondary, backgrounds] of [
      ['#b9b2a6', ['#000000', '#080807', '#11100e']],
      ['#575149', ['#fbf8f1', '#f6f1e7', '#eee7dc']],
    ] as const) {
      for (const background of backgrounds) {
        const node = document.createElement('span');
        node.style.color = secondary;
        node.style.backgroundColor = background;
        node.style.fontSize = '0.8rem';
        document.body.append(node);
        const computed = getComputedStyle(node);
        expect(computed.color).toBeTruthy();
        expect(computed.backgroundColor).toBeTruthy();
        expect(computed.fontSize).toBe('0.8rem');
        expect(ratio(secondary, background)).toBeGreaterThanOrEqual(4.5);
        node.remove();
      }
    }
  });

  it('keeps the top project rail compact and bounds Note details inside the Story rail', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');

    expect(css).toMatch(/\.stage19-writing-shell__rail--left,[\s\S]*?\.stage19-writing-shell__rail--bottom\s*\{[\s\S]*?padding-bottom:\s*8rem;/);
    expect(css).not.toMatch(/\.stage19-writing-shell__rail--top[^}]*padding-bottom:\s*8rem;/);
    expect(css).toMatch(/\.stage19-spine--writing \.stage19-living-outline__advanced\s*\{[\s\S]*?max-height:\s*min\(44vh,\s*28rem\);[\s\S]*?overflow-y:\s*auto;/);
    expect(css).toMatch(/\.stage19-story-rail__unit-row:has\(\.stage19-story-rail__selection\)[\s\S]*?grid-template-columns:\s*30px 28px minmax\(0,\s*1fr\) auto auto;/);
    expect(css).toMatch(/\.stage19-note-marker-cluster__selection label[\s\S]*?grid-template-columns:\s*24px minmax\(0,\s*1fr\);/);
  });
});
