import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="outline"
      size="icon"
      aria-label="Definições"
      className="fixed right-4 z-40 h-11 w-11 cursor-pointer rounded-full bg-white/90 shadow-md backdrop-blur-sm top-[calc(4rem+env(safe-area-inset-top,0px))] sm:top-[calc(1rem+env(safe-area-inset-top,0px))]"
      style={{
        borderColor: 'var(--ex-border)',
        color: 'var(--ex-fg)',
      }}
    >
      <Settings className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}
