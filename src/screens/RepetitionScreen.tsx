import { ExerciseHeader } from '@/components/ExerciseHeader';
import { Button } from '@/components/ui/button';

interface RepetitionScreenProps {
  exerciseName: string;
  target: number;
  repetitionLabel: string;
  onInstructions: () => void;
  onComplete: () => void;
  onHome: () => void;
}

export function RepetitionScreen({
  exerciseName,
  target,
  repetitionLabel,
  onInstructions,
  onComplete,
  onHome,
}: RepetitionScreenProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: 'var(--ex-bg)',
        padding: 'var(--ex-page-padding)',
      }}
    >
      <ExerciseHeader exerciseName={exerciseName} onHome={onHome} />

      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <p
          className="font-semibold"
          style={{
            fontFamily: 'var(--font-kids)',
            fontSize: 'min(18vh, 8rem)',
            lineHeight: 1,
            color: 'var(--ex-fg)',
          }}
        >
          {target} {repetitionLabel}
        </p>
      </main>

      <footer
        className="mx-auto flex w-full max-w-2xl flex-shrink-0 flex-wrap items-center justify-center gap-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <Button
          onClick={onInstructions}
          variant="outline"
          className="h-16 min-w-44 cursor-pointer rounded-2xl px-8 text-lg font-semibold"
          style={{ borderColor: 'var(--ex-border)', color: 'var(--ex-fg)' }}
        >
          Instruções
        </Button>
        <Button
          onClick={onComplete}
          className="h-16 min-w-44 cursor-pointer rounded-2xl px-8 text-lg font-semibold"
          style={{
            backgroundColor: 'var(--ex-accent)',
            color: 'var(--ex-accent-fg)',
          }}
        >
          Terminei
        </Button>
      </footer>
    </div>
  );
}
