import { describe, expect, it } from 'vitest';
import { programme } from '@/data/programme';
import { sessionEventsForAction } from '@/lib/analytics';
import type { SessionState } from '@/hooks/useSessionReducer';

function state(overrides: Partial<SessionState> = {}): SessionState {
  return {
    screen: 'intro',
    exerciseIndex: 0,
    currentSet: 1,
    sideIndex: 0,
    countdownSecondsRemaining: 3,
    instructionsOpen: false,
    rating: null,
    ...overrides,
  };
}

describe('sessionEventsForAction', () => {
  it('starts a session and the first exercise together', () => {
    const events = sessionEventsForAction(state(), { type: 'START' });
    expect(events.map((e) => e.name)).toEqual([
      'session_started',
      'exercise_started',
    ]);
    expect(events[1]?.properties).toMatchObject({
      exercise_id: programme[0].id,
      exercise_index: 0,
    });
  });

  it('starts later exercises without a new session_started', () => {
    const events = sessionEventsForAction(state({ exerciseIndex: 2 }), {
      type: 'START',
    });
    expect(events.map((e) => e.name)).toEqual(['exercise_started']);
  });

  it('records rest skips only while resting', () => {
    expect(
      sessionEventsForAction(state({ screen: 'active' }), { type: 'SKIP_REST' })
    ).toEqual([]);
    expect(
      sessionEventsForAction(state({ screen: 'rest' }), { type: 'SKIP_REST' })
        .map((e) => e.name)
    ).toEqual(['rest_skipped']);
  });

  it('distinguishes leg completion from set and exercise completion', () => {
    const perSideIndex = programme.findIndex(
      (exercise) => exercise.mode === 'timer' && exercise.perSide
    );
    expect(perSideIndex).toBeGreaterThanOrEqual(0);
    const perSide = programme[perSideIndex];

    expect(
      sessionEventsForAction(
        state({
          screen: 'active',
          exerciseIndex: perSideIndex,
          sideIndex: 0,
          currentSet: 1,
        }),
        { type: 'ADVANCE_SET', restSeconds: 15 }
      ).map((e) => e.name)
    ).toEqual(['leg_completed']);

    expect(
      sessionEventsForAction(
        state({
          screen: 'active',
          exerciseIndex: perSideIndex,
          sideIndex: 1,
          currentSet: 1,
        }),
        { type: 'ADVANCE_SET', restSeconds: 15 }
      ).map((e) => e.name)
    ).toEqual(
      perSide.sets > 1 ? ['set_completed'] : ['set_completed', 'exercise_completed']
    );
  });

  it('marks repetition completions distinctly', () => {
    const repsIndex = programme.findIndex(
      (exercise) => exercise.mode === 'repetitions'
    );
    const events = sessionEventsForAction(
      state({ screen: 'active', exerciseIndex: repsIndex }),
      { type: 'COMPLETE_EXERCISE' }
    );
    expect(events).toEqual([
      expect.objectContaining({
        name: 'exercise_completed',
        properties: expect.objectContaining({ completed_via: 'repetitions' }),
      }),
    ]);
  });

  it('tracks navigation and ratings', () => {
    expect(
      sessionEventsForAction(state({ exerciseIndex: 1 }), {
        type: 'PREV_EXERCISE',
      })[0]
    ).toMatchObject({
      name: 'exercise_navigated',
      properties: { direction: 'prev', to_exercise_index: 0 },
    });

    expect(
      sessionEventsForAction(state({ screen: 'final' }), {
        type: 'RATE',
        rating: 'facil',
      })
    ).toEqual([{ name: 'session_rated', properties: { rating: 'facil' } }]);
  });

  it('ignores countdown ticks', () => {
    expect(
      sessionEventsForAction(state({ screen: 'prepare' }), { type: 'TICK' })
    ).toEqual([]);
  });
});
