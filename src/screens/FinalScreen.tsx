import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeButton } from '@/components/HomeButton';
import { finalChecklist, FINAL_MESSAGE, ratingOptions } from '@/data/programme';
import type { Rating } from '@/data/programme';

interface FinalScreenProps {
  rating: Rating | null;
  onRate: (rating: Rating) => void;
  onRestart: () => void;
}

export function FinalScreen({ rating, onRate, onRestart }: FinalScreenProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-y-auto"
      style={{
        background: 'var(--ex-done-bg)',
        padding: 'var(--ex-page-padding)',
      }}
    >
      <HomeButton onHome={onRestart} color="var(--ex-done-fg)" />

      <main className="flex w-full max-w-2xl flex-col items-center gap-8 py-4">
        <h1
          className="text-center font-medium tracking-wide"
          style={{
            fontFamily: 'var(--font-kids)',
            fontSize: 'var(--ex-heading-size)',
            color: 'var(--ex-done-fg)',
          }}
        >
          Terminaste o treino!
        </h1>

        <ul className="flex flex-col gap-3">
          {finalChecklist.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 font-medium"
              style={{
                fontSize: 'var(--ex-body-size)',
                color: 'var(--ex-done-fg)',
              }}
            >
              <Check className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

        <section className="flex w-full flex-col items-center gap-4">
          <h2
            className="text-center font-semibold"
            style={{
              fontFamily: 'var(--font-kids)',
              fontSize: 'var(--ex-name-size)',
              color: 'var(--ex-done-fg)',
            }}
          >
            Dá uma nota ao treino:
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {ratingOptions.map((option) => {
              const chosen = rating === option.id;
              return (
                <Button
                  key={option.id}
                  onClick={() => onRate(option.id)}
                  variant="outline"
                  aria-pressed={chosen}
                  className="flex cursor-pointer flex-col gap-1 rounded-[var(--ex-btn-radius)] px-8 font-semibold"
                  style={{
                    height: 'var(--ex-btn-height)',
                    minWidth: '9rem',
                    fontSize: 'var(--ex-bullet-size)',
                    borderColor: chosen ? 'var(--ex-warm)' : 'var(--ex-border)',
                    borderWidth: chosen ? '3px' : '2px',
                    backgroundColor: chosen
                      ? 'oklch(0.96 0.025 85)'
                      : 'transparent',
                    color: 'var(--ex-done-fg)',
                  }}
                >
                  <span aria-hidden="true" className="text-3xl leading-none">
                    {option.emoji}
                  </span>
                  {option.label}
                </Button>
              );
            })}
          </div>
        </section>

        {rating && (
          <p
            className="max-w-xl text-center font-medium"
            style={{
              fontFamily: 'var(--font-kids)',
              fontSize: 'var(--ex-body-size)',
              color: 'var(--ex-done-fg)',
            }}
          >
            {FINAL_MESSAGE}
          </p>
        )}

        <Button
          onClick={onRestart}
          className="cursor-pointer rounded-[var(--ex-btn-radius)] px-12 font-semibold"
          style={{
            height: 'var(--ex-btn-height)',
            minWidth: 'var(--ex-btn-min-width)',
            fontSize: 'var(--ex-btn-font-size)',
            backgroundColor: 'var(--ex-accent)',
            color: 'var(--ex-accent-fg)',
          }}
        >
          Começar de novo
        </Button>
      </main>
    </div>
  );
}
