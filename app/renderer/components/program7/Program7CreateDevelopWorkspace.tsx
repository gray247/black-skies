import { useState, type ReactNode } from 'react';

export type Program7CreateDevelopSection = 'revision-desk' | 'story-foundation' | 'ideas' | 'history';

export interface Program7CreateDevelopWorkspaceProps {
  readonly revisionDesk?: ReactNode;
  readonly storyFoundation?: ReactNode;
  readonly ideas?: ReactNode;
  readonly history?: ReactNode;
  readonly initialSection?: Program7CreateDevelopSection;
  readonly onSectionChange?: (section: Program7CreateDevelopSection) => void;
}

const sections: readonly { readonly id: Program7CreateDevelopSection; readonly label: string; readonly description: string }[] = [
  { id: 'revision-desk', label: 'Revision Desk', description: 'Review and recheck source-linked revision work.' },
  { id: 'story-foundation', label: 'Story Foundation', description: 'Record optional author intent and project guidance.' },
  { id: 'ideas', label: 'Ideas', description: 'Explore seeds, branches, premises, and possibilities.' },
  { id: 'history', label: 'History', description: 'View a bounded projection of owner records.' },
];

function contentFor(section: Program7CreateDevelopSection, props: Program7CreateDevelopWorkspaceProps): ReactNode {
  if (section === 'revision-desk') return props.revisionDesk;
  if (section === 'story-foundation') return props.storyFoundation;
  if (section === 'ideas') return props.ideas;
  return props.history;
}

export default function Program7CreateDevelopWorkspace(props: Program7CreateDevelopWorkspaceProps): JSX.Element {
  const [activeSection, setActiveSection] = useState<Program7CreateDevelopSection>(props.initialSection ?? 'revision-desk');
  const active = sections.find((section) => section.id === activeSection) ?? sections[0];
  const content = contentFor(active.id, props);
  const selectSection = (section: Program7CreateDevelopSection) => {
    setActiveSection(section);
    props.onSectionChange?.(section);
  };

  return (
    <section className="program7-create-develop" aria-labelledby="program7-create-develop-heading" data-testid="program7-create-develop" data-writing-gate="false" data-truth-owner="parent-owned">
      <header>
        <h1 id="program7-create-develop-heading">Create / Develop</h1>
        <p>Four provisional views over existing owners. This workspace does not become a new truth owner and never blocks Command Center navigation.</p>
      </header>
      <nav aria-label="Create and Develop sections" className="program7-create-develop__nav">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-current={section.id === active.id ? 'page' : undefined}
            aria-pressed={section.id === active.id}
            onClick={() => selectSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>
      <section aria-labelledby={`program7-create-develop-${active.id}`} data-testid={`program7-create-develop-panel-${active.id}`}>
        <header>
          <h2 id={`program7-create-develop-${active.id}`}>{active.label}</h2>
          <p>{active.description}</p>
        </header>
        {content ?? <p data-testid="program7-create-develop-empty">This section is not connected yet. No change was made.</p>}
      </section>
    </section>
  );
}
