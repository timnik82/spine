/**
 * Countdown beeps, generated mathematically (no sample files).
 *
 * Four beeps at 4, 3, 2, then 1 second remaining. The first three are 660 Hz
 * for 120 ms; the last is one octave higher (1320 Hz) and 350 ms. Each tone is
 * a sine plus a quiet 2nd harmonic, with a short linear attack/release so the
 * edges do not click. Peak gain is 0.6 after the 1.0 + 0.15 mix is normalized
 * by 1.15 — matching the approved B2.wav reference.
 */

export type CountdownBeepKind = 'low' | 'high';

export const COUNTDOWN_BEEP_FROM_SECOND = 4;
export const COUNTDOWN_BEEP_LOW_HZ = 660;
export const COUNTDOWN_BEEP_HIGH_HZ = 1320;
export const COUNTDOWN_BEEP_LOW_DURATION_SEC = 0.12;
export const COUNTDOWN_BEEP_HIGH_DURATION_SEC = 0.35;
export const COUNTDOWN_BEEP_ATTACK_SEC = 0.005;
export const COUNTDOWN_BEEP_RELEASE_SEC = 0.03;
export const COUNTDOWN_BEEP_PEAK_GAIN = 0.6;
export const COUNTDOWN_BEEP_FUNDAMENTAL = 1;
export const COUNTDOWN_BEEP_HARMONIC = 0.15;

const MIX_NORM = COUNTDOWN_BEEP_FUNDAMENTAL + COUNTDOWN_BEEP_HARMONIC;

export function countdownBeepHz(kind: CountdownBeepKind) {
  return kind === 'high' ? COUNTDOWN_BEEP_HIGH_HZ : COUNTDOWN_BEEP_LOW_HZ;
}

export function countdownBeepDurationSec(kind: CountdownBeepKind) {
  return kind === 'high'
    ? COUNTDOWN_BEEP_HIGH_DURATION_SEC
    : COUNTDOWN_BEEP_LOW_DURATION_SEC;
}

/** Which beep (if any) belongs to this remaining whole second. */
export function countdownBeepKindForStep(step: number): CountdownBeepKind | null {
  if (step === 1) return 'high';
  if (step >= 2 && step <= COUNTDOWN_BEEP_FROM_SECOND) return 'low';
  return null;
}

function envelope(t: number, duration: number) {
  if (t <= 0 || t >= duration) return 0;
  if (t < COUNTDOWN_BEEP_ATTACK_SEC) {
    return COUNTDOWN_BEEP_PEAK_GAIN * (t / COUNTDOWN_BEEP_ATTACK_SEC);
  }
  const releaseStart = duration - COUNTDOWN_BEEP_RELEASE_SEC;
  if (t > releaseStart) {
    return COUNTDOWN_BEEP_PEAK_GAIN * ((duration - t) / COUNTDOWN_BEEP_RELEASE_SEC);
  }
  return COUNTDOWN_BEEP_PEAK_GAIN;
}

/** PCM for one beep at `sampleRate`. Mono, already envelope-shaped. */
export function renderCountdownBeep(
  kind: CountdownBeepKind,
  sampleRate: number
): Float32Array {
  const duration = countdownBeepDurationSec(kind);
  const freq = countdownBeepHz(kind);
  const n = Math.max(1, Math.round(duration * sampleRate));
  const samples = new Float32Array(n);

  for (let i = 0; i < n; i += 1) {
    const t = i / sampleRate;
    const fundamental = Math.sin(2 * Math.PI * freq * t);
    const harmonic = Math.sin(2 * Math.PI * freq * 2 * t);
    const mixed =
      (COUNTDOWN_BEEP_FUNDAMENTAL * fundamental +
        COUNTDOWN_BEEP_HARMONIC * harmonic) /
      MIX_NORM;
    samples[i] = mixed * envelope(t, duration);
  }

  return samples;
}
