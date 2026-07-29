import { Button } from '@/components/ui/button';
import { CircularTimer } from '@/components/CircularTimer';
import { CountdownLayout } from '@/components/CountdownLayout';

interface RestScreenProps {
  secondsRemaining: number;
  totalSeconds: number;
  onSkip: () => void;
  onHome: () => void;
}

export function RestScreen({ secondsRemaining, totalSeconds, onSkip, onHome }: RestScreenProps) {
  return (
    <CountdownLayout
      title="Descansa"
      onHome={onHome}
      footer={
        <Button
          onClick={onSkip}
          variant="outline"
          className="cursor-pointer rounded-[var(--ex-btn-radius)] px-8 font-semibold"
          style={{
            height: 'var(--ex-btn-height)',
            minWidth: 'var(--ex-btn-min-width)',
            fontSize: 'var(--ex-btn-font-size)',
            borderColor: 'var(--ex-border)',
            color: 'var(--ex-rest-fg)',
          }}
        >
          Saltar descanso
        </Button>
      }
    >
      <CircularTimer
        secondsRemaining={secondsRemaining}
        totalSeconds={totalSeconds}
        variant="rest"
      />
    </CountdownLayout>
  );
}
