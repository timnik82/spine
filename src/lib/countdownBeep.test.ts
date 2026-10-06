import { describe, expect, it } from 'vitest';
import {
  COUNTDOWN_BEEP_LOW_DURATION_SEC,
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
    expect(low.length / SAMPLE_RATE).toBeCloseTo(0.12, 5);
    expect(high.length / SAMPLE_RATE).toBeCloseTo(0.35, 5);
  });

  it('peaks near 0.543 with the 0.15 second harmonic in the mix', () => {
    const peak = Math.max(...low.map(Math.abs));
    // sin + 0.15 sin(2x) does not peak at 1.15, so 0.6 / 1.15 * ~1.041 ≈ 0.543.
    // Dropping the harmonic (peak 0.522) or the 1.15 normalize (peak 0.6) fails this.
    expect(peak).toBeGreaterThan(0.53);
    expect(peak).toBeLessThan(0.56);
    expect(peak).toBeLessThanOrEqual(COUNTDOWN_BEEP_PEAK_GAIN);
  });

  it('attacks over 5 ms and releases over 30 ms', () => {
    const sustainPeak = peakInWindow(low, SAMPLE_RATE, 0.02, 0.08);
    expect(Math.abs(low[0])).toBeLessThan(0.02);
    // Mid-attack (~2.5 ms) must still be well below sustain, so a 0 ms attack fails.
    expect(
      peakInWindow(low, SAMPLE_RATE, 0.002, 0.003) / sustainPeak
    ).toBeLessThan(0.75);
    expect(
      peakInWindow(low, SAMPLE_RATE, 0.004, 0.006) / sustainPeak
    ).toBeGreaterThan(0.85);
    const releaseMidpoint =
      COUNTDOWN_BEEP_LOW_DURATION_SEC - COUNTDOWN_BEEP_RELEASE_SEC / 2;
    const releaseMid =
      peakInWindow(
        low,
        SAMPLE_RATE,
        releaseMidpoint - 0.001,
        releaseMidpoint + 0.001
      ) / sustainPeak;
    expect(releaseMid).toBeGreaterThan(0.35);
    expect(releaseMid).toBeLessThan(0.65);
    expect(Math.abs(low[low.length - 1])).toBeLessThan(0.05);
  });

  it('uses 660 Hz for the first three beeps and 1320 Hz for the last', () => {
    expect(estimatedHz(low, SAMPLE_RATE, 0.02, 0.08)).toBeCloseTo(660, 0);
    expect(estimatedHz(high, SAMPLE_RATE, 0.05, 0.25)).toBeCloseTo(1320, 0);
  });
});
