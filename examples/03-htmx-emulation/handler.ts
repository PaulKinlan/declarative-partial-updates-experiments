import { fragmentResponse, htmlPage, sleep, streamingResponse } from "../../lib/streaming.ts";

const INDEX = `<main>
  <p class="crumbs"><a href="/">&larr; back to index</a></p>
  <h1>03. htmx-style attributes, in 40 lines</h1>
  <p class="lede">A tiny client (~40 lines) wires <code>data-get</code>, <code>data-target</code> and <code>data-swap</code> to streamed partial updates. No library. Add <code>data-get="/path"</code> to any element and it works.</p>

  <section style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem;">
    <button data-get="/03/fragment/news"      data-target="#out" data-swap="inner">load news</button>
    <button data-get="/03/fragment/weather"   data-target="#out" data-swap="inner">load weather</button>
    <button data-get="/03/fragment/quote"     data-target="#out" data-swap="inner">load quote</button>
    <button data-get="/03/fragment/append"    data-target="#out" data-swap="append">append paragraph</button>
    <button data-get="/03/fragment/prepend"   data-target="#out" data-swap="prepend">prepend paragraph</button>
    <button data-get="/03/fragment/news"      data-target="#out" data-swap="replace">replace whole &lt;section&gt;</button>
  </section>

  <h3>Target #out</h3>
  <section class="demo-area" id="out">
    <p style="color:var(--muted);margin:0;">target. swap modes: inner / append / prepend / replace.</p>
  </section>

  <h3>The whole client</h3>
  <pre><code>document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-get]');
  if (!el) return;
  e.preventDefault();
  const target = document.querySelector(el.dataset.target);
  const swap = el.dataset.swap || 'inner';
  const res = await fetch(el.dataset.get);
  const sink = {
    inner:   target.streamHTMLUnsafe(),
    append:  target.streamAppendHTMLUnsafe(),
    prepend: target.streamPrependHTMLUnsafe(),
    replace: target.streamReplaceWithHTMLUnsafe(),
  }[swap];
  await res.body.pipeThrough(new TextDecoderStream()).pipeTo(sink);
});</code></pre>

  <script src="/03/client.js"></script>
</main>`;

const CLIENT_JS = `// pure-DOM htmx-lite, ~40 lines
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-get]');
  if (!el) return;
  e.preventDefault();
  const target = document.querySelector(el.dataset.target);
  if (!target) return;
  const swap = el.dataset.swap || 'inner';
  const sinkFor = {
    inner:   (t) => t.streamHTMLUnsafe?.(),
    append:  (t) => t.streamAppendHTMLUnsafe?.(),
    prepend: (t) => t.streamPrependHTMLUnsafe?.(),
    replace: (t) => t.streamReplaceWithHTMLUnsafe?.(),
  };
  const sink = sinkFor[swap]?.(target);
  if (!sink) {
    // graceful fallback for browsers without DPU
    const html = await (await fetch(el.dataset.get)).text();
    if (swap === 'inner')   target.innerHTML = html;
    if (swap === 'append')  target.insertAdjacentHTML('beforeend', html);
    if (swap === 'prepend') target.insertAdjacentHTML('afterbegin', html);
    if (swap === 'replace') target.outerHTML = html;
    return;
  }
  const res = await fetch(el.dataset.get);
  await res.body
    .pipeThrough(new TextDecoderStream())
    .pipeTo(sink);
});`;

const FRAGMENTS: Record<string, string[]> = {
  news: [
    "<h2 style=\"margin:0 0 .4rem;\">latest news</h2>",
    "<ul style=\"margin:0;padding-left:1.2rem;\">",
    "<li>chrome 148 ships declarative partial updates</li>",
    "<li>navigation api ships in safari 26.2</li>",
    "<li>web push reaches 10 years from spec to ios</li>",
    "</ul>",
  ],
  weather: [
    "<h2 style=\"margin:0 0 .4rem;\">weather</h2>",
    "<p style=\"margin:0;\">liverpool, 12°c, cloudy with hopeful sun.</p>",
  ],
  quote: [
    "<h2 style=\"margin:0 0 .4rem;\">quote</h2>",
    "<blockquote style=\"margin:0;border-left:3px solid var(--accent);padding-left:.8rem;color:var(--muted);\">",
    "&quot;the web is being cooked, and it smells fantastic.&quot;",
    "</blockquote>",
  ],
  append: ["<p style=\"margin:0.5rem 0 0;color:var(--muted);font-size:.9rem;\">appended at " + Date.now() + "</p>"],
  prepend: ["<p style=\"margin:0 0 0.5rem;color:var(--muted);font-size:.9rem;\">prepended at " + Date.now() + "</p>"],
};

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") return htmlPage(INDEX, "03 · HTMX emulation");
  if (path === "/client.js") {
    return new Response(CLIENT_JS, {
      headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" },
    });
  }
  const fragMatch = path.match(/^\/fragment\/(\w+)$/);
  if (fragMatch) {
    const key = fragMatch[1];
    // regenerate timestamped fragments per request
    const tokens = key === "append"
      ? [`<p style="margin:0.5rem 0 0;color:var(--muted);font-size:.9rem;">appended at ${new Date().toLocaleTimeString()}</p>`]
      : key === "prepend"
      ? [`<p style="margin:0 0 0.5rem;color:var(--muted);font-size:.9rem;">prepended at ${new Date().toLocaleTimeString()}</p>`]
      : FRAGMENTS[key];
    if (!tokens) return fragmentResponse("<p>fragment not found</p>");
    return streamingResponse(async (write) => {
      for (const t of tokens) {
        await write(t);
        await sleep(120);
      }
    });
  }
  return fragmentResponse("Not found");
}
