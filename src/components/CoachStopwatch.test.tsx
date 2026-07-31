import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playStopwatchPress, playStopwatchRelease } from '@/lib/sounds';
import { CoachStopwatch, MIN_PRESS_HOLD_MS, PRESS_WATCHDOG_MS } from './CoachStopwatch';

vi.mock('@/lib/sounds', () => ({
  playStopwatchPress: vi.fn(),
  playStopwatchRelease: vi.fn(),
  unlockStopwatchSounds: vi.fn(),
}));

function pointerEvent(
  type: string,
  pointerId: number,
  { pointerType = 'touch', button = 0 }: { pointerType?: string; button?: number } = {}
) {
  return new PointerEvent(type, { bubbles: true, pointerId, pointerType, button });
}

async function renderStopwatch(onToggle = vi.fn()) {
  const view = render(
    <CoachStopwatch secondsRemaining={10} totalSeconds={10} onToggle={onToggle} />
  );
  await waitFor(() => {
    expect(getTopButton(view.container)).toBeTruthy();
  });
  return view;
}

function getTopButton(container: HTMLElement) {
  return container.querySelector<SVGGElement>('svg [id="top-button"]');
}

/** Finish the min-hold spring that fast taps schedule after finger-up. */
function flushPressHold() {
  act(() => {
    vi.advanceTimersByTime(MIN_PRESS_HOLD_MS);
  });
}

describe('CoachStopwatch crown button', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'performance',
        'Date',
      ],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  it('toggles immediately and springs back after a slow press', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    expect(topBtn.style.transform).toContain('translateY');

    act(() => {
      vi.advanceTimersByTime(MIN_PRESS_HOLD_MS);
    });

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerup', 1));
    });

    expect(topBtn.style.transform).toBe('');
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(playStopwatchPress).toHaveBeenCalledTimes(1);
    expect(playStopwatchRelease).toHaveBeenCalledTimes(1);
  });

  it('keeps the crown fully pressed through a fast tap, then springs back', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerup', 1));
    });

    // Finger already up: timer toggled, but visual still completing the down stroke.
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(topBtn.style.transform).toContain('translateY');
    expect(playStopwatchPress).toHaveBeenCalledTimes(1);
    expect(playStopwatchRelease).not.toHaveBeenCalled();

    flushPressHold();

    expect(topBtn.style.transform).toBe('');
    expect(playStopwatchRelease).toHaveBeenCalledTimes(1);
  });

  it('resets after pointercancel without toggling, once the min hold elapses', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointercancel', 1));
    });

    expect(onToggle).not.toHaveBeenCalled();
    expect(topBtn.style.transform).toContain('translateY');

    flushPressHold();

    expect(topBtn.style.transform).toBe('');
    expect(playStopwatchPress).toHaveBeenCalledTimes(1);
    expect(playStopwatchRelease).toHaveBeenCalledTimes(1);
  });

  it('releases and toggles when pointerup arrives on window', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
      vi.advanceTimersByTime(MIN_PRESS_HOLD_MS);
    });

    act(() => {
      window.dispatchEvent(pointerEvent('pointerup', 1));
    });

    expect(topBtn.style.transform).toBe('');
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(playStopwatchPress).toHaveBeenCalledTimes(1);
    expect(playStopwatchRelease).toHaveBeenCalledTimes(1);
  });

  it('resets on visibilitychange mid-hold without toggling or release sound', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerup', 1));
    });
    expect(topBtn.style.transform).toContain('translateY');
    expect(onToggle).toHaveBeenCalledTimes(1);

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(topBtn.style.transform).toBe('');
    expect(playStopwatchPress).toHaveBeenCalledTimes(1);
    expect(playStopwatchRelease).not.toHaveBeenCalled();

    // A cancelled hold must not fire a delayed release later.
    flushPressHold();
    expect(playStopwatchRelease).not.toHaveBeenCalled();
  });

  it('ignores a second pointerdown while the first press is active', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 2));
    });

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerup', 1));
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(playStopwatchPress).toHaveBeenCalledTimes(1);

    flushPressHold();

    expect(topBtn.style.transform).toBe('');
    expect(playStopwatchRelease).toHaveBeenCalledTimes(1);
  });

  it('plays release sound once when pointerup fires on both element and window', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
      vi.advanceTimersByTime(MIN_PRESS_HOLD_MS);
    });
    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerup', 1));
      window.dispatchEvent(pointerEvent('pointerup', 1));
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(playStopwatchPress).toHaveBeenCalledTimes(1);
    expect(playStopwatchRelease).toHaveBeenCalledTimes(1);
  });

  it('completes the pending release sound before a second rapid tap', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
      topBtn.dispatchEvent(pointerEvent('pointerup', 1));
    });
    expect(playStopwatchRelease).not.toHaveBeenCalled();

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 2));
    });

    expect(playStopwatchRelease).toHaveBeenCalledTimes(1);
    expect(playStopwatchPress).toHaveBeenCalledTimes(2);
    expect(topBtn.style.transform).toContain('translateY');

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerup', 2));
    });
    flushPressHold();

    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(playStopwatchRelease).toHaveBeenCalledTimes(2);
  });

  it('springs back on its own when the release event never arrives', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      vi.advanceTimersByTime(PRESS_WATCHDOG_MS);
    });

    expect(topBtn.style.transform).toBe('');
    expect(onToggle).not.toHaveBeenCalled();
    expect(playStopwatchRelease).toHaveBeenCalledTimes(1);
  });

  it('still toggles if the finger lifts after the watchdog gave up', async () => {
    // The watchdog only guarantees the crown never *looks* stuck. A pointerup
    // can only be delivered for a finger that was genuinely still down, so a
    // long hold must not be silently swallowed.
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      vi.advanceTimersByTime(PRESS_WATCHDOG_MS);
    });
    expect(topBtn.style.transform).toBe('');

    act(() => {
      window.dispatchEvent(pointerEvent('pointerup', 1));
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(topBtn.style.transform).toBe('');
    // The pair already closed when the watchdog sprang it — no second click.
    expect(playStopwatchRelease).toHaveBeenCalledTimes(1);
  });

  it('does not toggle on a cancel that arrives after the watchdog', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      vi.advanceTimersByTime(PRESS_WATCHDOG_MS);
    });
    act(() => {
      window.dispatchEvent(pointerEvent('pointercancel', 1));
    });

    expect(onToggle).not.toHaveBeenCalled();
    expect(topBtn.style.transform).toBe('');
  });

  it('lets the next tap take over after a release event was lost', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      vi.advanceTimersByTime(PRESS_WATCHDOG_MS);
    });

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 2));
    });
    expect(topBtn.style.transform).toContain('translateY');
    expect(playStopwatchPress).toHaveBeenCalledTimes(2);

    act(() => {
      window.dispatchEvent(pointerEvent('pointerup', 2));
    });
    flushPressHold();

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(topBtn.style.transform).toBe('');
  });

  it('drops the press when the window loses focus mid-hold', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(topBtn.style.transform).toBe('');
    expect(onToggle).not.toHaveBeenCalled();
    expect(playStopwatchRelease).not.toHaveBeenCalled();

    // The stale finger-up must not toggle after the gesture was dropped.
    act(() => {
      window.dispatchEvent(pointerEvent('pointerup', 1));
    });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('ignores non-primary mouse button presses', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1, { pointerType: 'mouse', button: 2 }));
    });

    expect(topBtn.style.transform).toBe('');
    expect(playStopwatchPress).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe('CoachStopwatch target-duration marker', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  async function renderTimed(secondsRemaining: number, totalSeconds: number) {
    const view = render(
      <CoachStopwatch secondsRemaining={secondsRemaining} totalSeconds={totalSeconds} />
    );
    await waitFor(() => {
      expect(getTopButton(view.container)).toBeTruthy();
    });
    return view;
  }

  function getMarker(container: HTMLElement) {
    return container.querySelector<SVGGElement>('svg [id="target-time-marker"]');
  }

  function getLabel(container: HTMLElement) {
    return container.querySelector<SVGTextElement>('.stopwatch-target__label');
  }

  it('shows the target duration before the stopwatch starts', async () => {
    const { container } = await renderTimed(20, 20);

    const marker = getMarker(container);
    expect(marker).toBeTruthy();
    expect(getLabel(container)?.textContent).toBe('20');
    expect(marker?.classList.contains('stopwatch-target--reached')).toBe(false);
  });

  it('sits below the seconds hand so the hand stays readable', async () => {
    const { container } = await renderTimed(20, 20);

    const marker = getMarker(container)!;
    const hand = container.querySelector('svg [id="seconds-hand"]')!;
    expect(marker.nextElementSibling).toBe(hand);
  });

  it('labels a whole-minute duration and places it at the top of the dial', async () => {
    const { container } = await renderTimed(120, 120);

    expect(getLabel(container)?.textContent).toBe('2 min');
    // Two full revolutions land on 60 — straight up from the dial centre.
    expect(getMarker(container)?.getAttribute('transform')).toBe('translate(500 419)');
  });

  it('colours the printed dial number instead of stacking a second one on it', async () => {
    const { container } = await renderTimed(15, 15);

    const fifteens = [...container.querySelectorAll('svg text')].filter(
      (t) => t.textContent?.trim() === '15'
    );
    // The dial's own `15`, moved into the marker — not a duplicate over it.
    expect(fifteens).toHaveLength(1);
    expect(fifteens[0].closest('#target-time-marker')).toBeTruthy();
    expect(fifteens[0].getAttribute('class')).toBe('stopwatch-target__label');
  });

  it('puts the adopted dial number back when the duration changes', async () => {
    const { container, rerender } = await renderTimed(15, 15);

    rerender(<CoachStopwatch secondsRemaining={20} totalSeconds={20} />);

    const fifteen = [...container.querySelectorAll('svg text')].find(
      (t) => t.textContent?.trim() === '15'
    )!;
    expect(fifteen.closest('#target-time-marker')).toBeNull();
    expect(fifteen.getAttribute('x')).toBe('671.0');
    expect(getLabel(container)?.textContent).toBe('20');
  });

  it('labels a non-whole-minute duration as m:ss', async () => {
    const { container } = await renderTimed(75, 75);

    expect(getLabel(container)?.textContent).toBe('1:15');
  });

  it('marks the target reached when the countdown hits zero', async () => {
    const { container, rerender } = await renderTimed(20, 20);

    rerender(<CoachStopwatch secondsRemaining={0} totalSeconds={20} />);

    expect(getMarker(container)?.classList.contains('stopwatch-target--reached')).toBe(true);
  });

  it('does not re-arm the reached animation on later renders at zero', async () => {
    const { container, rerender } = await renderTimed(20, 20);
    const marker = getMarker(container)!;

    const observer = new MutationObserver(() => {});
    observer.observe(marker, { attributes: true, attributeFilter: ['class'] });

    rerender(<CoachStopwatch secondsRemaining={0} totalSeconds={20} />);
    rerender(<CoachStopwatch secondsRemaining={0} totalSeconds={20} />);
    rerender(<CoachStopwatch secondsRemaining={0} totalSeconds={20} />);

    // Records are delivered on a microtask; drain them synchronously instead.
    const classChanges = observer.takeRecords();
    observer.disconnect();
    // The class landed once; the marker itself was never rebuilt.
    expect(classChanges).toHaveLength(1);
    expect(getMarker(container)).toBe(marker);
    expect(marker.classList.contains('stopwatch-target--reached')).toBe(true);
  });

  it('re-arms when the next set restores a positive remaining time', async () => {
    const { container, rerender } = await renderTimed(20, 20);

    rerender(<CoachStopwatch secondsRemaining={0} totalSeconds={20} />);
    expect(getMarker(container)?.classList.contains('stopwatch-target--reached')).toBe(true);

    rerender(<CoachStopwatch secondsRemaining={20} totalSeconds={20} />);
    expect(getMarker(container)?.classList.contains('stopwatch-target--reached')).toBe(false);

    rerender(<CoachStopwatch secondsRemaining={0} totalSeconds={20} />);
    expect(getMarker(container)?.classList.contains('stopwatch-target--reached')).toBe(true);
  });

  it('renders no marker for a non-positive or invalid duration', async () => {
    const { container, rerender } = await renderTimed(0, 0);
    expect(getMarker(container)).toBeNull();

    rerender(<CoachStopwatch secondsRemaining={0} totalSeconds={Number.NaN} />);
    expect(getMarker(container)).toBeNull();

    rerender(<CoachStopwatch secondsRemaining={0} totalSeconds={-5} />);
    expect(getMarker(container)).toBeNull();
  });

  it('rebuilds the marker when the exercise duration changes', async () => {
    const { container, rerender } = await renderTimed(20, 20);
    expect(getLabel(container)?.textContent).toBe('20');

    rerender(<CoachStopwatch secondsRemaining={10} totalSeconds={10} />);

    expect(container.querySelectorAll('.stopwatch-target__label')).toHaveLength(1);
    expect(getLabel(container)?.textContent).toBe('10');
  });
});
