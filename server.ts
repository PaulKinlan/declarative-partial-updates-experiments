import handler01 from "./examples/01-basic-marker/handler.ts";
import handler02 from "./examples/02-streaming-fetch/handler.ts";
import handler03 from "./examples/03-htmx-emulation/handler.ts";
import handler04 from "./examples/04-navigation-api/handler.ts";
import handler05 from "./examples/05-islands/handler.ts";
import handler06 from "./examples/06-ssr/handler.ts";
import handler07 from "./examples/07-streaming-clock/handler.ts";
import handler08 from "./examples/08-skeleton-card/handler.ts";

const PORT = Number(Deno.env.get("PORT") ?? 3000);

const EXAMPLES = [
  {
    id: "01",
    title: "Basic marker placeholder",
    blurb: "<?marker> + <template for> declarative replacement, zero JS.",
  },
  {
    id: "02",
    title: "Streaming fetch into element",
    blurb: "streamHTML() piping a chunked fetch into the DOM.",
  },
  {
    id: "03",
    title: "HTMX emulation",
    blurb: "Tiny JS that turns data-target attributes into streamed partial updates.",
  },
  {
    id: "04",
    title: "Navigation API + DPU",
    blurb: "SPA routing via navigation.intercept(), content via streamHTML.",
  },
  {
    id: "05",
    title: "Islands architecture",
    blurb: "Independent islands, each fetched in parallel via DPU.",
  },
  {
    id: "06",
    title: "Server-side rendered",
    blurb: "Server streams the whole document with out-of-order <?marker> fills.",
  },
  {
    id: "07",
    title: "Streaming clock",
    blurb: "Long-lived response that re-flushes a <template for> every second. Zero JS.",
  },
  {
    id: "08",
    title: "Skeleton card",
    blurb: "Placeholder shapes that match the final layout — no layout shift on fill.",
  },
];

const HANDLERS: Record<string, (req: Request, path: string) => Response | Promise<Response>> = {
  "01": handler01,
  "02": handler02,
  "03": handler03,
  "04": handler04,
  "05": handler05,
  "06": handler06,
  "07": handler07,
  "08": handler08,
};

function escapeHTML(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function indexPage(): Response {
  const items = EXAMPLES.map((e) =>
    `<li><a href="/${e.id}/"><strong>${e.id}.</strong> ${escapeHTML(e.title)}</a><p>${
      escapeHTML(e.blurb)
    }</p></li>`
  ).join("");
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Declarative Partial Updates experiments</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body>
  <main>
    <h1>declarative partial updates experiments</h1>
    <p class="lede">Experiments with the <a href="https://developer.chrome.com/blog/declarative-partial-updates">Declarative Partial Updates API</a> and the <a href="https://developer.chrome.com/docs/web-platform/navigation-api">Navigation API</a>. As little JS as possible. Chrome 148+ behind <code>chrome://flags/#enable-experimental-web-platform-features</code>.</p>
    <ol class="examples">${items}</ol>

    <section class="refs">
      <h3>references</h3>
      <ul>
        <li><a href="https://developer.chrome.com/blog/declarative-partial-updates?hl=en" target="_blank" rel="noopener">Chrome blog: Declarative Partial Updates</a> <span class="note">— Adam Argyle's introduction to the API.</span></li>
        <li><a href="https://github.com/WICG/declarative-partial-updates" target="_blank" rel="noopener">WICG/declarative-partial-updates</a> <span class="note">— Specification repo with explainers and issues.</span></li>
        <li><a href="https://github.com/WICG/declarative-partial-updates/blob/main/patching-explainer.md" target="_blank" rel="noopener">Patching explainer</a> <span class="note">— <code>&lt;?start&gt;/&lt;?end&gt;</code> markers and <code>&lt;template for&gt;</code>.</span></li>
        <li><a href="https://github.com/WICG/declarative-partial-updates/blob/main/dynamic-markup-revamped-explainer.md" target="_blank" rel="noopener">Dynamic-markup explainer</a> <span class="note">— The new <code>streamHTMLUnsafe()</code> / append / prepend / replace methods.</span></li>
        <li><a href="https://chromestatus.com/feature/5146752165478400" target="_blank" rel="noopener">Chrome Status entry</a> <span class="note">— Shipping signal.</span></li>
        <li><a href="https://github.com/whatwg/html/issues/2142" target="_blank" rel="noopener">WHATWG HTML issue #2142</a> <span class="note">— The long-running thread on streaming HTML capabilities.</span></li>
        <li><a href="https://github.com/GoogleChromeLabs/template-for-polyfill" target="_blank" rel="noopener">template-for polyfill</a></li>
        <li><a href="https://github.com/GoogleChromeLabs/html-setters-polyfill" target="_blank" rel="noopener">html-setters polyfill</a></li>
        <li><a href="https://developer.chrome.com/docs/web-platform/navigation-api" target="_blank" rel="noopener">Chrome docs: Navigation API</a></li>
        <li><a href="https://jasonformat.com/islands-architecture/" target="_blank" rel="noopener">Jason Miller: Islands Architecture</a></li>
        <li><a href="https://github.com/GoogleChromeLabs/web-perf-demos/blob/main/patching-demos/photo-album-server.js" target="_blank" rel="noopener">photo-album-server.js</a> <span class="note">— A larger out-of-order streaming demo from the same team.</span></li>
      </ul>
    </section>
  </main>
</body>
</html>`;
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });
}

async function staticFile(path: string): Promise<Response> {
  try {
    const file = await Deno.readFile("." + path);
    const ext = path.split(".").pop() ?? "";
    const types: Record<string, string> = {
      css: "text/css; charset=utf-8",
      js: "application/javascript; charset=utf-8",
      html: "text/html; charset=utf-8",
      svg: "image/svg+xml",
    };
    return new Response(file, {
      headers: { "content-type": types[ext] ?? "application/octet-stream" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/" || path === "/index.html") return indexPage();
  if (path.startsWith("/public/")) return staticFile(path);

  const m = path.match(/^\/(\d{2})(\/.*)?$/);
  if (m) {
    const id = m[1];
    const sub = m[2] ?? "/";
    const handler = HANDLERS[id];
    if (handler) return handler(req, sub);
  }

  return new Response("Not found", { status: 404 });
});

console.log(`Listening on http://localhost:${PORT}`);
