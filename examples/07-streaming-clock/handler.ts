import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { sourceBlock } from "../../lib/source.ts";

const SOURCE = sourceBlock(import.meta.url);

const SHELL = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>07 · streaming clock</title>
  <link rel="stylesheet" href="/public/styles.css">
  <style>
    .clock-face {
      font-size: 3.5rem;
      font-weight: 700;
      text-align: center;
      padding: 2.5rem 1rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      margin: 1.5rem 0;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
    }
    /* The connection stays open. Every tick appends a fresh <span>.
       We hide all spans and only show the most recent one. */
    .clock-face section span { display: none; }
    .clock-face section span:last-of-type { display: inline; color: var(--accent); }
  </style>
</head>
<body>
<main>
  <p class="crumbs"><a href="/">&larr; back to index</a></p>
  <h1>07. streaming clock (never-ending response)</h1>
  <p class="lede">A single HTTP response that stays open forever. Every second the server flushes a fresh <code>&lt;template for=&quot;clock&quot;&gt;</code>. The marker is re-emitted inside each template so the next tick has somewhere to land. A CSS rule hides every <code>&lt;span&gt;</code> except the last, so the clock updates in place. Zero client JS.</p>

  <div class="clock-face">
    <section>
      <?start name="clock"><span>loading...</span><?end>
    </section>
  </div>

  <p style="color:var(--muted);font-size:.85rem;">Open DevTools' Network panel and look at this response. The status will stay "pending" forever (or until you close the tab); each tick is a chunk on the wire.</p>

  ${SOURCE}
</main>
`;

const SUFFIX = `</body></html>`;

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return streamingResponse(async (write) => {
      await write(SHELL);
      while (true) {
        const time = new Date().toLocaleTimeString();
        await write(
          `<template for="clock">\n  <?start name="clock"><span>${time}</span><?end>\n</template>\n`,
        );
        await sleep(1000);
      }
      // unreachable; when the client disconnects, write() throws StreamAborted and the loop exits cleanly.
      // deno-lint-ignore no-unreachable
      await write(SUFFIX);
    });
  }
  return new Response("Not found", { status: 404 });
}
