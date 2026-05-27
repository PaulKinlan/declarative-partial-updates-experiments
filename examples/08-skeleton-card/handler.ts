import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { loadShell, readSibling, tryStatic } from "../../lib/files.ts";

const SHELL = loadShell(import.meta.url);
const LATE = readSibling(import.meta.url, "late.html");

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return streamingResponse(async (write) => {
      await write(SHELL);
      await sleep(2500);
      await write(LATE);
    });
  }
  return tryStatic(import.meta.url, path) ?? new Response("Not found", { status: 404 });
}
