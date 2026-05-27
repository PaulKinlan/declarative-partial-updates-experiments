import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { loadShell, tryStatic } from "../../lib/files.ts";

const SHELL = loadShell(import.meta.url);
const SUFFIX = `</body></html>`;

interface Section {
  name: string;
  delayMs: number;
  html: string;
}

const SECTIONS: Section[] = [
  {
    name: "user",
    delayMs: 200,
    html: `<h2 style="margin:0 0 .25rem;">Hello, Paul</h2>
<p style="margin:0;color:var(--muted);font-size:.9rem;">last seen 2 minutes ago</p>`,
  },
  {
    name: "feed",
    delayMs: 900,
    html: `<ul style="margin:0;padding-left:1.2rem;">
  <li>declarative partial updates landed in chrome 148</li>
  <li>navigation api shipped in safari 26.2</li>
  <li>llms can now write whole browsers, apparently</li>
</ul>`,
  },
  {
    name: "shop",
    delayMs: 1600,
    html: `<div style="display:flex;gap:1rem;align-items:center;">
  <div style="width:48px;height:48px;border-radius:8px;background:var(--code-bg);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--muted);">PK</div>
  <div>
    <strong>kit · hire me</strong><br>
    <span style="color:var(--muted);font-size:.85rem;">£99/hr · 4.9 reviews</span>
  </div>
</div>`,
  },
  {
    name: "footer",
    delayMs: 2200,
    html:
      `<p style="margin:0;color:var(--muted);font-size:.8rem;">all sections rendered server-side, streamed as each backend completed. zero client JS.</p>`,
  },
];

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return streamingResponse(async (write) => {
      await write(SHELL);
      const pending = SECTIONS.map((s) =>
        sleep(s.delayMs).then(() => write(`<template for="${s.name}">${s.html}</template>`))
      );
      await Promise.all(pending);
      await write(SUFFIX);
    });
  }
  return tryStatic(import.meta.url, path) ?? new Response("Not found", { status: 404 });
}
