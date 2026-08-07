# Spine

Spine é uma aplicação de acompanhamento para um programa de exercícios
terapêuticos para a coluna, projetada para ser usada em casa, sem
equipamento e sem supervisão.

## Para que serve

O programa guia o utilizador através de uma sequência de exercícios
divididos em três fases: aquecimento, exercícios e alongamentos.
Cada exercício apresenta instruções passo-a-passo, um temporizador
visual circular com contagem decrescente e controlo de séries e
repetições. Entre exercícios há pausas cronometradas para descanso.

## Para quem

Destina-se principalmente a crianças que precisam de realizar
exercícios de fortalecimento e mobilidade da coluna como parte de
um plano de saúde ou reabilitação, sob recomendação de um
profissional de saúde. A aplicação funciona como um guia visual que
acompanha a criança durante a prática, evitando a necessidade de
memorizar a sequência ou consultar folhas de papel.

## Estado atual

- Dados completos para 10 exercícios em 3 fases
- Programa completo jogável, do primeiro ao último exercício
- Contagem de preparação antes dos exercícios cronometrados
- Temporizador circular com contagem decrescente visual
- Continuação automática entre séries cronometradas e descansos
- Conclusão em bloco para exercícios de repetições
- Instruções detalhadas para cada exercício
- Pausas de descanso cronometradas entre séries
- Botão de regresso imediato ao início a partir de qualquer ecrã
- Definições de descanso ajustáveis e persistentes para exercícios cronometrados com mais de uma série

## Analytics (PostHog)

A app envia eventos anónimos de funil (início de sessão/exercício, séries, saltos de descanso, navegação, classificação) via PostHog. Sem token configurado, o SDK não inicia.

1. Cria um projeto em [PostHog](https://posthog.com) e copia o project token e o host (US `https://us.i.posthog.com` ou EU `https://eu.i.posthog.com`).
2. Copia `.env.example` para `.env.local` e preenche:

```bash
VITE_POSTHOG_PROJECT_TOKEN=phc_...
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

3. No deploy (ex. Vercel), define as mesmas variáveis de ambiente.

Eventos custom: `session_started`, `exercise_started`, `leg_completed`, `set_completed`, `exercise_completed`, `rest_skipped`, `instructions_opened` / `instructions_closed`, `exercise_navigated`, `session_rated`, `session_reset`. Autocapture de cliques/pageviews fica ativa com os defaults do SDK (`defaults: '2026-05-30'`).
