import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePwaUpdate } from './usePwaUpdate';

class FakeWorker extends EventTarget {
  state = 'installed';
  postMessage = vi.fn();
}

class FakeRegistration extends EventTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
}

function TestHarness() {
  const { updateAvailable, isApplying, applyUpdate, dismissUpdate } = usePwaUpdate();

  return (
    <>
      <output>{updateAvailable ? 'available' : 'hidden'}</output>
      <button type="button" onClick={applyUpdate} disabled={!updateAvailable}>
        Update now
      </button>
      <button type="button" onClick={dismissUpdate} disabled={isApplying}>
        Later
      </button>
    </>
  );
}

describe('usePwaUpdate', () => {
  const originalServiceWorker = navigator.serviceWorker;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker,
    });
  });

  it('shows a waiting worker and allows dismissing it for the current mount', async () => {
    const registration = new FakeRegistration();
    const waitingWorker = new FakeWorker();
    registration.waiting = waitingWorker;
    const register = vi.fn().mockResolvedValue(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register, addEventListener: vi.fn(), controller: {} },
    });

    render(<TestHarness />);
    await act(async () => {});

    expect(screen.getByText('available').textContent).toBe('available');
    await act(async () => {
      screen.getByRole('button', { name: 'Later' }).click();
    });
    expect(screen.getByText('hidden').textContent).toBe('hidden');
  });

  it('only activates the waiting worker after an explicit update action', async () => {
    const registration = new FakeRegistration();
    const waitingWorker = new FakeWorker();
    registration.waiting = waitingWorker;
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        addEventListener: vi.fn(),
        controller: {},
      },
    });

    render(<TestHarness />);
    await act(async () => {});
    expect(waitingWorker.postMessage).not.toHaveBeenCalled();

    await act(async () => {
      screen.getByRole('button', { name: 'Update now' }).click();
    });
    expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });
});
