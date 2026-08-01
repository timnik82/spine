interface UpdateBannerProps {
  isApplying: boolean;
  onApply: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ isApplying, onApply, onDismiss }: UpdateBannerProps) {
  return (
    <aside className="pwa-update-banner" role="status" aria-live="polite">
      <p>Está disponível uma nova versão da aplicação.</p>
      <div className="pwa-update-banner__actions">
        <button type="button" onClick={onApply} disabled={isApplying}>
          {isApplying ? 'Updating…' : 'Update now'}
        </button>
        <button type="button" onClick={onDismiss} disabled={isApplying}>
          Later
        </button>
      </div>
    </aside>
  );
}
