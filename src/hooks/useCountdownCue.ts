import { useEffect, useRef } from 'react';
import { playStopwatchEnd, playStopwatchTick } from '@/lib/sounds';

/** The last whole second that still earns a tick; zero gets the bell instead. */
export const TICK_FROM_SECOND = 3;

/**
 * Sounds the end of a timed run: a tick as each of the last three seconds
 * opens, then the bell the moment the countdown reaches zero.
 *
 * Cues are driven off the countdown's whole-second value rather than timers of
 * their own, so a pause, a reset or an exercise switch can never leave a beep
 * queued for a run that is already over.
 *
 * @param secondsRemaining the countdown's remaining seconds — fractional
 *   values are rounded *up*, so the cue for "3" fires while the dial still
 *   reads three.
 * @param active whether this countdown is the one on screen and audible. A
 *   run that is merely paused stops changing `secondsRemaining` on its own, so
 *   it needs no separate guard here; deliberately *not* keyed on the timer's
 *   running flag, which drops to false in the same render that delivers zero.
 */
export function useCountdownCue(secondsRemaining: number, active: boolean) {
  // The step this hook last saw, so each second cues once however often the
  // countdown re-renders. `null` means no run is being followed.
  const lastStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      lastStepRef.current = null;
      return;
    }

    const step = Math.ceil(Math.max(0, secondsRemaining));
    const previous = lastStepRef.current;
    lastStepRef.current = step;

    // First look at this run: a second that was already underway when the
    // countdown became audible has missed its moment. Seed, stay silent.
    if (previous === null || step === previous) return;

    if (step === 0) {
      playStopwatchEnd();
    } else if (step <= TICK_FROM_SECOND) {
      playStopwatchTick();
    }
  }, [secondsRemaining, active]);
}
