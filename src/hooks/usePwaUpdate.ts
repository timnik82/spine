import { useCallback, useEffect, useRef, useState } from 'react';
import { activateUpdate, watchServiceWorkerUpdates } from '@/lib/serviceWorker';

const reloadPage = () => window.location.reload();

export function usePwaUpdate(reloadPageNow = reloadPage) {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const reloadCleanupRef = useRef<(() => void) | null>(null);

  useEffect(
    () => {
      const stopWatching = watchServiceWorkerUpdates(setWaitingWorker);
      return () => {
        stopWatching();
        reloadCleanupRef.current?.();
        reloadCleanupRef.current = null;
      };
    },
    []
  );

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;

    setIsApplying(true);
    reloadCleanupRef.current?.();
    reloadCleanupRef.current = activateUpdate(waitingWorker, reloadPageNow);
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
