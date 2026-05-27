import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { sourceBlock } from "../../lib/source.ts";

const SOURCE = sourceBlock(import.meta.url);

const SHELL = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>08 · skeleton card</title>
  <link rel="stylesheet" href="/public/styles.css">
  <style>
    .store-shell {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem 0 2rem;
    }
    .product-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      width: 100%;
      max-width: 360px;
      min-height: 460px;
      display: flex;
      flex-direction: column;
    }
    /* Skeleton shapes match the final layout, not generic boxes. */
    .sk-image  { height: 200px; width: 100%; margin-bottom: 1.25rem; border-radius: 8px; }
    .sk-title  { height: 1.75rem; width: 60%; margin-bottom: 0.75rem; }
    .sk-price  { height: 1.1rem;  width: 28%; margin-bottom: 1rem; }
    .sk-line   { height: 0.85rem; width: 100%; margin-bottom: 0.55rem; }
    .sk-line.short { width: 70%; }
    .sk-button { height: 2.75rem; width: 100%; margin-top: auto; border-radius: 8px; }

    /* Real-content styles match the skeleton shapes. */
    .product-image {
      height: 200px;
      width: 100%;
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, var(--card) 40%));
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      font-weight: 700;
      color: var(--card);
      margin-bottom: 1.25rem;
    }
    .product-card h2 { margin: 0 0 .25rem; font-size: 1.4rem; font-weight: 700; }
    .product-card .price { color: var(--muted); font-size: 1.05rem; font-weight: 500; margin: 0 0 0.4rem; }
    .product-card .role  { color: var(--muted); font-size: 0.85rem; margin: 0 0 0.75rem; }
    .product-card .bio   { font-size: 0.9rem; line-height: 1.5; color: var(--fg); margin: 0 0 1rem; }
    .product-card .buy-btn {
      margin-top: auto;
      width: 100%;
      padding: 0.85rem;
      border-radius: 8px;
      border: none;
      background: var(--fg);
      color: var(--bg);
      font-weight: 600;
      cursor: pointer;
    }
    @media (prefers-color-scheme: dark) {
      .product-card .buy-btn { background: var(--accent); color: var(--bg); }
    }
  </style>
</head>
<body>
<main>
  <p class="crumbs"><a href="/">&larr; back to index</a></p>
  <h1>08. skeleton card (placeholder shapes match the real layout)</h1>
  <p class="lede">A product card whose <code>&lt;?start&gt;/&lt;?end&gt;</code> placeholder uses skeleton boxes shaped like the final content — image area, title, price, two text lines, button — so there's no layout shift when the data arrives. Zero client JS.</p>

  <section class="store-shell">
    <div class="product-card">
      <?start name="user-data">
        <div class="skeleton sk-image"></div>
        <div class="skeleton sk-title"></div>
        <div class="skeleton sk-price"></div>
        <div class="skeleton sk-line"></div>
        <div class="skeleton sk-line short"></div>
        <div class="skeleton sk-button"></div>
      <?end>
    </div>
  </section>

  <p style="color:var(--muted);font-size:.85rem;">Hint: server holds the response open for 2.5s, then flushes the late template. Refresh to see the skeleton again.</p>

  ${SOURCE}
</main>
`;

const LATE_FRAGMENT = `
<template for="user-data">
  <div class="product-image">PK</div>
  <h2>Paul Kinlan</h2>
  <p class="price">$99 / hr</p>
  <p class="role">Chrome Developer Relations</p>
  <p class="bio">Leads Chrome DevRel at Google. Likes the web, open standards, agents, and pubs in Liverpool.</p>
  <button class="buy-btn">hire now</button>
</template>
</body>
</html>`;

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return streamingResponse(async (write) => {
      await write(SHELL);
      await sleep(2500);
      await write(LATE_FRAGMENT);
    });
  }
  return new Response("Not found", { status: 404 });
}
