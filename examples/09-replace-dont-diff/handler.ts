import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { loadShell, tryStatic } from "../../lib/files.ts";

const SHELL = loadShell(import.meta.url);

// The "data": a few teams whose scores random-walk each tick. The starting scores
// match the static board baked into index.html, so the first paint (and the no-API
// fallback) line up with the streamed updates that follow.
type Row = { name: string; score: number };
const INITIAL: Row[] = [
  { name: "Astro Foxes", score: 42 },
  { name: "Quantum Owls", score: 39 },
  { name: "Neon Yaks", score: 37 },
  { name: "Pixel Pandas", score: 35 },
  { name: "Turbo Newts", score: 31 },
  { name: "Velvet Crabs", score: 28 },
];

function step(teams: Row[]): Row[] {
  for (const t of teams) {
    t.score = Math.max(0, t.score + Math.round((Math.random() - 0.45) * 6));
  }
  return [...teams].sort((a, b) => b.score - a.score);
}

/** Render the ordered rows. Each row carries a stable view-transition-name so a
 *  browser that opts into transitions animates the reshuffle for free, but the
 *  replacement itself needs none of that. */
function rows(sorted: Row[]): string {
  const max = Math.max(...sorted.map((t) => t.score), 1);
  return sorted.map((t, i) => {
    const slug = t.name.toLowerCase().replace(/[^a-z]+/g, "-");
    const pct = Math.round((t.score / max) * 100);
    return `    <li style="view-transition-name:row-${slug}">
      <span class="rank">${i + 1}</span>
      <span class="name">${t.name}</span>
      <span class="bar"><span class="fill" style="width:${pct}%"></span></span>
      <span class="score">${t.score}</span>
    </li>`;
  }).join("\n");
}

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    // Per-connection state so concurrent viewers get independent walks.
    const teams = INITIAL.map((t) => ({ ...t }));
    return streamingResponse(async (write) => {
      await write(SHELL);
      // Never-ending: each tick replaces the whole list. When the client closes,
      // the next write() throws StreamAborted and the loop exits quietly.
      while (true) {
        await sleep(1000);
        // Re-emit the <?start>/<?end> marker inside each template so the region
        // stays addressable for the next tick; the whole list is replaced in place.
        await write(
          `<template for="board"><?start name="board"><ol class="frame">\n${
            rows(step(teams))
          }\n</ol><?end></template>\n`,
        );
      }
    });
  }
  return tryStatic(import.meta.url, path) ?? new Response("Not found", { status: 404 });
}
