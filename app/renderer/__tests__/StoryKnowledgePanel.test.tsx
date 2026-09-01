import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StoryKnowledgePanel from '../components/StoryKnowledgePanel';
import WritingIntelligenceCue from '../components/WritingIntelligenceCue';
import type { ActiveOutlineV1 } from '../utils/storyUnits';

const outline: ActiveOutlineV1 = {
  outlineKey: 'main',
  label: 'main',
  sourceOutlineId: 'outline-1',
  units: [{
    unitId: 'unit-1',
    sceneId: 'scene-1',
    title: 'Lantern House',
    order: 1,
    state: 'placed',
    sourceType: 'scene',
    contentPreview: 'A loaded preview',
    placement: {
      outlineKey: 'main',
      sourceOutlineId: 'outline-1',
      chapterId: null,
      order: 1,
    },
    draftStatus: 'empty',
    isAiGenerated: false,
    source: { projectPath: '/projects/project-1', sceneId: 'scene-1' },
  }],
};

describe('P6-E quiet intelligence surfaces', () => {
  it('opens a source-linked Story Knowledge detail path without claiming canon', async () => {
    render(<StoryKnowledgePanel project={null} outline={outline} activeUnit={outline.units[0]} />);
    expect(screen.getByRole('heading', { name: 'Story Knowledge' })).toBeInTheDocument();
    expect(screen.getByText(/does not assert canon/i)).toBeInTheDocument();
    await screen.getByRole('button', { name: 'Open Story Knowledge detail' }).click();
    expect(screen.getByTestId('story-knowledge-detail')).toHaveTextContent('Selected story unit: Lantern House');
  });

  it('keeps the Writing Surface cue quiet and explicit when project data is unavailable', () => {
    render(<WritingIntelligenceCue projectLoaded={false} />);
    expect(screen.getByTestId('writing-intelligence-cue')).toHaveAttribute('data-intelligence-state', 'unavailable');
    expect(screen.getByText(/Load a project/i)).toBeInTheDocument();
  });
});
