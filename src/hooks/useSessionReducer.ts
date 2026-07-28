import { useReducer } from 'react';
import {
  PLAYABLE_EXERCISE_COUNT,
  PREPARE_SECONDS,
  programme,
  REST_SECONDS,
} from '@/data/programme';

export type Screen = 'intro' | 'prepare' | 'active' | 'rest' | 'done';

export interface SessionState {
  screen: Screen;
  exerciseIndex: number;
  currentSet: number;
  secondsRemaining: number;
  prepareSecondsRemaining: number;
  restSecondsRemaining: number;
  instructionsOpen: boolean;
}

type Action =
  | { type: 'START' }
  | { type: 'PREPARE_TICK' }
  | { type: 'REST_TICK' }
  | { type: 'SKIP_REST' }
  | { type: 'ADVANCE_SET' }
  | { type: 'COMPLETE_EXERCISE' }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'RESET' }
  | { type: 'OPEN_INSTRUCTIONS' }
  | { type: 'CLOSE_INSTRUCTIONS' };

function getInitialState(): SessionState {
  const exercise = programme[0];
  return {
    screen: 'intro',
    exerciseIndex: 0,
    currentSet: 1,
    secondsRemaining: exercise.durationSec ?? 0,
    prepareSecondsRemaining: PREPARE_SECONDS,
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
        screen: exercise.mode === 'timer' ? 'prepare' : 'active',
        currentSet: 1,
        secondsRemaining: exercise.durationSec ?? 0,
        prepareSecondsRemaining: PREPARE_SECONDS,
        instructionsOpen: false,
      };

    case 'PREPARE_TICK': {
      const next = state.prepareSecondsRemaining - 1;
      if (next > 0) {
        return { ...state, prepareSecondsRemaining: next };
      }
      return {
        ...state,
        screen: 'active',
        secondsRemaining: exercise.durationSec ?? 0,
        prepareSecondsRemaining: PREPARE_SECONDS,
      };
    }

    case 'REST_TICK': {
      const next = state.restSecondsRemaining - 1;
      if (next > 0) {
        return { ...state, restSecondsRemaining: next };
      }
      return {
        ...state,
        screen: 'prepare',
        currentSet: state.currentSet + 1,
        secondsRemaining: exercise.durationSec ?? 0,
        prepareSecondsRemaining: PREPARE_SECONDS,
        restSecondsRemaining: REST_SECONDS,
      };
    }

    case 'SKIP_REST':
      return {
        ...state,
        screen: 'prepare',
        currentSet: state.currentSet + 1,
        secondsRemaining: exercise.durationSec ?? 0,
        prepareSecondsRemaining: PREPARE_SECONDS,
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

    case 'COMPLETE_EXERCISE':
      return { ...state, screen: 'done' };

    case 'NEXT_EXERCISE': {
      if (state.exerciseIndex >= PLAYABLE_EXERCISE_COUNT - 1) {
        return state;
      }
      const exerciseIndex = state.exerciseIndex + 1;
      const nextExercise = programme[exerciseIndex];
      return {
        screen: 'intro',
        exerciseIndex,
        currentSet: 1,
        secondsRemaining: nextExercise.durationSec ?? 0,
        prepareSecondsRemaining: PREPARE_SECONDS,
        restSecondsRemaining: REST_SECONDS,
        instructionsOpen: false,
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
