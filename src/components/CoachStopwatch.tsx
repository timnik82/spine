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
/**
 * No real tap lasts this long. Past it we assume the release event was lost
 * (mobile browsers drop them) and let the button back up on its own.
 */
export const PRESS_WATCHDOG_MS = 2000;

interface PressControllerOptions {
  element: SVGGElement | null;
  setPressed: (pressed: boolean) => void;
  /** Runs on finger-up — never on cancel, watchdog or backgrounding. */
  onActivate: () => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
}

/**
 * Press lifecycle for one SVG button.
 *
 * Release is tracked on `window` rather than on the button itself: on mobile
 * the finger regularly ends up somewhere else by the time it lifts, and the
 * button element then never sees `pointerup`. Everything else here exists so
 * that a release event which never arrives at all can only ever cost one tap —
 * the watchdog puts the button back up, and the next press takes ownership.
 */
function createPressController({
  element,
  setPressed,
  onActivate,
  onPressStart,
  onPressEnd,
}: PressControllerOptions) {
  let pointerId: number | null = null;
  let pressedAt = 0;
  let pressedVisually = false;
  let springTimer: ReturnType<typeof setTimeout> | null = null;
  let watchdogTimer: ReturnType<typeof setTimeout> | null = null;

  const clearSpringTimer = () => {
    if (springTimer !== null) {
      clearTimeout(springTimer);
      springTimer = null;
    }
  };

  const clearWatchdogTimer = () => {
    if (watchdogTimer !== null) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
  };

  const spring = () => {
    springTimer = null;
    if (!pressedVisually) return;
    pressedVisually = false;
    setPressed(false);
    onPressEnd?.();
  };

  /** Finish a pending spring now, so rapid taps keep press/release pairs intact. */
  const flushSpring = () => {
    if (springTimer === null) return;
    clearSpringTimer();
    spring();
  };

  /**
   * Finger is up: the caller has already toggled, but hold the button visually
   * down until the min hold so fast taps still complete the down stroke.
   */
  const scheduleSpring = () => {
    clearSpringTimer();
    const remaining = Math.max(0, MIN_PRESS_HOLD_MS - (performance.now() - pressedAt));
    if (remaining === 0) {
      spring();
    } else {
      springTimer = setTimeout(spring, remaining);
    }
  };

  const handleWindowUp = (e: PointerEvent) => {
    endPress(e, { activate: true });
  };
  const handleWindowCancel = (e: PointerEvent) => {
    endPress(e, { activate: false });
  };

  const listenForRelease = () => {
    window.addEventListener('pointerup', handleWindowUp as EventListener);
    window.addEventListener('pointercancel', handleWindowCancel as EventListener);
  };

  const stopListeningForRelease = () => {
    window.removeEventListener('pointerup', handleWindowUp as EventListener);
    window.removeEventListener('pointercancel', handleWindowCancel as EventListener);
  };

  function endPress(e: PointerEvent, { activate }: { activate: boolean }) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    pointerId = null;
    stopListeningForRelease();
    clearWatchdogTimer();
    if (activate) onActivate();
    scheduleSpring();
  }

  /** Drop the gesture entirely: no activation, no click, button back up. */
  const abort = () => {
    clearSpringTimer();
    clearWatchdogTimer();
    pointerId = null;
    stopListeningForRelease();
    if (pressedVisually) {
      pressedVisually = false;
      setPressed(false);
    }
  };

  const handleDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (pointerId !== null) {
      // A live press owns the button — a second finger must not steal it.
      // Once the watchdog has given up on it, though, its release is never
      // coming, so this press takes over instead of being swallowed.
      if (pressedVisually) return;
      abort();
    }
    flushSpring();
    pointerId = e.pointerId;
    pressedAt = performance.now();
    pressedVisually = true;
    setPressed(true);
    onPressStart?.();
    listenForRelease();
    clearWatchdogTimer();
    watchdogTimer = setTimeout(() => {
      watchdogTimer = null;
      spring();
    }, PRESS_WATCHDOG_MS);
  };

  element?.addEventListener('pointerdown', handleDown as EventListener);

  return {
    abort,
    destroy: () => {
      abort();
      element?.removeEventListener('pointerdown', handleDown as EventListener);
    },
  };
}

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

  // Decode the click buffers up front so the very first tap already has sound.
  useEffect(() => {
    unlockStopwatchSounds();
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
      sideBtn.style.cursor = 'pointer';
      sideBtn.style.touchAction = 'none';
    }
    if (sideStem) {
      sideStem.style.transition = `transform ${PRESS_TRANSITION_MS}ms ease`;
    }

    const topController = createPressController({
      element: topBtn,
      setPressed: (pressed) => {
        if (topBtn) topBtn.style.transform = pressed ? `translateY(${TOP_PRESS_DISTANCE_PX}px)` : '';
      },
      onActivate: () => onToggleRef.current?.(),
      onPressStart: () => {
        unlockStopwatchSounds();
        playStopwatchPress();
      },
      onPressEnd: () => playStopwatchRelease(),
    });

    const sideController = createPressController({
      element: sideBtn,
      setPressed: (pressed) => {
        if (!sideStem) return;
        sideStem.setAttribute(
          'transform',
          pressed
            ? `${sideBaseTransform} translate(0 ${SIDE_PRESS_DISTANCE})`
            : sideBaseTransform
        );
      },
      onActivate: () => onResetRef.current?.(),
    });

    // Backgrounding or a system overlay swallows the release — drop the gesture.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        topController.abort();
        sideController.abort();
      }
    };
    const handleWindowBlur = () => {
      topController.abort();
      sideController.abort();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      topController.destroy();
      sideController.destroy();
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
