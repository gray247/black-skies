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
    const css = readFileSync(resolve(process.cwd(), 'renderer/styles/app.css'), 'utf8');
    expect(css).toMatch(/\.stage19-spine\s*\{[\s\S]*?overflow-y:\s*auto;/);
    expect(css).toMatch(
      /\.stage19-spine__command-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*24rem\),\s*1fr\)\);/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?\.stage19-spine__writing-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
    expect(css).not.toMatch(/\.stage19-spine__command-grid[\s\S]{0,300}max-width:\s*24rem/);
  });
});
