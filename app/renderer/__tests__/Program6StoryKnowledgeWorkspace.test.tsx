import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Program6StoryKnowledgeWorkspace from '../components/Program6StoryKnowledgeWorkspace';
import { createDefaultStoryIntelligenceDocument } from '../../shared/storyIntelligencePolicy';
import type { DurableSignalV1, StoryIntelligenceDocumentV1 } from '../../shared/ipc/storyIntelligence';
import type { ProjectSpineProjectContext } from '../../shared/ipc/projectSpine';

const project: ProjectSpineProjectContext = {
  projectId: 'proj_northline_letters_review',
  path: '/projects/northline-letters',
  title: 'Northline Letters',
  schemaVersion: 'ProjectMetadataSchema v1',
  units: [
    { id: 'nl_01', title: 'The First Letter', displayTitle: 'The First Letter', order: 1 },
    { id: 'nl_02', title: 'The Missing Letter', displayTitle: 'The Missing Letter', order: 2 },
    { id: 'nl_03', title: 'The First Letter', displayTitle: 'The First Letter', order: 3 },
    { id: 'nl_04', title: 'The Reply', displayTitle: 'The Reply', order: 4 },
  ],
};

function signal(currentness: DurableSignalV1['currentness']): DurableSignalV1 {
  const now = '2026-09-01T12:00:00.000Z';
  return {
    schemaVersion: 'BlackSkiesStoryIntelligence v1',
    signalId: `signal-${currentness}`,
    projectId: project.projectId,
    positionRefs: [{
      projectId: project.projectId,
      sourceKind: 'story-unit',
      sourceId: 'nl_01',
      sourceRevision: 1,
      sourceFingerprint: `${project.projectId}:nl_01:fixture`,
      unitId: 'nl_01',
      orderIndex: 1,
      orderBasis: 'manuscript',
    }],
    sourceOwner: 'Program 6 review fixture',
    evidenceClass: 'planned',
    impact: 'informational',
    confidenceBand: 'low',
    currentness,
    lifecycle: 'reviewed',
    summary: 'A reviewed source-linked signal.',
    evidenceSummary: 'Review the source before taking action.',
    provenance: {
      sourceOwner: 'Program 6 review fixture',
      origin: 'deterministic',
      visibility: 'included',
      citationRequired: true,
      protectionClass: 'included',
    },
    createdAt: now,
    updatedAt: now,
  };
}

function documentWithSignal(currentness: DurableSignalV1['currentness']): StoryIntelligenceDocumentV1 {
  return {
    ...createDefaultStoryIntelligenceDocument(project.projectId, new Date('2026-09-01T12:00:00.000Z')),
    durableSignals: [signal(currentness)],
  };
}

function renderWorkspace(document: StoryIntelligenceDocumentV1, onSignalDisposition = vi.fn()) {
  render(
    <Program6StoryKnowledgeWorkspace
      project={project}
      generation={1}
      document={document}
      onSignalDisposition={onSignalDisposition}
    />,
  );
  return onSignalDisposition;
}

describe('Program 6 Story Knowledge workspace', () => {
  it('reports all source units through the production projection when eligible timeline rows are fewer', () => {
    renderWorkspace(documentWithSignal('stale'));

    const sourceUnits = screen.getByText('Source units').parentElement;
    expect(sourceUnits).toHaveTextContent('4');
    expect(screen.getByText('Source units').nextElementSibling).toHaveTextContent('4');
  });

  it('disables conversion for stale reviewed signals', async () => {
    const user = userEvent.setup();
    renderWorkspace(documentWithSignal('stale'));
    await user.click(screen.getByRole('button', { name: /^Signals$/ }));

    expect(screen.getByRole('button', { name: /^Convert$/ })).toBeDisabled();
  });

  it('keeps conversion available for current reviewed signals and routes the action', async () => {
    const user = userEvent.setup();
    const onSignalDisposition = renderWorkspace(documentWithSignal('current'));
    await user.click(screen.getByRole('button', { name: /^Signals$/ }));

    const convert = screen.getByRole('button', { name: /^Convert$/ });
    expect(convert).toBeEnabled();
    await user.click(convert);

    expect(onSignalDisposition).toHaveBeenCalledWith('signal-current', 'converted');
  });
});
