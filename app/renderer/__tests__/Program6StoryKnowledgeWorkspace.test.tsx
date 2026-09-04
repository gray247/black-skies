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
  unitMetrics: {
    nl_01: { wordCount: 90, sentenceCount: 6, paragraphCount: 3, dialogueRatio: 0.1 },
    nl_02: { wordCount: 180, sentenceCount: 9, paragraphCount: 5, dialogueRatio: 0.25 },
    nl_03: { wordCount: 120, sentenceCount: 7, paragraphCount: 4, dialogueRatio: 0 },
    nl_04: { wordCount: 150, sentenceCount: 8, paragraphCount: 4, dialogueRatio: 0.4 },
  },
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

    expect(screen.getByText('Signals are saved story concerns or observations the author chooses to keep track of. They remain advisory and never change prose or canon.')).toBeVisible();
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

  it('collects a planned author emotion point without claiming to analyze prose', async () => {
    const user = userEvent.setup();
    const onEmotionRecordCreate = vi.fn();
    render(
      <Program6StoryKnowledgeWorkspace
        project={project}
        generation={1}
        document={documentWithSignal('current')}
        onAuthorRecordCreate={onEmotionRecordCreate}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Emotion$/ }));

    expect(screen.getByText(/No AI reading happens here/i)).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Emotion point story section'), 'nl_02');
    await user.type(screen.getByLabelText('Emotion point label'), 'guarded hope');
    await user.selectOptions(screen.getByLabelText('Emotion point intensity'), 'high');
    await user.type(screen.getByLabelText('Emotion point subject'), 'Mara');
    await user.click(screen.getByRole('button', { name: 'Save emotion point' }));

    expect(onEmotionRecordCreate).toHaveBeenCalledWith({
      kind: 'emotion-graph',
      unitId: 'nl_02',
      lane: 'planned',
      label: 'guarded hope',
      intensity: 'high',
      subjectLabel: 'Mara',
    });
  });

  it('collects author chronology, pacing intent, and pressure without inventing observations', async () => {
    const user = userEvent.setup();
    const onAuthorRecordCreate = vi.fn();
    render(
      <Program6StoryKnowledgeWorkspace
        project={project}
        generation={1}
        document={documentWithSignal('current')}
        onAuthorRecordCreate={onAuthorRecordCreate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Timeline$/ }));
    expect(screen.getByText('No author-entered story-world events are available.')).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Timeline event story section'), 'nl_02');
    await user.type(screen.getByLabelText('Timeline event label'), 'Mara finds the letter');
    await user.clear(screen.getByLabelText('Timeline story-world order'));
    await user.type(screen.getByLabelText('Timeline story-world order'), '4');
    await user.selectOptions(screen.getByLabelText('Timeline certainty'), 'disputed');
    await user.click(screen.getByRole('button', { name: 'Save timeline event' }));

    await user.click(screen.getByRole('button', { name: /^Pacing$/ }));
    await user.selectOptions(screen.getByLabelText('Pacing intent story section'), 'nl_03');
    await user.selectOptions(screen.getByLabelText('Pacing intended tempo'), 'fast');
    await user.click(screen.getByRole('button', { name: 'Save pacing intent' }));

    await user.click(screen.getByRole('button', { name: /^Pressure$/ }));
    expect(screen.getByText('No source-linked pressure observations are available.')).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Pressure point story section'), 'nl_04');
    await user.selectOptions(screen.getByLabelText('Pressure point lane'), 'observed');
    await user.selectOptions(screen.getByLabelText('Pressure point dimension'), 'constraint');
    await user.selectOptions(screen.getByLabelText('Pressure point band'), 'very-high');
    await user.click(screen.getByRole('button', { name: 'Save pressure point' }));

    expect(onAuthorRecordCreate).toHaveBeenNthCalledWith(1, {
      kind: 'timeline-event', unitId: 'nl_02', label: 'Mara finds the letter', storyWorldOrder: 4, temporalState: 'disputed',
    });
    expect(onAuthorRecordCreate).toHaveBeenNthCalledWith(2, {
      kind: 'pacing-intent', unitId: 'nl_03', tempo: 'fast',
    });
    expect(onAuthorRecordCreate).toHaveBeenNthCalledWith(3, {
      kind: 'pressure-point', unitId: 'nl_04', lane: 'observed', dimension: 'constraint', band: 'very-high',
    });
  });
});
