import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_REST_SECONDS,
  MAX_REST_SECONDS,
  useRestSettings,
} from './useRestSettings';

const CRESCER_ID = 'crescer-ate-ao-teto';

describe('rest settings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores a separate rest duration for each adjustable exercise', () => {
    const { result, unmount } = renderHook(() => useRestSettings());

    act(() => result.current.setRestSeconds(CRESCER_ID, 0));
    expect(result.current.restSecondsFor(CRESCER_ID)).toBe(0);
    expect(result.current.restSecondsFor('prancha-de-joelhos')).toBe(
      DEFAULT_REST_SECONDS
    );

    unmount();
    const restored = renderHook(() => useRestSettings());
    expect(restored.result.current.restSecondsFor(CRESCER_ID)).toBe(0);
  });

  it('keeps values on five-second steps inside the supported range', () => {
    const { result } = renderHook(() => useRestSettings());

    act(() => result.current.setRestSeconds(CRESCER_ID, 13));
    expect(result.current.restSecondsFor(CRESCER_ID)).toBe(15);

    act(() => result.current.setRestSeconds(CRESCER_ID, 500));
    expect(result.current.restSecondsFor(CRESCER_ID)).toBe(MAX_REST_SECONDS);
  });

  it('restores every exercise to the ten-second default', () => {
    const { result } = renderHook(() => useRestSettings());

    act(() => result.current.setRestSeconds(CRESCER_ID, 0));
    act(() => result.current.resetRestSeconds());

    expect(result.current.restSecondsFor(CRESCER_ID)).toBe(
      DEFAULT_REST_SECONDS
    );
  });
});
