/**
 * Debug-only render counter behind the ?debug URL flag (issue #11). App bumps
 * it once per render; PerfBadge reads it once per second. Cheap enough to
 * leave in production so the render rate can be checked on the target tablet.
 */
export const renderProbe = {
  count: 0,
};
