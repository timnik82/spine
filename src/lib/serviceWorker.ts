/**
 * Service-worker lifecycle helpers for PWA updates.
 *
 * Extracted from the `usePwaUpdate` hook so the React layer only owns state
 * and composition: registration, listener bookkeeping, and the one-shot
 * reload dance live here as plain, testable functions.
 */

export const SERVICE_WORKER_URL = '/sw.js';
export const SKIP_WAITING_MESSAGE = { type: 'SKIP_WAITING' } as const;

/**
 * How long `activateUpdate` waits for `controllerchange` before reloading on
 * its own. Safari does not always deliver the event, so the fallback is the
 * only thing that stops the "Update now" flow from hanging.
 */
export const UPDATE_RELOAD_FALLBACK_MS = 5_000;

/**
 * Register the service worker and report any worker that reaches the
 * `installed` (waiting) state. Returns a cleanup function that removes every
 * listener it attached; safe to call on a worker that never installed.
 *
 * @param onWaiting Called with a worker whose state is `installed` while a
 *   controller is already active. Never called for the very first install.
 */
export function watchServiceWorkerUpdates(
  onWaiting: (worker: ServiceWorker) => void
): () => void {
  if (!('serviceWorker' in navigator)) return () => {};

  let disposed = false;
  let registration: ServiceWorkerRegistration | null = null;
  // One statechange listener per installing worker, kept so it can be torn
  // down on unmount — otherwise every update would leak a new listener.
  const workerListeners = new Map<ServiceWorker, () => void>();

  const showIfWaiting = (worker: ServiceWorker | null) => {
    if (
      !disposed &&
      navigator.serviceWorker.controller &&
      worker?.state === 'installed'
    ) {
      onWaiting(worker);
    }
  };

  const onUpdateFound = () => {
    const installingWorker = registration?.installing;
    if (!installingWorker || workerListeners.has(installingWorker)) return;

    // The statechange listener is only wanted until the worker reaches a
    // terminal state. `installed` reports a waiting update; `redundant` means
    // the install failed or was superseded and can be dropped. Either way the
    // listener and its Map entry go, so the set stays bounded across updates.
    const onStateChange = () => {
      const state = installingWorker.state;
      if (state === 'installed') {
        showIfWaiting(installingWorker);
      }
      if (state === 'installed' || state === 'redundant') {
        installingWorker.removeEventListener('statechange', onStateChange);
        workerListeners.delete(installingWorker);
      }
    };
    workerListeners.set(installingWorker, onStateChange);
    installingWorker.addEventListener('statechange', onStateChange);
  };

  // Safari often skips background update discovery. Re-check when the app
  // returns to the foreground — but only via updatefound for a *new* worker.
  // Never call showIfWaiting(registration.waiting) on resume: dismiss is
  // UI-only and must keep the same waiting worker hidden until a newer build.
  const checkForUpdate = () => {
    if (disposed || !registration) return;
    void registration.update().catch(() => {
      // Update discovery is best-effort; failures must not affect the workout.
    });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate();
    }
  };

  const onFocus = () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate();
    }
  };

  void (async () => {
    try {
      registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
      if (disposed) return;

      showIfWaiting(registration.waiting);
      registration.addEventListener('updatefound', onUpdateFound);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('focus', onFocus);
    } catch {
      // A missing or unavailable service worker must not affect the workout.
    }
  })();

  return () => {
    disposed = true;
    registration?.removeEventListener('updatefound', onUpdateFound);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', onFocus);
    workerListeners.forEach((listener, worker) => {
      worker.removeEventListener('statechange', listener);
    });
    workerListeners.clear();
  };
}

/**
 * Tell `worker` to take over, then reload the page once it does — or after
 * `fallbackMs` if the browser never reports activation. Returns a cleanup
 * function that cancels both the timeout and the listener.
 *
 * @param reload Performs the reload, isolated so tests can observe it.
 */
export function activateUpdate(
  worker: ServiceWorker,
  reload: () => void,
  fallbackMs = UPDATE_RELOAD_FALLBACK_MS
): () => void {
  const serviceWorker = navigator.serviceWorker;

  let reloaded = false;
  const cleanupReload = () => {
    window.clearTimeout(fallbackReload);
    serviceWorker.removeEventListener('controllerchange', reloadOnce);
  };
  const reloadOnce = () => {
    if (reloaded) return;
    reloaded = true;
    cleanupReload();
    reload();
  };
  const fallbackReload = window.setTimeout(reloadOnce, fallbackMs);

  serviceWorker.addEventListener('controllerchange', reloadOnce, {
    once: true,
  });
  worker.postMessage(SKIP_WAITING_MESSAGE);

  return cleanupReload;
}
