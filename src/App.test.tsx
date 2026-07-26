import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { programme, REST_SECONDS } from '@/data/programme';

/** Every repsComplete value the battery has been asked to display. */
const announcedReps: number[] = [];

vi.mock('@/components/BatteryReps', () => ({
  BatteryReps: ({ repsComplete, totalReps }: { repsComplete: number; totalReps: number }) => {
    announcedReps.push(repsComplete);
    return <div role="progressbar" aria-valuenow={repsComplete} aria-valuemax={totalReps} />;
  },
}));

const exercise = programme.find((e) => e.id === 'crescer-ate-ao-teto')!;
const DURATION_MS = (exercise.durationSec ?? 10) * 1000;

describe('battery reps stay in sync with the set counter', () => {
  beforeEach(() => {
    announcedReps.length = 0;
    vi.useFakeTimers({
      toFake: [
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('never displays more completed reps than sets actually finished', () => {
    render(<App />);

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    // Run the first set to completion, then sit through the rest screen so the
    // reducer advances to set 2 on its own.
    act(() => {
      // The crown control and the footer both start the timer; use the footer.
      screen.getAllByRole('button', { name: /iniciar/i }).at(-1)!.click();
    });
    act(() => {
      vi.advanceTimersByTime(DURATION_MS + 100);
    });
    act(() => {
      vi.advanceTimersByTime(REST_SECONDS * 1000 + 100);
    });

    // Back on the active screen for set 2: exactly one rep is done.
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
    // ...and the battery never claimed otherwise, not even for a single render.
    expect(Math.max(...announcedReps)).toBe(1);
  });
});
