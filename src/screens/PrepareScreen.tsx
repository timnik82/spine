import { HomeButton } from '@/components/HomeButton';

interface PrepareScreenProps {
  secondsRemaining: number;
  onHome: () => void;
}

export function PrepareScreen({ secondsRemaining, onHome }: PrepareScreenProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'var(--ex-rest-bg)',
        padding: 'var(--ex-page-padding)',
      }}
    >
      <HomeButton onHome={onHome} color="var(--ex-rest-fg)" />
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <h1
          className="font-medium tracking-wide"
          style={{
            fontFamily: 'var(--font-kids)',
            fontSize: 'var(--ex-heading-size)',
            color: 'var(--ex-rest-fg)',
          }}
        >
          Preparar
        </h1>
        <p
          className="font-semibold tabular-nums"
          style={{
            fontFamily: 'var(--font-kids)',
            fontSize: 'min(35vh, 14rem)',
            lineHeight: 1,
            color: 'var(--ex-rest-fg)',
          }}
        >
          {secondsRemaining}
        </p>
      </div>
    </div>
  );
}
