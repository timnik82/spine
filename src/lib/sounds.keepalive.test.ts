import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  holdStopwatchKeepAlive,
  releaseStopwatchKeepAlive,
  unlockStopwatchSounds,
} from './sounds';

type EndedListener = () => void;

type MockSource = {
  loop: boolean;
  buffer: AudioBuffer | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  addEventListener: (type: string, listener: EndedListener) => void;
  dispatchEnded: () => void;
};

const sources: MockSource[] = [];

class MockAudioContext {
  state: AudioContextState = 'running';
  sampleRate = 44_100;
  destination = {} as AudioDestinationNode;
  resume = vi.fn(async () => {
    this.state = 'running';
  });

  createBuffer(_channels: number, length: number, sampleRate: number) {
    const data = new Float32Array(length);
    return {
      length,
      sampleRate,
      numberOfChannels: 1,
      getChannelData: () => data,
    } as AudioBuffer;
  }

  createGain() {
    return {
      gain: { value: 0 },
      connect: vi.fn(),
    } as unknown as GainNode;
  }

  createBufferSource() {
    const ended: EndedListener[] = [];
    const source: MockSource = {
      loop: false,
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(() => {
        for (const listener of ended) listener();
      }),
      addEventListener: (type, listener) => {
        if (type === 'ended') ended.push(listener);
      },
      dispatchEnded: () => {
        for (const listener of ended) listener();
      },
    };
    sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }
}

function loopingStartCount() {
  return sources.filter((source) => source.loop && source.start.mock.calls.length > 0)
    .length;
}

function dropCurrentKeepAlive() {
  const live = [...sources]
    .reverse()
    .find((source) => source.loop && source.start.mock.calls.length > 0);
  live?.dispatchEnded();
}

async function wakeViaVisibilityAndFocus() {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  });
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new Event('focus'));
  await Promise.resolve();
  await Promise.resolve();
}

describe('keep-alive across a visibility/focus wake', () => {
  beforeEach(() => {
    sources.length = 0;
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }) as unknown as Response)
    );
  });

  it('does not restart the silent loop on an idle screen, and does restart it on a timed screen', async () => {
    unlockStopwatchSounds();
    await Promise.resolve();
    expect(loopingStartCount()).toBeGreaterThan(0);

    // Intro / final / repetition: the session does not want the loop held.
    releaseStopwatchKeepAlive();
    const afterIdleRelease = loopingStartCount();
    await wakeViaVisibilityAndFocus();
    expect(loopingStartCount()).toBe(afterIdleRelease);

    // Prepare / timed hold / rest: a foreground wake must start the loop again.
    holdStopwatchKeepAlive();
    expect(loopingStartCount()).toBeGreaterThan(afterIdleRelease);
    dropCurrentKeepAlive();
    const afterDrop = loopingStartCount();
    await wakeViaVisibilityAndFocus();
    expect(loopingStartCount()).toBeGreaterThan(afterDrop);
  });
});
