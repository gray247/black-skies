import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { RevisionCandidateV1 } from '../../shared/ipc/revisionCandidates';
import type { RevisionItem } from '../../shared/ipc/feedbackNotes';
import { IDEATION_FIXED_CORE_QUESTIONS, type IdeationSnapshotV1 } from '../../shared/ipc/ideation';
import { STORY_FOUNDATION_QUESTIONS, type StoryFoundationSnapshotV1 } from '../../shared/ipc/storyFoundation';
import IdeasWorkspace from '../components/program7/IdeasWorkspace';
import Program7CreateDevelopWorkspace from '../components/program7/Program7CreateDevelopWorkspace';
import Program7History from '../components/program7/Program7History';
import RevisionComparison from '../components/program7/RevisionComparison';
import RevisionDesk from '../components/program7/RevisionDesk';
import StoryFoundation from '../components/program7/StoryFoundation';
import WritingRevisionDrawer from '../components/program7/WritingRevisionDrawer';

const timestamp = '2026-09-11T00:00:00.000Z';

function revisionItem(overrides: Partial<RevisionItem> = {}): RevisionItem {
  return {
    id: 'matrix-revision', projectId: 'matrix-project', unitId: 'unit-a', createdAt: timestamp,
    body: 'A source-linked author concern.', advisory: false, kind: 'revision_item', lifecycle: 'review',
    sourceKind: 'manuscript', sourceId: 'unit-a', sourceBodyFingerprint: 'body',
    provenance: { source: 'program6_finding', origin: 'manual' }, protection: { protected: false }, rechecks: [],
    ...overrides,
  };
}

function candidate(overrides: Partial<RevisionCandidateV1> = {}): RevisionCandidateV1 {
  return {
    id: 'matrix-candidate', projectId: 'matrix-project', unitId: 'unit-a',
    sourceSnapshot: { unitId: 'unit-a', bodySha256: 'body', text: 'Current source.' }, sourceAnchor: null,
    sourceBodySha256: 'body', purpose: 'Clarify the passage.', origin: 'manual',
    provenance: { origin: 'manual', source: 'author', model: null, receipt: null },
    protection: { excluded: false, class: 'ordinary' }, warnings: [], currentness: 'current',
    candidateText: 'Candidate source.', editedCandidateText: null, lifecycle: 'reviewing', history: [],
    createdAt: timestamp, updatedAt: timestamp, ...overrides,
  };
}

function foundationSnapshot(overrides: Partial<StoryFoundationSnapshotV1> = {}): StoryFoundationSnapshotV1 {
  return {
    availability: 'ready', document: { schemaVersion: 'BlackSkiesStoryFoundation v1', questionSetVersion: 1, projectId: 'matrix-project', revision: 1, entries: [] },
    questions: STORY_FOUNDATION_QUESTIONS, message: null, ...overrides,
  };
}

function ideasSnapshot(overrides: Partial<IdeationSnapshotV1> = {}): IdeationSnapshotV1 {
  return {
    availability: 'ready', document: { schemaVersion: 'BlackSkiesIdeation v1', projectId: 'matrix-project', revision: 1, seeds: [], branches: [], premiseTests: [], promotionPackages: [], aiAlternatives: [], history: [] },
    message: null, ...overrides,
  };
}

function historyProjection() {
  return { items: [], activeItems: [], historyItems: [], totalSourceItems: 0, trimmedCount: 0, limit: 100 };
}

function assertUniqueIds(container: HTMLElement): void {
  const ids = Array.from(container.querySelectorAll<HTMLElement>('[id]')).map((element) => element.id);
  expect(ids).toHaveLength(new Set(ids).size);
}

function assertNamedAndReachableControls(container: HTMLElement): void {
  for (const control of Array.from(container.querySelectorAll<HTMLElement>('button, input, select, textarea'))) {
    const name = control.getAttribute('aria-label') || control.textContent?.trim() || control.closest('label')?.textContent?.trim() ||
      (control.id ? Array.from(container.querySelectorAll<HTMLLabelElement>('label'))
        .find((label) => label.htmlFor === control.id)?.textContent?.trim() : '');
    expect(name, `${control.tagName}#${control.id} must have an accessible name`).toBeTruthy();
  }
  const positiveTabStops = Array.from(container.querySelectorAll<HTMLElement>('[tabindex]'))
    .filter((element) => Number(element.getAttribute('tabindex')) > 0);
  expect(positiveTabStops).toHaveLength(0);
}

function channel(hex: string): number[] {
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
}

function luminance(hex: string): number {
  const channels = channel(hex.replace('#', ''));
  return channels.reduce((sum, value, index) => {
    const linear = value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * ([0.2126, 0.7152, 0.0722][index] ?? 0);
  }, 0);
}

function contrast(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

describe('Program 7 accessibility and visual mechanical matrix', () => {
  it('covers every required route with named controls, unique IDs, and keyboard-safe tab stops', () => {
    const fixtures = [
      render(<Program7CreateDevelopWorkspace revisionDesk={<RevisionDesk activeItems={[revisionItem()]} historyItems={[]} onReturnToSource={() => undefined} onRecheck={() => undefined} onLifecycle={() => undefined} canResolve />} />),
      render(<RevisionDesk activeItems={[revisionItem()]} historyItems={[revisionItem({ id: 'matrix-history', lifecycle: 'resolved' })]} onReturnToSource={() => undefined} onRecheck={() => undefined} onLifecycle={() => undefined} canResolve />),
      render(<RevisionComparison candidate={candidate({ currentness: 'stale' })} canAccept />),
      render(<StoryFoundation snapshot={foundationSnapshot({ availability: 'degraded', message: 'Foundation unavailable.' })} />),
      render(<IdeasWorkspace snapshot={ideasSnapshot({ availability: 'degraded', message: 'Ideas unavailable.' })} />),
      render(<Program7History projection={historyProjection()} />),
      render(<WritingRevisionDrawer open candidate={candidate({ protection: { excluded: true, class: 'protected' } })} />),
    ];
    for (const fixture of fixtures) {
      assertUniqueIds(fixture.container);
      assertNamedAndReachableControls(fixture.container);
    }
    expect(screen.getAllByRole('alert')).toHaveLength(4);
    expect(screen.getByRole('heading', { name: 'Create / Develop' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Compare revision candidate' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByText('Content hidden by protection policy.')).toBeInTheDocument();
    expect(IDEATION_FIXED_CORE_QUESTIONS.length).toBeGreaterThan(0);
  });

  it('locks qualified dark/light contrast, no-new-light-gray, target sizing, reflow, and motion guards', () => {
    const css = readFileSync(resolve(import.meta.dirname, '..', 'styles', 'app.css'), 'utf8');
    const p7 = css.slice(css.indexOf('/* Program 7 author workspaces'));
    const pairs = [
      ['#f0ece3', '#000000'], ['#b9b2a6', '#000000'], ['#857f75', '#000000'], ['#a7f3d0', '#000000'],
      ['#24211d', '#fbf8f1'], ['#575149', '#fbf8f1'], ['#575149', '#f6f1e7'], ['#166534', '#dcfce7'],
    ] as const;
    for (const [foreground, background] of pairs) expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    expect(css).toContain('--bs-text-muted: var(--bs-text-secondary);');
    expect(css).toMatch(/\.stage19-spine label\s*\{[\s\S]*?color:\s*var\(--bs-text-secondary\);/);
    expect(css).toMatch(/\.stage19-spine__surface-notice\s*\{[\s\S]*?color:\s*var\(--bs-state-info\);/);
    expect(p7).not.toMatch(/(?:color|background(?:-color)?)\s*:\s*#(?:fff|ffffff|eee|eeeeee|d3d3d3|c0c0c0)\b/i);
    expect(p7).toContain('min-height: 44px;');
    expect(p7).toContain('white-space: pre-wrap;');
    expect(p7).toMatch(/@media\s*\(max-width:\s*720px\)/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.stage19-spine--command \*/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.stage19-writing-shell__edge/);
  });
});
