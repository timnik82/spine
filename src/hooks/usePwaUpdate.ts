import { useCallback, useEffect, useState } from 'react';

type WaitingWorker = ServiceWorker;

export function usePwaUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<WaitingWorker | null>(null);
  const [isApplying, setIsApplying] = useState(false);

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
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;

    setIsApplying(true);
    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', reload, {
      once: true,
    });
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
