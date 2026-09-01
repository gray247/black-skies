export interface WritingIntelligenceCueProps {
  readonly projectLoaded: boolean;
}

export default function WritingIntelligenceCue({ projectLoaded }: WritingIntelligenceCueProps): JSX.Element {
  return (
    <aside
      className="split-command__intelligence-cue"
      aria-label="Writing intelligence cue"
      data-testid="writing-intelligence-cue"
      data-intelligence-state={projectLoaded ? 'quiet' : 'unavailable'}
    >
      <strong>Story intelligence is quiet</strong>
      <span>
        {projectLoaded
          ? 'Open Story Knowledge in Command Center when you want source-linked detail.'
          : 'Load a project to make source-linked detail available.'}
      </span>
    </aside>
  );
}
