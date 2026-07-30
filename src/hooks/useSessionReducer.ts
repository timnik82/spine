import { useReducer } from 'react';
import {
  hasNextExercise,
  legsPerSet,
  programme,
  PREPARE_SECONDS,
  REST_SECONDS,
} from '@/data/programme';
import type { Rating } from '@/data/programme';

export type Screen = 'intro' | 'prepare' | 'active' | 'rest' | 'final';

export interface SessionState {
  screen: Screen;
  exerciseIndex: number;
  currentSet: number;
  /** Which leg of the set is running: 0 first, 1 second. Always 0 without sides. */
  sideIndex: number;
  /** Seconds left on whichever countdown screen is showing; unused elsewhere. */
  countdownSecondsRemaining: number;
  instructionsOpen: boolean;
  /** The note the child gave the session; lives only until the session ends. */
  rating: Rating | null;
}

type Action =
  | { type: 'START' }
  | { type: 'TICK' }
  | { type: 'SKIP_REST' }
  | { type: 'ADVANCE_SET' }
  | { type: 'COMPLETE_EXERCISE' }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'RATE'; rating: Rating }
  | { type: 'RESET' }
  | { type: 'OPEN_INSTRUCTIONS' }
  | { type: 'CLOSE_INSTRUCTIONS' }
  | { type: 'PREV_EXERCISE' }
  | { type: 'SELECT_EXERCISE'; index: number };

function getInitialState(): SessionState {
  return {
    screen: 'intro',
    exerciseIndex: 0,
    currentSet: 1,
    sideIndex: 0,
    countdownSecondsRemaining: PREPARE_SECONDS,
    instructionsOpen: false,
    rating: null,
  };
}

/** The one place a leg begins: the countdown is armed exactly here. */
function enterPrepare(
  state: SessionState,
  currentSet: number,
  sideIndex: number
): SessionState {
  return {
    ...state,
    screen: 'prepare',
    currentSet,
    sideIndex,
    countdownSecondsRemaining: PREPARE_SECONDS,
  };
}

function reducer(state: SessionState, action: Action): SessionState {
  const exercise = programme[state.exerciseIndex];

  switch (action.type) {
    case 'START':
      return exercise.mode === 'timer'
        ? enterPrepare({ ...state, instructionsOpen: false }, 1, 0)
        : {
            ...state,
            screen: 'active',
            currentSet: 1,
            sideIndex: 0,
            instructionsOpen: false,
          };

    case 'TICK': {
      if (state.screen !== 'prepare' && state.screen !== 'rest') return state;

      const next = state.countdownSecondsRemaining - 1;
      if (next > 0) {
        return { ...state, countdownSecondsRemaining: next };
      }
      return state.screen === 'rest'
        ? enterPrepare(state, state.currentSet + 1, 0)
        : { ...state, screen: 'active' };
    }

    case 'SKIP_REST':
      return state.screen === 'rest'
        ? enterPrepare(state, state.currentSet + 1, 0)
        : state;

    case 'ADVANCE_SET':
      // A completion queued by the timer must not land on a session the child
      // has already navigated away from, so the set only advances while the
      // exercise it belongs to is still the one running.
      if (state.screen !== 'active') return state;

      // Swapping sides is part of the same set, so it goes straight into the
      // preparation countdown; the rest belongs to the end of a whole set.
      if (state.sideIndex + 1 < legsPerSet(exercise)) {
        return enterPrepare(state, state.currentSet, state.sideIndex + 1);
      }
      if (state.currentSet >= exercise.sets) {
        if (!hasNextExercise(state.exerciseIndex)) {
          return { ...state, screen: 'final', instructionsOpen: false };
        }
        return { ...getInitialState(), exerciseIndex: state.exerciseIndex + 1 };
      }
      return {
        ...state,
        screen: 'rest',
        countdownSecondsRemaining: REST_SECONDS,
      };

    case 'COMPLETE_EXERCISE':
      if (!hasNextExercise(state.exerciseIndex)) {
        return { ...state, screen: 'final', instructionsOpen: false };
      }
      return { ...getInitialState(), exerciseIndex: state.exerciseIndex + 1 };

    case 'NEXT_EXERCISE':
      if (!hasNextExercise(state.exerciseIndex)) {
        return state;
      }
      return { ...getInitialState(), exerciseIndex: state.exerciseIndex + 1 };

    case 'RATE':
      return { ...state, rating: action.rating };

    case 'OPEN_INSTRUCTIONS':
      return { ...state, instructionsOpen: true };

    case 'PREV_EXERCISE':
      if (state.exerciseIndex <= 0) return state;
      return { ...getInitialState(), exerciseIndex: state.exerciseIndex - 1 };

    case 'SELECT_EXERCISE': {
      const targetIndex = Math.max(0, Math.min(programme.length - 1, action.index));
      return { ...getInitialState(), exerciseIndex: targetIndex };
    }

    case 'CLOSE_INSTRUCTIONS':
      return { ...state, instructionsOpen: false };

    case 'RESET':
      return getInitialState();

    default:
      return state;
  }
}

export function useSessionReducer() {
  return useReducer(reducer, undefined, getInitialState);
}
