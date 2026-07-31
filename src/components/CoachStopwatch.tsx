import { useEffect, useRef, useState } from 'react';
import stopwatchMarkup from '@/assets/stopwatch.svg?raw';
import type { FrameSinkRef } from '@/hooks/useExerciseTimer';
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
  /**
   * When provided, the seconds hand is driven per animation frame through
   * this channel instead of React state (issue #11).
   */
  frameSink?: FrameSinkRef;
}

const DIAL_CENTER_X = 500;
const DIAL_CENTER_Y = 590;
/** Radius of the printed dial numbers (the `15` sits at x=671, y=590). */
const TARGET_LABEL_RADIUS = 171;
const TARGET_MARKER_ID = 'target-time-marker';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Only positive, finite durations have a place on the dial. */
function hasTargetMarker(total: number) {
  return Number.isFinite(total) && total > 0;
}

/**
 * The dial position (1–60) a `total`-second run finishes on. Whole minutes
 * land on 60 — the top — rather than on the zero that `% 60` would give.
 */
function targetDialSecond(total: number) {
  const remainder = total % 60;
  return remainder === 0 ? 60 : remainder;
}

/** Dial coordinates of the target label for a `total`-second run. */
function targetMarkerPoint(total: number) {
  const angle = ((targetDialSecond(total) % 60) * 6 * Math.PI) / 180;
  return {
    x: DIAL_CENTER_X + TARGET_LABEL_RADIUS * Math.sin(angle),
    y: DIAL_CENTER_Y - TARGET_LABEL_RADIUS * Math.cos(angle),
  };
}

/** `20`, `2 min`, `1:15` — never an ambiguous bare number past one minute. */
function formatTargetLabel(total: number) {
  const seconds = Math.round(total);
  if (seconds <= 60) return `${seconds}`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (rest === 0) return `${minutes} min`;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/**
 * The dial number already printed at (`x`, `y`), if it says the same thing the
 * target does. The artwork places 5…55 on exactly the radius the marker uses,
 * so every multiple-of-five duration up to a minute has one.
 */
function findPrintedDialNumber(root: ParentNode, x: number, y: number, text: string) {
  const numbers = root.querySelectorAll<SVGTextElement>('text');
  for (const element of numbers) {
    if (element.textContent?.trim() !== text) continue;
    const nx = Number(element.getAttribute('x'));
    const ny = Number(element.getAttribute('y'));
    if (Math.abs(nx - x) > 0.5 || Math.abs(ny - y) > 0.5) continue;
    return { element };
  }
  return null;
}

function setOrRemoveAttribute(element: Element, name: string, value: string | null) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/** Label for a target the dial does not already print — drawn from scratch. */
function buildTargetLabel(text: string) {
  const label = document.createElementNS(SVG_NS, 'text');
  label.setAttribute('class', 'stopwatch-target__label');
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('dominant-baseline', 'central');

  const minutes = /^(\d+) (min)$/.exec(text);
  if (!minutes) {
    label.textContent = text;
    return label;
  }

  // `2 min` on one line is wide enough to run into the neighbouring dial
  // numbers, so stack the unit under the count. The leading space keeps the
  // element's text reading "2 min"; SVG collapses it away when rendering.
  label.setAttribute('class', 'stopwatch-target__label stopwatch-target__label--stacked');
  const count = document.createElementNS(SVG_NS, 'tspan');
  count.setAttribute('x', '0');
  count.setAttribute('dy', '-10');
  count.textContent = minutes[1];
  const unit = document.createElementNS(SVG_NS, 'tspan');
  unit.setAttribute('class', 'stopwatch-target__unit');
  unit.setAttribute('x', '0');
  unit.setAttribute('dy', '32');
  unit.textContent = ` ${minutes[2]}`;
  label.append(count, unit);
  return label;
}

/** Seconds-hand rotation, in degrees, for `remaining` seconds of a `total`-second run. */
function handRotationDegrees(remaining: number, total: number) {
  return Math.max(0, total - remaining) * 6;
}

/** SVG transform attribute placing the seconds hand for `remaining`/`total`. */
function handTransform(remaining: number, total: number) {
  return `rotate(${handRotationDegrees(remaining, total)} ${DIAL_CENTER_X} ${DIAL_CENTER_Y})`;
}

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
    // Deliberately springs the button back *without* retiring the gesture: the
    // watchdog only promises the crown never looks stuck. A pointerup can only
    // ever be delivered for a finger that was genuinely still down, so a long
    // hold must still toggle on lift rather than be silently swallowed. The
    // takeover above is what covers a release that truly never arrives.
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
  frameSink,
}: CoachStopwatchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<SVGGElement | null>(null);
  const targetMarkerRef = useRef<SVGGElement | null>(null);
  /** One-shot latch: the reached animation plays once per run, not once per render at zero. */
  const hasReachedTargetRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  const elapsed = Math.max(0, totalSeconds - secondsRemaining);

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

  // Rotate the seconds hand using the SVG-native transform attribute. With a
  // frame sink the exercise timer pushes fractional seconds straight to the
  // hand on every animation frame — no React render involved (issue #11).
  // Without a sink (tests, standalone use) the hand follows whole-second
  // state instead.
  useEffect(() => {
    if (!frameSink) return;
    frameSink.current = (fractionalRemaining) => {
      handRef.current?.setAttribute('transform', handTransform(fractionalRemaining, totalSeconds));
    };
    return () => {
      frameSink.current = null;
    };
  }, [frameSink, totalSeconds]);

  useEffect(() => {
    if (frameSink || !handRef.current) return;
    handRef.current.setAttribute('transform', handTransform(secondsRemaining, totalSeconds));
  }, [secondsRemaining, totalSeconds, frameSink]);

  // Draw the target duration on the dial as a generated overlay layer, so the
  // artwork stays a single static file and every exercise can mark its own
  // duration. Rebuilt whenever the duration changes.
  useEffect(() => {
    if (!mounted) return;
    const hand = handRef.current;
    const parent = hand?.parentNode;
    if (!hand || !parent || !hasTargetMarker(totalSeconds)) return;

    const { x, y } = targetMarkerPoint(totalSeconds);

    const marker = document.createElementNS(SVG_NS, 'g');
    marker.setAttribute('id', TARGET_MARKER_ID);
    marker.setAttribute('class', 'stopwatch-target');
    // The position lives on the attribute; the pulse animates the inner group,
    // whose CSS transform would otherwise replace this one outright.
    marker.setAttribute('transform', `translate(${x} ${y})`);
    // Decorative: the duration is already in the screen's accessible labels.
    marker.setAttribute('aria-hidden', 'true');

    const pulse = document.createElementNS(SVG_NS, 'g');
    pulse.setAttribute('class', 'stopwatch-target__pulse');

    const text = formatTargetLabel(totalSeconds);

    const halo = document.createElementNS(SVG_NS, 'circle');
    halo.setAttribute('class', 'stopwatch-target__halo');
    halo.setAttribute('r', '36');
    pulse.append(halo);

    // Most durations land exactly on a printed dial number. Colour that number
    // instead of drawing a second one over it: two 15s stacked on the same spot
    // read as artwork gone wrong, not as a target.
    const adopted = findPrintedDialNumber(parent, x, y, text);
    let restore: (() => void) | null = null;

    if (adopted) {
      const { element } = adopted;
      const home = { parent: element.parentNode, next: element.nextSibling };
      const originalX = element.getAttribute('x');
      const originalY = element.getAttribute('y');
      const originalClass = element.getAttribute('class');
      // The group carries the position now, so the pulse scales the number in
      // place rather than around the dial's origin.
      element.setAttribute('x', '0');
      element.setAttribute('y', '0');
      element.setAttribute('class', 'stopwatch-target__label');
      pulse.append(element);
      restore = () => {
        setOrRemoveAttribute(element, 'x', originalX);
        setOrRemoveAttribute(element, 'y', originalY);
        setOrRemoveAttribute(element, 'class', originalClass);
        home.parent?.insertBefore(element, home.next);
      };
    } else {
      // Nothing was printed here, so the marker lands on whatever artwork the
      // dial has at that spot — at the top, the minutes sub-dial. An opaque
      // backdrop keeps the label from tangling with it.
      halo.setAttribute('class', 'stopwatch-target__halo stopwatch-target__halo--badge');
      halo.setAttribute('r', '44');
      pulse.append(buildTargetLabel(text));
    }

    marker.append(pulse);
    // Below the hand, which must stay readable as it sweeps past.
    parent.insertBefore(marker, hand);
    targetMarkerRef.current = marker;

    return () => {
      marker.remove();
      restore?.();
      targetMarkerRef.current = null;
      hasReachedTargetRef.current = false;
    };
  }, [mounted, totalSeconds]);

  // Reached state, driven by the countdown the timer already owns — not by hand
  // rotation or animation events, and without per-frame React state.
  useEffect(() => {
    const marker = targetMarkerRef.current;
    if (!marker) return;

    if (secondsRemaining > 0) {
      hasReachedTargetRef.current = false;
      // Guarded: this runs on every whole second, and an unguarded remove()
      // rewrites the attribute each time for nothing.
      if (marker.classList.contains('stopwatch-target--reached')) {
        marker.classList.remove('stopwatch-target--reached');
      }
      return;
    }
    // Later renders at zero must not restart the pulse.
    if (hasReachedTargetRef.current) return;
    hasReachedTargetRef.current = true;
    marker.classList.add('stopwatch-target--reached');
  }, [mounted, secondsRemaining, totalSeconds]);

  const timerLabel = `Cronometro: ${Math.floor(elapsed)} de ${totalSeconds} segundos`;

  return (
    <div
      // Fills the width its container leaves, capped so the dial never grows
      // taller than the viewport; the ratio matches the SVG's viewBox. The
      // reserve covers the title above and the buttons below, which now cost
      // the same in both orientations — landscape used to keep its buttons in a
      // side column and got a smaller reserve, and that is what let the dial
      // reach into them once they moved down.
      className="relative aspect-[640/760] w-[min(100%,calc((100vh_-_12rem)*0.842),44rem)] overflow-hidden"
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
