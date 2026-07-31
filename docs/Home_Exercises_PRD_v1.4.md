# Home Exercises — Product Requirements Document

Version: 1.4 Date: 23 July 2026 Status: Minimal agreed scope Primary platform: Bolt (regular web application, not Bolt Slides) Target device: 10-inch tablet Source files: "Os meus exercícios.md" and the Granola notes "PRD v1" and "Music integration for exercises"

## 0\. Changes

### Version 1.4

1. Platform changed from Bolt Slides to a regular web application built in Bolt. Bolt Slides is designed for presenting a deck to an audience (presenter mode, annotations, free forward and backward navigation) and none of that is needed here. Free navigation is actively harmful: a tap mid-exercise must not skip ahead. Section 1 already required the product to behave like an application rather than a presentation; v1.2 contradicted that in its choice of platform.  
2. Section 6 rewritten for React, TypeScript and Vite, with screen transitions driven by application state and no router.  
3. Added a design tokens file so colours, type sizes and spacing can be changed in one place.  
4. Added an interface rule forbidding swipe or tap-anywhere navigation.  
5. Progressive web app packaging (installable icon, offline use) deferred to a later version; see section 7\.  
6. Delivery approach added in section 10: build a vertical slice of one exercise first, then extend.

### Version 1.3

1. The stretching block carries an explicit duration in the source: "Alongamentos (3 minutos)". Added to section 2\.  
2. Exercise 6 has an alternative name in the source: "Cão de caça (Bird Dog) — ou super-homem". Restored the full name.  
3. Exercise 9 has a position qualifier in the source: "Alongamento lateral (sentado ou em pé)". Restored the full name.  
4. Added a clarification on numbering: the numbers 1–10 used in this PRD are a global running order for the player. The source file restarts numbering inside each section. The interface must display exercise names only and never the source numbers.

## 1\. Purpose

Home Exercises is a full-screen interactive player for a prescribed home programme. It should behave like a simple application, not like a conventional slide presentation.

The exercise names, order, instructions, durations, repetitions, sides, and number of sets must come from "Os meus exercícios.md". The application must not replace real programme values with generic examples.

The programme is intended for 3 sessions per week and takes approximately 15–20 minutes.

## 2\. Programme

The player numbering below (1–10) is the global running order. It is internal and is not shown to the user.

Aquecimento (2 minutos)

1. Marcha no lugar — 2 minutes.

Exercícios 2\. Crescer até ao teto — hold for 10 seconds, repeat 10 times. 3\. Respiração profunda — 10 slow breaths. 4\. Gato assanhado / Gato e camelo — 10 repetitions. 5\. Ponte — 10 repetitions. 6\. Cão de caça (Bird Dog) — ou super-homem — 8 repetitions on each side. 7\. Prancha de joelhos — hold for 15–20 seconds, repeat 3 times. 8\. Equilíbrio numa perna — 20 seconds on each leg, repeat 3 times.

Alongamentos (3 minutos) 9\. Alongamento lateral (sentado ou em pé) — 20 seconds on each side, repeat 2 times. 10\. Alongamento dos músculos de trás da coxa — 20 seconds on each leg, repeat 2 times.

At the end, show the steps contained in the source file: take 3 deep breaths, drink water, choose Fácil / Mais ou menos / Difícil, and show the final encouragement message.

The full Portuguese instructions for every exercise must be copied exactly from "Os meus exercícios.md", including the section durations and the alternative names given above.

## 3\. Exercise Flow

Each exercise begins with a full-screen introduction containing:

- the exercise name;  
- a full-screen placeholder image;  
- later support for replacing the placeholder with a generated image or a short video.

During the exercise:

- the exercise name remains visible at the top;  
- the timer or counter occupies as much of the screen as possible;  
- instructions remain hidden by default and open through an Instructions button;  
- the full instruction text is taken word for word from the source file.

When the programme specifies time, show a timer.

When the programme specifies a count, show a simple progress counter such as "1 of 10". "Respiração profunda" uses the same generic counter for its 10 breaths; it does not require a separate breathing or biometric system.

Where the programme combines time, repetitions, sides, or sets, the screen must show the relevant current progress. Examples include 10-second holds repeated 10 times, 8 repetitions on each side, and 20 seconds on each leg repeated 3 times.

A short automatic rest timer appears between repeated timed holds or sets. Its duration can be configured separately for each eligible exercise from 0 to 60 seconds in five-second steps. Zero skips the rest screen and moves directly to the next preparation countdown.

Moving to the next exercise is always manual through a Next button.

A Home button is available on the active exercise, rest, and completion screens. Pressing it immediately resets the session and returns to the start of the programme. It is the only way to navigate backwards, and it always confirms before discarding an in-progress session.

## 4\. Music and Sound

Each exercise may have its own music or sound.

The audio begins when the full-screen introduction for that exercise appears and continues during the exercise.

No other sound behaviour is required in this version.

## 5\. Interface Requirements

- Use the full screen of a 10-inch tablet.  
- Use very large timer digits and progress numbers.  
- Keep controls large and easy to tap.  
- Keep the interface simple and uncluttered.  
- Do not require the instructions to remain visible during the exercise.  
- Display exercise names exactly as written in the source; do not display the source numbering.  
- Do not implement swipe or tap-anywhere navigation. Screens change only through explicit buttons, so that an accidental touch during an exercise cannot skip ahead.

## 6\. Technical Approach

- Build in Bolt as a regular web application, not with Bolt Slides.  
- React, TypeScript and Vite.  
- Screen transitions are driven by application state. No router is required.  
- Session state (current exercise, current set, current side, timer, rest, final rating) lives in one place and survives every screen change within a session.  
- Store the programme in one local structured data file.  
- Keep colours, type sizes and spacing in a single design tokens file.  
- Store exercise media references with the exercise data.  
- Reuse the same introduction, timer, counter, instructions, and next-exercise patterns across the programme.  
- Version 1 does not require a backend, database, authentication, or Supabase.  
- Rest-duration preferences are stored locally in the browser. No session progress or personal data is persisted.

## 7\. Open Decisions

- Rest duration defaults to 10 seconds for each eligible exercise and can be changed in Settings.
- Whether the plank timer should use 15 seconds, 20 seconds, or allow choosing between the two (currently a constant, default 20 seconds).  
- Final images, videos, music, and sounds.  
- Progressive web app packaging: deferred. To be added once the content and flow are stable, so that offline caching does not interfere with iteration.

## 8\. Acceptance Criteria

The first complete version is successful when:

1. It runs full screen on a 10-inch tablet-sized display.  
2. It presents the complete programme in the correct order.  
3. It uses the real values from "Os meus exercícios.md".  
4. It supports the programme's timed, counted, side-based, and repeated exercises.  
5. The exercise title is always visible during the active exercise.  
6. The main timer or counter is large and easy to read.  
7. Instructions open on demand and preserve the exact Portuguese source wording.  
8. Music starts with the exercise introduction and continues during the exercise.  
9. The user manually moves to the next exercise, and no accidental touch can skip ahead.  
10. Section durations and alternative exercise names match the source file.

## 9\. Bolt Prompt

The working prompt is maintained as a separate file in this folder: "Home Exercises — Bolt Prompt v1.2.md". It supersedes the prompt in PRD v1.2 and the earlier prompt file v1.1.

## 10\. Delivery Approach

The application is built in increments, each one small enough to test on the tablet before the next begins.

- Increment 1 — one complete exercise, end to end: introduction screen, start, timer with sets, rest between sets, instructions overlay, manual advance. Uses "Crescer até ao teto" (10 seconds, 10 sets) because it exercises every primitive at once. The data file already holds the whole programme, but only this exercise is played.  
- Increment 2 — the repetition counter mode, which unlocks the counted exercises.  
- Increment 3 — the side mode (left and right), which unlocks the remaining exercises.  
- Increment 4 — the full programme in order, section labels, and the final screen with the rating and the encouragement message.  
- Increment 5 — media and audio.  
- Increment 6 — progressive web app packaging, if still wanted.
