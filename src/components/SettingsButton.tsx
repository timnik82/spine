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
      className="fixed right-4 top-16 z-40 h-11 w-11 cursor-pointer rounded-full bg-white/90 shadow-md backdrop-blur-sm sm:top-4"
      style={{
        borderColor: 'var(--ex-border)',
        color: 'var(--ex-fg)',
      }}
    >
      <Settings className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}
