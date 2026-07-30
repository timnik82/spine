import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FINAL_MESSAGE,
  legsPerSet,
  phaseLabels,
  programme,
} from '@/data/programme';
import { renderProbe } from '@/lib/renderProbe';
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
}

function completeCrescerAndOpenRespiracao() {
  runTimedExercise({ durationSec: 10, sets: 10 });
}

/** Walks the four exercises before Cão de caça and leaves its intro open. */
function openCaoDeCaca() {
  completeMarchaAndOpenCrescer();
  completeCrescerAndOpenRespiracao();

  for (let block = 0; block < 3; block += 1) {
    finishRepetitionBlock();
  }
}

/** Plays the whole programme and stops on the closing screen. */
function openFinalScreen() {
  programme.forEach((exercise) => {
    if (exercise.mode === 'timer') {
      runTimedExercise({
        durationSec: exercise.durationSec,
        sets: exercise.sets,
        legsPerSet: legsPerSet(exercise),
      });
    } else {
      finishRepetitionBlock();
    }
  });
}

/** Walks everything before Equilíbrio numa perna and leaves its intro open. */
function openEquilibrio() {
  openCaoDeCaca();
  finishRepetitionBlock();
  runTimedExercise({ durationSec: 15, sets: 3 });
}

/**
 * Plays one timed exercise from its intro to its completion screen, following
 * the same rules the reducer does: a preparation countdown before every leg, a
 * rest only after the last leg of a set that is not the last set.
 */
function runTimedExercise({
  durationSec,
  sets,
  legsPerSet = 1,
}: {
  durationSec: number;
  sets: number;
  legsPerSet?: number;
}) {
  act(() => {
    screen.getByRole('button', { name: /começar/i }).click();
  });
  advance(3_100);

  for (let set = 1; set <= sets; set += 1) {
    for (let leg = 1; leg <= legsPerSet; leg += 1) {
      advance(durationSec * 1_000 + 100);

      if (set === sets && leg === legsPerSet) break;

      if (leg < legsPerSet) {
        advance(3_100);
      } else {
        advance(10_100);
        advance(3_100);
      }
    }
  }
}

function finishRepetitionBlock() {
  act(() => {
    screen.getByRole('button', { name: /começar/i }).click();
  });
  act(() => {
    screen.getByRole('button', { name: /terminei/i }).click();
  });
}

/** Jumps straight to an exercise through the always-present navigation. */
function selectExercise(index: number) {
  const exerciseSelect = screen.getByRole('combobox', {
    name: /selecionar exercício/i,
  });
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value'
    )?.set?.call(exerciseSelect, String(index));
    exerciseSelect.dispatchEvent(new Event('change', { bubbles: true }));
  });
}


describe('exercise programme', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
        'Date',
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

  it('announces every second while re-rendering once per second (#11)', () => {
    render(<App />);

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(3_100);

    expect(
      screen.getByRole('region', { name: /Exercício: 120 segundos restantes/ })
    ).toBeTruthy();

    const probeStart = renderProbe.count;
    advance(100);
    expect(
      screen.getByRole('region', { name: /Exercício: 119 segundos restantes/ })
    ).toBeTruthy();
    advance(1_000);
    expect(
      screen.getByRole('region', { name: /Exercício: 118 segundos restantes/ })
    ).toBeTruthy();

    advance(9_000);
    // ~600 animation frames elapsed over these ten seconds; only the eleven
    // whole-second crossings (120→…→109) may reach shared state. Before #11
    // this window produced a render per frame.
    expect(renderProbe.count - probeStart).toBeLessThanOrEqual(15);

    // The hand still moves at sub-second precision, driven outside React.
    const hand = document.querySelector('#seconds-hand');
    expect(hand?.getAttribute('transform')).toMatch(/rotate\(\d+\.\d+ /);
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
      screen.getByRole('img', { name: 'Cronometro: 1 de 120 segundos' })
    ).toBeTruthy();
  });

  it('advances directly after Marcha into Crescer intro', () => {
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

  it('completes all repetitions with one Terminei tap and opens next exercise', () => {
    render(<App />);
    completeMarchaAndOpenCrescer();
    completeCrescerAndOpenRespiracao();

    expect(screen.getByRole('heading', { name: 'Respiração profunda' })).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    expect(screen.getByText('Faz 10 respirações lentas.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Respiração profunda' })).toBeTruthy();
    expect(
      screen.getByRole('timer', { name: 'Tempo decorrido: 00:00' })
    ).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();

    act(() => {
      screen.getByRole('button', { name: /terminei/i }).click();
    });

    expect(screen.getByRole('heading', { name: 'Gato assanhado / Gato e camelo' })).toBeTruthy();
  });

  it('runs the repetition blocks in order', () => {
    render(<App />);
    completeMarchaAndOpenCrescer();
    completeCrescerAndOpenRespiracao();

    const finishBlockAndOpenNext = (nextExercise: string) => {
      finishRepetitionBlock();
      expect(screen.getByRole('heading', { name: nextExercise })).toBeTruthy();
    };

    finishBlockAndOpenNext('Gato assanhado / Gato e camelo');
    finishBlockAndOpenNext('Ponte');
    finishBlockAndOpenNext('Cão de caça (Bird Dog) — ou super-homem');
  });

  it('keeps repetition media mounted when the exercise starts', () => {
    render(<App />);

    selectExercise(3);

    const videoBeforeStart = document.querySelector(
      'video[src="/gato-assanhado.mp4"]'
    );
    expect(videoBeforeStart).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    expect(screen.getByRole('button', { name: /terminei/i })).toBeTruthy();
    expect(screen.getByText('10 repetições.')).toBeTruthy();
    expect(document.querySelector('video[src="/gato-assanhado.mp4"]')).toBe(
      videoBeforeStart
    );
  });

  it('counts repetition time, pauses for instructions and resets on navigation', () => {
    render(<App />);
    completeMarchaAndOpenCrescer();
    completeCrescerAndOpenRespiracao();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(2_100);
    expect(
      screen.getByRole('timer', { name: 'Tempo decorrido: 00:02' })
    ).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /instruções/i }).click();
    });
    advance(3_000);
    expect(
      document.querySelector('[role="timer"]')?.getAttribute('aria-label')
    ).toBe('Tempo decorrido: 00:02');

    act(() => {
      screen.getByRole('button', { name: /fechar/i }).click();
    });
    advance(1_100);
    expect(
      screen.getByRole('timer', { name: 'Tempo decorrido: 00:03' })
    ).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /próximo exercício/i }).click();
    });
    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    expect(
      screen.getByRole('timer', { name: 'Tempo decorrido: 00:00' })
    ).toBeTruthy();
  });

  it('restarts the repetition timer when the running exercise is reselected', () => {
    render(<App />);
    completeMarchaAndOpenCrescer();
    completeCrescerAndOpenRespiracao();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(2_100);
    expect(
      screen.getByRole('timer', { name: 'Tempo decorrido: 00:02' })
    ).toBeTruthy();

    // Reselecting the running exercise restarts it without moving the index,
    // so the elapsed time has to fall back to zero all the same.
    selectExercise(2);
    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    expect(
      screen.getByRole('timer', { name: 'Tempo decorrido: 00:00' })
    ).toBeTruthy();
  });

  it('keeps repetition elapsed time accurate after a throttled interval', () => {
    render(<App />);
    completeMarchaAndOpenCrescer();
    completeCrescerAndOpenRespiracao();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    // A throttled interval fires far less often than it was scheduled to, so
    // the clock is pushed ahead of the single tick that does get through.
    const tickingClock = performance.now.bind(performance);
    const throttledClock = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => tickingClock() + 9_000);

    act(() => {
      vi.advanceTimersToNextTimer();
    });

    expect(
      screen.getByRole('timer', { name: 'Tempo decorrido: 00:10' })
    ).toBeTruthy();

    throttledClock.mockRestore();
  });

  it('offers a Home button during an active repetition exercise', () => {
    render(<App />);
    completeMarchaAndOpenCrescer();
    completeCrescerAndOpenRespiracao();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    act(() => {
      screen.getByRole('button', { name: /voltar ao início/i }).click();
    });

    expect(screen.getByRole('heading', { name: 'Marcha no lugar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /começar/i })).toBeTruthy();
  });

  it('counts one Cão de caça repetition as both sides', () => {
    render(<App />);
    openCaoDeCaca();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });

    expect(screen.getByText('8 repetições para cada lado.')).toBeTruthy();
    expect(screen.getByText('Em cada repetição troca de lado.')).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /terminei/i }).click();
    });

    expect(screen.getByRole('heading', { name: 'Prancha de joelhos' })).toBeTruthy();
  });

  it('runs Prancha as three timed sets and advances to next exercise', () => {
    render(<App />);
    openCaoDeCaca();
    finishRepetitionBlock();

    expect(screen.getByRole('heading', { name: 'Prancha de joelhos' })).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(3_100);
    advance(15_100);

    expect(screen.getByRole('heading', { name: 'Descansa' })).toBeTruthy();
    advance(10_100);
    advance(3_100);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');

    advance(15_100);
    advance(10_100);
    advance(3_100);
    advance(15_100);

    expect(screen.getByRole('heading', { name: 'Equilíbrio numa perna' })).toBeTruthy();
  });

  it('holds both legs before an Equilíbrio set counts', () => {
    render(<App />);
    openEquilibrio();

    expect(screen.getByRole('heading', { name: 'Equilíbrio numa perna' })).toBeTruthy();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    advance(3_100);
    advance(20_100);

    // Swapping legs happens inside the set: preparation only, no rest.
    expect(screen.getByRole('heading', { name: /preparar/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Descansa' })).toBeNull();

    advance(3_100);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    expect(
      screen.getByRole('img', { name: 'Cronometro: 0 de 20 segundos' })
    ).toBeTruthy();

    advance(20_100);
    expect(screen.getByRole('heading', { name: 'Descansa' })).toBeTruthy();

    advance(10_100);
    advance(3_100);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('names the leg on the preparation and exercise screens', () => {
    render(<App />);
    openEquilibrio();

    act(() => {
      screen.getByRole('button', { name: /começar/i }).click();
    });
    expect(screen.getByText('Perna direita')).toBeTruthy();

    advance(3_100);
    expect(screen.getByText('Perna direita')).toBeTruthy();
    expect(
      screen.getByRole('region', { name: /Perna direita/ })
    ).toBeTruthy();

    advance(20_100);
    expect(screen.getByText('Perna esquerda')).toBeTruthy();

    advance(3_100);
    expect(screen.getByText('Perna esquerda')).toBeTruthy();
  });

  it('ends Equilíbrio after the second leg of the last set', () => {
    render(<App />);
    openEquilibrio();
    runTimedExercise({ durationSec: 20, sets: 3, legsPerSet: 2 });

    expect(screen.getByRole('heading', { name: 'Alongamento lateral (sentado ou em pé)' })).toBeTruthy();
  });

  it('plays all ten exercises in the prescribed order', () => {
    render(<App />);

    programme.forEach((exercise) => {
      expect(screen.getByRole('heading', { name: exercise.name })).toBeTruthy();
      expect(screen.getByText(phaseLabels[exercise.phase])).toBeTruthy();

      if (exercise.mode === 'timer') {
        runTimedExercise({
          durationSec: exercise.durationSec,
          sets: exercise.sets,
          legsPerSet: legsPerSet(exercise),
        });
      } else {
        finishRepetitionBlock();
      }
    });

    expect(screen.getByText('Dá uma nota ao treino:')).toBeTruthy();
  });

  it('closes the session with the checklist, a note and encouragement', () => {
    render(<App />);
    openFinalScreen();

    expect(screen.getByText('Respira fundo 3 vezes.')).toBeTruthy();
    expect(screen.getByText('Bebe um pouco de água.')).toBeTruthy();
    expect(screen.getByText('Dá uma nota ao treino:')).toBeTruthy();
    expect(screen.queryByText(FINAL_MESSAGE)).toBeNull();

    const easy = screen.getByRole('button', { name: /fácil/i });
    act(() => {
      easy.click();
    });

    expect(easy.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(FINAL_MESSAGE)).toBeTruthy();
  });

  it('starts a fresh session from the final screen', () => {
    render(<App />);
    openFinalScreen();

    act(() => {
      screen.getByRole('button', { name: /começar de novo/i }).click();
    });

    expect(screen.getByRole('heading', { name: 'Marcha no lugar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /começar/i })).toBeTruthy();
  });
});
