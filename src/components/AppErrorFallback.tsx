import { PrimaryButton } from '@/components/PrimaryButton';

/**
 * Full-screen recovery UI shown by Sentry's ErrorBoundary when a render
 * error escapes the session state machine.
 *
 * Reload is the recovery path: session state is in-memory only, so a full
 * page load returns to the intro screen (see AGENTS.md). Calling
 * `resetError()` before reload would be a no-op — reload tears down the root.
 */
export function AppErrorFallback() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{
        background: 'var(--ex-bg)',
        padding: 'var(--ex-page-padding)',
        color: 'var(--ex-fg)',
      }}
      role="alert"
    >
      <h1
        className="text-center font-medium tracking-wide"
        style={{
          fontFamily: 'var(--font-kids)',
          fontSize: 'var(--ex-heading-size)',
        }}
      >
        Algo correu mal
      </h1>
      <p
        className="max-w-md text-center"
        style={{
          fontFamily: 'var(--font-kids)',
          color: 'var(--ex-fg-muted)',
          fontSize: 'var(--ex-body-size)',
        }}
      >
        Recarrega a página para continuar o treino.
      </p>
      <PrimaryButton
        type="button"
        onClick={() => {
          window.location.reload();
        }}
      >
        Recarregar
      </PrimaryButton>
    </div>
  );
}
