import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdownCue } from './useCountdownCue';

const playStopwatchTick = vi.fn();
const playStopwatchEnd = vi.fn();

vi.mock('@/lib/sounds', () => ({
  playStopwatchTick: (...args: unknown[]) => playStopwatchTick(...args),
  playStopwatchEnd: (...args: unknown[]) => playStopwatchEnd(...args),
}));

/** Runs a countdown through the hook, second by second, and reports the cues. */
function playThrough(seconds: number[], active = true) {
  const { rerender } = renderHook(
    ({ remaining }) => useCountdownCue(remaining, active),
    { initialProps: { remaining: seconds[0] } }
  );
  for (const remaining of seconds.slice(1)) {
    rerender({ remaining });
  }
  return {
    ticks: playStopwatchTick.mock.calls.length,
    ends: playStopwatchEnd.mock.calls.length,
  };
}

describe('useCountdownCue', () => {
  beforeEach(() => {
    playStopwatchTick.mockClear();
    playStopwatchEnd.mockClear();
  });

  it('ticks the last three seconds and rings once at zero', () => {
    expect(playThrough([10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])).toEqual({
      ticks: 3,
      ends: 1,
    });
  });

  it('cues on the ceiling, so the tick lands while the dial still reads that second', () => {
    // What the timer actually promotes: values a hair under the whole second.
    playThrough([5, 3.9997, 2.9998, 1.9996, 0.9999, 0]);
    expect(playStopwatchTick).toHaveBeenCalledTimes(3);
    expect(playStopwatchEnd).toHaveBeenCalledTimes(1);
  });

  it('cues each second once however often the countdown re-renders', () => {
    expect(playThrough([4, 3, 3, 3, 2, 2, 1, 1, 0, 0, 0])).toEqual({
      ticks: 3,
      ends: 1,
    });
  });

  it('stays silent while the countdown is not audible', () => {
    expect(playThrough([4, 3, 2, 1, 0], false)).toEqual({ ticks: 0, ends: 0 });
  });

  it('says nothing about a second that was already underway when it started', () => {
    // Mounting mid-second (a resume, a remount) must not fire a cue for a
    // second the child is already halfway through.
    expect(playThrough([2, 1, 0])).toEqual({ ticks: 1, ends: 1 });
  });

  it('rings again on the next run rather than staying latched at zero', () => {
    const { rerender } = renderHook(
      ({ remaining, active }) => useCountdownCue(remaining, active),
      { initialProps: { remaining: 2, active: true } }
    );
    rerender({ remaining: 1, active: true });
    rerender({ remaining: 0, active: true });
    // A fresh run: the screen goes away and comes back at full duration.
    rerender({ remaining: 30, active: false });
    rerender({ remaining: 30, active: true });
    rerender({ remaining: 2, active: true });
    rerender({ remaining: 1, active: true });
    rerender({ remaining: 0, active: true });

    expect(playStopwatchEnd).toHaveBeenCalledTimes(2);
  });

  it('does not ring when a finished countdown is merely re-shown', () => {
    const { rerender } = renderHook(
      ({ remaining, active }) => useCountdownCue(remaining, active),
      { initialProps: { remaining: 0, active: false } }
    );
    rerender({ remaining: 0, active: true });
    expect(playStopwatchEnd).not.toHaveBeenCalled();
  });
});
