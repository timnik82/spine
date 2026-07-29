import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PrimaryButtonProps = ComponentProps<typeof Button>;

/**
 * The accent CTA used on the intro, done, final and instructions screens.
 *
 * The preset is the set of `--ex-btn-*` tokens shared by those four screens:
 * consolidating it here keeps their dimensions in one place, so a resize is a
 * one-line change instead of four drift-prone copies. Callers can still append
 * `className` (merged with `twMerge`) or override `style`, e.g. the overlay's
 * `px-8` tighter padding.
 */
export function PrimaryButton({
  className,
  style,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      className={cn(
        'cursor-pointer rounded-[var(--ex-btn-radius)] px-12 font-semibold',
        className
      )}
      style={{
        height: 'var(--ex-btn-height)',
        minWidth: 'var(--ex-btn-min-width)',
        fontSize: 'var(--ex-btn-font-size)',
        backgroundColor: 'var(--ex-accent)',
        color: 'var(--ex-accent-fg)',
        ...style,
      }}
      {...props}
    />
  );
}
