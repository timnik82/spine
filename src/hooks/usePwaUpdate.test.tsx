import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UPDATE_RELOAD_FALLBACK_MS } from '@/lib/serviceWorker';
import { usePwaUpdate } from './usePwaUpdate';

class FakeWorker extends EventTarget {
  state = 'installed';
  postMessage = vi.fn();
}

class FakeRegistration extends EventTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
  update = vi.fn().mockResolvedValue(undefined);

  emitUpdateFound(installing: FakeWorker) {
    this.installing = installing;
    this.dispatchEvent(new Event('updatefound'));
  }
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

async function flushRegistration() {
  await act(async () => {});
  await act(async () => {});
}

describe('usePwaUpdate', () => {
  const originalServiceWorker = navigator.serviceWorker;

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker,
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
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
    await flushRegistration();

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
    await flushRegistration();
    expect(waitingWorker.postMessage).not.toHaveBeenCalled();

    await act(async () => {
      screen.getByRole('button', { name: 'Update now' }).click();
    });
    expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(serviceWorker.controllerChangeListeners).toBe(1);
  });

  it('reloads after the fallback when controllerchange never arrives', async () => {
    vi.useFakeTimers();
    const registration = new FakeRegistration();
    const waitingWorker = new FakeWorker();
    registration.waiting = waitingWorker;
    const serviceWorker = new FakeServiceWorkerContainer(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    });

    const reload = vi.fn();
    function FallbackHarness() {
      const update = usePwaUpdate(reload);
      return (
        <button type="button" onClick={update.applyUpdate} disabled={!update.updateAvailable}>
          Update now
        </button>
      );
    }

    render(<FallbackHarness />);
    await flushRegistration();
    await act(async () => {
      screen.getByRole('button', { name: 'Update now' }).click();
    });

    act(() => {
      vi.advanceTimersByTime(UPDATE_RELOAD_FALLBACK_MS);
    });
    expect(reload).toHaveBeenCalledTimes(1);
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
    const reload = vi.fn();

    function CleanupHarness() {
      const update = usePwaUpdate(reload);
      return (
        <button type="button" onClick={update.applyUpdate} disabled={!update.updateAvailable}>
          Update now
        </button>
      );
    }

    const { unmount } = render(<CleanupHarness />);
    await flushRegistration();
    await act(async () => {
      screen.getByRole('button', { name: 'Update now' }).click();
    });
    unmount();

    expect(serviceWorker.controllerChangeListeners).toBe(0);
    act(() => {
      vi.advanceTimersByTime(UPDATE_RELOAD_FALLBACK_MS);
    });
    expect(reload).not.toHaveBeenCalled();
  });

  it('checks for updates on visible visibilitychange and shows a newly waiting worker', async () => {
    const registration = new FakeRegistration();
    const serviceWorker = new FakeServiceWorkerContainer(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    });

    render(<TestHarness />);
    await flushRegistration();
    expect(screen.getByText('hidden').textContent).toBe('hidden');

    registration.update.mockClear();
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(registration.update).toHaveBeenCalledTimes(1);

    const installingWorker = new FakeWorker();
    installingWorker.state = 'installing';
    await act(async () => {
      registration.emitUpdateFound(installingWorker);
      installingWorker.state = 'installed';
      installingWorker.dispatchEvent(new Event('statechange'));
    });

    expect(screen.getByText('available').textContent).toBe('available');
  });

  it('checks for updates on focus only while the document is visible', async () => {
    const registration = new FakeRegistration();
    const serviceWorker = new FakeServiceWorkerContainer(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    });

    render(<TestHarness />);
    await flushRegistration();

    registration.update.mockClear();
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      window.dispatchEvent(new Event('focus'));
    });
    expect(registration.update).not.toHaveBeenCalled();

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      });
      window.dispatchEvent(new Event('focus'));
    });
    expect(registration.update).toHaveBeenCalledTimes(1);
  });

  it('does not re-show a dismissed waiting worker on resume alone', async () => {
    const registration = new FakeRegistration();
    const waitingWorker = new FakeWorker();
    registration.waiting = waitingWorker;
    const serviceWorker = new FakeServiceWorkerContainer(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: serviceWorker,
    });

    render(<TestHarness />);
    await flushRegistration();
    expect(screen.getByText('available').textContent).toBe('available');

    await act(async () => {
      screen.getByRole('button', { name: 'Later' }).click();
    });
    expect(screen.getByText('hidden').textContent).toBe('hidden');

    registration.update.mockClear();
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(registration.update).toHaveBeenCalledTimes(1);
    expect(screen.getByText('hidden').textContent).toBe('hidden');

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(registration.update).toHaveBeenCalledTimes(2);
    expect(screen.getByText('hidden').textContent).toBe('hidden');

    const newerWorker = new FakeWorker();
    newerWorker.state = 'installing';
    await act(async () => {
      registration.emitUpdateFound(newerWorker);
      newerWorker.state = 'installed';
      newerWorker.dispatchEvent(new Event('statechange'));
    });

    expect(screen.getByText('available').textContent).toBe('available');
  });
});
