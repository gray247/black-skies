import { useState } from 'react';

import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type { ActiveOutlineV1, StoryUnitV1 } from '../utils/storyUnits';

export interface StoryKnowledgePanelProps {
  readonly project: LoadedProject | null;
  readonly outline: ActiveOutlineV1;
  readonly activeUnit: StoryUnitV1 | null;
}

export default function StoryKnowledgePanel({
  project,
  outline,
  activeUnit,
}: StoryKnowledgePanelProps): JSX.Element {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const sceneCount = project?.scenes.length ?? 0;
  const recordScope = project ? 'Current project only' : 'Unavailable until a project is loaded';

  return (
    <section
      className="split-command__panel split-command__story-knowledge"
      aria-label="Story Knowledge"
      data-panel-id="story-knowledge"
      data-panel-authority="derived"
      data-panel-priority="secondary"
      data-intelligence-state="advisory"
    >
      <div className="split-command__panel-heading">
        <div>
          <h3>Story Knowledge</h3>
          <p>Source-linked workspace detail</p>
        </div>
        <span className="split-command__count" aria-label="Story Knowledge is advisory">Advisory</span>
      </div>
      <dl className="split-command__overview-grid" aria-label="Story Knowledge summary">
        <div>
          <dt>Scope</dt>
          <dd>{recordScope}</dd>
        </div>
        <div>
          <dt>Scenes</dt>
          <dd>{sceneCount || 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Outline</dt>
          <dd>{outline.units.length > 0 ? outline.label : 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Selected</dt>
          <dd>{activeUnit?.title ?? 'None selected'}</dd>
        </div>
      </dl>
      <p className="split-command__panel-note">
        Knowledge is derived from loaded project structure. It does not assert canon, infer
        quality, or change the manuscript.
      </p>
      <button
        type="button"
        className="split-command__detail-button"
        aria-expanded={detailsOpen}
        aria-controls="story-knowledge-detail"
        onClick={() => setDetailsOpen((open) => !open)}
      >
        {detailsOpen ? 'Hide Story Knowledge detail' : 'Open Story Knowledge detail'}
      </button>
      {detailsOpen ? (
        <div id="story-knowledge-detail" className="split-command__panel-note" data-testid="story-knowledge-detail">
          <strong>Current project detail</strong>
          <br />
          {activeUnit
            ? `Selected story unit: ${activeUnit.title}. Source type: ${activeUnit.sourceType}.`
            : 'Select a story unit to inspect its loaded structural detail.'}
          <br />
          {project ? 'No local inference has been requested.' : 'No project data is available.'}
        </div>
      ) : null}
    </section>
  );
}
