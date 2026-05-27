import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { loadShell, tryStatic } from "../../lib/files.ts";

const SHELL = loadShell(import.meta.url);

const TOKENS = [
  "<h2>streamed paragraph</h2>",
  "<p>this content is being emitted ",
  "one chunk at a time, ",
  "with a 200ms pause between each piece. ",
  "Each chunk is parsed and reflected ",
  "in the DOM as it arrives, ",
  "no buffering, no full replace.</p>",
  "<ul>",
  "<li>first item</li>",
  "<li>second item</li>",
  "<li>third item</li>",
  "</ul>",
  '<p style="color:var(--muted);font-size:.85rem;">stream ended.</p>',
];

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return new Response(SHELL, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  if (path === "/stream") {
    return streamingResponse(async (write) => {
      for (const chunk of TOKENS) {
        await write(chunk);
        await sleep(220);
      }
    });
  }
  return tryStatic(import.meta.url, path) ?? new Response("Not found", { status: 404 });
}
