import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useRef, useState } from 'react';

type Step = { id: string; locked: boolean };

function WizardHarness(): JSX.Element {
  const [steps, setSteps] = useState<Step[]>([
    { id: 'outline', locked: false },
    { id: 'draft', locked: false },
    { id: 'review', locked: true },
  ]);
  const [active, setActive] = useState(0);
  const lockRef = useRef(steps);
  useEffect(() => {
    lockRef.current = steps;
  }, [steps]);

  const advance = () => {
    setSteps((prev) =>
      prev.map((step, idx) => (idx < prev.length - 1 && idx <= active ? { ...step, locked: true } : step)),
    );
    setActive((prev) => Math.min(prev + 1, steps.length - 1));
  };
  const goBack = () => {
    if (lockRef.current[active - 1]?.locked) {
      return;
    }
    setActive((prev) => Math.max(prev - 1, 0));
  };

  const unlockPrevious = () =>
    setSteps((prev) => prev.map((step, idx) => (idx < active ? { ...step, locked: false } : step)));

  return (
    <div>
      <p data-testid="active-step">{steps[active]?.id}</p>
      <p data-testid="prev-locked">{String(lockRef.current[active - 1]?.locked ?? false)}</p>
      <button onClick={advance}>Next</button>
      <button onClick={goBack}>Prev</button>
      <button onClick={unlockPrevious}>Unlock prev</button>
    </div>
  );
}

function TimelineHarness(): JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const items = ['a', 'b', 'c'];
  return (
    <div>
      <button onClick={() => setExpanded((v) => !v)} data-testid="toggle">
        Toggle
      </button>
      <div data-testid="timeline" data-expanded={String(expanded)}>
        {expanded ? items.map((id) => <div key={id}>{id}</div>) : null}
      </div>
    </div>
  );
}

function CompanionHarness(): JSX.Element {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  return (
    <div>
      <p data-testid="status">{status}</p>
      <button onClick={() => setStatus('online')}>Go online</button>
      <button data-testid="companion-action" disabled={status === 'offline'}>
        Companion action
      </button>
    </div>
  );
}

describe('Wizard state machine behavior', () => {
  it('locks previous steps and prevents back navigation until unlocked', async () => {
    const user = userEvent.setup();
    render(<WizardHarness />);

    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Prev'));
    expect(screen.getByTestId('active-step').textContent).toBe('draft');

    await user.click(screen.getByText('Unlock prev'));
    await user.click(screen.getByText('Prev'));
    expect(screen.getByTestId('active-step').textContent).toBe('outline');
  });

  it('timeline expand/collapse remains stable across rapid toggles', async () => {
    const user = userEvent.setup();
    render(<TimelineHarness />);

    const toggle = screen.getByTestId('toggle');
    await user.click(toggle);
    await user.click(toggle);
    const timeline = screen.getByTestId('timeline');
    expect(timeline.querySelectorAll('div').length).toBeGreaterThanOrEqual(3);
    expect(timeline.getAttribute('data-expanded')).toBe('true');
  });

  it('disables companion actions when offline and reenables on reconnect', async () => {
    const user = userEvent.setup();
    render(<CompanionHarness />);
    const actionBtn = screen.getByTestId('companion-action') as HTMLButtonElement;
    expect(actionBtn.disabled).toBe(true);
    await user.click(screen.getByText('Go online'));
    expect(actionBtn.disabled).toBe(false);
  });
});
