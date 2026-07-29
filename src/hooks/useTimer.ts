import { useEffect, useRef } from 'react';
import type { Screen } from './useSessionReducer';

export function useTimer(
  screen: Screen,
  paused: boolean,
  dispatch: (action: { type: 'TICK' }) => void
) {
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    if (screen !== 'prepare' && screen !== 'rest') return;
    if (paused) return;

    const id = setInterval(() => {
      dispatchRef.current({ type: 'TICK' });
    }, 1000);

    return () => clearInterval(id);
  }, [screen, paused]);
}
