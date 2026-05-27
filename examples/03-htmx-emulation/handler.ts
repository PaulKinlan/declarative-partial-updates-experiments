import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { loadShell, tryStatic } from "../../lib/files.ts";

const SHELL = loadShell(import.meta.url);

const FRAGMENTS: Record<string, string[]> = {
  news: [
    '<h2 style="margin:0 0 .4rem;">latest news</h2>',
    '<ul style="margin:0;padding-left:1.2rem;">',
    "<li>chrome 148 ships declarative partial updates</li>",
    "<li>navigation api ships in safari 26.2</li>",
    "<li>web push reaches 10 years from spec to ios</li>",
    "</ul>",
  ],
  weather: [
    '<h2 style="margin:0 0 .4rem;">weather</h2>',
    '<p style="margin:0;">liverpool, 12°c, cloudy with hopeful sun.</p>',
  ],
  quote: [
    '<h2 style="margin:0 0 .4rem;">quote</h2>',
    '<blockquote style="margin:0;border-left:3px solid var(--accent);padding-left:.8rem;color:var(--muted);">',
    "&quot;the web is being cooked, and it smells fantastic.&quot;",
    "</blockquote>",
  ],
};

function timestamped(prefix: string): string[] {
  return [
    `<p style="margin:0.5rem 0 0;color:var(--muted);font-size:.9rem;">${prefix} at ${
      new Date().toLocaleTimeString()
    }</p>`,
  ];
}

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return new Response(SHELL, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  const fragMatch = path.match(/^\/fragment\/(\w+)$/);
  if (fragMatch) {
    const key = fragMatch[1];
    const tokens = key === "append"
      ? timestamped("appended")
      : key === "prepend"
      ? timestamped("prepended")
      : FRAGMENTS[key];
    if (!tokens) return new Response("<p>fragment not found</p>", { status: 404 });
    return streamingResponse(async (write) => {
      for (const t of tokens) {
        await write(t);
        await sleep(120);
      }
    });
  }

  return tryStatic(import.meta.url, path) ?? new Response("Not found", { status: 404 });
}
