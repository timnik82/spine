/**
 * Short interface sounds played through the Web Audio API for low latency
 * on mobile. Buffers are decoded once; each click is a one-shot source node.
 */

type AudioContextConstructor = typeof AudioContext;

const PRESS_VOLUME = 0.7;
const RELEASE_VOLUME = 0.55;

let audioContext: AudioContext | null = null;
let pressBuffer: AudioBuffer | null = null;
let releaseBuffer: AudioBuffer | null = null;
let loadPromise: Promise<void> | null = null;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext ||
    null
  );
}

function getContext(): AudioContext | null {
  const Ctor = getAudioContextConstructor();
  if (!Ctor) return null;
  audioContext ??= new Ctor();
  return audioContext;
}

function soundUrl(fileName: string) {
  return `${import.meta.env.BASE_URL}sounds/${fileName}`;
}

async function decodeSound(ctx: AudioContext, fileName: string): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(soundUrl(fileName));
    if (!response.ok) return null;
    const data = await response.arrayBuffer();
    return await ctx.decodeAudioData(data.slice(0));
  } catch {
    return null;
  }
}

function ensureLoaded(ctx: AudioContext) {
  loadPromise ??= (async () => {
    const [press, release] = await Promise.all([
      decodeSound(ctx, 'stopwatch-press.mp3'),
      decodeSound(ctx, 'stopwatch-release.mp3'),
    ]);
    pressBuffer = press;
    releaseBuffer = release;
  })().catch(() => {
    // Decode failures stay silent — a missing click is not worth surfacing.
    loadPromise = null;
  });
  return loadPromise;
}

function playBuffer(buffer: AudioBuffer | null, volume: number) {
  const ctx = getContext();
  if (!ctx || !buffer) return;

  try {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignore playback errors (closed context, etc.)
  }
}

/** Resume the audio context and kick off buffer decode (call from a user gesture). */
export function unlockStopwatchSounds() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
  void ensureLoaded(ctx);
}

function play(kind: 'press' | 'release') {
  unlockStopwatchSounds();
  const buffer = kind === 'press' ? pressBuffer : releaseBuffer;
  const volume = kind === 'press' ? PRESS_VOLUME : RELEASE_VOLUME;

  if (buffer) {
    playBuffer(buffer, volume);
    return;
  }

  // First gesture may race decode — play as soon as the buffer is ready.
  const ctx = getContext();
  if (!ctx) return;
  void ensureLoaded(ctx)?.then(() => {
    const ready = kind === 'press' ? pressBuffer : releaseBuffer;
    playBuffer(ready, volume);
  });
}

/** Crown button travelling down — the deeper of the two clicks. */
export function playStopwatchPress() {
  play('press');
}

/** Crown button springing back up — lighter, closes the pair. */
export function playStopwatchRelease() {
  play('release');
}
