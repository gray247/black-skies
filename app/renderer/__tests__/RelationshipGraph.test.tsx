import { render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';

import RelationshipGraph from '../components/RelationshipGraph';

const graphPayload = {
  ok: true,
  data: {
    projectId: 'proj',
    nodes: [
      { id: 'char:alice', label: 'Alice', type: 'character' },
      { id: 'char:ben', label: 'Ben', type: 'character' },
      { id: 'scene:sc_0001', label: 'Scene One', type: 'scene' },
      { id: 'scene:sc_0002', label: 'Scene Two', type: 'scene' },
    ],
    edges: [
      { from: 'char:alice', to: 'scene:sc_0001', kind: 'appearsIn' },
      { from: 'char:ben', to: 'scene:sc_0002', kind: 'appearsIn' },
    ],
  },
};

describe('RelationshipGraph', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (window as typeof window & { services?: unknown }).services = {
      getAnalyticsRelationships: vi.fn().mockResolvedValue(graphPayload),
    };
  });

  afterEach(() => {
    delete (window as typeof window & { services?: unknown }).services;
  });

  it('renders nodes and edges', async () => {
    render(<RelationshipGraph projectId="proj" />);
    await waitFor(() => {
      expect(screen.getByTestId('relationship-graph')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getAllByTestId('relationship-node').length).toBe(graphPayload.data.nodes.length);
    });
    expect(screen.getAllByTestId('relationship-edge').length).toBe(
      graphPayload.data.edges.length,
    );
    const [firstCharacterNode, , firstSceneNode] = screen.getAllByTestId('relationship-node');
    expect(within(firstCharacterNode).getByText('Alice')).toBeInTheDocument();
    expect(within(firstSceneNode).getByText('Scene One')).toBeInTheDocument();
    const firstEdge = screen.getAllByTestId('relationship-edge')[0];
    expect(within(firstEdge).getByText('Appears In')).toBeInTheDocument();
  });
});
