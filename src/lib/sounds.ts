/**
 * Short interface sounds played through the Web Audio API for low latency
 * on mobile. Crown clicks are decoded MP3 buffers; countdown beeps are
 * synthesized in-memory so they never depend on a fetch.
 */

import {
  type CountdownBeepKind,
  renderCountdownBeep,
} from '@/lib/countdownBeep';

type AudioContextConstructor = typeof AudioContext;

const PRESS_VOLUME = 0.7;
const RELEASE_VOLUME = 0.55;

let audioContext: AudioContext | null = null;
let pressBuffer: AudioBuffer | null = null;
let releaseBuffer: AudioBuffer | null = null;
let lowBeepBuffer: AudioBuffer | null = null;
let highBeepBuffer: AudioBuffer | null = null;
let loadPromise: Promise<void> | null = null;
let keepAliveSource: AudioBufferSourceNode | null = null;
let interruptionBound = false;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext ||
    null
  );
}

function clearGeneratedBuffers() {
  pressBuffer = null;
  releaseBuffer = null;
  lowBeepBuffer = null;
  highBeepBuffer = null;
  loadPromise = null;
  keepAliveSource = null;
}

function contextState(ctx: AudioContext) {
  return ctx.state as AudioContext['state'] | 'interrupted';
}

function getContext(): AudioContext | null {
  const Ctor = getAudioContextConstructor();
  if (!Ctor) return null;

  // A closed context can never play again, and its buffers go with it.
  if (audioContext && contextState(audioContext) === 'closed') {
    audioContext = null;
    clearGeneratedBuffers();
  }

  if (!audioContext) {
    try {
      audioContext = new Ctor();
    } catch {
      // Browsers cap how many contexts may exist. A missing click is not
      // worth throwing out of the mount effect that preloads the buffers.
      return null;
    }
  }
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

function fillBeepBuffer(ctx: AudioContext, kind: CountdownBeepKind) {
  const samples = renderCountdownBeep(kind, ctx.sampleRate);
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buffer.getChannelData(0).set(samples);
  return buffer;
}

function ensureBeepBuffers(ctx: AudioContext) {
  lowBeepBuffer ??= fillBeepBuffer(ctx, 'low');
  highBeepBuffer ??= fillBeepBuffer(ctx, 'high');
}

function ensureLoaded(ctx: AudioContext) {
  ensureBeepBuffers(ctx);
  loadPromise ??= (async () => {
    const [press, release] = await Promise.all([
      decodeSound(ctx, 'stopwatch-press.mp3'),
      decodeSound(ctx, 'stopwatch-release.mp3'),
    ]);
    if (!press || !release) {
      // Transient fetch/decode failure — allow a later gesture to retry.
      loadPromise = null;
      return;
    }
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
  if (contextState(ctx) !== 'running') return;

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

/**
 * iOS will re-suspend a context that sits idle. A looping silent buffer,
 * started inside a user gesture, keeps the session alive through prepare
 * and the hold until the last-four-second beeps.
 */
function startKeepAlive(ctx: AudioContext) {
  if (keepAliveSource) return;
  try {
    const silent = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate / 10)), ctx.sampleRate);
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    const source = ctx.createBufferSource();
    source.buffer = silent;
    source.loop = true;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
    keepAliveSource = source;
    source.addEventListener('ended', () => {
      if (keepAliveSource === source) keepAliveSource = null;
    });
  } catch {
    keepAliveSource = null;
  }
}

function primeContextFromGesture(ctx: AudioContext) {
  // WebKit often ignores resume() unless a source actually starts in the
  // same user-gesture turn as the unlock.
  try {
    const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = silent;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // A failed prime must not block the resume() that follows.
  }
  startKeepAlive(ctx);
}

function applyPlaybackAudioSession() {
  const session = (
    navigator as Navigator & { audioSession?: { type: string } }
  ).audioSession;
  if (!session) return;
  try {
    session.type = 'playback';
  } catch {
    // Older WebKit: the property exists but is not writable.
  }
}

function resumeContext(ctx: AudioContext) {
  const state = contextState(ctx);
  if (state === 'suspended' || state === 'interrupted') {
    return ctx.resume().catch(() => {});
  }
  return Promise.resolve();
}

function bindInterruptionHandlers() {
  if (interruptionBound || typeof document === 'undefined') return;
  interruptionBound = true;

  const onForeground = () => {
    if (!audioContext) return;
    void resumeContext(audioContext).then(() => {
      if (audioContext && contextState(audioContext) === 'running') {
        startKeepAlive(audioContext);
      }
    });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onForeground();
  });
  window.addEventListener('focus', onForeground);
  window.addEventListener('pageshow', onForeground);
}

/**
 * Resume the audio context and kick off buffer decode.
 * Must run inside a user gesture on iOS (Começar / Iniciar / crown).
 */
export function unlockStopwatchSounds() {
  const ctx = getContext();
  if (!ctx) return;
  applyPlaybackAudioSession();
  bindInterruptionHandlers();
  primeContextFromGesture(ctx);
  void resumeContext(ctx).then(() => {
    if (contextState(ctx) === 'running') startKeepAlive(ctx);
  });
  void ensureLoaded(ctx);
}

function playClick(kind: 'press' | 'release') {
  unlockStopwatchSounds();
  const buffer = kind === 'press' ? pressBuffer : releaseBuffer;
  const volume = kind === 'press' ? PRESS_VOLUME : RELEASE_VOLUME;

  if (buffer) {
    playBuffer(buffer, volume);
  }
  // Buffer not ready yet — preload has started via unlock. Do not queue a
  // deferred play: a fast press+release would both fire late and together.
}

/** Crown button travelling down — the deeper of the two clicks. */
export function playStopwatchPress() {
  playClick('press');
}

/** Crown button springing back up — lighter, closes the pair. */
export function playStopwatchRelease() {
  playClick('release');
}

function beepBuffer(kind: CountdownBeepKind) {
  return kind === 'high' ? highBeepBuffer : lowBeepBuffer;
}

/**
 * One of the last four remaining seconds. `high` is the final second (1),
 * an octave above the three that precede it.
 */
export function playCountdownBeep(kind: CountdownBeepKind) {
  const ctx = getContext();
  if (!ctx) return;
  ensureBeepBuffers(ctx);

  const start = () => {
    if (contextState(ctx) !== 'running') return;
    playBuffer(beepBuffer(kind), 1);
  };

  if (contextState(ctx) === 'running') {
    start();
    return;
  }

  void resumeContext(ctx).then(() => {
    startKeepAlive(ctx);
    start();
  });
}
