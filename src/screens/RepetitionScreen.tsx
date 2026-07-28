import { Sparkles } from 'lucide-react';
import { HomeButton } from '@/components/HomeButton';
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
      <header className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3 sm:gap-4">
        <div className="justify-self-start">
          <HomeButton onHome={onHome} color="var(--ex-fg)" inFlow />
        </div>
        <div className="flex min-w-0 items-center justify-center">
          <div
            className="inline-flex items-center gap-2.5 rounded-full px-6 py-2.5 shadow-sm sm:px-8 sm:py-3"
            style={{
              backgroundColor: 'oklch(0.96 0.025 85)',
              border: '2.5px solid var(--ex-border)',
              boxShadow: '0 4px 16px rgb(34 29 24 / 0.06)',
            }}
          >
            <Sparkles
              className="h-6 w-6 flex-shrink-0 sm:h-7 sm:w-7"
              style={{ color: 'var(--ex-warm)' }}
            />
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
        <div />
      </header>

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
        className="mx-auto flex w-full max-w-2xl flex-shrink-0 items-center justify-center gap-4"
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
