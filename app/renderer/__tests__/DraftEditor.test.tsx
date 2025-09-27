import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import DraftEditor from '../DraftEditor';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const sampleScenePath = path.resolve(
  testDirectory,
  '../../..',
  'sample_project',
  'Esther_Estate',
  'drafts',
  'sc_0001.md',
);

describe('DraftEditor', () => {
  it('renders the sample scene title and body', async () => {
    const markdown = await fs.readFile(sampleScenePath, 'utf8');

    render(
      <DraftEditor
        value={markdown}
        readOnly
        placeholder="Draft body placeholder"
      />,
    );

    const title = await screen.findByText(/Basement Pulse/i);
    expect(title).toBeTruthy();

    const bodyLine = await screen.findByText(
      /Mara braced her shoulder against the rusted hatch/i,
    );
    expect(bodyLine).toBeTruthy();
  });
});
