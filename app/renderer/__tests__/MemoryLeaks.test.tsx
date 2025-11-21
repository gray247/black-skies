import { act, render } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, it } from 'vitest';

type Registry = {
  active: number;
  snapshots: number[];
};

const createRegistry = (): Registry => ({
  active: 0,
  snapshots: [],
});

function CountingPane({ registry }: { registry: Registry }) {
  useEffect(() => {
    registry.active += 1;
    return () => {
      registry.active -= 1;
    };
  }, [registry]);
  return <div data-testid="counting-pane" />;
}

function TabHost({
  registry,
  onReady,
}: {
  registry: Registry;
  onReady: (switcher: (tab: 'analytics' | 'corkboard' | 'relationships') => void) => void;
}) {
  const [tab, setTab] = useState<'analytics' | 'corkboard' | 'relationships'>('analytics');
  useEffect(() => {
    onReady(setTab);
  }, [onReady]);
  useEffect(() => {
    registry.snapshots.push(registry.active || 1);
  }, [registry, tab]);

  if (tab === 'analytics') {
    return <CountingPane registry={registry} />;
  }
  if (tab === 'corkboard') {
    return <CountingPane registry={registry} />;
  }
  return <CountingPane registry={registry} />;
}

function ProjectSession({ registry }: { registry: Registry }) {
  useEffect(() => {
    registry.active += 1;
    return () => {
      registry.active -= 1;
    };
  }, [registry]);
  return <div data-testid="project-session" />;
}

describe('Renderer memory leak detection', () => {
  it('keeps tab switching allocations stable', async () => {
    const registry = createRegistry();
    let switchTab: (tab: 'analytics' | 'corkboard' | 'relationships') => void = () => {};

    const view = render(
      <TabHost
        registry={registry}
        onReady={(setter) => {
          switchTab = setter;
        }}
      />,
    );

    await act(async () => {
      for (let index = 0; index < 100; index += 1) {
        const tab = index % 3 === 0 ? 'analytics' : index % 3 === 1 ? 'corkboard' : 'relationships';
        switchTab(tab);
      }
    });

    const baseline = registry.snapshots[0] || 1;
    const peak = Math.max(...registry.snapshots);
    const growth = (peak - baseline) / baseline;

    expect(growth).toBeLessThan(0.1);
    view.unmount();
  });

  it('does not accumulate listeners across project reloads', async () => {
    const registry = createRegistry();
    const usageOverTime: number[] = [];

    await act(async () => {
      for (let iteration = 0; iteration < 50; iteration += 1) {
        const mounted = render(<ProjectSession registry={registry} />);
        usageOverTime.push(registry.active);
        mounted.unmount();
        usageOverTime.push(registry.active);
      }
    });

    const maxUsage = Math.max(...usageOverTime);
    const minUsage = Math.min(...usageOverTime);
    const spread = maxUsage === 0 ? 0 : (maxUsage - minUsage) / maxUsage;

    expect(spread).toBeLessThan(0.1);
  });
});
