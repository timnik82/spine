import { useEffect, useRef, useState } from 'react';

interface CoachStopwatchProps {
  secondsRemaining: number;
  totalSeconds: number;
  onToggle?: () => void;
  onReset?: () => void;
}

const STOPWATCH_IMAGE_URL =
  'https://cdn.magicpatterns.com/uploads/4gzFNatpQx9nB2mpjWNdLE/agat_stopwatch_vector.svg';

export function CoachStopwatch({
  secondsRemaining,
  totalSeconds,
  onToggle,
  onReset,
}: CoachStopwatchProps) {
  const stopwatchRef = useRef<HTMLDivElement>(null);
  const secondsHandsRef = useRef<SVGGraphicsElement[]>([]);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  const reduceMotion = useReducedMotion();
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  const preciseElapsedSeconds = Math.max(0, totalSeconds - secondsRemaining);
  const elapsedSeconds = Math.min(totalSeconds, Math.floor(preciseElapsedSeconds));
  const handElapsedSeconds = reduceMotion ? elapsedSeconds : preciseElapsedSeconds;
  const handAngle = handElapsedSeconds * 6;
  const timerLabel = `Cronómetro: ${elapsedSeconds} de ${totalSeconds} segundos`;

  useEffect(() => {
    const controller = new AbortController();

    async function loadSvg() {
      try {
        const response = await fetch(STOPWATCH_IMAGE_URL, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Unable to load stopwatch SVG');
        const markup = await response.text();
        setSvgMarkup(sanitizeSvgMarkup(markup));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setHasLoadError(true);
      }
    }

    void loadSvg();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!svgMarkup || !stopwatchRef.current) return;

    const svg = stopwatchRef.current.querySelector('svg');
    if (!svg) {
      setHasLoadError(true);
      return;
    }

    svg.setAttribute('aria-hidden', 'true');
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.background = 'transparent';

    hideBackgroundRects(svg);

    const hands = findSecondsHands(svg);
    if (hands.length === 0) {
      setHasLoadError(true);
      return;
    }

    const dialCenter = getDialCenter(svg);
    hands.forEach((hand) => {
      hand.style.transformBox = 'view-box';
      hand.style.transformOrigin = dialCenter;
      hand.style.transition = 'none';
    });
    secondsHandsRef.current = hands;
  }, [svgMarkup, reduceMotion]);

  useEffect(() => {
    if (!svgMarkup || !stopwatchRef.current) return;
    const svg = stopwatchRef.current.querySelector('svg');
    if (!svg) return;

    const topBtn = svg.querySelector('#top-button') as SVGGElement | null;
    const sideBtn = svg.querySelector('#side-button') as SVGGElement | null;

    let topPressed = false;
    const handleTopDown = () => {
      topPressed = true;
      if (topBtn) topBtn.style.transform = 'translateY(33px)';
    };
    const handleTopUp = () => {
      if (!topPressed) return;
      topPressed = false;
      if (topBtn) topBtn.style.transform = 'translateY(0)';
      onToggleRef.current?.();
    };
    const handleTopLeave = () => {
      topPressed = false;
      if (topBtn) topBtn.style.transform = 'translateY(0)';
    };

    let sidePressed = false;
    const handleSideDown = () => {
      sidePressed = true;
      if (sideBtn) sideBtn.style.transform = 'translateY(32px)';
    };
    const handleSideUp = () => {
      if (!sidePressed) return;
      sidePressed = false;
      if (sideBtn) sideBtn.style.transform = 'translateY(0)';
      onResetRef.current?.();
    };
    const handleSideLeave = () => {
      sidePressed = false;
      if (sideBtn) sideBtn.style.transform = 'translateY(0)';
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
  }, [svgMarkup]);

  useEffect(() => {
    secondsHandsRef.current.forEach((hand) => {
      hand.style.transform = `rotate(${handAngle}deg)`;
    });
  }, [handAngle]);

  return (
    <div
      className="relative h-[min(55vw,20rem)] w-[min(55vw,20rem)] overflow-hidden sm:h-[24rem] sm:w-[24rem]"
      role="img"
      aria-label={timerLabel}
    >
      {svgMarkup && !hasLoadError ? (
        <div
          ref={stopwatchRef}
          className="h-full w-full drop-shadow-[0_10px_12px_rgb(34_29_24_/_0.16)]"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      ) : hasLoadError ? (
        <img
          src={STOPWATCH_IMAGE_URL}
          alt={timerLabel}
          className="h-full w-full object-contain drop-shadow-[0_10px_12px_rgb(34_29_24_/_0.16)]"
        />
      ) : (
        <div className="h-full w-full" aria-hidden="true" />
      )}
    </div>
  );
}

function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduce;
}

function findSecondsHands(svg: SVGSVGElement): SVGGraphicsElement[] {
  const { x, y, width, height } = svg.viewBox.baseVal;
  const centerX = x + width / 2;
  const minimumHandHeight = height * 0.17;
  const maximumHandWidth = width * 0.08;

  return Array.from(
    svg.querySelectorAll<SVGGraphicsElement>('path, line, polyline, polygon, rect')
  )
    .map((element) => ({ element, bounds: element.getBBox() }))
    .filter(
      ({ bounds }) =>
        bounds.height >= minimumHandHeight &&
        bounds.width <= maximumHandWidth &&
        bounds.x <= centerX + width * 0.03 &&
        bounds.x + bounds.width >= centerX - width * 0.03 &&
        bounds.y >= y + height * 0.25 &&
        bounds.y + bounds.height >= y + height * 0.59 - height * 0.05
    )
    .map((item) => item.element);
}

function getDialCenter(svg: SVGSVGElement): string {
  const { x, y, width, height } = svg.viewBox.baseVal;
  return `${x + width / 2}px ${y + height * 0.59}px`;
}

function hideBackgroundRects(svg: SVGSVGElement) {
  try {
    const { width, height } = svg.viewBox.baseVal;
    const elements = svg.querySelectorAll('rect, path');
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as SVGGraphicsElement;
      const fill = (el.getAttribute('fill') || '').toLowerCase().trim();
      const isWhitish =
        fill === '#ffffff' ||
        fill === '#fff' ||
        fill === 'white' ||
        fill === '#f5f5f5' ||
        fill === '#fafafa' ||
        fill === '#f0f0f0' ||
        fill === '#eeeeee' ||
        fill === '#eee' ||
        fill.startsWith('rgb(255') ||
        fill.startsWith('rgb(250') ||
        fill.startsWith('rgb(245');

      if (isWhitish) {
        const bbox = el.getBBox();
        if (bbox.width >= width * 0.9 && bbox.height >= height * 0.9) {
          (el as unknown as HTMLElement).style.display = 'none';
        }
      } else if (el.tagName.toLowerCase() === 'rect') {
        const rect = el as unknown as SVGRectElement;
        if (
          rect.width.baseVal.value >= width * 0.9 &&
          rect.height.baseVal.value >= height * 0.9
        ) {
          (el as unknown as HTMLElement).style.display = 'none';
        }
      }
    }
  } catch {
    // ignore
  }
}

function sanitizeSvgMarkup(markup: string): string {
  let sanitized = markup
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  const newRing = `<!-- top suspension ring -->
<g transform="translate(0, 32)">
  <g id="top-ring">
    <circle cx="500" cy="185" r="75" fill="none" stroke="#2f343a" stroke-width="10"/>
    <circle cx="500" cy="185" r="72" fill="none" stroke="url(#chrome)" stroke-width="6"/>
    <path d="M440 145 A72 72 0 0 1 540 125" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.75"/>
    <path d="M440 225 A72 72 0 0 0 540 245" fill="none" stroke="#20252a" stroke-width="2" opacity="0.55"/>
  </g>
</g>
<!-- central winding stem -->`;

  sanitized = sanitized.replace(
    /<!-- top suspension ring -->[\s\S]*?<!-- central winding stem -->/,
    newRing
  );

  sanitized = sanitized.replace(
    /(<rect x="475" y="223"[\s\S]*?)(?=<!-- side pusher -->)/,
    '<g transform="translate(0, 32)"><g id="top-button" style="cursor: pointer; transition: transform 0.1s;">$1</g></g>\n'
  );

  sanitized = sanitized.replace(
    /(<rect x="601" y="270"[\s\S]*?)(?=<\/g>\s*<!-- case -->)/,
    '<g transform="translate(0, 31)"><g id="side-button" style="cursor: pointer; transition: transform 0.1s;">$1</g></g>'
  );

  return sanitized;
}
