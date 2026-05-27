import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { loadShell, tryStatic } from "../../lib/files.ts";

const SHELL = loadShell(import.meta.url);
const SUFFIX = `</body></html>`;

interface Island {
  name: string;
  delayMs: number;
  body: string;
}

const ISLANDS: Island[] = [
  {
    name: "news",
    delayMs: 1400,
    body: `<ul style="margin:0;padding-left:1.2rem;font-size:.9rem;">
  <li>chrome 148: declarative partial updates lands</li>
  <li>safari 26.2: navigation api</li>
  <li>firefox: still no opinion on dpu</li>
</ul>`,
  },
  {
    name: "weather",
    delayMs: 600,
    body: `<p style="margin:0;font-size:2rem;font-weight:700;">12°c</p>
<p style="margin:0;color:var(--muted);font-size:.85rem;">liverpool, cloudy</p>`,
  },
  {
    name: "builds",
    delayMs: 2400,
    body: `<ul style="margin:0;padding-left:1.2rem;font-size:.85rem;">
  <li>aifocus / main &mdash; <span style="color:#1d8b3e;">green</span></li>
  <li>agent-do / main &mdash; <span style="color:#1d8b3e;">green</span></li>
  <li>declarative-partial-updates-experiments / main &mdash; <span style="color:#b87b00;">running</span></li>
</ul>`,
  },
];

async function fetchIsland(island: Island): Promise<{ name: string; body: string }> {
  await sleep(island.delayMs);
  return { name: island.name, body: island.body };
}

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return streamingResponse(async (write) => {
      await write(SHELL);
      const pending = ISLANDS.map((island) =>
        fetchIsland(island).then((r) => write(`<template for="${r.name}">${r.body}</template>`))
      );
      await Promise.all(pending);
      await write(SUFFIX);
    });
  }
  return tryStatic(import.meta.url, path) ?? new Response("Not found", { status: 404 });
}
