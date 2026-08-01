import { useCallback, useEffect, useRef, useState } from 'react';

export const UPDATE_RELOAD_FALLBACK_MS = 5_000;
const reloadPage = () => window.location.reload();

export function usePwaUpdate(reloadPageNow = reloadPage) {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const reloadCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let disposed = false;
    let registration: ServiceWorkerRegistration | null = null;
    const workerListeners = new Map<ServiceWorker, () => void>();

    const showWaitingWorker = (worker: ServiceWorker | null) => {
      if (
        !disposed &&
        navigator.serviceWorker.controller &&
        worker?.state === 'installed'
      ) {
        setWaitingWorker(worker);
      }
    };

    const onUpdateFound = () => {
      const installingWorker = registration?.installing;
      if (!installingWorker || workerListeners.has(installingWorker)) return;

      const onStateChange = () => {
        if (installingWorker.state === 'installed') {
          showWaitingWorker(installingWorker);
        }
      };
      workerListeners.set(installingWorker, onStateChange);
      installingWorker.addEventListener('statechange', onStateChange);
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');
        if (disposed) return;

        showWaitingWorker(registration.waiting);
        registration.addEventListener('updatefound', onUpdateFound);
      } catch {
        // A missing or unavailable service worker must not affect the workout.
      }
    };

    void register();

    return () => {
      disposed = true;
      registration?.removeEventListener('updatefound', onUpdateFound);
      workerListeners.forEach((listener, worker) => {
        worker.removeEventListener('statechange', listener);
      });
      workerListeners.clear();
      reloadCleanupRef.current?.();
      reloadCleanupRef.current = null;
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;

    setIsApplying(true);
    reloadCleanupRef.current?.();
    const serviceWorker = navigator.serviceWorker;

    let reloaded = false;
    const cleanupReload = () => {
      window.clearTimeout(fallbackReload);
      serviceWorker.removeEventListener('controllerchange', reload);
    };
    const reload = () => {
      if (reloaded) return;
      reloaded = true;
      cleanupReload();
      reloadPageNow();
    };
    const fallbackReload = window.setTimeout(reload, UPDATE_RELOAD_FALLBACK_MS);

    serviceWorker.addEventListener('controllerchange', reload, {
      once: true,
    });
    reloadCleanupRef.current = cleanupReload;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [reloadPageNow, waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setWaitingWorker(null);
  }, []);

  return {
    updateAvailable: waitingWorker !== null,
    isApplying,
    applyUpdate,
    dismissUpdate,
  };
}
