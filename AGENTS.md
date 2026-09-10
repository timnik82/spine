# Spine

Spine is a single-page, frontend-only React app (Vite + TypeScript + Tailwind v4, shadcn-ui components) that guides children through a therapeutic spine exercise programme. UI text is in Portuguese. There is no backend, database, or auth.

## Cursor Cloud specific instructions

- This is a frontend-only Vite app. There is no lint script. The quality gates are `npm run typecheck` (tsc `-b --noEmit`), `npm run build` (`tsc -b && vite build`) and `npm run test` (Vitest + Testing Library, jsdom; specs live next to the code as `*.test.tsx`).
- Dev server: `npm run dev` (Vite, serves at `http://localhost:5173/`). It binds to localhost only — it is not exposed on the network unless started with `--host`.
- The app is a client-side state machine (see `src/App.tsx`): `intro → prepare → active → rest → … → final`. Timed exercises take the `prepare` countdown before every leg; repetition exercises go straight to `active`. Finishing an exercise opens the next one's intro, and finishing the last one closes the session on `final`. There is no per-exercise completion screen. State resets on page reload, so reloading the page always returns to the intro screen.
- On the active exercise screen the `Instruções` and `Seguinte` buttons sit next to each other; when testing via GUI automation, click carefully to avoid advancing the set when you meant to open the instructions overlay.

## Target platform

The app ships to **mobile Safari on iOS**. That is the reference browser — not Chrome, not desktop.

Two devices matter, and they answer different questions:

- **A 9.7-inch iPad (768x1024 points) is the delivery target.** Judge layout, spacing, and anything viewport-shaped against it. A phone-sized screen is the wrong reference for how the app will actually be used, and no simulator ships that exact size any more — the closest checks are an iPad simulator for real WebKit plus a 768x1024 browser viewport for the geometry.
- **An iPhone is the device on hand for verification.** It settles input, audio, and WebKit behaviour; it says nothing about whether the iPad layout holds.

The dev preview runs on Chromium, so "it works in the preview" is not evidence for input, audio, or viewport behaviour. When a change touches any of those, state plainly which device it was verified on, or that it was only checked locally. An unverified fix is fine; an unverified fix reported as done is not.

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

Shipped interface sounds live in `public/sounds/` and are decoded by `src/lib/sounds.ts`. To generate a new short SFX (local or Cloud Agent), run `npm run sfx -- "soft wooden click"` or `node scripts/generate-sfx.mjs "…" --out public/sounds/name.mp3 --duration 1.2`. Duration defaults to 2 seconds; if the user or the task names a length, pass `--duration` (0.5–30). `npm run sfx` loads `.env` then `.env.local` if they exist; an already-set `ELEVENLABS_API_KEY` wins. It calls ElevenLabs `POST /v1/sound-generation` and needs that key in the environment (Cloud Agent secret / local `.env`), never in the repo and never as a `VITE_` variable.

`stopwatch-end-bell.mp3` is the end-of-countdown cue: `src/lib/sounds.ts` decodes it, and `useCountdownCue` (wired in `src/App.tsx`) ticks `stopwatch-last-seconds.mp3` as each of the last three seconds opens, then rings the bell at zero. `stopwatch-end-chime.mp3` is kept on purpose as the alternative take — the owner wants both on hand — so do not delete it; it ships unused because everything in `public/` is copied verbatim. They were generated with `npm run sfx -- "single warm soft bell ding, short decay, gentle, clean" --duration 1.5` and `npm run sfx -- "short friendly rising two-tone chime, completion sound, clean" --duration 1.2`.

To listen to sounds from inside an agent session, build a self-contained player page instead of sending files one by one: `npm run sfx:player -- public/sounds --title "Stopwatch sounds"` (accepts files or directories, `--out` defaults to `dist-sound-player/index.html`). It embeds each file as a base64 data URI, so the page needs no server and no network — open it locally, or publish it as an Artifact and play the whole batch in the chat with per-track play buttons, real waveforms and click-to-seek. The 16 MB Artifact limit caps a page at roughly 11 minutes of 128 kbps MP3; the script refuses to build past that rather than failing on publish.

## Learned User Preferences

- Small ignore-only housekeeping can go straight on `main` when asked; dependency and security lockfile updates go on a branch with a PR.
- **Never schedule recurring self check-ins** (hourly `send_later`/cron wake-ups to re-poll a PR, CI or a deploy). Each firing costs the owner's usage quota, and they have asked for none. Subscribe to PR webhook events if useful, act on what arrives, then end the turn — do not add a timer on top. If a PR genuinely needs re-checking later, say so and let the owner ask.

## Learned Workspace Facts

- Git `origin` is `timnik82/spine`, a public fork of `labramik/spine`. There is no local `upstream` remote.
- Vercel project `spine` is linked to `timnik82/spine` and must build with Vite (`npm install`, `npm run build`, `dist`), not a custom `build.mjs`.
- `.zcode/` and `.cursor/hooks/` are gitignored local agent/hook state; keep `.cursor/environment.json` tracked as Cloud Agent config.
