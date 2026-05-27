import handler01 from "./examples/01-basic-marker/handler.ts";
import handler02 from "./examples/02-streaming-fetch/handler.ts";
import handler03 from "./examples/03-htmx-emulation/handler.ts";
import handler04 from "./examples/04-navigation-api/handler.ts";
import handler05 from "./examples/05-islands/handler.ts";
import handler06 from "./examples/06-ssr/handler.ts";

const PORT = Number(Deno.env.get("PORT") ?? 3000);

const EXAMPLES = [
  { id: "01", title: "Basic marker placeholder",   blurb: "<?marker> + <template for> declarative replacement, zero JS." },
  { id: "02", title: "Streaming fetch into element", blurb: "streamHTML() piping a chunked fetch into the DOM." },
  { id: "03", title: "HTMX emulation",               blurb: "Tiny JS that turns data-target attributes into streamed partial updates." },
  { id: "04", title: "Navigation API + DPU",         blurb: "SPA routing via navigation.intercept(), content via streamHTML." },
  { id: "05", title: "Islands architecture",         blurb: "Independent islands, each fetched in parallel via DPU." },
  { id: "06", title: "Server-side rendered",         blurb: "Server streams the whole document with out-of-order <?marker> fills." },
];

const HANDLERS: Record<string, (req: Request, path: string) => Response | Promise<Response>> = {
  "01": handler01,
  "02": handler02,
  "03": handler03,
  "04": handler04,
  "05": handler05,
  "06": handler06,
};

function indexPage(): Response {
  const items = EXAMPLES.map((e) =>
    `<li><a href="/${e.id}/"><strong>${e.id}.</strong> ${e.title}</a><p>${e.blurb}</p></li>`
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
      js:  "application/javascript; charset=utf-8",
      html: "text/html; charset=utf-8",
      svg: "image/svg+xml",
    };
    return new Response(file, { headers: { "content-type": types[ext] ?? "application/octet-stream" } });
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
