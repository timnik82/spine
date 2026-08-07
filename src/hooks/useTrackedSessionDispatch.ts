import {
  useCallback,
  useLayoutEffect,
  useRef,
  type Dispatch,
} from 'react';
import { captureSessionAction } from '@/lib/analytics';
import type { SessionAction, SessionState } from '@/hooks/useSessionReducer';

/**
 * Wraps the session reducer dispatch so funnel events are captured from the
 * pre-transition state. Capture runs before dispatch so abandoned mid-action
 * state still matches what the child was looking at.
 *
 * The returned dispatch keeps useReducer's stable identity: state is read from
 * a ref so effects that depend on `dispatch` (e.g. the timed auto-advance hold)
 * are not cleared and re-scheduled on every session update. The ref is updated
 * in useLayoutEffect so discarded concurrent renders cannot poison capture.
 */
export function useTrackedSessionDispatch(
  state: SessionState,
  dispatch: Dispatch<SessionAction>
): Dispatch<SessionAction> {
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  return useCallback(
    (action: SessionAction) => {
      captureSessionAction(stateRef.current, action);
      dispatch(action);
    },
    [dispatch]
  );
}
