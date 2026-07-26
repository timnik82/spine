import { Button } from '@/components/ui/button';

interface IntroScreenProps {
  exerciseName: string;
  onStart: () => void;
}

export function IntroScreen({ exerciseName, onStart }: IntroScreenProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-end"
      style={{
        background: 'var(--ex-bg-intro)',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <img
          src="/intro-crescer.webp"
          alt=""
          className="h-full w-full object-cover opacity-60"
        />
      </div>

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
        <Button
          onClick={onStart}
          className="cursor-pointer rounded-[var(--ex-btn-radius)] px-12 text-lg font-semibold"
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
  );
}
