import { useEffect, useState } from 'react';

interface BatteryRepsProps {
  repsComplete: number;
  totalReps: number;
}

export function BatteryReps({ repsComplete, totalReps }: BatteryRepsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="progressbar"
      aria-valuenow={repsComplete}
      aria-valuemin={0}
      aria-valuemax={totalReps}
      aria-label={`${repsComplete} de ${totalReps} repetições concluídas`}
      className="flex flex-col items-center"
    >
      {/* Battery Terminal */}
      <div
        className="h-2.5 w-8 rounded-t-md border-4 border-b-0 sm:h-3 sm:w-10"
        aria-hidden="true"
        style={{
          backgroundColor: 'oklch(0.95 0.02 80)',
          borderColor: '#2f343a',
        }}
      />
      {/* Battery Body */}
      <div
        // A cell is the same size on every exercise, so the battery is as tall
        // as the set count and no taller: three sets read as three small cells
        // rather than three slabs stretched to fill a fixed case. The cap only
        // bites on long exercises, where the cells give way together.
        className="flex max-h-[min(18rem,55vw,max(6rem,calc(100vh_-_13rem)))] w-[clamp(4.5rem,12vw,6.5rem)] flex-col gap-1.5 rounded-[1.25rem] border-4 p-2.5 sm:gap-2 sm:p-3.5 landscape:max-h-[min(18rem,max(6rem,calc(100vh_-_7rem)))]"
        aria-hidden="true"
        style={{
          backgroundColor: 'oklch(0.95 0.02 80)',
          borderColor: '#2f343a',
        }}
      >
        {Array.from({ length: totalReps }, (_, index) => {
          const filled = index >= totalReps - repsComplete;
          return (
            <div
              key={index}
              className="h-4 min-h-0 shrink rounded-md border sm:h-5"
              style={{
                backgroundColor: filled
                  ? 'var(--ex-warm)'
                  : 'var(--ex-rest-soft)',
                borderColor: filled
                  ? 'var(--ex-warm)'
                  : 'oklch(0.85 0.03 200)',
                boxShadow: filled
                  ? '0 2px 10px rgb(204 107 58 / 0.18)'
                  : 'none',
                transition: reduceMotion
                  ? 'none'
                  : 'background-color 180ms ease, border-color 180ms ease, transform 180ms ease',
                transform: filled ? 'scaleX(1)' : 'scaleX(0.94)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduce;
}
