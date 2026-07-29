import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Channel for the sub-second countdown value (issue #11): the timer writes
 * the precise remaining time here on every animation frame, so a dial can
 * sweep its hand without a React render.
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
  const lastPromotedRef = useRef(Math.ceil(totalSeconds));

  // Restart on a new run or an exercise switch, before anything renders.
  const currentRun = useRef({ key: resetKey, total: totalSeconds });
  if (currentRun.current.key !== resetKey || currentRun.current.total !== totalSeconds) {
    currentRun.current = { key: resetKey, total: totalSeconds };
    fractionalRef.current = totalSeconds;
    lastPromotedRef.current = Math.ceil(totalSeconds);
    setSecondsRemaining(totalSeconds);
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

      const whole = Math.ceil(next);
      if (whole !== lastPromotedRef.current) {
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
  // value out so the dial never shows a stale position.
  useEffect(() => {
    if (!isRunning || paused) {
      frameSink?.current?.(fractionalRef.current);
    }
  });

  const restart = useCallback(() => {
    fractionalRef.current = totalSeconds;
    lastPromotedRef.current = Math.ceil(totalSeconds);
    setSecondsRemaining(totalSeconds);
    setIsRunning(true);
    setRunVersion((version) => version + 1);
  }, [totalSeconds]);

  const toggle = useCallback(() => {
    if (fractionalRef.current <= 0) {
      fractionalRef.current = totalSeconds;
      lastPromotedRef.current = Math.ceil(totalSeconds);
      setSecondsRemaining(totalSeconds);
      frameSink?.current?.(totalSeconds);
    }
    setIsRunning((running) => !running);
  }, [totalSeconds, frameSink]);

  const setPaused = useCallback((p: boolean) => {
    setPausedState(p);
  }, []);

  return { secondsRemaining, isRunning, restart, toggle, setPaused };
}
