import { useEffect, useState } from 'react';

/**
 * A deliberately low-frequency count-up timer for repetition exercises.
 * Reading instructions pauses it; changing exercise resets it.
 */
export function useElapsedTimer(
  enabled: boolean,
  paused: boolean,
  resetKey: string | number
) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (!enabled || paused) return;

    const id = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1_000);

    return () => clearInterval(id);
  }, [enabled, paused, resetKey]);

  return elapsedSeconds;
}
