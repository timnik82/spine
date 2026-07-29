import { HomeButton } from '@/components/HomeButton';
import { Button } from '@/components/ui/button';

interface DoneScreenProps {
  exerciseName: string;
  hasNextExercise: boolean;
  onNext: () => void;
  onHome: () => void;
}

export function DoneScreen({
  exerciseName,
  hasNextExercise,
  onNext,
  onHome,
}: DoneScreenProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'var(--ex-done-bg)',
        padding: 'var(--ex-page-padding)',
      }}
    >
      <HomeButton onHome={onHome} color="var(--ex-done-fg)" />
      <h1
        className="font-medium tracking-wide"
        style={{
          fontFamily: 'var(--font-kids)',
          fontSize: 'var(--ex-name-size)',
          color: 'var(--ex-done-fg)',
        }}
      >
        {exerciseName}
      </h1>
      <p
        className="mt-6 font-medium tracking-wide"
        style={{
          fontFamily: 'var(--font-kids)',
          fontSize: 'var(--ex-heading-size)',
          color: 'var(--ex-done-fg)',
        }}
      >
        Concluído
      </p>
      {!hasNextExercise && (
        <p
          className="mt-8 max-w-xl text-center text-lg font-medium"
          style={{ color: 'var(--ex-done-fg)' }}
        >
          Próximos exercícios serão adicionados no próximo incremento.
        </p>
      )}
      {hasNextExercise && (
        <Button
          onClick={onNext}
          className="mt-10 cursor-pointer rounded-[var(--ex-btn-radius)] px-12 font-semibold"
          style={{
            height: 'var(--ex-btn-height)',
            minWidth: 'var(--ex-btn-min-width)',
            fontSize: 'var(--ex-btn-font-size)',
            backgroundColor: 'var(--ex-accent)',
            color: 'var(--ex-accent-fg)',
          }}
        >
          Seguinte
        </Button>
      )}
    </div>
  );
}
