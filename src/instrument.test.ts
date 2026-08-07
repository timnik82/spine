import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const init = vi.hoisted(() => vi.fn());

vi.mock('@sentry/react', () => ({
  init,
}));

describe('initSentry', () => {
  beforeEach(() => {
    init.mockClear();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not initialise Sentry when VITE_SENTRY_DSN is missing', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', undefined);

    const { initSentry } = await import('./instrument');
    init.mockClear();
    initSentry();

    expect(init).not.toHaveBeenCalled();
  });

  it('initialises Sentry with the DSN and current mode', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/0');

    const { initSentry } = await import('./instrument');
    init.mockClear();
    initSentry();

    expect(init).toHaveBeenCalledWith({
      dsn: 'https://public@o0.ingest.sentry.io/0',
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
    });
  });

  it('ignores a blank DSN', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '   ');

    const { initSentry } = await import('./instrument');
    init.mockClear();
    initSentry();

    expect(init).not.toHaveBeenCalled();
  });
});
