import { HomeButton } from '@/components/HomeButton';
import { PrimaryButton } from '@/components/PrimaryButton';

interface DoneScreenProps {
  exerciseName: string;
  hasNextExercise: boolean;
  onNext: () => void;
  onFinish: () => void;
  onHome: () => void;
}

export function DoneScreen({
  exerciseName,
  hasNextExercise,
  onNext,
  onFinish,
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
      <PrimaryButton
        onClick={hasNextExercise ? onNext : onFinish}
        className="mt-10"
      >
        {hasNextExercise ? 'Seguinte' : 'Terminar'}
      </PrimaryButton>
    </div>
  );
}
