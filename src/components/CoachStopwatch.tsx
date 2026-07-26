import { useEffect, useRef, useState } from 'react';
import stopwatchMarkup from '@/assets/stopwatch.svg?raw';

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

    const releaseCapture = (e: PointerEvent) => {
      try {
        if ((e.currentTarget as Element)?.hasPointerCapture?.(e.pointerId)) {
          (e.currentTarget as Element)?.releasePointerCapture?.(e.pointerId);
        }
      } catch {
        // ignore pointer capture release errors
      }
    };

    let topPressed = false;
    const handleTopDown = (e: PointerEvent) => {
      topPressed = true;
      try {
        (e.currentTarget as Element)?.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore pointer capture errors if unsupported
      }
      if (topBtn) topBtn.style.transform = `translateY(${TOP_PRESS_DISTANCE_PX}px)`;
    };
    const handleTopUp = (e: PointerEvent) => {
      releaseCapture(e);
      if (!topPressed) return;
      topPressed = false;
      if (topBtn) topBtn.style.transform = '';
      onToggleRef.current?.();
    };
    const handleTopCancel = (e: PointerEvent) => {
      releaseCapture(e);
      if (!topPressed) return;
      topPressed = false;
      if (topBtn) topBtn.style.transform = '';
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

    let sidePressed = false;
    const handleSideDown = (e: PointerEvent) => {
      sidePressed = true;
      try {
        (e.currentTarget as Element)?.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore pointer capture errors if unsupported
      }
      setSidePressed(true);
    };
    const handleSideUp = (e: PointerEvent) => {
      releaseCapture(e);
      if (!sidePressed) return;
      sidePressed = false;
      setSidePressed(false);
      onResetRef.current?.();
    };
    const handleSideCancel = (e: PointerEvent) => {
      releaseCapture(e);
      if (!sidePressed) return;
      sidePressed = false;
      setSidePressed(false);
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

    return () => {
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
