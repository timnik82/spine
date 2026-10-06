import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TARGET_REACHED_HOLD_MS } from './App';

const {
  unlockStopwatchSounds,
  playCountdownBeep,
  holdStopwatchKeepAlive,
  releaseStopwatchKeepAlive,
} = vi.hoisted(() => ({
  unlockStopwatchSounds: vi.fn(),
  playCountdownBeep: vi.fn(),
  holdStopwatchKeepAlive: vi.fn(),
  releaseStopwatchKeepAlive: vi.fn(),
}));

vi.mock('@/lib/sounds', () => ({
  unlockStopwatchSounds,
  playStopwatchPress: vi.fn(),
  playStopwatchRelease: vi.fn(),
  playCountdownBeep,
  holdStopwatchKeepAlive,
  releaseStopwatchKeepAlive,
}));

vi.mock('@/components/BatteryReps', () => ({
  BatteryReps: ({ repsComplete, totalReps }: { repsComplete: number; totalReps: number }) => (
    <div role="progressbar" aria-valuenow={repsComplete} aria-valuemax={totalReps} />
  ),
}));

import { App } from './App';

function unlockCalls() {
  return unlockStopwatchSounds.mock.calls.length;
}

function selectExercise(index: number) {
  const exerciseSelect = screen.getByRole('combobox', {
    name: /selecionar exercício/i,
  });
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value'
    )?.set?.call(exerciseSelect, String(index));
    exerciseSelect.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function advance(milliseconds: number) {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
}

describe('session audio unlock', () => {
  beforeEach(() => {
    unlockStopwatchSounds.mockClear();
    playCountdownBeep.mockClear();
    holdStopwatchKeepAlive.mockClear();
    releaseStopwatchKeepAlive.mockClear();
    window.localStorage.clear();
  });

  it('unlocks Web Audio from the Começar tap', () => {
    render(<App />);
    const before = unlockCalls();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    expect(unlockCalls()).toBeGreaterThan(before);
  });

  it('unlocks Web Audio when closing the instructions overlay', () => {
    render(<App />);
    act(() => {
      screen.getByRole('button', { name: /instruções/i }).click();
    });
    const before = unlockCalls();

    act(() => {
      screen.getByRole('button', { name: /fechar/i }).click();
    });

    expect(unlockCalls()).toBeGreaterThan(before);
  });
});

describe('session audio unlock during a timed run', () => {
  beforeEach(() => {
    unlockStopwatchSounds.mockClear();
    playCountdownBeep.mockClear();
    holdStopwatchKeepAlive.mockClear();
    releaseStopwatchKeepAlive.mockClear();
    window.localStorage.clear();
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
        'Date',
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('unlocks Web Audio from Pausar / Iniciar', () => {
    render(<App />);
    selectExercise(1);
    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(3_100);

    const before = unlockCalls();
    act(() => {
      screen.getByRole('button', { name: /pausar/i }).click();
    });
    expect(unlockCalls()).toBeGreaterThan(before);
  });

  it('unlocks Web Audio from Saltar descanso', () => {
    render(<App />);
    selectExercise(1);
    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(3_100);
    advance(10_100);
    advance(TARGET_REACHED_HOLD_MS);

    const skip = screen.getByRole('button', { name: /saltar descanso/i });
    const before = unlockCalls();
    act(() => {
      skip.click();
    });
    expect(unlockCalls()).toBeGreaterThan(before);
  });
});
