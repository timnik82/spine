export const REST_SECONDS = 10;
export const PLANK_SECONDS = 20;

export type Phase = 'aquecimento' | 'exercicios' | 'alongamentos';
export type Mode = 'timer' | 'counter';

export interface Exercise {
  id: string;
  phase: Phase;
  order: number;
  name: string;
  lead?: string;
  instructions: string[];
  summary: string;
  mode: Mode;
  durationSec?: number;
  reps?: number;
  sets: number;
  perSide?: boolean;
  media: { image?: string; video?: string };
  audio?: string;
}

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
    media: {},
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
    media: {},
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
    mode: 'counter',
    reps: 10,
    sets: 1,
    media: {},
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
    mode: 'counter',
    reps: 10,
    sets: 1,
    media: {},
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
    mode: 'counter',
    reps: 10,
    sets: 1,
    media: {},
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
    mode: 'counter',
    reps: 8,
    sets: 1,
    perSide: true,
    media: {},
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
    media: {},
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
    media: {},
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
    media: {},
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
    media: {},
  },
];
