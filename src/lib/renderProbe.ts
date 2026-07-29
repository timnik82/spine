/**
 * Debug-only render counter behind the ?debug URL flag (issue #11). App bumps
 * it once per render; PerfBadge reads it once per second. Left in production
 * so the render rate can be checked on the target tablet, but gated on the
 * flag so the normal path pays nothing for it.
 */
export const renderProbeEnabled = new URLSearchParams(
  window.location.search
).has('debug');

export const renderProbe = {
  count: 0,
};
