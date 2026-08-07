import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorFallback } from './AppErrorFallback';

describe('AppErrorFallback', () => {
  it('offers a reload action that resets the boundary', () => {
    const resetError = vi.fn();
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });

    render(<AppErrorFallback resetError={resetError} />);

    expect(
      screen.getByRole('heading', { name: /algo correu mal/i }),
    ).toBeTruthy();

    screen.getByRole('button', { name: /recarregar/i }).click();

    expect(resetError).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });
});
