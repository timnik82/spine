import { CoachStopwatch } from './CoachStopwatch';
import { BatteryReps } from './BatteryReps';
import type { FrameSinkRef } from '@/hooks/useExerciseTimer';

interface ExerciseProgressPairProps {
  sideLabel?: string;
  secondsRemaining: number;
  totalSeconds: number;
  repsComplete: number;
  totalReps: number;
  onToggle?: () => void;
  onReset?: () => void;
  frameSink?: FrameSinkRef;
}

export function ExerciseProgressPair({
  sideLabel,
  secondsRemaining,
  totalSeconds,
  repsComplete,
  totalReps,
  onToggle,
  onReset,
  frameSink,
}: ExerciseProgressPairProps) {
  const hasRepeatedSets = totalReps > 1;

  return (
    <section
      className="flex w-full flex-row items-center justify-center gap-4 sm:gap-20"
      aria-label={
        `Exercício: ${Math.floor(secondsRemaining)} segundos restantes` +
        (sideLabel ? `, ${sideLabel}` : '') +
        (hasRepeatedSets
          ? `, ${repsComplete} de ${totalReps} repetições concluídas`
          : '')
      }
    >
      <div className="flex min-w-0 flex-1 flex-col items-center" aria-label="Temporizador">
        <CoachStopwatch
          secondsRemaining={secondsRemaining}
          totalSeconds={totalSeconds}
          onToggle={onToggle}
          onReset={onReset}
          frameSink={frameSink}
        />
      </div>

      {hasRepeatedSets && (
        <div className="shrink-0">
          <BatteryReps repsComplete={repsComplete} totalReps={totalReps} />
        </div>
      )}
    </section>
  );
}
