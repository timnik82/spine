import { useCallback, useEffect, useRef, useState } from 'react';

interface ExerciseTimer {
  secondsRemaining: number;
  isRunning: boolean;
  reset: () => void;
  toggle: () => void;
  setPaused: (paused: boolean) => void;
}

export function useExerciseTimer(totalSeconds: number): ExerciseTimer {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [paused, setPausedState] = useState(false);

  // Reset when totalSeconds changes (exercise switch)
  const prevTotal = useRef(totalSeconds);
  useEffect(() => {
    if (prevTotal.current !== totalSeconds) {
      prevTotal.current = totalSeconds;
      setSecondsRemaining(totalSeconds);
      setIsRunning(false);
    }
  }, [totalSeconds]);

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
    setIsRunning(false);
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

  return { secondsRemaining, isRunning, reset, toggle, setPaused };
}
