import { describe, expect, it } from 'vitest';

// Regression guard for the `@` path alias in vite.config.ts / vitest.config.ts.
// Vitest resolves through the same Vite config, so importing via `@/` here
// exercises the alias through the real resolver. This exists because an earlier
// change used URL.pathname directly, which yields a non-canonical "/C:/.../src"
// path on Windows; the test suite passed only because no test imported via `@/`,
// so the broken alias went unnoticed. Don't let that happen again.
describe('@ path alias', () => {
  it('resolves a module through the @ alias', async () => {
    // cn is the shadcn className helper — pure, stable, imported via @/ across
    // the component tree. Resolving it through @/ proves the alias works end
    // to end through Vite's resolver.
    const { cn } = await import('@/lib/utils');
    expect(typeof cn).toBe('function');
    expect(cn('a', 'b')).toBe('a b');
  });
});
