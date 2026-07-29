import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Channel for the sub-second countdown value (issue #11): the timer writes
 * the precise remaining time here on every animation frame, so a dial can
 * sweep its hand without a React render.
 *
 * Ownership deliberately stays in this hook instead of moving the animation
 * loop into the stopwatch as the issue sketched: the same loop drives pause,
 * resume and the auto-advance, and splitting the clock across two places
 * would cost more than the prop drilling this ref incurs.
 */
export interface FrameSinkRef {
  current: ((fractionalSecondsRemaining: number) => void) | null;
}

interface ExerciseTimer {
  secondsRemaining: number;
  isRunning: boolean;
  /** Starts a fresh timing run from the full duration. */
  restart: () => void;
  toggle: () => void;
  setPaused: (paused: boolean) => void;
}

/**
 * @param resetKey identifies the run the timer currently belongs to (set,
 *   exercise, screen). When it changes the timer restarts *during render*, so
 *   consumers never observe the previous run's leftover zero alongside the new
 *   run's counters.
 * @param frameSink receives the precise remaining time on every animation
 *   frame. Shared state, by contrast, is only written when the displayed whole
 *   second actually changes, so the app re-renders about once a second instead
 *   of once per frame.
 */
export function useExerciseTimer(
  totalSeconds: number,
  resetKey: string,
  frameSink?: FrameSinkRef
): ExerciseTimer {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [paused, setPausedState] = useState(false);
  const [runVersion, setRunVersion] = useState(0);

  // The precise countdown. Frames write here; shared state only hears about
  // whole-second crossings.
  const fractionalRef = useRef(totalSeconds);
  const lastPromotedRef = useRef(Math.floor(totalSeconds));

  // Reset the countdown bookkeeping to the full duration: the precise value,
  // the whole-second promotion boundary (floored, to match the RAF's floor()
  // promotion), and the shared whole-second state. Shared by the render-body
  // restart, restart() and toggle() so the three can't drift apart.
  const resetCountdown = useCallback(() => {
    fractionalRef.current = totalSeconds;
    lastPromotedRef.current = Math.floor(totalSeconds);
    setSecondsRemaining(totalSeconds);
  }, [totalSeconds]);

  // Restart on a new run or an exercise switch, before anything renders.
  const currentRun = useRef({ key: resetKey, total: totalSeconds });
  if (currentRun.current.key !== resetKey || currentRun.current.total !== totalSeconds) {
    currentRun.current = { key: resetKey, total: totalSeconds };
    resetCountdown();
    setIsRunning(false);
  }

  useEffect(() => {
    if (!isRunning || paused) return;

    // Resume from the precise value, not the promoted whole second, so a
    // pause costs no drift.
    const startingSeconds = fractionalRef.current;
    if (startingSeconds <= 0) return;

    const startedAt = performance.now();
    let frameId: number;

    const updateTimer = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      const next = Math.max(0, startingSeconds - elapsed);

      fractionalRef.current = next;
      frameSink?.current?.(next);

      // Promote on the floored boundary so consumers announcing the remaining
      // whole seconds hear every value (120, 119, 118…). The final frame is
      // written unconditionally: floor(0.99) already promoted 0, but the
      // auto-advance check needs the exact zero.
      const whole = Math.floor(next);
      if (whole !== lastPromotedRef.current || next === 0) {
        lastPromotedRef.current = whole;
        setSecondsRemaining(next);
      }

      if (next > 0) {
        frameId = requestAnimationFrame(updateTimer);
      } else {
        setIsRunning(false);
      }
    };

    frameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, paused, runVersion, frameSink]);

  // A paused or freshly (re)started run emits no frames; push the current
  // value out so the dial never shows a stale position. No dependency array
  // on purpose: only the loop knows when it owns the hand, so this re-syncs
  // after every render. Post-#11 renders are rare, and the body is one call.
  useEffect(() => {
    if (!isRunning || paused) {
      frameSink?.current?.(fractionalRef.current);
    }
  });

  const restart = useCallback(() => {
    resetCountdown();
    setIsRunning(true);
    setRunVersion((version) => version + 1);
  }, [resetCountdown]);

  const toggle = useCallback(() => {
    if (fractionalRef.current <= 0) {
      resetCountdown();
      frameSink?.current?.(totalSeconds);
    }
    setIsRunning((running) => !running);
  }, [resetCountdown, frameSink]);

  const setPaused = useCallback((p: boolean) => {
    setPausedState(p);
  }, []);

  return { secondsRemaining, isRunning, restart, toggle, setPaused };
}
