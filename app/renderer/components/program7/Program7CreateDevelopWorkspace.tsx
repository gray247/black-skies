import { useEffect, useRef, useState, type ReactNode } from 'react';

export type Program7CreateDevelopSection = 'revision-desk' | 'story-foundation' | 'ideas' | 'history';

export interface Program7CreateDevelopWorkspaceProps {
  readonly notice?: ReactNode;
  readonly revisionDesk?: ReactNode;
  readonly storyFoundation?: ReactNode;
  readonly ideas?: ReactNode;
  readonly history?: ReactNode;
  readonly initialSection?: Program7CreateDevelopSection;
  readonly activeSection?: Program7CreateDevelopSection;
  readonly onSectionChange?: (section: Program7CreateDevelopSection) => void;
}

const sections: readonly { readonly id: Program7CreateDevelopSection; readonly label: string }[] = [
  { id: 'revision-desk', label: 'Revision Desk' },
  { id: 'story-foundation', label: 'Story Foundation' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'history', label: 'History' },
];

function contentFor(section: Program7CreateDevelopSection, props: Program7CreateDevelopWorkspaceProps): ReactNode {
  if (section === 'revision-desk') return props.revisionDesk;
  if (section === 'story-foundation') return props.storyFoundation;
  if (section === 'ideas') return props.ideas;
  return props.history;
}

export default function Program7CreateDevelopWorkspace(props: Program7CreateDevelopWorkspaceProps): JSX.Element {
  const [localSection, setLocalSection] = useState<Program7CreateDevelopSection>(props.initialSection ?? 'revision-desk');
  const noticeRef = useRef<HTMLDivElement>(null);
  const previousNoticeText = useRef('');
  useEffect(() => {
    const text = noticeRef.current?.textContent ?? '';
    // Notice nodes are recreated by the host. Only a changed message should
    // move the viewport; typing, theme changes and unrelated renders must not.
    if (text && text !== previousNoticeText.current) {
      noticeRef.current?.scrollIntoView?.({ block: 'nearest' });
    }
    previousNoticeText.current = text;
  });
  const currentSection = props.activeSection ?? localSection;
  const active = sections.find((section) => section.id === currentSection) ?? sections[0];
  const [visited, setVisited] = useState<readonly Program7CreateDevelopSection[]>([currentSection]);
  const selectSection = (section: Program7CreateDevelopSection) => {
    setVisited(previous => previous.includes(section) ? previous : [...previous, section]);
    setLocalSection(section);
    props.onSectionChange?.(section);
  };

  return (
    <section className="program7-create-develop" aria-labelledby="program7-create-develop-heading" data-testid="program7-create-develop" data-writing-gate="false" data-truth-owner="parent-owned">
      <header>
        <h1 id="program7-create-develop-heading">Develop your story</h1>
        <p>Use Revision Desk to compare wording, Ideas to save possibilities, Story Foundation to keep your current intentions, and History to find saved decisions. Start with whichever helps you. Save unfinished notes before closing or reloading the app.</p>
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
      {[...new Set([...visited, currentSection])].map(section => (
        <section key={section} hidden={section !== active.id} aria-label={sections.find(value => value.id === section)!.label} data-testid={`program7-create-develop-panel-${section}`}>
          {section === active.id && props.notice ? <div ref={noticeRef} className="program7-create-develop__notice">{props.notice}</div> : null}
          {contentFor(section, props) ?? <p data-testid={section === active.id ? 'program7-create-develop-empty' : undefined}>This section is not connected yet. No change was made.</p>}
        </section>
      ))}
    </section>
  );
}
