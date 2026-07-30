import { useEffect, useRef, useState } from 'react';

/**
 * A deliberately low-frequency count-up timer for repetition exercises.
 * Reading instructions pauses it; a new `resetKey` starts a fresh run from
 * zero, so the key has to identify the run rather than just the exercise.
 */
export function useElapsedTimer(
  enabled: boolean,
  paused: boolean,
  resetKey: string | number
) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const accumulatedMilliseconds = useRef(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    accumulatedMilliseconds.current = 0;
    startedAt.current = null;
    setElapsedSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (!enabled || paused) return;

    startedAt.current = performance.now();

    const updateElapsedTime = () => {
      const currentRunMilliseconds =
        startedAt.current === null ? 0 : performance.now() - startedAt.current;
      setElapsedSeconds(
        Math.floor(
          (accumulatedMilliseconds.current + currentRunMilliseconds) / 1_000
        )
      );
    };

    const id = setInterval(() => {
      updateElapsedTime();
    }, 1_000);

    return () => {
      clearInterval(id);
      if (startedAt.current !== null) {
        accumulatedMilliseconds.current += performance.now() - startedAt.current;
        startedAt.current = null;
        updateElapsedTime();
      }
    };
  }, [enabled, paused, resetKey]);

  return elapsedSeconds;
}
