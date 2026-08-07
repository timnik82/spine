import { act, renderHook } from '@testing-library/react';
import { useReducer } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useTrackedSessionDispatch } from '@/hooks/useTrackedSessionDispatch';
import {
  useSessionReducer,
  type SessionAction,
  type SessionState,
} from '@/hooks/useSessionReducer';
import * as analytics from '@/lib/analytics';

describe('useTrackedSessionDispatch', () => {
  it('keeps a stable dispatch identity across state updates', () => {
    const { result } = renderHook(() => {
      const [state, rawDispatch] = useSessionReducer();
      const dispatch = useTrackedSessionDispatch(state, rawDispatch);
      return { state, dispatch };
    });

    const firstDispatch = result.current.dispatch;

    act(() => {
      result.current.dispatch({ type: 'START' });
    });

    expect(result.current.state.screen).not.toBe('intro');
    expect(result.current.dispatch).toBe(firstDispatch);
  });

  it('captures against the pre-transition state', () => {
    const capture = vi
      .spyOn(analytics, 'captureSessionAction')
      .mockImplementation(() => {});

    const initial: SessionState = {
      screen: 'intro',
      exerciseIndex: 0,
      currentSet: 1,
      sideIndex: 0,
      countdownSecondsRemaining: 3,
      instructionsOpen: false,
      rating: null,
    };

    const { result } = renderHook(() => {
      const [state, rawDispatch] = useReducer(
        (current: SessionState, action: SessionAction): SessionState => {
          if (action.type === 'START') {
            return { ...current, screen: 'prepare' };
          }
          return current;
        },
        initial
      );
      const dispatch = useTrackedSessionDispatch(state, rawDispatch);
      return { state, dispatch };
    });

    act(() => {
      result.current.dispatch({ type: 'START' });
    });

    expect(capture).toHaveBeenCalledWith(initial, { type: 'START' });
    capture.mockRestore();
  });
});
