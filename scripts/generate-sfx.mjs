#!/usr/bin/env node
/**
 * Generate a short ElevenLabs sound effect and write an MP3.
 *
 * Lives in the repo so the same command works locally and in a Cloud Agent VM.
 * The API key is never committed: set ELEVENLABS_API_KEY in the environment
 * (local .env / Cloud Agent secrets).
 *
 *   node scripts/generate-sfx.mjs "soft wooden click"
 *   node scripts/generate-sfx.mjs "soft wooden click" --out public/sounds/click.mp3 --duration 1.2
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const API_URL = "https://api.elevenlabs.io/v1/sound-generation";
const DEFAULT_DIR = "public/sounds";

function slugify(text) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "sfx";
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--loop") {
      flags.loop = true;
      continue;
    }
    if (arg === "--out" || arg === "--duration") {
      flags[arg.slice(2)] = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    positional.push(arg);
  }
  const text = positional.join(" ").trim();
  if (!text) {
    throw new Error(
      'Usage: node scripts/generate-sfx.mjs "<description>" [--out path] [--duration 2] [--loop]',
    );
  }
  const duration = flags.duration === undefined ? 2 : Number(flags.duration);
  if (!Number.isFinite(duration) || duration < 0.5 || duration > 30) {
    throw new Error("--duration must be a number between 0.5 and 30");
  }
  return {
    text,
    out: flags.out ?? join(DEFAULT_DIR, `${slugify(text)}.mp3`),
    duration,
    loop: flags.loop === true,
  };
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }

  const { text, out, duration, loop } = parseArgs(process.argv.slice(2));

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      duration_seconds: duration,
      loop,
      model_id: "eleven_text_to_sound_v2",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ElevenLabs ${response.status}: ${detail}`);
  }

  const audio = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, audio);
  process.stdout.write(`${out} (${audio.length} bytes)\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
