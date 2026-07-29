import { useEffect, useState } from 'react';
import { renderProbe, renderProbeEnabled } from '@/lib/renderProbe';

/**
 * Renders-per-second readout for verifying issue #11 on a real device. Only
 * appears when the URL carries ?debug. Samples once a second, and its own
 * state is local, so the badge never adds to the App render rate it reports.
 */
export function PerfBadge() {
  const [rendersPerSecond, setRendersPerSecond] = useState(0);

  useEffect(() => {
    if (!renderProbeEnabled) return;
    let last = renderProbe.count;
    const id = setInterval(() => {
      const now = renderProbe.count;
      setRendersPerSecond(now - last);
      last = now;
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!renderProbeEnabled) return null;

  return (
    <output
      aria-hidden="true"
      className="pointer-events-none fixed bottom-1 left-1 z-50 rounded bg-black/60 px-2 py-1 font-mono text-xs text-white"
    >
      {rendersPerSecond} renders/s
    </output>
  );
}
