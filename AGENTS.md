# Spine

Spine is a single-page, frontend-only React app (Vite + TypeScript + Tailwind v4, shadcn-ui components) that guides children through a therapeutic spine exercise programme. UI text is in Portuguese. There is no backend, database, or auth.

## Cursor Cloud specific instructions

- This is a frontend-only Vite app. There is no lint script. The quality gates are `npm run typecheck` (tsc `-b --noEmit`), `npm run build` (`tsc -b && vite build`) and `npm run test` (Vitest + Testing Library, jsdom; specs live next to the code as `*.test.tsx`).
- Dev server: `npm run dev` (Vite, serves at `http://localhost:5173/`). It binds to localhost only — it is not exposed on the network unless started with `--host`.
- The app is a client-side state machine (see `src/App.tsx`): `intro → active → rest → … → done`. State resets on page reload, so reloading the page always returns to the intro screen.
- On the active exercise screen the `Instruções` and `Seguinte` buttons sit next to each other; when testing via GUI automation, click carefully to avoid advancing the set when you meant to open the instructions overlay.

## Target platform

The app ships to **mobile Safari on iOS**. That is the reference browser — not Chrome, not desktop.

The dev preview runs on Chromium, so "it works in the preview" is not evidence for input, audio, or viewport behaviour. When a change touches any of those, state plainly whether it was verified on a real iPhone or only locally. An unverified fix is fine; an unverified fix reported as done is not.

## Touch input is best-effort

`pointerdown` says a gesture started. Nothing guarantees anything will finish it. iOS Safari drops `pointerup` when the finger drifts off, when the gesture becomes a scroll, and when the system takes over (Control Centre, notification shade, an incoming call).

- Never make correctness depend on the closing event reaching the element that started the gesture. Listen for release on `window`, unconditionally.
- Do not build on pointer capture. `hasPointerCapture()` returns `true` the instant `setPointerCapture()` is called — the spec sets a *pending* override — so any fallback gated on it is dead code that reads as correct.
- Prefer state that heals itself over state that enumerates failure cases. A lost signal should cost one interaction; it must never leave a control stuck or unresponsive until reload.
- WebKit does not reliably honour `touch-action` on SVG children. Put it on an HTML ancestor if it has to hold.

## Verify semantics, don't infer them

Most of the cost of the stuck-crown bug (PR #8, four failed rounds) was one guard everybody assumed could be false. Before relying on what a DOM API returns, check the spec or MDN — especially for anything whose return value gates a fallback path. If a branch can never be taken, the safety net it guards does not exist.

## Pointer tests in jsdom prove less than they look

Synthetic `PointerEvent`s carry pointer ids the browser never issued, so `setPointerCapture()` throws and capture-dependent code takes a different branch than it does on a device. A green pointer-lifecycle suite does not mean the gesture survives iOS.

Test the failure modes directly: release arriving on `window` instead of the element, release never arriving at all, and a fresh press after a lost one.

## Audio

iOS blocks audio until a user gesture and adds audible latency to `HTMLAudioElement`. Decode short interface sounds into Web Audio buffers ahead of the interaction and play them as one-shot sources. Expect the first sound of a session to be the weakest — that one cannot be fixed, only moved earlier.
