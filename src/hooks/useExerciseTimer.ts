import { useCallback, useEffect, useRef, useState } from 'react';

interface ExerciseTimer {
  secondsRemaining: number;
  isRunning: boolean;
  reset: () => void;
  start: () => void;
  toggle: () => void;
  setPaused: (paused: boolean) => void;
}

/**
 * @param resetKey identifies the run the timer currently belongs to (set,
 *   exercise, screen). When it changes the timer restarts *during render*, so
 *   consumers never observe the previous run's leftover zero alongside the new
 *   run's counters.
 */
export function useExerciseTimer(totalSeconds: number, resetKey: string): ExerciseTimer {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [paused, setPausedState] = useState(false);

  // Restart on a new run or an exercise switch, before anything renders.
  const currentRun = useRef({ key: resetKey, total: totalSeconds });
  if (currentRun.current.key !== resetKey || currentRun.current.total !== totalSeconds) {
    currentRun.current = { key: resetKey, total: totalSeconds };
    setSecondsRemaining(totalSeconds);
    setIsRunning(false);
  }

  useEffect(() => {
    if (!isRunning || paused || secondsRemaining <= 0) return;

    const startedAt = performance.now();
    const startingSeconds = secondsRemaining;
    let frameId: number;

    const updateTimer = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      const next = Math.max(0, startingSeconds - elapsed);

      setSecondsRemaining(next);

      if (next > 0) {
        frameId = requestAnimationFrame(updateTimer);
      } else {
        setIsRunning(false);
      }
    };

    frameId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, paused]);

  const reset = useCallback(() => {
    setSecondsRemaining(totalSeconds);
    setIsRunning(true);
  }, [totalSeconds]);

  const start = useCallback(() => {
    setSecondsRemaining((prev) => (prev <= 0 ? totalSeconds : prev));
    setIsRunning(true);
  }, [totalSeconds]);

  const toggle = useCallback(() => {
    setSecondsRemaining((prev) => {
      if (prev <= 0) return totalSeconds;
      return prev;
    });
    setIsRunning((running) => !running);
  }, [totalSeconds]);

  const setPaused = useCallback((p: boolean) => {
    setPausedState(p);
  }, []);

  return { secondsRemaining, isRunning, reset, start, toggle, setPaused };
}
