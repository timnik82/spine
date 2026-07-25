import { programme, REST_SECONDS } from '@/data/programme';
import { useSessionReducer } from '@/hooks/useSessionReducer';
import { useTimer } from '@/hooks/useTimer';
import { useExerciseTimer } from '@/hooks/useExerciseTimer';
import { IntroScreen } from '@/screens/IntroScreen';
import { ActiveScreen } from '@/screens/ActiveScreen';
import { RestScreen } from '@/screens/RestScreen';
import { DoneScreen } from '@/screens/DoneScreen';
import { InstructionsOverlay } from '@/components/InstructionsOverlay';
import { useEffect, useRef } from 'react';

export function App() {
  const [state, dispatch] = useSessionReducer();
  const exercise = programme[state.exerciseIndex];

  const timer = useExerciseTimer(exercise.durationSec ?? 10);

  useTimer(state.screen, state.instructionsOpen, dispatch);

  // Pause exercise timer when instructions overlay is open (#10)
  useEffect(() => {
    timer.setPaused(state.instructionsOpen);
  }, [state.instructionsOpen, timer.setPaused]);

  // Track whether the user has started this set's timer at least once
  const hasStarted = useRef(false);

  // Auto-advance when timer completes (only if user actually started it)
  useEffect(() => {
    if (state.screen !== 'active') return;
    if (!hasStarted.current) return;

    const done = timer.secondsRemaining <= 0 && !timer.isRunning;
    if (done) {
      hasStarted.current = false;
      dispatch({ type: 'ADVANCE_SET' });
    }
  }, [timer.secondsRemaining, timer.isRunning, state.screen, dispatch]);

  // Track when user starts
  useEffect(() => {
    if (timer.isRunning) {
      hasStarted.current = true;
    }
  }, [timer.isRunning]);

  // Reset timer when entering active screen or changing set/exercise (#4, #8)
  useEffect(() => {
    if (state.screen === 'active') {
      hasStarted.current = false;
      timer.reset();
    }
  }, [state.screen, state.currentSet, state.exerciseIndex]);

  switch (state.screen) {
    case 'intro':
      return (
        <IntroScreen
          exerciseName={exercise.name}
          onStart={() => dispatch({ type: 'START' })}
        />
      );

    case 'active':
      return (
        <>
          <ActiveScreen
            exerciseName={exercise.name}
            secondsRemaining={timer.secondsRemaining}
            totalSeconds={exercise.durationSec ?? 10}
            isRunning={timer.isRunning}
            currentSet={state.currentSet}
            totalSets={exercise.sets}
            onToggle={timer.toggle}
            onReset={timer.reset}
            onInstructions={() => dispatch({ type: 'OPEN_INSTRUCTIONS' })}
            onNext={() => dispatch({ type: 'ADVANCE_SET' })}
            onRestart={() => dispatch({ type: 'START' })}
            onHome={() => dispatch({ type: 'RESET' })}
          />
          <InstructionsOverlay
            exercise={exercise}
            open={state.instructionsOpen}
            onClose={() => dispatch({ type: 'CLOSE_INSTRUCTIONS' })}
          />
        </>
      );

    case 'rest':
      return (
        <RestScreen
          secondsRemaining={state.restSecondsRemaining}
          totalSeconds={REST_SECONDS}
          onSkip={() => dispatch({ type: 'SKIP_REST' })}
          onHome={() => dispatch({ type: 'RESET' })}
        />
      );

    case 'done':
      return (
        <DoneScreen
          exerciseName={exercise.name}
          onHome={() => dispatch({ type: 'RESET' })}
        />
      );
  }
}

export default App;
