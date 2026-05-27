import { sleep, streamingResponse } from "../../lib/streaming.ts";

const SHELL = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>05 · Islands (zero JS)</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body>
<main>
  <p class="crumbs"><a href="/">&larr; back to index</a></p>
  <h1>05. islands, server-orchestrated, zero client JS</h1>
  <p class="lede">A page with three islands. The server holds the connection open and races three async data sources in parallel. Whichever finishes first flushes its <code>&lt;template for&gt;</code> first. No JS runs on the page.</p>

  <section class="island-grid">
    <article class="island" id="island-news">
      <h3>news</h3>
      <section>
        <?start name="news">
          <div class="skeleton"></div>
          <div class="skeleton"></div>
          <div class="skeleton sm"></div>
        <?end>
      </section>
    </article>

    <article class="island" id="island-weather">
      <h3>weather</h3>
      <section>
        <?start name="weather">
          <div class="skeleton lg"></div>
          <div class="skeleton sm"></div>
        <?end>
      </section>
    </article>

    <article class="island" id="island-builds">
      <h3>builds</h3>
      <section>
        <?start name="builds">
          <div class="skeleton"></div>
          <div class="skeleton"></div>
          <div class="skeleton"></div>
        <?end>
      </section>
    </article>
  </section>

  <p style="margin-top:1.5rem;color:var(--muted);font-size:.85rem;">island timings: weather ~600ms, news ~1.4s, builds ~2.4s. Watch them fill in order of completion.</p>
</main>
`;

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
  <li>dpu-experiments / main &mdash; <span style="color:#b87b00;">running</span></li>
</ul>`,
  },
];

async function fetchIsland(island: Island): Promise<{ name: string; body: string }> {
  await sleep(island.delayMs);
  return { name: island.name, body: island.body };
}

const SUFFIX = `</body></html>`;

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return streamingResponse(async (write) => {
      await write(SHELL);
      // race them — whichever resolves first flushes first
      const pending = ISLANDS.map((island) =>
        fetchIsland(island).then(async (r) => {
          await write(`<template for="${r.name}">${r.body}</template>`);
        })
      );
      await Promise.all(pending);
      await write(SUFFIX);
    });
  }
  return new Response("Not found", { status: 404 });
}
