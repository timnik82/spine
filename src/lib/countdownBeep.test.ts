import { describe, expect, it } from 'vitest';
import {
  COUNTDOWN_BEEP_HIGH_DURATION_SEC,
  COUNTDOWN_BEEP_HIGH_HZ,
  COUNTDOWN_BEEP_LOW_DURATION_SEC,
  COUNTDOWN_BEEP_LOW_HZ,
  COUNTDOWN_BEEP_PEAK_GAIN,
  COUNTDOWN_BEEP_RELEASE_SEC,
  countdownBeepKindForStep,
  renderCountdownBeep,
} from './countdownBeep';

const SAMPLE_RATE = 44_100;

function estimatedHz(
  samples: Float32Array,
  sampleRate: number,
  startSec: number,
  endSec: number
) {
  const i0 = Math.floor(startSec * sampleRate);
  const i1 = Math.floor(endSec * sampleRate);
  const crossings: number[] = [];
  for (let i = i0 + 1; i < i1; i += 1) {
    if (samples[i - 1] <= 0 && samples[i] > 0) crossings.push(i);
  }
  if (crossings.length < 2) return 0;
  const periods = crossings.length - 1;
  const duration = (crossings[crossings.length - 1] - crossings[0]) / sampleRate;
  return periods / duration;
}

function peakInWindow(
  samples: Float32Array,
  sampleRate: number,
  startSec: number,
  endSec: number
) {
  const i0 = Math.floor(startSec * sampleRate);
  const i1 = Math.floor(endSec * sampleRate);
  let peak = 0;
  for (let i = i0; i < i1; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  return peak;
}

describe('countdownBeepKindForStep', () => {
  it('maps 4, 3, 2 to the low beep and 1 to the high beep', () => {
    expect(countdownBeepKindForStep(4)).toBe('low');
    expect(countdownBeepKindForStep(3)).toBe('low');
    expect(countdownBeepKindForStep(2)).toBe('low');
    expect(countdownBeepKindForStep(1)).toBe('high');
  });

  it('is silent outside the last four seconds, including zero', () => {
    expect(countdownBeepKindForStep(5)).toBeNull();
    expect(countdownBeepKindForStep(0)).toBeNull();
    expect(countdownBeepKindForStep(-1)).toBeNull();
  });
});

describe('renderCountdownBeep', () => {
  const low = renderCountdownBeep('low', SAMPLE_RATE);
  const high = renderCountdownBeep('high', SAMPLE_RATE);

  it('lasts 120 ms for the low beeps and 350 ms for the final beep', () => {
    expect(low.length / SAMPLE_RATE).toBeCloseTo(COUNTDOWN_BEEP_LOW_DURATION_SEC, 5);
    expect(high.length / SAMPLE_RATE).toBeCloseTo(
      COUNTDOWN_BEEP_HIGH_DURATION_SEC,
      5
    );
  });

  it('peaks near 0.6 after the 1.0 + 0.15 mix is normalized', () => {
    const peak = Math.max(...low.map(Math.abs));
    // sin + 0.15 sin(2x) does not peak at 1.15, so 0.6 / 1.15 * ~1.041 ≈ 0.543.
    expect(peak).toBeGreaterThan(0.52);
    expect(peak).toBeLessThanOrEqual(COUNTDOWN_BEEP_PEAK_GAIN);
  });

  it('attacks over 5 ms and releases over 30 ms', () => {
    const sustainPeak = peakInWindow(low, SAMPLE_RATE, 0.02, 0.08);
    expect(Math.abs(low[0])).toBeLessThan(0.02);
    expect(
      peakInWindow(low, SAMPLE_RATE, 0.004, 0.006) / sustainPeak
    ).toBeGreaterThan(0.85);
    expect(
      peakInWindow(
        low,
        SAMPLE_RATE,
        COUNTDOWN_BEEP_LOW_DURATION_SEC - COUNTDOWN_BEEP_RELEASE_SEC,
        COUNTDOWN_BEEP_LOW_DURATION_SEC - COUNTDOWN_BEEP_RELEASE_SEC + 0.002
      ) / sustainPeak
    ).toBeGreaterThan(0.85);
    expect(Math.abs(low[low.length - 1])).toBeLessThan(0.05);
  });

  it('uses 660 Hz for the first three beeps and 1320 Hz for the last', () => {
    expect(
      estimatedHz(low, SAMPLE_RATE, 0.02, 0.08)
    ).toBeCloseTo(COUNTDOWN_BEEP_LOW_HZ, 0);
    expect(
      estimatedHz(high, SAMPLE_RATE, 0.05, 0.25)
    ).toBeCloseTo(COUNTDOWN_BEEP_HIGH_HZ, 0);
  });
});
