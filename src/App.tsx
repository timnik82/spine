import {
  hasNextExercise,
  playableProgramme,
  REST_SECONDS,
} from '@/data/programme';
import { useSessionReducer } from '@/hooks/useSessionReducer';
import { useTimer } from '@/hooks/useTimer';
import { useExerciseTimer } from '@/hooks/useExerciseTimer';
import { IntroScreen } from '@/screens/IntroScreen';
import { ActiveScreen } from '@/screens/ActiveScreen';
import { RestScreen } from '@/screens/RestScreen';
import { PrepareScreen } from '@/screens/PrepareScreen';
import { RepetitionScreen } from '@/screens/RepetitionScreen';
import { DoneScreen } from '@/screens/DoneScreen';
import { InstructionsOverlay } from '@/components/InstructionsOverlay';
import { unlockStopwatchSounds } from '@/lib/sounds';
import { useEffect } from 'react';

export function App() {
  const [state, dispatch] = useSessionReducer();
  const exercise = playableProgramme[state.exerciseIndex];
  const exerciseSeconds = exercise.mode === 'timer' ? exercise.durationSec : 0;

  // Decode the stopwatch clicks at startup. The crown only appears after the
  // intro screen, so this buys the fetch and decode seconds rather than the
  // milliseconds a mount-time preload would have left them.
  useEffect(() => {
    unlockStopwatchSounds();
  }, []);

  // The timer belongs to one run of one set; when that changes it restarts
  // during render, so the set counter and the countdown are never out of step.
  const timer = useExerciseTimer(
    exerciseSeconds,
    `${state.screen}:${state.exerciseIndex}:${state.currentSet}`
  );

  useTimer(state.screen, state.instructionsOpen, dispatch);

  // Pause exercise timer when instructions overlay is open (#10)
  useEffect(() => {
    timer.setPaused(state.instructionsOpen);
  }, [state.instructionsOpen, timer.setPaused]);

  useEffect(() => {
    if (state.screen === 'active' && exercise.mode === 'timer') {
      timer.restart();
    }
  }, [
    exercise.mode,
    state.currentSet,
    state.exerciseIndex,
    state.screen,
    timer.restart,
  ]);

  // Auto-advance timed exercises when their countdown completes.
  useEffect(() => {
    if (state.screen !== 'active' || exercise.mode !== 'timer') return;

    const done = timer.secondsRemaining <= 0 && !timer.isRunning;
    if (done) {
      dispatch({ type: 'ADVANCE_SET' });
    }
  }, [
    dispatch,
    exercise.mode,
    state.screen,
    timer.isRunning,
    timer.secondsRemaining,
  ]);

  switch (state.screen) {
    case 'intro':
      return (
        <>
          <IntroScreen
            exerciseName={exercise.name}
            image={exercise.media.image}
            onInstructions={() => dispatch({ type: 'OPEN_INSTRUCTIONS' })}
            onStart={() => dispatch({ type: 'START' })}
          />
          <InstructionsOverlay
            exercise={exercise}
            open={state.instructionsOpen}
            onClose={() => dispatch({ type: 'CLOSE_INSTRUCTIONS' })}
          />
        </>
      );

    case 'active':
      return (
        <>
          {exercise.mode === 'timer' ? (
            <ActiveScreen
              exerciseName={exercise.name}
              secondsRemaining={timer.secondsRemaining}
              totalSeconds={exerciseSeconds}
              isRunning={timer.isRunning}
              currentSet={state.currentSet}
              totalSets={exercise.sets}
              onToggle={timer.toggle}
              onReset={timer.restart}
              onInstructions={() => dispatch({ type: 'OPEN_INSTRUCTIONS' })}
              onHome={() => dispatch({ type: 'RESET' })}
            />
          ) : (
            <RepetitionScreen
              exerciseName={exercise.name}
              target={exercise.reps}
              repetitionLabel={exercise.repetitionLabel}
              onInstructions={() => dispatch({ type: 'OPEN_INSTRUCTIONS' })}
              onComplete={() => dispatch({ type: 'COMPLETE_EXERCISE' })}
              onHome={() => dispatch({ type: 'RESET' })}
            />
          )}
          <InstructionsOverlay
            exercise={exercise}
            open={state.instructionsOpen}
            onClose={() => dispatch({ type: 'CLOSE_INSTRUCTIONS' })}
          />
        </>
      );

    case 'prepare':
      return (
        <PrepareScreen
          secondsRemaining={state.countdownSecondsRemaining}
          onHome={() => dispatch({ type: 'RESET' })}
        />
      );

    case 'rest':
      return (
        <RestScreen
          secondsRemaining={state.countdownSecondsRemaining}
          totalSeconds={REST_SECONDS}
          onSkip={() => dispatch({ type: 'SKIP_REST' })}
          onHome={() => dispatch({ type: 'RESET' })}
        />
      );

    case 'done':
      return (
        <DoneScreen
          exerciseName={exercise.name}
          hasNextExercise={hasNextExercise(state.exerciseIndex)}
          onNext={() => dispatch({ type: 'NEXT_EXERCISE' })}
          onHome={() => dispatch({ type: 'RESET' })}
        />
      );
  }
}

export default App;
