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
  return (
    <section
      className="flex w-full flex-row items-center justify-center gap-7 sm:gap-20"
      aria-label={`Exercício: ${Math.floor(secondsRemaining)} segundos restantes, ${repsComplete} de ${totalReps} repetições concluídas`}
    >
      <div className="flex flex-col items-center" aria-label="Temporizador">
        <CoachStopwatch
          secondsRemaining={secondsRemaining}
          totalSeconds={totalSeconds}
          onToggle={onToggle}
          onReset={onReset}
        />
      </div>

      <BatteryReps repsComplete={repsComplete} totalReps={totalReps} />
    </section>
  );
}
