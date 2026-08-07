import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorFallback } from './AppErrorFallback';

describe('AppErrorFallback', () => {
  it('offers a reload action that reloads the page', () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });

    render(<AppErrorFallback />);

    expect(
      screen.getByRole('heading', { name: /algo correu mal/i }),
    ).toBeTruthy();

    screen.getByRole('button', { name: /recarregar/i }).click();

    expect(reload).toHaveBeenCalledOnce();
  });
});
