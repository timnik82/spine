import { useEffect, useRef, useState } from 'react';
import stopwatchMarkup from '@/assets/stopwatch.svg?raw';
import { playStopwatchPress, playStopwatchRelease } from '@/lib/sounds';

interface CoachStopwatchProps {
  secondsRemaining: number;
  totalSeconds: number;
  onToggle?: () => void;
  onReset?: () => void;
}

const DIAL_CENTER_X = 500;
const DIAL_CENTER_Y = 590;

/** Matches side pusher transform in stopwatch.svg (radial toward dial center) */
const SIDE_BUTTON_ROTATE = 'translate(55 48) rotate(33.5 620 278)';
/** Local +Y press depth in SVG user units — hat just kisses the case */
const SIDE_PRESS_DISTANCE = 26;
const TOP_PRESS_DISTANCE_PX = 28.5;

export function CoachStopwatch({
  secondsRemaining,
  totalSeconds,
  onToggle,
  onReset,
}: CoachStopwatchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<SVGGElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  const elapsed = Math.max(0, totalSeconds - secondsRemaining);
  const handAngle = elapsed * 6;

  // Mount the SVG once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = stopwatchMarkup;

    const svg = container.querySelector('svg');
    if (svg) {
      svg.setAttribute('aria-hidden', 'true');
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = '100%';
    }

    const hand = container.querySelector<SVGGElement>('#seconds-hand');
    handRef.current = hand;

    setMounted(true);

    return () => {
      container.innerHTML = '';
      handRef.current = null;
    };
  }, []);

  // Attach button interactions
  useEffect(() => {
    if (!mounted) return;
    const container = containerRef.current;
    if (!container) return;

    const topBtn = container.querySelector<SVGGElement>('#top-button');
    const sideBtn = container.querySelector<SVGGElement>('#side-button');
    // Inner group already has the 33.5° rotate — press along its local +Y
    const sideStem = sideBtn?.querySelector<SVGGElement>('g') ?? null;
    const sideBaseTransform = sideStem?.getAttribute('transform') || SIDE_BUTTON_ROTATE;

    if (topBtn) {
      topBtn.style.transition = 'transform 0.1s ease';
      topBtn.style.touchAction = 'none';
    }
    if (sideBtn) {
      sideBtn.style.touchAction = 'none';
    }
    if (sideStem) {
      sideStem.style.transition = 'transform 0.1s ease';
    }

    const releaseCaptureFrom = (el: Element | null | undefined, pointerId: number) => {
      try {
        if (el?.hasPointerCapture?.(pointerId)) {
          el.releasePointerCapture(pointerId);
        }
      } catch {
        // ignore pointer capture release errors
      }
    };

    // Holds the pointer that owns the press, so a second finger on the crown
    // cannot release the first one's press or leave its own unmatched.
    let topPointerId: number | null = null;
    let disarmTopReleaseListeners: () => void = () => {};

    /**
     * Lets the button back up. Cancelling springs it back just as releasing
     * does, so both paths click; only a real release toggles the timer.
     */
    const releaseTopButton = (e: PointerEvent, { toggle = false } = {}) => {
      releaseCaptureFrom(topBtn, e.pointerId);
      if (topPointerId === null || e.pointerId !== topPointerId) return false;
      topPointerId = null;
      disarmTopReleaseListeners();
      if (topBtn) topBtn.style.transform = '';
      playStopwatchRelease();
      if (toggle) onToggleRef.current?.();
      return true;
    };

    const handleWindowTopUp = (e: PointerEvent) => {
      releaseTopButton(e, { toggle: true });
    };
    const handleWindowTopCancel = (e: PointerEvent) => {
      releaseTopButton(e);
    };

    disarmTopReleaseListeners = () => {
      window.removeEventListener('pointerup', handleWindowTopUp as EventListener);
      window.removeEventListener('pointercancel', handleWindowTopCancel as EventListener);
    };

    const armTopReleaseListeners = () => {
      window.addEventListener('pointerup', handleWindowTopUp as EventListener);
      window.addEventListener('pointercancel', handleWindowTopCancel as EventListener);
    };

    const forceResetTopButton = () => {
      if (topPointerId === null) return;
      topPointerId = null;
      disarmTopReleaseListeners();
      if (topBtn) topBtn.style.transform = '';
    };

    const handleTopDown = (e: PointerEvent) => {
      if (topPointerId !== null) return;
      e.preventDefault();
      topPointerId = e.pointerId;
      try {
        topBtn?.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore pointer capture errors if unsupported
      }
      if (topBtn) topBtn.style.transform = `translateY(${TOP_PRESS_DISTANCE_PX}px)`;
      playStopwatchPress();
      armTopReleaseListeners();
    };
    const handleTopUp = (e: PointerEvent) => {
      releaseTopButton(e, { toggle: true });
    };
    const handleTopCancel = (e: PointerEvent) => {
      releaseTopButton(e);
    };
    const handleTopLostCapture = (e: PointerEvent) => {
      releaseTopButton(e);
    };

    const setSidePressed = (pressed: boolean) => {
      if (!sideStem) return;
      sideStem.setAttribute(
        'transform',
        pressed
          ? `${sideBaseTransform} translate(0 ${SIDE_PRESS_DISTANCE})`
          : sideBaseTransform
      );
    };

    let sidePointerId: number | null = null;
    let disarmSideReleaseListeners: () => void = () => {};

    const releaseSideButton = (e: PointerEvent, { invokeReset = false } = {}) => {
      releaseCaptureFrom(sideBtn, e.pointerId);
      if (sidePointerId === null || e.pointerId !== sidePointerId) return false;
      sidePointerId = null;
      disarmSideReleaseListeners();
      setSidePressed(false);
      if (invokeReset) onResetRef.current?.();
      return true;
    };

    const handleWindowSideUp = (e: PointerEvent) => {
      releaseSideButton(e, { invokeReset: true });
    };
    const handleWindowSideCancel = (e: PointerEvent) => {
      releaseSideButton(e);
    };

    disarmSideReleaseListeners = () => {
      window.removeEventListener('pointerup', handleWindowSideUp as EventListener);
      window.removeEventListener('pointercancel', handleWindowSideCancel as EventListener);
    };

    const armSideReleaseListeners = () => {
      window.addEventListener('pointerup', handleWindowSideUp as EventListener);
      window.addEventListener('pointercancel', handleWindowSideCancel as EventListener);
    };

    const forceResetSideButton = () => {
      if (sidePointerId === null) return;
      sidePointerId = null;
      disarmSideReleaseListeners();
      setSidePressed(false);
    };

    const handleSideDown = (e: PointerEvent) => {
      if (sidePointerId !== null) return;
      e.preventDefault();
      sidePointerId = e.pointerId;
      try {
        sideBtn?.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore pointer capture errors if unsupported
      }
      setSidePressed(true);
      armSideReleaseListeners();
    };
    const handleSideUp = (e: PointerEvent) => {
      releaseSideButton(e, { invokeReset: true });
    };
    const handleSideCancel = (e: PointerEvent) => {
      releaseSideButton(e);
    };
    const handleSideLostCapture = (e: PointerEvent) => {
      releaseSideButton(e);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        forceResetTopButton();
        forceResetSideButton();
      }
    };

    if (topBtn) {
      topBtn.addEventListener('pointerdown', handleTopDown as EventListener);
      topBtn.addEventListener('pointerup', handleTopUp as EventListener);
      topBtn.addEventListener('pointercancel', handleTopCancel as EventListener);
      topBtn.addEventListener('lostpointercapture', handleTopLostCapture as EventListener);
    }
    if (sideBtn) {
      sideBtn.style.cursor = 'pointer';
      sideBtn.addEventListener('pointerdown', handleSideDown as EventListener);
      sideBtn.addEventListener('pointerup', handleSideUp as EventListener);
      sideBtn.addEventListener('pointercancel', handleSideCancel as EventListener);
      sideBtn.addEventListener('lostpointercapture', handleSideLostCapture as EventListener);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      forceResetTopButton();
      forceResetSideButton();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (topBtn) {
        topBtn.removeEventListener('pointerdown', handleTopDown as EventListener);
        topBtn.removeEventListener('pointerup', handleTopUp as EventListener);
        topBtn.removeEventListener('pointercancel', handleTopCancel as EventListener);
        topBtn.removeEventListener('lostpointercapture', handleTopLostCapture as EventListener);
      }
      if (sideBtn) {
        sideBtn.removeEventListener('pointerdown', handleSideDown as EventListener);
        sideBtn.removeEventListener('pointerup', handleSideUp as EventListener);
        sideBtn.removeEventListener('pointercancel', handleSideCancel as EventListener);
        sideBtn.removeEventListener('lostpointercapture', handleSideLostCapture as EventListener);
      }
    };
  }, [mounted]);

  // Rotate the seconds hand using SVG-native transform attribute
  useEffect(() => {
    if (handRef.current) {
      handRef.current.setAttribute(
        'transform',
        `rotate(${handAngle} ${DIAL_CENTER_X} ${DIAL_CENTER_Y})`
      );
    }
  }, [handAngle]);

  const timerLabel = `Cronometro: ${Math.floor(elapsed)} de ${totalSeconds} segundos`;

  return (
    <div
      // Fills the width its container leaves, capped so the dial never grows
      // taller than the viewport; the ratio matches the SVG's viewBox.
      className="relative aspect-[640/760] w-[min(100%,calc((100vh_-_12rem)*0.842),44rem)] overflow-hidden landscape:w-[min(100%,calc((100vh_-_7rem)*0.842),44rem)]"
      role="img"
      aria-label={timerLabel}
    >
      <div
        ref={containerRef}
        className="h-full w-full drop-shadow-[0_10px_12px_rgb(34_29_24_/_0.16)]"
      />
    </div>
  );
}
