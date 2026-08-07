import { useCallback, type Dispatch } from 'react';
import {
  captureSessionAction,
  type SessionAction,
} from '@/lib/analytics';
import type { SessionState } from '@/hooks/useSessionReducer';

/**
 * Wraps the session reducer dispatch so funnel events are captured from the
 * pre-transition state. Capture runs before dispatch so abandoned mid-action
 * state still matches what the child was looking at.
 */
export function useTrackedSessionDispatch(
  state: SessionState,
  dispatch: Dispatch<SessionAction>
): Dispatch<SessionAction> {
  return useCallback(
    (action: SessionAction) => {
      captureSessionAction(state, action);
      dispatch(action);
    },
    [dispatch, state]
  );
}
