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

    if (topBtn) topBtn.style.transition = 'transform 0.1s';
    if (sideBtn) sideBtn.style.transition = 'transform 0.1s';

    let topPressed = false;
    const handleTopDown = () => {
      topPressed = true;
      if (topBtn) topBtn.style.transform = 'translateY(30px)';
    };
    const handleTopUp = () => {
      if (!topPressed) return;
      topPressed = false;
      if (topBtn) topBtn.style.transform = '';
      onToggleRef.current?.();
    };
    const handleTopLeave = () => {
      if (!topPressed) return;
      topPressed = false;
      if (topBtn) topBtn.style.transform = '';
    };

    let sidePressed = false;
    const handleSideDown = () => {
      sidePressed = true;
      if (sideBtn) sideBtn.style.transform = 'translate(8px, 12px)';
    };
    const handleSideUp = () => {
      if (!sidePressed) return;
      sidePressed = false;
      if (sideBtn) sideBtn.style.transform = '';
      onResetRef.current?.();
    };
    const handleSideLeave = () => {
      if (!sidePressed) return;
      sidePressed = false;
      if (sideBtn) sideBtn.style.transform = '';
    };

    if (topBtn) {
      topBtn.addEventListener('pointerdown', handleTopDown);
      topBtn.addEventListener('pointerup', handleTopUp);
      topBtn.addEventListener('pointerleave', handleTopLeave);
    }
    if (sideBtn) {
      sideBtn.addEventListener('pointerdown', handleSideDown);
      sideBtn.addEventListener('pointerup', handleSideUp);
      sideBtn.addEventListener('pointerleave', handleSideLeave);
    }

    return () => {
      if (topBtn) {
        topBtn.removeEventListener('pointerdown', handleTopDown);
        topBtn.removeEventListener('pointerup', handleTopUp);
        topBtn.removeEventListener('pointerleave', handleTopLeave);
      }
      if (sideBtn) {
        sideBtn.removeEventListener('pointerdown', handleSideDown);
        sideBtn.removeEventListener('pointerup', handleSideUp);
        sideBtn.removeEventListener('pointerleave', handleSideLeave);
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
      className="relative h-[min(55vw,20rem)] w-[min(55vw,20rem)] overflow-hidden sm:h-[24rem] sm:w-[24rem]"
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
