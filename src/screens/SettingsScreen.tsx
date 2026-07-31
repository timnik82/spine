import { Check, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_REST_SECONDS,
  MAX_REST_SECONDS,
  REST_SECONDS_STEP,
  restAdjustableExercises,
} from '@/hooks/useRestSettings';

interface SettingsScreenProps {
  restSecondsFor: (exerciseId: string) => number;
  onChangeRestSeconds: (exerciseId: string, seconds: number) => void;
  onReset: () => void;
  onClose: () => void;
}

export function SettingsScreen({
  restSecondsFor,
  onChangeRestSeconds,
  onReset,
  onClose,
}: SettingsScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'var(--ex-bg-intro)', color: 'var(--ex-fg)' }}
    >
      <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6 sm:px-8 sm:py-10">
        <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
          <div>
            <p
              className="mb-1 text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: 'var(--ex-warm)' }}
            >
              Pausas da sessão
            </p>
            <h1
              className="font-medium tracking-wide"
              style={{
                fontFamily: 'var(--font-kids)',
                fontSize: 'var(--ex-heading-size)',
              }}
            >
              Definições
            </h1>
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="h-12 cursor-pointer rounded-2xl px-5 font-semibold"
            style={{
              backgroundColor: 'var(--ex-accent)',
              color: 'var(--ex-accent-fg)',
            }}
          >
            <Check className="h-5 w-5" aria-hidden="true" />
            Concluído
          </Button>
        </header>

        <section
          aria-labelledby="rest-settings-heading"
          className="rounded-3xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-6"
          style={{ borderColor: 'var(--ex-border)' }}
        >
          <div className="mb-5">
            <h2
              id="rest-settings-heading"
              className="text-xl font-bold sm:text-2xl"
              style={{ fontFamily: 'var(--font-kids)' }}
            >
              Tempo de descanso
            </h2>
            <p className="mt-1 text-sm sm:text-base" style={{ color: 'var(--ex-fg-muted)' }}>
              Ajusta a pausa entre séries de cada exercício.
            </p>
          </div>

          <div className="divide-y divide-[color:var(--ex-border)]">
            {restAdjustableExercises.map((exercise) => {
              const seconds = restSecondsFor(exercise.id);

              return (
                <div
                  key={exercise.id}
                  className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
                  role="group"
                  aria-label={exercise.name}
                >
                  <div className="flex min-w-0 items-center">
                    <span className="font-semibold leading-snug">{exercise.name}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        onChangeRestSeconds(
                          exercise.id,
                          seconds - REST_SECONDS_STEP
                        )
                      }
                      disabled={seconds <= 0}
                      aria-label={`Diminuir descanso de ${exercise.name}`}
                      className="h-11 w-11 cursor-pointer rounded-full"
                      style={{ borderColor: 'var(--ex-border)' }}
                    >
                      <Minus className="h-5 w-5" aria-hidden="true" />
                    </Button>

                    <output
                      className="flex h-12 min-w-28 items-center justify-center rounded-2xl px-3 text-center text-lg font-bold tabular-nums"
                      style={{
                        backgroundColor: 'var(--ex-rest-soft)',
                        color: 'var(--ex-rest-fg)',
                      }}
                      aria-live="polite"
                    >
                      {seconds === 0 ? 'Sem descanso' : `${seconds} s`}
                    </output>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        onChangeRestSeconds(
                          exercise.id,
                          seconds + REST_SECONDS_STEP
                        )
                      }
                      disabled={seconds >= MAX_REST_SECONDS}
                      aria-label={`Aumentar descanso de ${exercise.name}`}
                      className="h-11 w-11 cursor-pointer rounded-full"
                      style={{ borderColor: 'var(--ex-border)' }}
                    >
                      <Plus className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-5 flex justify-center sm:justify-end">
          <Button
            type="button"
            onClick={onReset}
            variant="ghost"
            className="h-11 cursor-pointer rounded-xl px-4 font-semibold"
            style={{ color: 'var(--ex-fg-muted)' }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Repor {DEFAULT_REST_SECONDS} s
          </Button>
        </footer>
      </main>
    </div>
  );
}
