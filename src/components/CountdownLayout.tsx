import type { ReactNode } from 'react';
import { HomeButton } from '@/components/HomeButton';

interface CountdownLayoutProps {
  title: string;
  /** Which side is coming up, on the exercises that hold one side at a time. */
  subtitle?: string;
  onHome: () => void;
  /** The countdown itself — a dial, a bare number, whatever the screen shows. */
  children: ReactNode;
  footer?: ReactNode;
}

/** Calm full-screen shell shared by the prepare and rest countdowns. */
export function CountdownLayout({
  title,
  subtitle,
  onHome,
  children,
  footer,
}: CountdownLayoutProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'var(--ex-rest-bg)',
        padding: 'var(--ex-page-padding)',
        paddingTop:
          'calc(var(--ex-page-padding) + env(safe-area-inset-top, 0px))',
      }}
    >
      <HomeButton onHome={onHome} color="var(--ex-rest-fg)" />
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <h1
            className="font-medium tracking-wide"
            style={{
              fontFamily: 'var(--font-kids)',
              fontSize: 'var(--ex-heading-size)',
              color: 'var(--ex-rest-fg)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="font-semibold"
              style={{
                fontFamily: 'var(--font-kids)',
                fontSize: 'var(--ex-side-size)',
                color: 'var(--ex-rest-fg)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>

      {footer && <footer className="flex-shrink-0 pb-8">{footer}</footer>}
    </div>
  );
}
