export const REST_SECONDS = 10;
/**
 * Shown on repetition exercises marked `perSide`: one repetition covers both
 * sides, so the child swaps inside the repetition instead of running the block
 * twice.
 */
export const SIDE_SWAP_HINT = 'Em cada repetição troca de lado.';
export const PREPARE_SECONDS = 3;
/**
 * The source permits 15-20 seconds. Issue #9 set the MVP default to the
 * minimum (15); raise it to 20 only as a deliberate product decision.
 */
export const PLANK_SECONDS = 15;

export type Phase = 'aquecimento' | 'exercicios' | 'alongamentos';
export type Mode = 'timer' | 'repetitions';
export type SideNoun = 'lado' | 'perna';

/**
 * What an exercise has to show the child. Either form may be absent; when both
 * are present the clip wins, which the component that renders it decides.
 */
export interface Demonstration {
  image?: string;
  video?: string;
}

/** Whether there is anything to show at all. */
export function hasDemonstration(media: Demonstration): boolean {
  return Boolean(media.video || media.image);
}

interface ExerciseBase {
  id: string;
  phase: Phase;
  order: number;
  name: string;
  lead?: string;
  instructions: string[];
  summary: string;
  sets: number;
  media: Demonstration;
  audio?: string;
}

type TimedExercise = ExerciseBase & { mode: 'timer'; durationSec: number };

/**
 * The mode decides which counters an exercise carries, so consumers can read
 * them straight off a narrowed exercise instead of inventing a default each
 * time they need one.
 *
 * A timed hold held one side at a time has to name its sides: the label is all
 * the child has to tell the legs apart, so leaving `sideNoun` out is a compile
 * error rather than a hold that runs twice without saying why.
 */
export type Exercise =
  | (TimedExercise & { perSide: true; sideNoun: SideNoun })
  | (TimedExercise & { perSide?: false; sideNoun?: never })
  | (ExerciseBase & {
      mode: 'repetitions';
      reps: number;
      repetitionLabel: string;
      /** One repetition covers both sides, so neither side is ever named. */
      perSide?: boolean;
      sideNoun?: never;
    });

export const programme: Exercise[] = [
  {
    id: 'marcha-no-lugar',
    phase: 'aquecimento',
    order: 1,
    name: 'Marcha no lugar',
    instructions: [
      'Marcha sem sair do sítio.',
      'Mexe os braços naturalmente.',
      'Mantém as costas direitas.',
    ],
    summary: 'Faz durante 2 minutos.',
    mode: 'timer',
    durationSec: 120,
    sets: 1,
    media: {
      video: '/marcha-no-lugar.mp4',
    },
  },
  {
    id: 'crescer-ate-ao-teto',
    phase: 'exercicios',
    order: 2,
    name: 'Crescer até ao teto',
    lead: 'Imagina que um fio está a puxar o topo da tua cabeça para cima.',
    instructions: [
      'Na posição de pé (manter os pés à largura dos ombros e fixos no chão).',
      'Mantém os ombros relaxados.',
      'Cresce o mais alto que conseguires.',
      'Respira devagar (o ar entra pelo nariz e sai pela boca).',
    ],
    summary: 'Mantém durante 10 segundos. Repete 10 vezes.',
    mode: 'timer',
    durationSec: 10,
    sets: 10,
    media: {
      image: '/intro-crescer.jpg',
    },
  },
  {
    id: 'respiracao-profunda',
    phase: 'exercicios',
    order: 3,
    name: 'Respiração profunda',
    instructions: [
      'Coloca as mãos nas costelas.',
      'Inspira pelo nariz lentamente.',
      'Sente as costelas a abrir.',
      'Expira pela boca devagar.',
    ],
    summary: 'Faz 10 respirações lentas.',
    mode: 'repetitions',
    reps: 10,
    repetitionLabel: 'respirações',
    sets: 1,
    media: {
      image: '/respiracao-profunda.jpg',
    },
  },
  {
    id: 'gato-assanhado',
    phase: 'exercicios',
    order: 4,
    name: 'Gato assanhado / Gato e camelo',
    instructions: [
      'Coloca-te de mãos e joelhos.',
      'Arredonda as costas como um camelo, olhando para cima. (Expirar)',
      'Depois faz o movimento contrário, olhando ligeiramente o chão. (Inspirar)',
      'Faz os movimentos devagar.',
    ],
    summary: '10 repetições.',
    mode: 'repetitions',
    reps: 10,
    repetitionLabel: 'repetições',
    sets: 1,
    media: {
      video: '/gato-assanhado.mp4',
    },
  },
  {
    id: 'ponte',
    phase: 'exercicios',
    order: 5,
    name: 'Ponte',
    instructions: [
      'Deita-te de barriga para cima.',
      'Dobra os joelhos.',
      'Levanta a bacia devagar. (Expirar)',
      'Mantém os ombros apoiados no chão. (Inspirar)',
      'Desce lentamente.',
    ],
    summary: '10 repetições.',
    mode: 'repetitions',
    reps: 10,
    repetitionLabel: 'repetições',
    sets: 1,
    media: {
      image: '/ponte.jpg',
    },
  },
  {
    id: 'cao-de-caca',
    phase: 'exercicios',
    order: 6,
    name: 'Cão de caça (Bird Dog) — ou super-homem',
    instructions: [
      'Fica de mãos e joelhos.',
      'Estica um braço para a frente. (Expirar)',
      'Estica a perna do lado contrário. (Expirar)',
      'Mantém o equilíbrio.',
      'Volta devagar. (Inspirar)',
      'Troca de lado.',
    ],
    summary: '8 repetições para cada lado.',
    mode: 'repetitions',
    reps: 8,
    repetitionLabel: 'repetições',
    sets: 1,
    perSide: true,
    media: {
      image: '/cao-de-caca.jpg',
    },
  },
  {
    id: 'prancha-de-joelhos',
    phase: 'exercicios',
    order: 7,
    name: 'Prancha de joelhos',
    instructions: [
      'Apoia os antebraços no chão.',
      'Mantém os joelhos apoiados.',
      'Faz uma linha direita desde a cabeça até aos joelhos.',
      'Respira normalmente.',
    ],
    summary: 'Mantém 15 a 20 segundos. Repete 3 vezes.',
    mode: 'timer',
    durationSec: PLANK_SECONDS,
    sets: 3,
    media: {
      image: '/prancha-de-joelhos.jpg',
    },
  },
  {
    id: 'equilibrio-numa-perna',
    phase: 'exercicios',
    order: 8,
    name: 'Equilíbrio numa perna',
    instructions: [
      'Fica de pé.',
      'Levanta um pé.',
      'Mantém o equilíbrio.',
      'Troca de perna.',
      'Respirar normalmente.',
    ],
    summary: '20 segundos em cada perna. Repete 3 vezes.',
    mode: 'timer',
    durationSec: 20,
    sets: 3,
    perSide: true,
    sideNoun: 'perna',
    media: {
      image: '/equilibrio-numa-perna.jpg',
    },
  },
  {
    id: 'alongamento-lateral',
    phase: 'alongamentos',
    order: 9,
    name: 'Alongamento lateral (sentado ou em pé)',
    instructions: [
      'Levanta um braço acima da cabeça.',
      'Inclina o corpo para o lado contrário.',
      'Não prendas a respiração.',
    ],
    summary: '20 segundos para cada lado. Repete 2 vezes.',
    mode: 'timer',
    durationSec: 20,
    sets: 2,
    perSide: true,
    sideNoun: 'lado',
    media: {
      image: '/alongamento-lateral.jpg',
    },
  },
  {
    id: 'alongamento-musculos-coxa',
    phase: 'alongamentos',
    order: 10,
    name: 'Alongamento dos músculos de trás da coxa',
    instructions: [
      'Senta-te no chão.',
      'Estica uma perna.',
      'Inclina-te ligeiramente para a frente.',
      'Mantém as costas direitas.',
    ],
    summary: '20 segundos em cada perna. Repete 2 vezes.',
    mode: 'timer',
    durationSec: 20,
    sets: 2,
    perSide: true,
    sideNoun: 'perna',
    media: {
      image: '/alongamento-musculos-coxa.jpg',
    },
  },
];

/** The closing block from the source file: checklist, rating, encouragement. */
export const finalChecklist = [
  'Respira fundo 3 vezes.',
  'Bebe um pouco de água.',
] as const;

export type Rating = 'facil' | 'medio' | 'dificil';

export const ratingOptions: readonly {
  id: Rating;
  emoji: string;
  label: string;
}[] = [
  { id: 'facil', emoji: '😃', label: 'Fácil' },
  { id: 'medio', emoji: '😐', label: 'Mais ou menos' },
  { id: 'dificil', emoji: '😓', label: 'Difícil' },
];

export const FINAL_MESSAGE =
  'Parabéns! Cada vez que fazes os exercícios estás a ajudar o teu corpo a ficar mais forte.';

/** Section headings from the source file, shown on the introduction screens. */
/**
 * The main block carries no label: the counter beside it already says
 * "Exercício N de 10", so the word on its own only repeats that. The other two
 * name a section the counter does not, and say how long it lasts. An empty
 * label means the screen shows no phase badge at all.
 */
export const phaseLabels: Record<Phase, string> = {
  aquecimento: 'Aquecimento (2 minutos)',
  exercicios: '',
  alongamentos: 'Alongamentos (3 minutos)',
};

export function hasNextExercise(exerciseIndex: number): boolean {
  return exerciseIndex < programme.length - 1;
}

/**
 * How many legs one set is made of. `perSide` means two only for timed holds,
 * which are held on one side at a time; a repetition covers both sides at once,
 * so its block still runs a single leg.
 */
export function legsPerSet(exercise: Exercise): 1 | 2 {
  return exercise.mode === 'timer' && exercise.perSide ? 2 : 1;
}

const sideLabels: Record<SideNoun, readonly [string, string]> = {
  lado: ['Lado direito', 'Lado esquerdo'],
  perna: ['Perna direita', 'Perna esquerda'],
};

/** The label for the leg being held, or undefined when sides do not apply. */
export function sideLabel(
  exercise: Exercise,
  sideIndex: number
): string | undefined {
  if (exercise.mode !== 'timer' || !exercise.perSide) return undefined;
  return sideLabels[exercise.sideNoun][sideIndex];
}
