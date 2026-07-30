import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Exercise } from '@/data/programme';

interface InstructionsOverlayProps {
  exercise: Exercise;
  open: boolean;
  onClose: () => void;
}

export function InstructionsOverlay({
  exercise,
  open,
  onClose,
}: InstructionsOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl"
        style={{
          background: 'var(--ex-overlay-bg)',
          padding: 'var(--ex-page-padding)',
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle
            className="text-center font-semibold"
            style={{
              fontSize: 'var(--ex-name-size)',
              color: 'var(--ex-fg)',
            }}
          >
            {exercise.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {exercise.summary}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {(exercise.media.video || exercise.media.image) && (
            <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-black/5 p-2">
              <ExerciseMedia
                media={exercise.media}
                label={exercise.name}
                className="max-h-full w-auto object-contain rounded-lg"
              />
            </div>
          )}

          {exercise.lead && (
            <p
              className="italic"
              style={{
                fontSize: 'var(--ex-body-size)',
                color: 'var(--ex-fg)',
              }}
            >
              {exercise.lead}
            </p>
          )}

          <ul className="flex flex-col gap-2 pl-4">
            {exercise.instructions.map((line, i) => (
              <li
                key={i}
                className="list-disc"
                style={{
                  fontSize: 'var(--ex-bullet-size)',
                  color: 'var(--ex-fg)',
                }}
              >
                {line}
              </li>
            ))}
          </ul>

          <p
            className="font-bold"
            style={{
              fontSize: 'var(--ex-body-size)',
              color: 'var(--ex-fg)',
            }}
          >
            {exercise.summary}
          </p>
        </div>

        <DialogFooter className="justify-center sm:justify-center">
          <DialogClose asChild>
            <PrimaryButton onClick={onClose} className="px-8">
              Fechar
            </PrimaryButton>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
