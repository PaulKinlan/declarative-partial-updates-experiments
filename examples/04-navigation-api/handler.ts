import { sleep, streamingResponse } from "../../lib/streaming.ts";
import { loadShell, readSibling, tryStatic } from "../../lib/files.ts";

interface Page {
  title: string;
  body: string[];
}

const CONTENT: { pages: Record<string, Page>; posts: Record<string, Page> } = JSON.parse(
  readSibling(import.meta.url, "content.json"),
);

const TABS: [string, string][] = [
  ["home", "/04/home"],
  ["posts", "/04/posts"],
  ["about", "/04/about"],
];

function renderTabs(currentPath: string): string {
  return TABS.map(([label, href]) => {
    const aria = currentPath === href ? ` aria-current="page"` : "";
    return `<a href="${href}"${aria}>${label}</a>`;
  }).join("");
}

function pageFor(subPath: string): Page | null {
  const m1 = subPath.match(/^\/(home|about|posts)$/);
  if (m1) return CONTENT.pages[m1[1]];
  const m2 = subPath.match(/^\/post\/([\w-]+)$/);
  if (m2) return CONTENT.posts[m2[1]] ?? null;
  return null;
}

function renderShell(currentPath: string, page: Page): string {
  return loadShell(import.meta.url, "shell.html", {
    title: `04 · ${page.title}`,
    tabs: renderTabs(currentPath),
    body: page.body.join(""),
  });
}

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  if (path === "/" || path === "/index.html") {
    return new Response(renderShell("/04/home", CONTENT.pages.home), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const ssrMatch = path.match(/^\/(home|about|posts|post\/[\w-]+)$/);
  if (ssrMatch) {
    const page = pageFor(path);
    if (page) {
      return new Response(renderShell(`/04${path}`, page), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  }

  const fragMatch = path.match(/^\/fragment\/(home|about|posts|post\/[\w-]+)$/);
  if (fragMatch) {
    const page = pageFor("/" + fragMatch[1]);
    if (!page) return new Response("<p>not found</p>", { status: 404 });
    return streamingResponse(async (write) => {
      for (const chunk of page.body) {
        await write(chunk);
        await sleep(80);
      }
    });
  }

  return tryStatic(import.meta.url, path) ?? new Response("Not found", { status: 404 });
}
