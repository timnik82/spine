import { ExerciseMedia } from '@/components/ExerciseMedia';
import { HomeButton } from '@/components/HomeButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Button } from '@/components/ui/button';

interface ExerciseOverviewProps {
  exerciseName: string;
  phaseLabel: string;
  currentExercise: number;
  totalExercises: number;
  targetSummary?: string;
  media: { image?: string; video?: string };
  active?: boolean;
  elapsedSeconds?: number;
  hint?: string;
  onHome?: () => void;
  onInstructions: () => void;
  onPrimaryAction: () => void;
}

function formatElapsedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The stable visual shell shared by an exercise introduction and an active
 * repetition exercise. Keeping the media in the same component position lets
 * React preserve the video element when "Começar" changes the internal state.
 */
export function ExerciseOverview({
  exerciseName,
  phaseLabel,
  currentExercise,
  totalExercises,
  targetSummary,
  media,
  active = false,
  elapsedSeconds = 0,
  hint,
  onHome,
  onInstructions,
  onPrimaryAction,
}: ExerciseOverviewProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-end overflow-hidden pt-16"
      style={{ background: 'var(--ex-bg-intro)' }}
    >
      {active && onHome && (
        <HomeButton onHome={onHome} color="var(--ex-fg)" />
      )}

      {(media.video || media.image) && (
        <div className="flex w-full min-h-0 flex-1 items-center justify-center p-4">
          <ExerciseMedia
            media={media}
            label=""
            className="max-h-full max-w-full rounded-2xl bg-white/50 object-contain p-2 shadow-sm backdrop-blur-sm"
          />
        </div>
      )}

      <div className="relative z-10 flex w-full shrink-0 flex-col items-center gap-6 px-4 pb-16">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-bold tracking-wider"
              style={{
                color: 'var(--ex-fg)',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              EXERCÍCIO {currentExercise} DE {totalExercises}
            </span>
            {phaseLabel && (
              <span
                className="rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest"
                style={{
                  color: 'var(--ex-fg-muted)',
                  border: '1.5px solid var(--ex-border)',
                  backgroundColor: 'var(--ex-badge-bg)',
                }}
              >
                {phaseLabel}
              </span>
            )}
          </div>
          <h1
            className="text-center font-medium tracking-wide"
            style={{
              fontFamily: 'var(--font-kids)',
              fontSize: 'var(--ex-heading-size)',
              color: 'var(--ex-fg)',
            }}
          >
            {exerciseName}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {targetSummary && (
              <p
                className="rounded-full px-5 py-2 font-bold tracking-wide shadow-xs"
                style={{
                  fontSize: 'var(--ex-target-size)',
                  color: 'var(--ex-fg)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1.5px solid var(--ex-border)',
                }}
              >
                {targetSummary}
              </p>
            )}
            {active && (
              <p
                role="timer"
                aria-label={`Tempo decorrido: ${formatElapsedTime(elapsedSeconds)}`}
                className="rounded-full px-5 py-2 font-bold tabular-nums tracking-wide shadow-xs"
                style={{
                  fontSize: 'var(--ex-target-size)',
                  color: 'var(--ex-fg)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1.5px solid var(--ex-border)',
                }}
              >
                Tempo: {formatElapsedTime(elapsedSeconds)}
              </p>
            )}
          </div>
          {active && hint && (
            <p
              className="text-center text-sm font-medium"
              style={{ color: 'var(--ex-fg-muted)' }}
            >
              {hint}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={onInstructions}
            variant="outline"
            className="cursor-pointer rounded-[var(--ex-btn-radius)] px-10 font-semibold"
            style={{
              height: 'var(--ex-btn-height)',
              minWidth: 'var(--ex-btn-min-width)',
              fontSize: 'var(--ex-btn-font-size)',
              borderColor: 'var(--ex-border)',
              color: 'var(--ex-fg)',
            }}
          >
            Instruções
          </Button>
          <PrimaryButton onClick={onPrimaryAction}>
            {active ? 'Terminei' : 'Começar'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
