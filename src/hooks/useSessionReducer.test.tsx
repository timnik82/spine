import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PREPARE_SECONDS } from '@/data/programme';
import { useSessionReducer } from './useSessionReducer';

/** Walks the preparation countdown of the exercise on screen down to zero. */
function runPrepareCountdown(dispatch: (action: { type: 'TICK' }) => void) {
  for (let second = 0; second < PREPARE_SECONDS; second += 1) {
    act(() => dispatch({ type: 'TICK' }));
  }
}

describe('session reducer', () => {
  it('drops a set completion that lands after the child left the exercise', () => {
    const { result } = renderHook(() => useSessionReducer());

    act(() => result.current[1]({ type: 'START' }));
    runPrepareCountdown(result.current[1]);
    expect(result.current[0].screen).toBe('active');

    // The navigation bar jumps to another exercise mid-run.
    act(() => result.current[1]({ type: 'SELECT_EXERCISE', index: 1 }));
    expect(result.current[0]).toMatchObject({ screen: 'intro', exerciseIndex: 1 });

    // The timer of the exercise just abandoned reports its completion late.
    act(() => result.current[1]({ type: 'ADVANCE_SET', restSeconds: 10 }));

    expect(result.current[0]).toMatchObject({
      screen: 'intro',
      exerciseIndex: 1,
      currentSet: 1,
      sideIndex: 0,
    });
  });

  it('still ends the set while the exercise is the one running', () => {
    const { result } = renderHook(() => useSessionReducer());

    // Crescer até ao teto: ten sets, so the first one closes with a rest.
    act(() => result.current[1]({ type: 'SELECT_EXERCISE', index: 1 }));
    act(() => result.current[1]({ type: 'START' }));
    runPrepareCountdown(result.current[1]);
    expect(result.current[0].screen).toBe('active');

    act(() => result.current[1]({ type: 'ADVANCE_SET', restSeconds: 10 }));

    expect(result.current[0].screen).toBe('rest');
  });

  it('leaves the exercise startable after a completion was dropped', () => {
    const { result } = renderHook(() => useSessionReducer());

    act(() => result.current[1]({ type: 'SELECT_EXERCISE', index: 1 }));
    act(() => result.current[1]({ type: 'ADVANCE_SET', restSeconds: 10 }));
    act(() => result.current[1]({ type: 'START' }));
    runPrepareCountdown(result.current[1]);

    expect(result.current[0]).toMatchObject({
      screen: 'active',
      exerciseIndex: 1,
      currentSet: 1,
    });
  });

  it('skips the rest screen when that exercise is set to zero seconds', () => {
    const { result } = renderHook(() => useSessionReducer());

    act(() => result.current[1]({ type: 'SELECT_EXERCISE', index: 1 }));
    act(() => result.current[1]({ type: 'START' }));
    runPrepareCountdown(result.current[1]);

    act(() => result.current[1]({ type: 'ADVANCE_SET', restSeconds: 0 }));

    expect(result.current[0]).toMatchObject({
      screen: 'prepare',
      currentSet: 2,
      sideIndex: 0,
      countdownSecondsRemaining: PREPARE_SECONDS,
    });
  });
});
