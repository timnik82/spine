import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('@/components/BatteryReps', () => ({
  BatteryReps: ({ repsComplete, totalReps }: { repsComplete: number; totalReps: number }) => (
    <div role="progressbar" aria-valuenow={repsComplete} aria-valuemax={totalReps} />
  ),
}));

function advance(milliseconds: number) {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
}

function completeMarchaAndOpenCrescer() {
  act(() => {
    screen.getByRole('button', { name: /começar/i }).click();
  });
  advance(3_100);
  advance(120_100);
  act(() => {
    screen.getByRole('button', { name: /seguinte/i }).click();
  });
}

function completeCrescerAndOpenRespiracao() {
  act(() => {
    screen.getByRole('button', { name: /começar/i }).click();
  });
  advance(3_100);

  for (let set = 1; set <= 10; set += 1) {
    advance(10_100);
    if (set < 10) {
      advance(10_100);
      advance(3_100);
    }
  }

  act(() => {
    screen.getByRole('button', { name: /seguinte/i }).click();
  });
}

describe('five-exercise programme', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('starts Marcha after a three-second preparation countdown', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Marcha no lugar' })).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    expect(screen.getByRole('heading', { name: /preparar/i })).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(3_100);
    });

    expect(screen.getByRole('heading', { name: 'Marcha no lugar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /pausar/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /seguinte/i })).toBeNull();
  });

  it('keeps instructions hidden until the child asks for them', () => {
    render(<App />);

    expect(screen.queryByText('Marcha sem sair do sítio.')).toBeNull();

    act(() => {
      screen.getByRole('button', { name: /instruções/i }).click();
    });

    expect(screen.getByText('Marcha sem sair do sítio.')).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /fechar/i }).click();
    });

    expect(screen.getByRole('button', { name: /começar/i })).toBeTruthy();
    expect(screen.queryByText('Marcha sem sair do sítio.')).toBeNull();
  });

  it('pauses a timed exercise while instructions are open', () => {
    render(<App />);

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(3_100);
    advance(2_100);

    const stopwatch = screen.getByRole('img', { name: /cronometro/i });
    const elapsedBeforeInstructions = stopwatch.getAttribute('aria-label');

    act(() => {
      screen.getByRole('button', { name: /instruções/i }).click();
    });
    advance(5_000);

    expect(stopwatch.getAttribute('aria-label')).toBe(elapsedBeforeInstructions);

    act(() => {
      screen.getByRole('button', { name: /fechar/i }).click();
    });
    advance(1_100);

    expect(stopwatch.getAttribute('aria-label')).not.toBe(elapsedBeforeInstructions);
  });

  it('immediately restarts a timed exercise after the child resets it', () => {
    render(<App />);

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(3_100);
    advance(2_100);

    act(() => {
      screen.getByRole('button', { name: /reiniciar exercício/i }).click();
    });

    expect(screen.getByRole('button', { name: /pausar/i })).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Cronometro: 0 de 120 segundos' })
    ).toBeTruthy();

    advance(1_100);

    expect(
      screen.queryByRole('img', { name: 'Cronometro: 0 de 120 segundos' })
    ).toBeNull();
  });

  it('requires Seguinte after Marcha before opening Crescer', () => {
    render(<App />);

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    act(() => {
      vi.advanceTimersByTime(3_100);
    });

    act(() => {
      vi.advanceTimersByTime(120_100);
    });

    expect(screen.getByText('Concluído')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Marcha no lugar' })).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /seguinte/i }).click();
    });

    expect(screen.getByRole('heading', { name: 'Crescer até ao teto' })).toBeTruthy();
  });

  it('continues from a Crescer rest into the next set without another tap', () => {
    render(<App />);
    completeMarchaAndOpenCrescer();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(3_100);
    advance(10_100);

    expect(screen.getByRole('heading', { name: 'Descansa' })).toBeTruthy();

    advance(10_100);
    expect(screen.getByRole('heading', { name: 'Preparar' })).toBeTruthy();

    advance(3_100);
    expect(screen.getByRole('heading', { name: 'Crescer até ao teto' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /pausar/i })).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('completes all repetitions with one Terminei tap', () => {
    render(<App />);
    completeMarchaAndOpenCrescer();
    completeCrescerAndOpenRespiracao();

    expect(screen.getByRole('heading', { name: 'Respiração profunda' })).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    expect(screen.getByText('10 respirações')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();

    act(() => {
      screen.getByRole('button', { name: /terminei/i }).click();
    });

    expect(screen.getByText('Concluído')).toBeTruthy();
  });

  it('runs the three repetition blocks in order and stops after Ponte', () => {
    render(<App />);
    completeMarchaAndOpenCrescer();
    completeCrescerAndOpenRespiracao();

    const finishBlockAndOpenNext = (nextExercise: string) => {
      act(() => {
        screen.getByRole('button', { name: /começar/i }).click();
      });
      act(() => {
        screen.getByRole('button', { name: /terminei/i }).click();
      });
      act(() => {
        screen.getByRole('button', { name: /seguinte/i }).click();
      });
      expect(screen.getByRole('heading', { name: nextExercise })).toBeTruthy();
    };

    finishBlockAndOpenNext('Gato assanhado / Gato e camelo');
    finishBlockAndOpenNext('Ponte');

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    act(() => {
      screen.getByRole('button', { name: /terminei/i }).click();
    });

    expect(screen.getByText('Concluído')).toBeTruthy();
    expect(
      screen.getByText('Próximos exercícios serão adicionados no próximo incremento.')
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: /seguinte/i })).toBeNull();
  });
});
