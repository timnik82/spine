import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UPDATE_RELOAD_FALLBACK_MS, usePwaUpdate } from './usePwaUpdate';

class FakeWorker extends EventTarget {
  state = 'installed';
  postMessage = vi.fn();
}

class FakeRegistration extends EventTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
}

class FakeServiceWorkerContainer extends EventTarget {
  controller = {};
  controllerChangeListeners = 0;
  register: ReturnType<typeof vi.fn>;

  constructor(registration: FakeRegistration) {
    super();
    this.register = vi.fn().mockResolvedValue(registration);
  }

  override addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
    if (type === 'controllerchange') this.controllerChangeListeners += 1;
    super.addEventListener(type, listener, options);
  }

  override removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) {
    if (type === 'controllerchange') this.controllerChangeListeners -= 1;
    super.removeEventListener(type, listener, options);
  }
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
    const serviceWorker = new FakeServiceWorkerContainer(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    });

    render(<TestHarness />);
    await act(async () => {});
    expect(waitingWorker.postMessage).not.toHaveBeenCalled();

    await act(async () => {
      screen.getByRole('button', { name: 'Update now' }).click();
    });
    expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(serviceWorker.controllerChangeListeners).toBe(1);
  });

  it('removes the reload listener when the update hook unmounts', async () => {
    vi.useFakeTimers();
    const registration = new FakeRegistration();
    const waitingWorker = new FakeWorker();
    registration.waiting = waitingWorker;
    const serviceWorker = new FakeServiceWorkerContainer(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    });

    const { unmount } = render(<TestHarness />);
    await act(async () => {});
    await act(async () => {
      screen.getByRole('button', { name: 'Update now' }).click();
    });
    unmount();

    expect(serviceWorker.controllerChangeListeners).toBe(0);
    expect(() => vi.advanceTimersByTime(UPDATE_RELOAD_FALLBACK_MS)).not.toThrow();
    vi.useRealTimers();
  });
});
