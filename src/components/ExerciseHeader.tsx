import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { HomeButton } from '@/components/HomeButton';

interface ExerciseHeaderProps {
  exerciseName: string;
  /** Which side is being held, on the exercises that work one side at a time. */
  subtitle?: string;
  onHome: () => void;
  /** Optional control for the right-hand slot; the slot is reserved either way. */
  action?: ReactNode;
  className?: string;
}

/**
 * Title bar shared by the exercise screens. Outer columns are fixed to the
 * button size so the title stays centred on the page and still gets all the
 * space left in between.
 */
export function ExerciseHeader({
  exerciseName,
  subtitle,
  onHome,
  action,
  className = '',
}: ExerciseHeaderProps) {
  return (
    <header
      className={`grid grid-cols-[3rem_1fr_3rem] items-center gap-3 sm:gap-4 ${className}`}
    >
      <div className="justify-self-start">
        <HomeButton onHome={onHome} color="var(--ex-fg)" inFlow />
      </div>
      <div className="flex min-w-0 items-center justify-center">
        <div
          className="inline-flex items-center gap-2.5 rounded-full px-6 py-2.5 shadow-sm transition-transform duration-200 hover:scale-[1.02] sm:px-8 sm:py-3"
          style={{
            backgroundColor: 'var(--ex-badge-bg)',
            border: '2.5px solid var(--ex-border)',
            boxShadow: '0 4px 16px rgb(34 29 24 / 0.06)',
          }}
        >
          <Sparkles
            className="h-6 w-6 flex-shrink-0 sm:h-7 sm:w-7"
            style={{ color: 'var(--ex-warm)' }}
          />
          <div className="flex min-w-0 flex-col items-center">
            <h1
              className="text-center font-medium tracking-wide"
              style={{
                fontFamily: 'var(--font-kids)',
                fontSize: 'var(--ex-name-size)',
                color: 'var(--ex-fg)',
                lineHeight: 1.25,
              }}
            >
              {exerciseName}
            </h1>
            {subtitle && (
              <p
                className="text-center font-semibold"
                style={{
                  fontFamily: 'var(--font-kids)',
                  fontSize: 'var(--ex-bullet-size)',
                  color: 'var(--ex-warm)',
                  lineHeight: 1.2,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      {action ? <div className="justify-self-end">{action}</div> : <div />}
    </header>
  );
}
