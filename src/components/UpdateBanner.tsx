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
          {isApplying ? 'A atualizar…' : 'Atualizar agora'}
        </button>
        <button type="button" onClick={onDismiss} disabled={isApplying}>
          Mais tarde
        </button>
      </div>
    </aside>
  );
}
