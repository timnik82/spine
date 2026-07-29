import { Button } from '@/components/ui/button';
import { PrimaryButton } from '@/components/PrimaryButton';

interface IntroScreenProps {
  exerciseName: string;
  phaseLabel: string;
  image?: string;
  onInstructions: () => void;
  onStart: () => void;
}

export function IntroScreen({
  exerciseName,
  phaseLabel,
  image,
  onInstructions,
  onStart,
}: IntroScreenProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-end"
      style={{
        background: 'var(--ex-bg-intro)',
      }}
    >
      {image && (
        <div className="absolute inset-x-0 top-16 bottom-48 flex items-center justify-center p-4">
          <img
            src={image}
            alt=""
            className="max-h-full max-w-full rounded-2xl object-contain shadow-sm bg-white/50 p-2 backdrop-blur-sm"
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-8 pb-16">
        <div className="flex flex-col items-center gap-4">
          <p
            className="rounded-full px-5 py-1.5 font-semibold uppercase tracking-widest"
            style={{
              fontSize: 'var(--ex-bullet-size)',
              color: 'var(--ex-fg-muted)',
              border: '2px solid var(--ex-border)',
              backgroundColor: 'var(--ex-badge-bg)',
            }}
          >
            {phaseLabel}
          </p>
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
          <PrimaryButton onClick={onStart}>
            Começar
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
