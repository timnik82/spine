/**
 * Short interface sounds played through the Web Audio API for low latency
 * on mobile. Buffers are decoded once; each click is a one-shot source node.
 */

type AudioContextConstructor = typeof AudioContext;

/** Every clip the stopwatch can play, and the file each one decodes from. */
const SOUND_FILES = {
  press: 'stopwatch-press.mp3',
  release: 'stopwatch-release.mp3',
  tick: 'stopwatch-last-seconds.mp3',
  end: 'stopwatch-end-bell.mp3',
} as const;

type SoundName = keyof typeof SOUND_FILES;

const VOLUMES: Record<SoundName, number> = {
  press: 0.7,
  release: 0.55,
  // The countdown cue plays over an exercise, not over a silent room: loud
  // enough to carry, quieter than the crown the child pressed themselves.
  tick: 0.6,
  end: 0.75,
};

let audioContext: AudioContext | null = null;
const buffers: Partial<Record<SoundName, AudioBuffer>> = {};
let loadPromise: Promise<void> | null = null;

function clearBuffers() {
  for (const name of Object.keys(SOUND_FILES) as SoundName[]) {
    delete buffers[name];
  }
}

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

  // A closed context can never play again, and its buffers go with it.
  if (audioContext?.state === 'closed') {
    audioContext = null;
    clearBuffers();
    loadPromise = null;
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

function ensureLoaded(ctx: AudioContext) {
  loadPromise ??= (async () => {
    const names = Object.keys(SOUND_FILES) as SoundName[];
    const decoded = await Promise.all(
      names.map((name) => decodeSound(ctx, SOUND_FILES[name]))
    );
    names.forEach((name, index) => {
      const buffer = decoded[index];
      if (buffer) buffers[name] = buffer;
    });
    if (decoded.some((buffer) => !buffer)) {
      // Transient fetch/decode failure — allow a later gesture to retry the
      // clips that did not make it. The ones that decoded stay usable.
      loadPromise = null;
    }
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

function play(name: SoundName) {
  unlockStopwatchSounds();
  const buffer = buffers[name];

  if (buffer) {
    playBuffer(buffer, VOLUMES[name]);
  }
  // Buffer not ready yet — preload has started via unlock. Do not queue a
  // deferred play: a fast press+release would both fire late and together,
  // and a countdown cue is worthless once its second has passed.
}

/** Crown button travelling down — the deeper of the two clicks. */
export function playStopwatchPress() {
  play('press');
}

/** Crown button springing back up — lighter, closes the pair. */
export function playStopwatchRelease() {
  play('release');
}

/** One of the last three seconds of a run just started. */
export function playStopwatchTick() {
  play('tick');
}

/** The run reached its target — the bell that closes the countdown. */
export function playStopwatchEnd() {
  play('end');
}
