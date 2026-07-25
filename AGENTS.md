# Spine

Spine is a single-page, frontend-only React app (Vite + TypeScript + Tailwind v4, shadcn-ui components) that guides children through a therapeutic spine exercise programme. UI text is in Portuguese. There is no backend, database, or auth.

## Cursor Cloud specific instructions

- This is a frontend-only Vite app. There are no automated tests and no lint script. The only quality gates are `npm run typecheck` (tsc `--noEmit`) and `npm run build` (`tsc -b && vite build`).
- Dev server: `npm run dev` (Vite, serves at `http://localhost:5173/`). It binds to localhost only — it is not exposed on the network unless started with `--host`.
- The app is a client-side state machine (see `src/App.tsx`): `intro → active → rest → … → done`. State resets on page reload, so reloading the page always returns to the intro screen.
- On the active exercise screen the `Instruções` and `Seguinte` buttons sit next to each other; when testing via GUI automation, click carefully to avoid advancing the set when you meant to open the instructions overlay.
