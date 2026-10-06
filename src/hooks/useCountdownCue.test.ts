import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdownCue } from './useCountdownCue';

const { playCountdownBeep } = vi.hoisted(() => ({
  playCountdownBeep: vi.fn(),
}));

vi.mock('@/lib/sounds', () => ({
  playCountdownBeep,
}));

function playThrough(seconds: number[], active = true) {
  const { rerender } = renderHook(
    ({ remaining, audible }) => useCountdownCue(remaining, audible),
    { initialProps: { remaining: seconds[0], audible: active } }
  );
  for (const remaining of seconds.slice(1)) {
    rerender({ remaining, audible: active });
  }
  return playCountdownBeep.mock.calls.map((call) => call[0]);
}

describe('useCountdownCue', () => {
  beforeEach(() => {
    playCountdownBeep.mockClear();
  });

  it('plays exactly four beeps at 4, 3, 2, then a higher 1 — never at zero', () => {
    expect(playThrough([10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0])).toEqual([
      'low',
      'low',
      'low',
      'high',
    ]);
  });

  it('plays four beeps on a 5-second integer rest (prepare is 3s and stays silent)', () => {
    expect(playThrough([5, 4, 3, 2, 1])).toEqual(['low', 'low', 'low', 'high']);
  });

  it('cues on the ceiling, matching the timer’s just-under-whole promotions', () => {
    expect(
      playThrough([5, 3.9997, 2.9998, 1.9996, 0.9999, 0])
    ).toEqual(['low', 'low', 'low', 'high']);
  });

  it('cues each second once however often the countdown re-renders', () => {
    expect(
      playThrough([5, 4, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0])
    ).toEqual(['low', 'low', 'low', 'high']);
  });

  it('stays silent while the countdown is not audible', () => {
    expect(playThrough([4, 3, 2, 1, 0], false)).toEqual([]);
  });

  it('does not fire for a second that was already underway when it started', () => {
    expect(playThrough([2, 1, 0])).toEqual(['high']);
  });

  it('beeps again on the next run rather than staying latched', () => {
    const { rerender } = renderHook(
      ({ remaining, active }) => useCountdownCue(remaining, active),
      { initialProps: { remaining: 4, active: true } }
    );
    rerender({ remaining: 3, active: true });
    rerender({ remaining: 2, active: true });
    rerender({ remaining: 1, active: true });
    rerender({ remaining: 0, active: true });
    rerender({ remaining: 30, active: false });
    rerender({ remaining: 30, active: true });
    rerender({ remaining: 4, active: true });
    rerender({ remaining: 3, active: true });
    rerender({ remaining: 2, active: true });
    rerender({ remaining: 1, active: true });
    rerender({ remaining: 0, active: true });

    expect(playCountdownBeep.mock.calls.map((call) => call[0])).toEqual([
      'low',
      'low',
      'high',
      'low',
      'low',
      'low',
      'high',
    ]);
  });

  it('does not beep when a finished countdown is merely re-shown', () => {
    const { rerender } = renderHook(
      ({ remaining, active }) => useCountdownCue(remaining, active),
      { initialProps: { remaining: 0, active: false } }
    );
    rerender({ remaining: 0, active: true });
    expect(playCountdownBeep).not.toHaveBeenCalled();
  });
});
