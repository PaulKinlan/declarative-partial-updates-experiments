import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { sourceBlock } from "../../lib/source.ts";

const SOURCE = sourceBlock(import.meta.url);

interface Section {
  name: string;
  delayMs: number;
  render: () => string;
}

// Simulated data fetches. In a real app these would be DB queries.
const SECTIONS: Section[] = [
  {
    name: "user",
    delayMs: 200,
    render: () =>
      `<h2 style="margin:0 0 .25rem;">Hello, Paul</h2>
<p style="margin:0;color:var(--muted);font-size:.9rem;">last seen 2 minutes ago</p>`,
  },
  {
    name: "feed",
    delayMs: 900,
    render: () =>
      `<ul style="margin:0;padding-left:1.2rem;">
  <li>declarative partial updates landed in chrome 148</li>
  <li>navigation api shipped in safari 26.2</li>
  <li>llms can now write whole browsers, apparently</li>
</ul>`,
  },
  {
    name: "shop",
    delayMs: 1600,
    render: () =>
      `<div style="display:flex;gap:1rem;align-items:center;">
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
    render: () =>
      `<p style="margin:0;color:var(--muted);font-size:.8rem;">all sections rendered server-side, streamed as each backend completed. zero client JS.</p>`,
  },
];

const SHELL = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>06 · Streaming SSR</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body>
<main>
  <p class="crumbs"><a href="/">&larr; back to index</a></p>
  <h1>06. streaming SSR with DPU</h1>
  <p class="lede">The entire page is server-rendered in one HTTP response. The shell flushes immediately, then each section streams in as its backend resolves. Out-of-order. Zero client JS. Refresh as many times as you want.</p>

  <section class="demo-area">
    <?start name="user">
      <div class="skeleton lg"></div>
      <div class="skeleton sm"></div>
    <?end>
  </section>

  <h3>feed</h3>
  <section class="demo-area">
    <?start name="feed">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton sm"></div>
    <?end>
  </section>

  <h3>shop</h3>
  <section class="demo-area">
    <?start name="shop">
      <div class="skeleton lg"></div>
      <div class="skeleton sm"></div>
    <?end>
  </section>

  <section style="margin-top:2rem;">
    <?start name="footer"><span style="color:var(--muted);font-size:.75rem;">waiting for footer...</span><?end>
  </section>

  ${SOURCE}
</main>
`;

async function fetchSection(s: Section): Promise<{ name: string; html: string }> {
  await sleep(s.delayMs);
  return { name: s.name, html: s.render() };
}

const SUFFIX = `</body></html>`;

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return streamingResponse(async (write) => {
      await write(SHELL);
      // Race all sections; flush each as it resolves.
      const pending = SECTIONS.map((section) =>
        fetchSection(section).then(async (r) => {
          await write(`<template for="${r.name}">${r.html}</template>`);
        })
      );
      await Promise.all(pending);
      await write(SUFFIX);
    });
  }
  return new Response("Not found", { status: 404 });
}
