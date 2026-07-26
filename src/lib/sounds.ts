/**
 * Short interface sounds played through small pools of preloaded audio
 * elements: one element cannot play twice at once, so a pool keeps a rapid
 * second press from cutting the first one off.
 */

const POOL_SIZE = 3;

function createPool(fileName: string, volume: number) {
  const src = `${import.meta.env.BASE_URL}sounds/${fileName}`;
  let pool: HTMLAudioElement[] | null = null;
  let next = 0;

  const build = () => {
    const created = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = volume;
      return audio;
    });
    return created;
  };

  return () => {
    if (typeof Audio === 'undefined') return;
    pool ??= build();

    // Prefer an element that finished playing; only reuse a busy one when every
    // element is still mid-click, which needs presses ~50ms apart.
    const idle = pool.find((audio) => audio.paused || audio.ended);
    const audio = idle ?? pool[next];
    next = (next + 1) % pool.length;

    audio.currentTime = 0;
    // Autoplay restrictions reject playback outside a user gesture — a missing
    // click is not worth surfacing as an error.
    void audio.play().catch(() => {});
  };
}

/** Crown button travelling down — the deeper of the two clicks. */
export const playStopwatchPress = createPool('stopwatch-press.mp3', 0.7);

/** Crown button springing back up — lighter, closes the pair. */
export const playStopwatchRelease = createPool('stopwatch-release.mp3', 0.55);
