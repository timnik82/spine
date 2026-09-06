#!/usr/bin/env node
/**
 * Build a self-contained HTML player for local sound files.
 *
 * The audio is embedded as base64 data URIs, so the page plays with no network
 * and no server — open it locally, or publish it as an Artifact to listen to a
 * batch of sounds inside a Claude Code session without downloading each file.
 *
 *   node scripts/build-sound-player.mjs public/sounds
 *   node scripts/build-sound-player.mjs public/sounds/click.mp3 --out /tmp/player.html
 *   npm run sfx:player -- public/sounds --title "Stopwatch sounds"
 */

import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(HERE, "sound-player-template.html");
const DEFAULT_OUT = "dist-sound-player/index.html";
const AUDIO_EXT = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm"]);
const MIME = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
};
// Artifacts cap the rendered page at 16 MB and base64 costs ~33% on top of the
// raw bytes, so refuse to build a page that would be rejected on publish.
const MAX_ENCODED_BYTES = 15 * 1024 * 1024;

function parseArgs(argv) {
  const inputs = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out" || arg === "--title" || arg === "--subtitle") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      flags[arg.slice(2)] = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    inputs.push(arg);
  }
  if (inputs.length === 0) {
    throw new Error(
      'Usage: node scripts/build-sound-player.mjs <file-or-dir…> [--out path] [--title "…"] [--subtitle "…"]',
    );
  }
  return {
    inputs,
    out: flags.out ?? DEFAULT_OUT,
    title: flags.title ?? "Sound Bench",
    subtitle: flags.subtitle,
  };
}

async function collect(inputs) {
  const files = [];
  for (const input of inputs) {
    const info = await stat(input);
    if (info.isDirectory()) {
      const entries = await readdir(input);
      for (const entry of entries.sort()) {
        if (AUDIO_EXT.has(extname(entry).toLowerCase())) {
          files.push(join(input, entry));
        }
      }
      continue;
    }
    if (!AUDIO_EXT.has(extname(input).toLowerCase())) {
      throw new Error(`Not an audio file: ${input}`);
    }
    files.push(input);
  }
  if (files.length === 0) {
    throw new Error("No audio files found in the given paths");
  }
  return files;
}

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
}

function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  const { inputs, out, title, subtitle } = parseArgs(process.argv.slice(2));
  const files = await collect(inputs);

  const tracks = [];
  let encoded = 0;
  for (const file of files) {
    const audio = await readFile(file);
    const data = audio.toString("base64");
    encoded += data.length;
    if (encoded > MAX_ENCODED_BYTES) {
      throw new Error(
        `Embedded audio exceeds ${formatSize(MAX_ENCODED_BYTES)} at ${file} — split the batch into several pages`,
      );
    }
    tracks.push({
      name: basename(file),
      size: formatSize(audio.length),
      mime: MIME[extname(file).toLowerCase()],
      data,
    });
  }

  const heading = title;
  const eyebrow = `${tracks.length} ${tracks.length === 1 ? "sound" : "sounds"} · embedded audio`;
  const sub =
    subtitle ??
    `Локальные звуковые файлы из ${inputs.join(", ")}. Нажмите play — воспроизведение идёт прямо на странице.`;

  const template = await readFile(TEMPLATE, "utf8");
  // JSON goes inside a <script> block, so no "</script>" may survive in it.
  const payload = JSON.stringify(tracks).replaceAll("</", "<\\/");
  // Replacement *strings* interpret "$&", "$`" and friends, which would corrupt
  // any title or file name containing them — a function replacer never does.
  const literal = (value) => () => value;
  const html = template
    .replaceAll("__EYEBROW__", literal(escapeHtml(eyebrow)))
    .replaceAll("__HEADING__", literal(escapeHtml(heading)))
    .replaceAll("__SUBTITLE__", literal(escapeHtml(sub)))
    .replace("__TRACKS__", literal(payload));

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html);
  process.stdout.write(`${out} (${tracks.length} tracks, ${formatSize(Buffer.byteLength(html))})\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
