import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { loadShell, tryStatic } from "../../lib/files.ts";

const SHELL = loadShell(import.meta.url);

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return streamingResponse(async (write) => {
      await write(SHELL);
      // Never-ending loop. When the client closes the tab, the next write()
      // throws StreamAborted and the loop exits silently.
      while (true) {
        const time = new Date().toLocaleTimeString();
        await write(
          `<template for="clock">\n  <?start name="clock"><span>${time}</span><?end>\n</template>\n`,
        );
        await sleep(1000);
      }
    });
  }
  return tryStatic(import.meta.url, path) ?? new Response("Not found", { status: 404 });
}
