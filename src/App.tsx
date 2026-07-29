import {
  hasNextExercise,
  phaseLabels,
  programme,
  REST_SECONDS,
  SIDE_SWAP_HINT,
  sideLabel,
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
import { FinalScreen } from '@/screens/FinalScreen';
import { InstructionsOverlay } from '@/components/InstructionsOverlay';
import { ExerciseNav } from '@/components/ExerciseNav';
import { PerfBadge } from '@/components/PerfBadge';
import { unlockStopwatchSounds } from '@/lib/sounds';
import { renderProbe } from '@/lib/renderProbe';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { FrameSinkRef } from '@/hooks/useExerciseTimer';

export function App() {
  const [state, dispatch] = useSessionReducer();
  const exercise = programme[state.exerciseIndex];
  const exerciseSeconds = exercise.mode === 'timer' ? exercise.durationSec : 0;
  const currentSideLabel = sideLabel(exercise, state.sideIndex);

  // Decode the stopwatch clicks at startup. The crown only appears after the
  // intro screen, so this buys the fetch and decode seconds rather than the
  // milliseconds a mount-time preload would have left them.
  useEffect(() => {
    unlockStopwatchSounds();
  }, []);

  // Counts every App render for the ?debug render-rate badge (issue #11).
  // The increment is unconditional: the regression test in App.test.tsx reads
  // renderProbe.count, and it must measure real renders — not silently read
  // zero because ?debug isn't in the jsdom URL. PerfBadge stays responsible
  // for hiding itself when the flag is off, so the production UI pays nothing.
  useEffect(() => {
    renderProbe.count += 1;
  });

  // The stopwatch hand subscribes to this channel; the exercise timer writes
  // the precise remaining time here every animation frame, so the sweep never
  // goes through React state (issue #11).
  const stopwatchSweepRef = useRef<FrameSinkRef['current']>(null);

  // The timer belongs to one leg of one set; when that changes it restarts
  // during render, so the set counter and the countdown are never out of step.
  const timer = useExerciseTimer(
    exerciseSeconds,
    `${state.screen}:${state.exerciseIndex}:${state.currentSet}:${state.sideIndex}`,
    stopwatchSweepRef
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
    state.sideIndex,
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

  let content: ReactNode;
  switch (state.screen) {
    case 'intro':
      content = (
        <>
          <IntroScreen
            exerciseName={exercise.name}
            phaseLabel={phaseLabels[exercise.phase]}
            currentExercise={state.exerciseIndex + 1}
            totalExercises={programme.length}
            targetSummary={exercise.summary}
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
      break;

    case 'active':
      content = (
        <>
          {exercise.mode === 'timer' ? (
            <ActiveScreen
              exerciseName={exercise.name}
              sideLabel={currentSideLabel}
              secondsRemaining={timer.secondsRemaining}
              totalSeconds={exerciseSeconds}
              isRunning={timer.isRunning}
              currentSet={state.currentSet}
              totalSets={exercise.sets}
              onToggle={timer.toggle}
              onReset={timer.restart}
              onInstructions={() => dispatch({ type: 'OPEN_INSTRUCTIONS' })}
              onHome={() => dispatch({ type: 'RESET' })}
              frameSink={stopwatchSweepRef}
            />
          ) : (
            <RepetitionScreen
              exerciseName={exercise.name}
              target={exercise.reps}
              repetitionLabel={exercise.repetitionLabel}
              hint={exercise.perSide ? SIDE_SWAP_HINT : undefined}
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
      break;

    case 'prepare':
      content = (
        <PrepareScreen
          secondsRemaining={state.countdownSecondsRemaining}
          sideLabel={currentSideLabel}
          onHome={() => dispatch({ type: 'RESET' })}
        />
      );
      break;

    case 'rest':
      content = (
        <RestScreen
          secondsRemaining={state.countdownSecondsRemaining}
          totalSeconds={REST_SECONDS}
          onSkip={() => dispatch({ type: 'SKIP_REST' })}
          onHome={() => dispatch({ type: 'RESET' })}
        />
      );
      break;

    case 'done':
      content = (
        <DoneScreen
          exerciseName={exercise.name}
          hasNextExercise={hasNextExercise(state.exerciseIndex)}
          onNext={() => dispatch({ type: 'NEXT_EXERCISE' })}
          onFinish={() => dispatch({ type: 'FINISH_SESSION' })}
          onHome={() => dispatch({ type: 'RESET' })}
        />
      );
      break;

    case 'final':
      content = (
        <FinalScreen
          rating={state.rating}
          onRate={(rating) => dispatch({ type: 'RATE', rating })}
          onRestart={() => dispatch({ type: 'RESET' })}
        />
      );
      break;
  }

  return (
    <>
      {state.screen !== 'final' && (
        <ExerciseNav
          currentIndex={state.exerciseIndex}
          onPrev={() => dispatch({ type: 'PREV_EXERCISE' })}
          onNext={() => dispatch({ type: 'NEXT_EXERCISE' })}
          onSelect={(index) => dispatch({ type: 'SELECT_EXERCISE', index })}
        />
      )}
      {content}
      <PerfBadge />
    </>
  );
}

export default App;
