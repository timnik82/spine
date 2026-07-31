import {
  phaseLabels,
  programme,
  SIDE_SWAP_HINT,
  sideLabel,
} from '@/data/programme';
import { useSessionReducer } from '@/hooks/useSessionReducer';
import { useTimer } from '@/hooks/useTimer';
import { useExerciseTimer } from '@/hooks/useExerciseTimer';
import { useElapsedTimer } from '@/hooks/useElapsedTimer';
import { ActiveScreen } from '@/screens/ActiveScreen';
import { RestScreen } from '@/screens/RestScreen';
import { PrepareScreen } from '@/screens/PrepareScreen';
import { FinalScreen } from '@/screens/FinalScreen';
import { InstructionsOverlay } from '@/components/InstructionsOverlay';
import { ExerciseOverview } from '@/components/ExerciseOverview';
import { ExerciseNav } from '@/components/ExerciseNav';
import { PerfBadge } from '@/components/PerfBadge';
import { SettingsButton } from '@/components/SettingsButton';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { unlockStopwatchSounds } from '@/lib/sounds';
import { renderProbe } from '@/lib/renderProbe';
import { useRestSettings } from '@/hooks/useRestSettings';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { FrameSinkRef } from '@/hooks/useExerciseTimer';

export function App() {
  const [state, dispatch] = useSessionReducer();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { restSecondsFor, setRestSeconds, resetRestSeconds } =
    useRestSettings();
  const exercise = programme[state.exerciseIndex];
  const exerciseSeconds = exercise.mode === 'timer' ? exercise.durationSec : 0;
  const restSeconds = restSecondsFor(exercise.id);
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
  const repetitionElapsedSeconds = useElapsedTimer(
    state.screen === 'active' && exercise.mode === 'repetitions',
    state.instructionsOpen,
    // Reselecting the running exercise sends it back to its intro without
    // moving the index, so the screen has to be part of what identifies a run.
    `${state.exerciseIndex}:${state.screen}`
  );

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
      dispatch({ type: 'ADVANCE_SET', restSeconds });
    }
  }, [
    dispatch,
    exercise.mode,
    restSeconds,
    state.screen,
    timer.isRunning,
    timer.secondsRemaining,
  ]);

  if (settingsOpen) {
    return (
      <SettingsScreen
        restSecondsFor={restSecondsFor}
        onChangeRestSeconds={setRestSeconds}
        onReset={resetRestSeconds}
        onClose={() => setSettingsOpen(false)}
      />
    );
  }

  let content: ReactNode;
  switch (state.screen) {
    case 'intro':
      content = (
        <>
          <ExerciseOverview
            exerciseName={exercise.name}
            phaseLabel={phaseLabels[exercise.phase]}
            currentExercise={state.exerciseIndex + 1}
            totalExercises={programme.length}
            targetSummary={exercise.summary}
            media={exercise.media}
            onInstructions={() => dispatch({ type: 'OPEN_INSTRUCTIONS' })}
            onPrimaryAction={() => dispatch({ type: 'START' })}
          />
          <InstructionsOverlay
            exercise={exercise}
            open={state.instructionsOpen}
            onClose={() => dispatch({ type: 'CLOSE_INSTRUCTIONS' })}
          />
          <SettingsButton onClick={() => setSettingsOpen(true)} />
        </>
      );
      break;

    case 'active':
      content = (
        <>
          {exercise.mode === 'timer' ? (
            <ActiveScreen
              exerciseName={exercise.name}
              media={exercise.media}
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
            <ExerciseOverview
              exerciseName={exercise.name}
              phaseLabel={phaseLabels[exercise.phase]}
              currentExercise={state.exerciseIndex + 1}
              totalExercises={programme.length}
              targetSummary={exercise.summary}
              media={exercise.media}
              active
              elapsedSeconds={repetitionElapsedSeconds}
              hint={exercise.perSide ? SIDE_SWAP_HINT : undefined}
              onHome={() => dispatch({ type: 'RESET' })}
              onInstructions={() => dispatch({ type: 'OPEN_INSTRUCTIONS' })}
              onPrimaryAction={() => dispatch({ type: 'COMPLETE_EXERCISE' })}
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
          totalSeconds={restSeconds}
          onSkip={() => dispatch({ type: 'SKIP_REST' })}
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
