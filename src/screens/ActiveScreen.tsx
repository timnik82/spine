import { Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseProgressPair } from '@/components/ExerciseProgressPair';
import { ExerciseHeader } from '@/components/ExerciseHeader';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { cn } from '@/lib/utils';
import type { FrameSinkRef } from '@/hooks/useExerciseTimer';

interface ActiveScreenProps {
  exerciseName: string;
  media: { image?: string; video?: string };
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
  media,
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
  const hasMedia = Boolean(media.video || media.image);

  return (
    <div
      // One column in both orientations: title, then the working area, then the
      // buttons. Only the working area changes direction — the clip sits beside
      // the dial in landscape and above it in portrait.
      className="fixed inset-0 flex flex-col"
      style={{
        background: 'var(--ex-bg)',
        padding: 'var(--ex-page-padding)',
      }}
    >
      <ExerciseHeader
        exerciseName={exerciseName}
        subtitle={sideLabel}
        onHome={onHome}
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

      {/*
        The demonstration stays on screen while the clock runs, so the child can
        keep copying the movement instead of remembering it: beside the dial in
        landscape, above it in portrait. Without media the dial is alone and
        centred, exactly as before.
      */}
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-2 sm:py-4 landscape:flex-row landscape:gap-6 landscape:py-0">
        {hasMedia && (
          <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
            <ExerciseMedia
              media={media}
              label=""
              className="max-h-full max-w-full rounded-2xl object-contain"
            />
          </div>
        )}

        {/*
          The dial sizes itself from the viewport height, assuming it is the
          only thing between the header and the footer. Stacked above it in
          portrait, the clip breaks that assumption, so the dial is capped by
          width — its aspect ratio turns that into the height it may claim.
        */}
        <div
          className={cn(
            'flex w-full min-w-0 shrink-0 items-center justify-center landscape:min-h-0 landscape:w-auto landscape:flex-1',
            hasMedia && 'portrait:max-w-[38vh]'
          )}
        >
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
        </div>
      </main>

      <footer
        className="mx-auto flex w-full max-w-3xl flex-shrink-0 flex-wrap items-center justify-center gap-3 sm:justify-between"
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
