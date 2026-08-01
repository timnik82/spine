import { useCallback, useEffect, useRef, useState } from 'react';

export const UPDATE_RELOAD_FALLBACK_MS = 5_000;

export function usePwaUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const reloadCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let disposed = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        const showWaitingWorker = (worker: ServiceWorker | null) => {
          if (
            !disposed &&
            navigator.serviceWorker.controller &&
            worker?.state === 'installed'
          ) {
            setWaitingWorker(worker);
          }
        };

        showWaitingWorker(registration.waiting);

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              showWaitingWorker(installingWorker);
            }
          });
        });
      } catch {
        // A missing or unavailable service worker must not affect the workout.
      }
    };

    void register();

    return () => {
      disposed = true;
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
      window.location.reload();
    };
    const fallbackReload = window.setTimeout(reload, UPDATE_RELOAD_FALLBACK_MS);

    serviceWorker.addEventListener('controllerchange', reload, {
      once: true,
    });
    reloadCleanupRef.current = cleanupReload;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingWorker]);

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
