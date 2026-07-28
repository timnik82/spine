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
  onHome,
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
      {/* Outer columns are fixed to the button size so the title stays centred
          on the page and still gets all the space left in between. */}
      <header className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3 sm:gap-4 landscape:col-span-2">
        <div className="justify-self-start">
          <HomeButton onHome={onHome} color="var(--ex-fg)" inFlow />
        </div>
        <div className="flex min-w-0 items-center justify-center">
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
          className="h-12 w-12 cursor-pointer justify-self-end rounded-full"
          style={{ color: 'var(--ex-fg)' }}
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center py-2 sm:py-4 landscape:col-start-2 landscape:row-start-2 landscape:min-h-0 landscape:py-0">
        <ExerciseProgressPair
          secondsRemaining={secondsRemaining}
          totalSeconds={totalSeconds}
          repsComplete={currentSet - 1 + (secondsRemaining <= 0 && currentSet <= totalSets ? 1 : 0)}
          totalReps={totalSets}
          onToggle={onToggle}
          onReset={onReset}
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
          {isRunning ? 'Pausar' : secondsRemaining <= 0 ? 'Recomeçar' : 'Iniciar'}
        </Button>
      </footer>
    </div>
  );
}
