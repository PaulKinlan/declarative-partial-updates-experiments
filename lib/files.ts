// File helpers for examples: read sibling files, render the page shell with the
// source viewer injected, and serve sibling static assets (CSS/JS/HTML) on demand.

import { sourceBlock } from "./source.ts";

const MIME: Record<string, string> = {
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  html: "text/html; charset=utf-8",
  svg: "image/svg+xml",
  json: "application/json; charset=utf-8",
};

function dirFor(handlerUrl: string): string {
  return new URL(".", handlerUrl).pathname;
}

export function readSibling(handlerUrl: string, name: string): string {
  return Deno.readTextFileSync(dirFor(handlerUrl) + name);
}

// Reads a sibling HTML file and substitutes `{{source}}` with the source-viewer block.
// Optional extra placeholders can be provided via `vars`.
export function loadShell(
  handlerUrl: string,
  name = "index.html",
  vars: Record<string, string> = {},
): string {
  let raw = readSibling(handlerUrl, name);
  raw = raw.replace("{{source}}", sourceBlock(handlerUrl));
  for (const [k, v] of Object.entries(vars)) {
    raw = raw.replaceAll(`{{${k}}}`, v);
  }
  return raw;
}

// Try to serve a sibling static file from the example folder. Returns null when the
// file is missing, the path escapes the folder, or the path is empty.
export function tryStatic(handlerUrl: string, requestPath: string): Response | null {
  const safe = requestPath.replace(/^\/+/, "");
  if (!safe || safe.includes("..")) return null;
  // Never let the browser fetch handler.ts or README.md through this fallback.
  if (safe === "handler.ts" || safe === "README.md") return null;
  try {
    const content = Deno.readFileSync(dirFor(handlerUrl) + safe);
    const ext = safe.split(".").pop() ?? "";
    return new Response(content, {
      headers: {
        "content-type": MIME[ext] ?? "application/octet-stream",
        "cache-control": "no-store",
      },
    });
  } catch {
    return null;
  }
}
