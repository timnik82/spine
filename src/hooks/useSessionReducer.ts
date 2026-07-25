import { useReducer } from 'react';
import { programme, REST_SECONDS } from '@/data/programme';

export type Screen = 'intro' | 'active' | 'rest' | 'done';

export interface SessionState {
  screen: Screen;
  exerciseIndex: number;
  currentSet: number;
  secondsRemaining: number;
  restSecondsRemaining: number;
  instructionsOpen: boolean;
}

type Action =
  | { type: 'START' }
  | { type: 'REST_TICK' }
  | { type: 'SKIP_REST' }
  | { type: 'ADVANCE_SET' }
  | { type: 'RESET' }
  | { type: 'OPEN_INSTRUCTIONS' }
  | { type: 'CLOSE_INSTRUCTIONS' };

const EXERCISE_INDEX = programme.findIndex(e => e.id === 'crescer-ate-ao-teto');

function getInitialState(): SessionState {
  const exercise = programme[EXERCISE_INDEX];
  return {
    screen: 'intro',
    exerciseIndex: EXERCISE_INDEX,
    currentSet: 1,
    secondsRemaining: exercise.durationSec ?? 0,
    restSecondsRemaining: REST_SECONDS,
    instructionsOpen: false,
  };
}

function reducer(state: SessionState, action: Action): SessionState {
  const exercise = programme[state.exerciseIndex];

  switch (action.type) {
    case 'START':
      return {
        ...state,
        screen: 'active',
        currentSet: 1,
        secondsRemaining: exercise.durationSec ?? 0,
      };

    case 'REST_TICK': {
      const next = state.restSecondsRemaining - 1;
      if (next > 0) {
        return { ...state, restSecondsRemaining: next };
      }
      return {
        ...state,
        screen: 'active',
        currentSet: state.currentSet + 1,
        secondsRemaining: exercise.durationSec ?? 0,
        restSecondsRemaining: REST_SECONDS,
      };
    }

    case 'SKIP_REST':
      return {
        ...state,
        screen: 'active',
        currentSet: state.currentSet + 1,
        secondsRemaining: exercise.durationSec ?? 0,
        restSecondsRemaining: REST_SECONDS,
      };

    case 'ADVANCE_SET': {
      if (state.currentSet >= exercise.sets) {
        return { ...state, secondsRemaining: 0, screen: 'done' };
      }
      return {
        ...state,
        screen: 'rest',
        secondsRemaining: 0,
        restSecondsRemaining: REST_SECONDS,
      };
    }

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
