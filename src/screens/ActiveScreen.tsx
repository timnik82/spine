import { Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseProgressPair } from '@/components/ExerciseProgressPair';
import { ExerciseHeader } from '@/components/ExerciseHeader';
import type { FrameSinkRef } from '@/hooks/useExerciseTimer';

interface ActiveScreenProps {
  exerciseName: string;
  sideLabel?: string;
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
  currentSet: number;
  totalSets: number;
  onToggle: () => void;
  onReset: () => void;
  onInstructions: () => void;
  onHome: () => void;
  frameSink?: FrameSinkRef;
}

export function ActiveScreen({
  exerciseName,
  sideLabel,
  secondsRemaining,
  totalSeconds,
  isRunning,
  currentSet,
  totalSets,
  onToggle,
  onReset,
  onInstructions,
  onHome,
  frameSink,
}: ActiveScreenProps) {
  return (
    <div
      // Landscape puts the action buttons in a left-hand column so the dial and
      // the reps battery get the full height instead of sharing it with a footer.
      className="fixed inset-0 flex flex-col landscape:grid landscape:grid-cols-[auto_1fr] landscape:grid-rows-[auto_1fr] landscape:gap-x-4"
      style={{
        background: 'var(--ex-bg)',
        padding: 'var(--ex-page-padding)',
      }}
    >
      <ExerciseHeader
        exerciseName={exerciseName}
        subtitle={sideLabel}
        onHome={onHome}
        className="landscape:col-span-2"
        action={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reiniciar exercício"
            onClick={onReset}
            className="h-12 w-12 cursor-pointer rounded-full"
            style={{ color: 'var(--ex-fg)' }}
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </Button>
        }
      />

      <main className="flex flex-1 flex-col items-center justify-center py-2 sm:py-4 landscape:col-start-2 landscape:row-start-2 landscape:min-h-0 landscape:py-0">
        <ExerciseProgressPair
          sideLabel={sideLabel}
          secondsRemaining={secondsRemaining}
          totalSeconds={totalSeconds}
          repsComplete={currentSet - 1}
          totalReps={totalSets}
          onToggle={onToggle}
          onReset={onReset}
          frameSink={frameSink}
        />
      </main>

      <footer
        className="mx-auto flex w-full max-w-3xl flex-shrink-0 flex-wrap items-center justify-center gap-3 sm:justify-between landscape:col-start-1 landscape:row-start-2 landscape:mx-0 landscape:min-h-0 landscape:w-auto landscape:max-w-none landscape:flex-col landscape:flex-nowrap landscape:justify-center! landscape:overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <Button
          onClick={onInstructions}
          variant="outline"
          className="h-14 min-w-[8.5rem] cursor-pointer sm:min-w-40 rounded-2xl px-6 text-base font-semibold"
          style={{
            borderColor: 'var(--ex-border)',
            color: 'var(--ex-fg)',
          }}
        >
          Instruções
        </Button>

        <Button
          onClick={onToggle}
          className="h-14 min-w-[8.5rem] cursor-pointer sm:min-w-40 rounded-2xl px-6 text-base font-semibold"
          style={{
            backgroundColor: 'var(--ex-accent)',
            color: 'var(--ex-accent-fg)',
          }}
        >
          {isRunning ? (
            <Pause className="mr-2 h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="mr-2 h-5 w-5" aria-hidden="true" />
          )}
          {isRunning ? 'Pausar' : 'Iniciar'}
        </Button>
      </footer>
    </div>
  );
}
