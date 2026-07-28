import { CoachStopwatch } from './CoachStopwatch';
import { BatteryReps } from './BatteryReps';

interface ExerciseProgressPairProps {
  secondsRemaining: number;
  totalSeconds: number;
  repsComplete: number;
  totalReps: number;
  onToggle?: () => void;
  onReset?: () => void;
}

export function ExerciseProgressPair({
  secondsRemaining,
  totalSeconds,
  repsComplete,
  totalReps,
  onToggle,
  onReset,
}: ExerciseProgressPairProps) {
  const hasRepeatedSets = totalReps > 1;

  return (
    <section
      className="flex w-full flex-row items-center justify-center gap-4 sm:gap-20"
      aria-label={
        hasRepeatedSets
          ? `Exercício: ${Math.floor(secondsRemaining)} segundos restantes, ${repsComplete} de ${totalReps} repetições concluídas`
          : `Exercício: ${Math.floor(secondsRemaining)} segundos restantes`
      }
    >
      <div className="flex min-w-0 flex-1 flex-col items-center" aria-label="Temporizador">
        <CoachStopwatch
          secondsRemaining={secondsRemaining}
          totalSeconds={totalSeconds}
          onToggle={onToggle}
          onReset={onReset}
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
