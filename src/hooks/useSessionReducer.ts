import { useReducer } from 'react';
import {
  hasNextExercise,
  playableProgramme,
  PREPARE_SECONDS,
  REST_SECONDS,
} from '@/data/programme';

export type Screen = 'intro' | 'prepare' | 'active' | 'rest' | 'done';

export interface SessionState {
  screen: Screen;
  exerciseIndex: number;
  currentSet: number;
  /** Seconds left on whichever countdown screen is showing; unused elsewhere. */
  countdownSecondsRemaining: number;
  instructionsOpen: boolean;
}

type Action =
  | { type: 'START' }
  | { type: 'TICK' }
  | { type: 'SKIP_REST' }
  | { type: 'ADVANCE_SET' }
  | { type: 'COMPLETE_EXERCISE' }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'RESET' }
  | { type: 'OPEN_INSTRUCTIONS' }
  | { type: 'CLOSE_INSTRUCTIONS' };

function getInitialState(): SessionState {
  return {
    screen: 'intro',
    exerciseIndex: 0,
    currentSet: 1,
    countdownSecondsRemaining: PREPARE_SECONDS,
    instructionsOpen: false,
  };
}

/** The one place a set begins: the countdown is armed exactly here. */
function enterPrepare(state: SessionState, currentSet: number): SessionState {
  return {
    ...state,
    screen: 'prepare',
    currentSet,
    countdownSecondsRemaining: PREPARE_SECONDS,
  };
}

function reducer(state: SessionState, action: Action): SessionState {
  const exercise = playableProgramme[state.exerciseIndex];

  switch (action.type) {
    case 'START':
      return exercise.mode === 'timer'
        ? enterPrepare({ ...state, instructionsOpen: false }, 1)
        : { ...state, screen: 'active', currentSet: 1, instructionsOpen: false };

    case 'TICK': {
      if (state.screen !== 'prepare' && state.screen !== 'rest') return state;

      const next = state.countdownSecondsRemaining - 1;
      if (next > 0) {
        return { ...state, countdownSecondsRemaining: next };
      }
      return state.screen === 'rest'
        ? enterPrepare(state, state.currentSet + 1)
        : { ...state, screen: 'active' };
    }

    case 'SKIP_REST':
      return enterPrepare(state, state.currentSet + 1);

    case 'ADVANCE_SET':
      if (state.currentSet >= exercise.sets) {
        return { ...state, screen: 'done' };
      }
      return {
        ...state,
        screen: 'rest',
        countdownSecondsRemaining: REST_SECONDS,
      };

    case 'COMPLETE_EXERCISE':
      return { ...state, screen: 'done' };

    case 'NEXT_EXERCISE':
      if (!hasNextExercise(state.exerciseIndex)) {
        return state;
      }
      return { ...getInitialState(), exerciseIndex: state.exerciseIndex + 1 };

    case 'OPEN_INSTRUCTIONS':
      return { ...state, instructionsOpen: true };

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
