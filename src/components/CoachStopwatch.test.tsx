import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CoachStopwatch } from './CoachStopwatch';

vi.mock('@/lib/sounds', () => ({
  playStopwatchPress: vi.fn(),
  playStopwatchRelease: vi.fn(),
}));

function pointerEvent(type: string, pointerId: number) {
  return new PointerEvent(type, { bubbles: true, pointerId, pointerType: 'touch' });
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

describe('CoachStopwatch crown button', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  it('toggles and clears the pressed transform on pointerup', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    expect(topBtn.style.transform).toContain('translateY');

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerup', 1));
    });

    expect(topBtn.style.transform).toBe('');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('resets the pressed transform on pointercancel without toggling', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointercancel', 1));
    });

    expect(topBtn.style.transform).toBe('');
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('releases and toggles when pointerup arrives on window', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    expect(topBtn.style.transform).toContain('translateY');

    act(() => {
      window.dispatchEvent(pointerEvent('pointerup', 1));
    });

    expect(topBtn.style.transform).toBe('');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('resets the pressed transform on visibilitychange without toggling', async () => {
    const onToggle = vi.fn();
    const { container } = await renderStopwatch(onToggle);
    const topBtn = getTopButton(container)!;

    act(() => {
      topBtn.dispatchEvent(pointerEvent('pointerdown', 1));
    });
    expect(topBtn.style.transform).toContain('translateY');

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(topBtn.style.transform).toBe('');
    expect(onToggle).not.toHaveBeenCalled();
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
    expect(topBtn.style.transform).toBe('');
  });
});
