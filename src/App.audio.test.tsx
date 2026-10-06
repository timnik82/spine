import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { unlockStopwatchSounds, playCountdownBeep } = vi.hoisted(() => ({
  unlockStopwatchSounds: vi.fn(),
  playCountdownBeep: vi.fn(),
}));

vi.mock('@/lib/sounds', () => ({
  unlockStopwatchSounds,
  playStopwatchPress: vi.fn(),
  playStopwatchRelease: vi.fn(),
  playCountdownBeep,
}));

import { App } from './App';

describe('session audio unlock', () => {
  beforeEach(() => {
    unlockStopwatchSounds.mockClear();
    playCountdownBeep.mockClear();
    window.localStorage.clear();
  });

  it('unlocks Web Audio from the Começar tap', () => {
    render(<App />);
    const before = unlockStopwatchSounds.mock.calls.length;

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    expect(unlockStopwatchSounds.mock.calls.length).toBeGreaterThan(before);
  });
});
