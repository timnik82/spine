import * as Sentry from '@sentry/react';

/**
 * Initialise Sentry error reporting when a DSN is configured.
 *
 * Kept lean on purpose: this is a frontend-only kids' exercise app, so we
 * enable Issues (uncaught errors / rejections) and skip Session Replay,
 * User Feedback, and tracing until those are explicitly wanted.
 *
 * Must be imported before any other application modules in the entry point
 * (see https://docs.sentry.io/platforms/javascript/guides/react/).
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
  });
}

initSentry();
