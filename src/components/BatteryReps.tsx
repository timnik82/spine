interface BatteryRepsProps {
  repsComplete: number;
  totalReps: number;
}

export function BatteryReps({ repsComplete, totalReps }: BatteryRepsProps) {
  const reduceMotion = useReducedMotionSimple();

  return (
    <div className="flex flex-col items-center" aria-label="Bateria de repetições">
      {/* Battery Terminal */}
      <div
        className="h-2.5 w-8 rounded-t-md border-4 border-b-0 sm:h-3 sm:w-10"
        style={{
          backgroundColor: 'oklch(0.95 0.02 80)',
          borderColor: '#2f343a',
        }}
      />
      {/* Battery Body */}
      <div
        className="flex h-[min(55vw,18rem)] w-[clamp(4.5rem,12vw,6.5rem)] flex-col gap-1.5 rounded-[1.25rem] border-4 p-2.5 sm:h-72 sm:gap-2 sm:p-3.5"
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
              aria-hidden="true"
              className="min-h-0 flex-1 rounded-md border"
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

function useReducedMotionSimple(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
