import { CountdownLayout } from '@/components/CountdownLayout';

interface PrepareScreenProps {
  secondsRemaining: number;
  onHome: () => void;
}

export function PrepareScreen({ secondsRemaining, onHome }: PrepareScreenProps) {
  return (
    <CountdownLayout title="Preparar" onHome={onHome}>
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
    </CountdownLayout>
  );
}
