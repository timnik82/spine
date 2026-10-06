import { useEffect, useRef } from 'react';
import { countdownBeepKindForStep } from '@/lib/countdownBeep';
import { playCountdownBeep } from '@/lib/sounds';

/**
 * Plays the four countdown beeps as remaining time crosses 4, 3, 2, then 1.
 *
 * Driven off the countdown's own remaining value — not a parallel timer — so a
 * pause, a reset or a screen change cannot leave a beep queued for a run that
 * has already ended. Fractional values are rounded *up*, so the beep for "4"
 * fires as remaining first drops through 4.0 (about four seconds left), in
 * step with the displayed second.
 *
 * @param active the countdown on screen is audible. Instructions pause the
 *   run, so they must silence the cue too. Not keyed on the timer's running
 *   flag: that drops to false in the same render that delivers zero.
 */
export function useCountdownCue(secondsRemaining: number, active: boolean) {
  const lastStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      lastStepRef.current = null;
      return;
    }

    const step = Math.ceil(Math.max(0, secondsRemaining));
    const previous = lastStepRef.current;
    lastStepRef.current = step;

    // First look at this run: a second already underway (resume, remount)
    // has missed its moment. Seed, stay silent.
    if (previous === null || step === previous) return;

    const kind = countdownBeepKindForStep(step);
    if (kind) playCountdownBeep(kind);
  }, [secondsRemaining, active]);
}
