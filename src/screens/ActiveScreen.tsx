import { Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseProgressPair } from '@/components/ExerciseProgressPair';
import { HomeButton } from '@/components/HomeButton';

interface ActiveScreenProps {
  exerciseName: string;
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
  currentSet: number;
  totalSets: number;
  onToggle: () => void;
  onReset: () => void;
  onInstructions: () => void;
  onNext: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export function ActiveScreen({
  exerciseName,
  secondsRemaining,
  totalSeconds,
  isRunning,
  currentSet,
  totalSets,
  onToggle,
  onReset,
  onInstructions,
  onNext,
  onRestart,
  onHome,
}: ActiveScreenProps) {
  const completed = currentSet >= totalSets && secondsRemaining <= 0;

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: 'var(--ex-bg)',
        padding: 'var(--ex-page-padding)',
      }}
    >
      <header className="flex items-center justify-between gap-4">
        <HomeButton onHome={onHome} color="var(--ex-fg)" />
        <div className="flex flex-1 items-center justify-center">
          <div
            className="inline-flex items-center gap-2.5 rounded-full px-6 py-2.5 shadow-sm transition-transform duration-200 hover:scale-[1.02] sm:px-8 sm:py-3"
            style={{
              backgroundColor: 'oklch(0.96 0.025 85)',
              border: '2.5px solid var(--ex-border)',
              boxShadow: '0 4px 16px rgb(34 29 24 / 0.06)',
            }}
          >
            <Sparkles className="h-6 w-6 flex-shrink-0 sm:h-7 sm:w-7" style={{ color: 'var(--ex-warm)' }} />
            <h1
              className="text-center font-medium tracking-wide"
              style={{
                fontFamily: 'var(--font-kids)',
                fontSize: 'var(--ex-name-size)',
                color: 'var(--ex-fg)',
                lineHeight: 1.25,
              }}
            >
              {exerciseName}
            </h1>
          </div>
        </div>
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
      </header>

      <main className="flex flex-1 flex-col items-center justify-center py-2 sm:py-4">
        <ExerciseProgressPair
          secondsRemaining={secondsRemaining}
          totalSeconds={totalSeconds}
          repsComplete={currentSet - 1 + (secondsRemaining <= 0 && currentSet <= totalSets ? 1 : 0)}
          totalReps={totalSets}
          onToggle={onToggle}
          onReset={onReset}
        />
        {completed && (
          <p
            className="mt-8 max-w-md text-center text-base font-medium"
            style={{ color: 'var(--ex-fg-muted)' }}
          >
            Muito bem! Completaste as {totalSets} repetições.
          </p>
        )}
      </main>

      <footer
        className="mx-auto flex w-full max-w-3xl flex-shrink-0 flex-wrap items-center justify-center gap-3 sm:justify-between"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <Button
          onClick={onInstructions}
          variant="outline"
          className="h-14 min-w-40 cursor-pointer rounded-2xl px-6 text-base font-semibold"
          style={{
            borderColor: 'var(--ex-border)',
            color: 'var(--ex-fg)',
          }}
        >
          Instruções
        </Button>

        <Button
          onClick={onToggle}
          className="h-14 min-w-40 cursor-pointer rounded-2xl px-6 text-base font-semibold"
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
          {isRunning ? 'Pausar' : secondsRemaining <= 0 ? 'Recomeçar' : 'Iniciar'}
        </Button>

        <Button
          variant="outline"
          onClick={completed ? onRestart : onNext}
          className="h-14 min-w-40 cursor-pointer rounded-2xl px-6 text-base font-semibold"
          style={{
            borderColor: 'var(--ex-warm)',
            color: 'var(--ex-warm)',
          }}
        >
          {completed ? 'Nova série' : 'Seguinte'}
        </Button>
      </footer>
    </div>
  );
}
