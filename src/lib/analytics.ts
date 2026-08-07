import posthog from 'posthog-js';
import {
  hasNextExercise,
  legsPerSet,
  programme,
} from '@/data/programme';
import type {
  SessionAction,
  SessionState,
} from '@/hooks/useSessionReducer';

export type { SessionAction };

export type AnalyticsEventName =
  | 'session_started'
  | 'exercise_started'
  | 'leg_completed'
  | 'set_completed'
  | 'exercise_completed'
  | 'rest_skipped'
  | 'instructions_opened'
  | 'instructions_closed'
  | 'exercise_navigated'
  | 'session_rated'
  | 'session_reset';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null | undefined>;
}

function exerciseProperties(state: SessionState) {
  const exercise = programme[state.exerciseIndex];
  return {
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    exercise_index: state.exerciseIndex,
    exercise_mode: exercise.mode,
    exercise_phase: exercise.phase,
    current_set: state.currentSet,
    total_sets: exercise.sets,
    side_index: state.sideIndex,
    legs_per_set: legsPerSet(exercise),
    screen: state.screen,
  };
}

/**
 * Pure mapping from a reducer action (and the state *before* it applies) to
 * PostHog events. Kept free of the SDK so unit tests can assert the funnel
 * without booting posthog-js.
 */
export function sessionEventsForAction(
  state: SessionState,
  action: SessionAction
): AnalyticsEvent[] {
  const exercise = programme[state.exerciseIndex];
  const base = exerciseProperties(state);

  switch (action.type) {
    case 'START': {
      const events: AnalyticsEvent[] = [
        { name: 'exercise_started', properties: base },
      ];
      if (state.exerciseIndex === 0) {
        events.unshift({
          name: 'session_started',
          properties: { exercise_count: programme.length },
        });
      }
      return events;
    }

    case 'SKIP_REST':
      return state.screen === 'rest'
        ? [{ name: 'rest_skipped', properties: base }]
        : [];

    case 'ADVANCE_SET': {
      if (state.screen !== 'active') return [];

      if (state.sideIndex + 1 < legsPerSet(exercise)) {
        return [{ name: 'leg_completed', properties: base }];
      }

      const events: AnalyticsEvent[] = [
        { name: 'set_completed', properties: base },
      ];

      if (state.currentSet >= exercise.sets) {
        events.push({
          name: 'exercise_completed',
          properties: {
            ...base,
            completed_via: 'timer',
            has_next_exercise: hasNextExercise(state.exerciseIndex),
          },
        });
      }

      return events;
    }

    case 'COMPLETE_EXERCISE':
      return [
        {
          name: 'exercise_completed',
          properties: {
            ...base,
            completed_via: 'repetitions',
            has_next_exercise: hasNextExercise(state.exerciseIndex),
          },
        },
      ];

    case 'OPEN_INSTRUCTIONS':
      return [{ name: 'instructions_opened', properties: base }];

    case 'CLOSE_INSTRUCTIONS':
      return [{ name: 'instructions_closed', properties: base }];

    case 'NEXT_EXERCISE':
      if (!hasNextExercise(state.exerciseIndex)) return [];
      return [
        {
          name: 'exercise_navigated',
          properties: {
            ...base,
            direction: 'next',
            to_exercise_index: state.exerciseIndex + 1,
          },
        },
      ];

    case 'PREV_EXERCISE':
      if (state.exerciseIndex <= 0) return [];
      return [
        {
          name: 'exercise_navigated',
          properties: {
            ...base,
            direction: 'prev',
            to_exercise_index: state.exerciseIndex - 1,
          },
        },
      ];

    case 'SELECT_EXERCISE': {
      const toIndex = Math.max(
        0,
        Math.min(programme.length - 1, action.index)
      );
      if (toIndex === state.exerciseIndex && state.screen === 'intro') {
        return [];
      }
      return [
        {
          name: 'exercise_navigated',
          properties: {
            ...base,
            direction: 'select',
            to_exercise_index: toIndex,
          },
        },
      ];
    }

    case 'RATE':
      return [
        {
          name: 'session_rated',
          properties: { rating: action.rating },
        },
      ];

    case 'RESET':
      return [
        {
          name: 'session_reset',
          properties: {
            ...base,
            had_rating: state.rating,
            from_final: state.screen === 'final',
          },
        },
      ];

    case 'TICK':
      return [];

    default: {
      // New reducer actions must get an explicit analytics case (or []).
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function isPostHogConfigured(): boolean {
  return Boolean(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN);
}

/** Fire mapped session events. No-ops when PostHog was never initialised. */
export function captureSessionAction(
  state: SessionState,
  action: SessionAction
): void {
  if (!isPostHogConfigured()) return;
  for (const event of sessionEventsForAction(state, action)) {
    posthog.capture(event.name, event.properties);
  }
}
