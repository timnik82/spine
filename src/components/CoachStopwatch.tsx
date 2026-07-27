import { useEffect, useRef, useState } from 'react';
import stopwatchMarkup from '@/assets/stopwatch.svg?raw';
import {
  playStopwatchPress,
  playStopwatchRelease,
  unlockStopwatchSounds,
} from '@/lib/sounds';

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

/** Matches the CSS transform transition on the crown / side stem. */
const PRESS_TRANSITION_MS = 100;
/** Hold long enough for the down stroke to finish and a fully-pressed frame to show. */
export const MIN_PRESS_HOLD_MS = PRESS_TRANSITION_MS + 20;

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
      topBtn.style.transition = `transform ${PRESS_TRANSITION_MS}ms ease`;
      topBtn.style.touchAction = 'none';
    }
    if (sideBtn) {
      sideBtn.style.touchAction = 'none';
    }
    if (sideStem) {
      sideStem.style.transition = `transform ${PRESS_TRANSITION_MS}ms ease`;
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
    let topPressStartedAt = 0;
    let topReleaseTimer: ReturnType<typeof setTimeout> | null = null;
    let disarmTopReleaseListeners: () => void = () => {};

    const clearTopReleaseTimer = () => {
      if (topReleaseTimer !== null) {
        clearTimeout(topReleaseTimer);
        topReleaseTimer = null;
      }
    };

    const springTopButton = () => {
      topReleaseTimer = null;
      if (topBtn) topBtn.style.transform = '';
      playStopwatchRelease();
    };

    const scheduleTopSpring = () => {
      const remaining = Math.max(0, MIN_PRESS_HOLD_MS - (performance.now() - topPressStartedAt));
      clearTopReleaseTimer();
      if (remaining === 0) {
        springTopButton();
      } else {
        topReleaseTimer = setTimeout(springTopButton, remaining);
      }
    };

    /**
     * Finger-up path: toggle immediately for timer responsiveness, but keep the
     * crown visually down until the min hold so fast taps still reach the case.
     */
    const releaseTopButton = (e: PointerEvent, { toggle = false } = {}) => {
      if (topPointerId === null || e.pointerId !== topPointerId) return false;
      const pointerId = e.pointerId;
      topPointerId = null;
      disarmTopReleaseListeners();
      releaseCaptureFrom(topBtn, pointerId);
      if (toggle) onToggleRef.current?.();
      scheduleTopSpring();
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
      clearTopReleaseTimer();
      topPointerId = null;
      disarmTopReleaseListeners();
      if (topBtn) topBtn.style.transform = '';
    };

    const handleTopDown = (e: PointerEvent) => {
      if (topPointerId !== null) return;
      // A pending spring from a prior fast tap would fight this new press.
      clearTopReleaseTimer();
      unlockStopwatchSounds();
      topPointerId = e.pointerId;
      topPressStartedAt = performance.now();
      if (topBtn) topBtn.style.transform = `translateY(${TOP_PRESS_DISTANCE_PX}px)`;
      playStopwatchPress();
      try {
        topBtn?.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore pointer capture errors if unsupported
      }
      if (!topBtn?.hasPointerCapture?.(e.pointerId)) {
        armTopReleaseListeners();
      }
    };
    const handleTopUp = (e: PointerEvent) => {
      releaseTopButton(e, { toggle: true });
    };
    const handleTopCancel = (e: PointerEvent) => {
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
    let sidePressStartedAt = 0;
    let sideReleaseTimer: ReturnType<typeof setTimeout> | null = null;
    let disarmSideReleaseListeners: () => void = () => {};

    const clearSideReleaseTimer = () => {
      if (sideReleaseTimer !== null) {
        clearTimeout(sideReleaseTimer);
        sideReleaseTimer = null;
      }
    };

    const springSideButton = () => {
      sideReleaseTimer = null;
      setSidePressed(false);
    };

    const scheduleSideSpring = () => {
      const remaining = Math.max(0, MIN_PRESS_HOLD_MS - (performance.now() - sidePressStartedAt));
      clearSideReleaseTimer();
      if (remaining === 0) {
        springSideButton();
      } else {
        sideReleaseTimer = setTimeout(springSideButton, remaining);
      }
    };

    const releaseSideButton = (e: PointerEvent, { invokeReset = false } = {}) => {
      if (sidePointerId === null || e.pointerId !== sidePointerId) return false;
      const pointerId = e.pointerId;
      sidePointerId = null;
      disarmSideReleaseListeners();
      releaseCaptureFrom(sideBtn, pointerId);
      if (invokeReset) onResetRef.current?.();
      scheduleSideSpring();
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
      clearSideReleaseTimer();
      sidePointerId = null;
      disarmSideReleaseListeners();
      setSidePressed(false);
    };

    const handleSideDown = (e: PointerEvent) => {
      if (sidePointerId !== null) return;
      clearSideReleaseTimer();
      sidePointerId = e.pointerId;
      sidePressStartedAt = performance.now();
      setSidePressed(true);
      try {
        sideBtn?.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore pointer capture errors if unsupported
      }
      if (!sideBtn?.hasPointerCapture?.(e.pointerId)) {
        armSideReleaseListeners();
      }
    };
    const handleSideUp = (e: PointerEvent) => {
      releaseSideButton(e, { invokeReset: true });
    };
    const handleSideCancel = (e: PointerEvent) => {
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
    }
    if (sideBtn) {
      sideBtn.style.cursor = 'pointer';
      sideBtn.addEventListener('pointerdown', handleSideDown as EventListener);
      sideBtn.addEventListener('pointerup', handleSideUp as EventListener);
      sideBtn.addEventListener('pointercancel', handleSideCancel as EventListener);
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
      }
      if (sideBtn) {
        sideBtn.removeEventListener('pointerdown', handleSideDown as EventListener);
        sideBtn.removeEventListener('pointerup', handleSideUp as EventListener);
        sideBtn.removeEventListener('pointercancel', handleSideCancel as EventListener);
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
