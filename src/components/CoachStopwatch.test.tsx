import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playStopwatchPress, playStopwatchRelease } from '@/lib/sounds';
import { CoachStopwatch, MIN_PRESS_HOLD_MS } from './CoachStopwatch';

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
