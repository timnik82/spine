import { useCallback, useEffect, useRef, useState } from 'react';

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
 */
export function useExerciseTimer(totalSeconds: number, resetKey: string): ExerciseTimer {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [paused, setPausedState] = useState(false);
  const [runVersion, setRunVersion] = useState(0);

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
  }, [isRunning, paused, runVersion]);

  const restart = useCallback(() => {
    setSecondsRemaining(totalSeconds);
    setIsRunning(true);
    setRunVersion((version) => version + 1);
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

  return { secondsRemaining, isRunning, restart, toggle, setPaused };
}
