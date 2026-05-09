import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DraftEditor from '../DraftEditor';

const sampleSceneMarkdown = `---
id: sc_0001
slug: basement-pulse
title: Basement Pulse
pov: Mara Ibarra
---
Mara Ibarra enters Basement Pulse and maps the sealed corridor.`;

describe('DraftEditor', () => {
  it('renders the sample scene title and body', async () => {
    render(
      <DraftEditor
        value={sampleSceneMarkdown}
        readOnly
        placeholder="Draft body placeholder"
      />,
    );

    const title = await screen.findByText(/title:\s*Basement Pulse/i);
    expect(title).toBeTruthy();

    const bodyLine = await screen.findByText(
      /Mara Ibarra enters Basement Pulse/i,
    );
    expect(bodyLine).toBeTruthy();
  });

  it('keeps the editor shell full-height so the preview can occupy a visible viewport', () => {
    const { container } = render(
      <DraftEditor
        value={sampleSceneMarkdown}
        readOnly
        placeholder="Draft body placeholder"
      />,
    );

    expect(container.querySelector('.draft-editor')).toHaveStyle({ minHeight: '100%' });
  });

  it('applies fallback accessibility metadata when no labels are provided', async () => {
    const { container } = render(
      <DraftEditor
        value=""
        placeholder="Draft body placeholder"
      />,
    );

    const textbox = await screen.findByRole('textbox', { name: 'Draft editor' });
    expect(textbox).toHaveAttribute('aria-label', 'Draft editor');

    const scroller = container.querySelector<HTMLDivElement>('.cm-scroller');
    expect(scroller).not.toBeNull();
    expect(scroller).toHaveAttribute('role', 'region');
    expect(scroller).toHaveAttribute('aria-label', 'Draft editor');
    expect(scroller).toHaveAttribute('tabindex', '0');

    scroller?.focus();
    fireEvent.focus(scroller as Element);

    expect(document.activeElement).toBe(textbox);
  });

  it('honors labelled-by and described-by attributes', async () => {
    const { container } = render(
      <div>
        <h3 id="scene-title">Scene: Basement Pulse</h3>
        <p id="scene-meta">Scene metadata for accessibility.</p>
        <DraftEditor
          value=""
          placeholder="Draft body placeholder"
          ariaLabel={null}
          ariaLabelledBy="scene-title"
          ariaDescribedBy="scene-meta"
        />
      </div>,
    );

    const textbox = await screen.findByRole('textbox', { name: 'Scene: Basement Pulse' });
    expect(textbox).not.toHaveAttribute('aria-label', 'Draft editor');
    expect(textbox).toHaveAttribute('aria-labelledby', 'scene-title');
    expect(textbox).toHaveAttribute('aria-describedby', 'scene-meta');

    const scroller = container.querySelector<HTMLDivElement>('.cm-scroller');
    expect(scroller).not.toBeNull();
    expect(scroller).toHaveAttribute('aria-labelledby', 'scene-title');
    expect(scroller).toHaveAttribute('aria-describedby', 'scene-meta');
  });
});
