import { useCallback, useEffect, useState } from 'react';

interface ExerciseTimer {
  secondsRemaining: number;
  isRunning: boolean;
  reset: () => void;
  toggle: () => void;
}

export function useExerciseTimer(totalSeconds: number): ExerciseTimer {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || secondsRemaining <= 0) return;

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
  }, [isRunning]);

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

  return { secondsRemaining, isRunning, reset, toggle };
}
