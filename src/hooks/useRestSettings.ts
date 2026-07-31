import { useCallback, useEffect, useState } from 'react';
import { programme } from '@/data/programme';

export const DEFAULT_REST_SECONDS = 10;
export const REST_SECONDS_STEP = 5;
export const MAX_REST_SECONDS = 60;

const STORAGE_KEY = 'spine-rest-settings-v1';

export const restAdjustableExercises = programme.filter(
  (exercise) => exercise.mode === 'timer' && exercise.sets > 1
);

const adjustableExerciseIds = new Set(
  restAdjustableExercises.map((exercise) => exercise.id)
);

type RestSettings = Record<string, number>;

function defaultSettings(): RestSettings {
  return Object.fromEntries(
    restAdjustableExercises.map((exercise) => [
      exercise.id,
      DEFAULT_REST_SECONDS,
    ])
  );
}

function normaliseRestSeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_REST_SECONDS;

  const stepped = Math.round(value / REST_SECONDS_STEP) * REST_SECONDS_STEP;
  return Math.max(0, Math.min(MAX_REST_SECONDS, stepped));
}

function loadSettings(): RestSettings {
  const defaults = defaultSettings();
  if (typeof window === 'undefined') return defaults;

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      return defaults;
    }

    for (const exercise of restAdjustableExercises) {
      const value = (stored as Record<string, unknown>)[exercise.id];
      if (typeof value === 'number') {
        defaults[exercise.id] = normaliseRestSeconds(value);
      }
    }
  } catch {
    // A missing, unavailable, or malformed store must never block a session.
  }

  return defaults;
}

export function useRestSettings() {
  const [settings, setSettings] = useState<RestSettings>(loadSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // The current session still works when Safari storage is unavailable.
    }
  }, [settings]);

  const restSecondsFor = useCallback(
    (exerciseId: string) =>
      settings[exerciseId] ?? DEFAULT_REST_SECONDS,
    [settings]
  );

  const setRestSeconds = useCallback((exerciseId: string, seconds: number) => {
    if (!adjustableExerciseIds.has(exerciseId)) return;

    setSettings((current) => ({
      ...current,
      [exerciseId]: normaliseRestSeconds(seconds),
    }));
  }, []);

  const resetRestSeconds = useCallback(() => {
    setSettings(defaultSettings());
  }, []);

  return { restSecondsFor, setRestSeconds, resetRestSeconds };
}
