import { Button } from '@/components/ui/button';
import { CircularTimer } from '@/components/CircularTimer';
import { HomeButton } from '@/components/HomeButton';

interface RestScreenProps {
  secondsRemaining: number;
  totalSeconds: number;
  onSkip: () => void;
  onHome: () => void;
}

export function RestScreen({ secondsRemaining, totalSeconds, onSkip, onHome }: RestScreenProps) {
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
          Descansa
        </h1>
        <CircularTimer
          secondsRemaining={secondsRemaining}
          totalSeconds={totalSeconds}
          variant="rest"
        />
      </div>

      <footer className="flex-shrink-0 pb-8">
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
      </footer>
    </div>
  );
}
