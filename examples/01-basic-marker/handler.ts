import { sleep, streamingResponse } from "../../lib/streaming.ts";

const SHELL = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>01 · Basic marker</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body>
<main>
  <p class="crumbs"><a href="/">&larr; back to index</a></p>
  <h1>01. basic marker placeholder</h1>
  <p class="lede">A single declarative <code>&lt;?marker&gt;</code> processing instruction is replaced when a matching <code>&lt;template for&gt;</code> arrives later in the same response. The connection stays open between the shell and the late fragment. No JavaScript runs on the page.</p>

  <h3>The marker, initially showing a skeleton</h3>
  <section class="demo-area" id="bio">
    <?start name="bio">
      <div class="skeleton lg"></div>
      <div class="skeleton"></div>
      <div class="skeleton sm"></div>
    <?end>
  </section>

  <h3>What was streamed in</h3>
  <pre><code>&lt;template for="bio"&gt;
  &lt;h2&gt;Paul Kinlan&lt;/h2&gt;
  &lt;p&gt;Chrome DevRel...&lt;/p&gt;
&lt;/template&gt;</code></pre>

  <p style="margin-top:2rem;color:var(--muted);font-size:.85rem;">Hint: the server holds the connection open for ~1.8s then flushes the template. The shell renders immediately.</p>
</main>
`;

const LATE_FRAGMENT = `
<template for="bio">
  <h2 style="margin:0 0 .4rem;">Paul Kinlan</h2>
  <p style="margin:0;color:var(--muted);">Chrome DevRel. Likes the web, agents, and pubs in Liverpool.</p>
</template>
</body>
</html>`;

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return streamingResponse(async (write) => {
      await write(SHELL);
      await sleep(1800);
      await write(LATE_FRAGMENT);
    });
  }
  return new Response("Not found", { status: 404 });
}
