import { useEffect, useRef } from 'react';
import type { Screen } from './useSessionReducer';

export function useTimer(
  screen: Screen,
  paused: boolean,
  dispatch: (action: { type: 'PREPARE_TICK' } | { type: 'REST_TICK' }) => void
) {
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    if (screen !== 'prepare' && screen !== 'rest') return;
    if (paused) return;

    const id = setInterval(() => {
      dispatchRef.current({
        type: screen === 'prepare' ? 'PREPARE_TICK' : 'REST_TICK',
      });
    }, 1000);

    return () => clearInterval(id);
  }, [screen, paused]);
}
