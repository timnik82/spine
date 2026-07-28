import { Button } from '@/components/ui/button';

interface IntroScreenProps {
  exerciseName: string;
  image?: string;
  onInstructions: () => void;
  onStart: () => void;
}

export function IntroScreen({
  exerciseName,
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
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover opacity-60"
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-8 pb-16">
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
          <Button
            onClick={onStart}
            className="cursor-pointer rounded-[var(--ex-btn-radius)] px-12 font-semibold"
            style={{
              height: 'var(--ex-btn-height)',
              minWidth: 'var(--ex-btn-min-width)',
              fontSize: 'var(--ex-btn-font-size)',
              backgroundColor: 'var(--ex-accent)',
              color: 'var(--ex-accent-fg)',
            }}
          >
            Começar
          </Button>
        </div>
      </div>
    </div>
  );
}
