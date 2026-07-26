import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeButtonProps {
  onHome: () => void;
  /** CSS color value (e.g. "#f00", "oklch(0.5 0.1 200)") */
  color?: string;
  variant?: 'outline' | 'default';
  /**
   * Set on screens that lay the button out themselves (e.g. inside a header
   * grid); otherwise it floats over the top-left corner.
   */
  inFlow?: boolean;
}

export function HomeButton({
  onHome,
  color,
  variant = 'outline',
  inFlow = false,
}: HomeButtonProps) {
  const style: React.CSSProperties = {};
  if (color) {
    if (variant === 'outline') {
      style.borderColor = color;
      style.color = color;
    } else {
      style.backgroundColor = color;
    }
  }

  return (
    <Button
      onClick={onHome}
      variant={variant}
      size="icon"
      className={cn(
        'z-10 cursor-pointer rounded-full',
        !inFlow && 'absolute left-4 top-4'
      )}
      style={style}
      aria-label="Voltar ao início"
    >
      <Home className="h-5 w-5" />
    </Button>
  );
}
