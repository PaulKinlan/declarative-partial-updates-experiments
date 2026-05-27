import { fragmentResponse, htmlPage, sleep, streamingResponse } from "../../lib/streaming.ts";
import { sourceBlock } from "../../lib/source.ts";

const SOURCE = sourceBlock(import.meta.url);

const PAGES = {
  home: {
    title: "home",
    body: [
      '<h2 style="margin:0 0 .5rem;">home</h2>',
      "<p>this content is streamed from <code>/04/page/home</code>. The URL in your address bar updated via <code>navigation.intercept()</code>, no full reload happened.</p>",
      "<p>Try the back button. It also goes through the navigate event.</p>",
    ],
  },
  about: {
    title: "about",
    body: [
      '<h2 style="margin:0 0 .5rem;">about</h2>',
      "<p>a tiny SPA built on the Navigation API + Declarative Partial Updates. The whole client is ~25 lines.</p>",
      "<p>If the API is unavailable, links fall back to normal full-page navigations and everything still works because the server can render every page standalone.</p>",
    ],
  },
  posts: {
    title: "posts",
    body: [
      '<h2 style="margin:0 0 .5rem;">posts</h2>',
      '<ul style="margin:0;padding-left:1.2rem;">',
      '<li><a href="/04/post/declarative-partial-updates">declarative partial updates</a></li>',
      '<li><a href="/04/post/navigation-api">the navigation api</a></li>',
      '<li><a href="/04/post/streaming-html">streaming html</a></li>',
      "</ul>",
    ],
  },
};

const POSTS: Record<string, { title: string; body: string[] }> = {
  "declarative-partial-updates": {
    title: "declarative partial updates",
    body: [
      '<h2 style="margin:0 0 .5rem;">declarative partial updates</h2>',
      "<p>processing instructions plus <code>&lt;template for&gt;</code> let the server stream patches into a long-lived response.</p>",
      '<p><a href="/04/posts">&larr; back to posts</a></p>',
    ],
  },
  "navigation-api": {
    title: "navigation api",
    body: [
      '<h2 style="margin:0 0 .5rem;">the navigation api</h2>',
      "<p>one event (<code>navigate</code>) covers link clicks, form posts, back/forward, programmatic navigation. <code>event.intercept({ handler })</code> takes over.</p>",
      '<p><a href="/04/posts">&larr; back to posts</a></p>',
    ],
  },
  "streaming-html": {
    title: "streaming html",
    body: [
      '<h2 style="margin:0 0 .5rem;">streaming html</h2>',
      "<p>HTML has always streamed. DPU just gives us declarative tools so the late parts can flow into specific holes punched into the early parts.</p>",
      '<p><a href="/04/posts">&larr; back to posts</a></p>',
    ],
  },
};

const CLIENT_JS = `// SPA shell using Navigation API + streamHTMLUnsafe
const content = document.querySelector('#content');

function setActiveTab(pathname) {
  document.querySelectorAll('nav.tabs a').forEach((a) => {
    const isCurrent = new URL(a.href).pathname === pathname;
    if (isCurrent) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

if ('navigation' in window) {
  navigation.addEventListener('navigate', (event) => {
    if (!event.canIntercept || event.hashChange || event.downloadRequest) return;
    const url = new URL(event.destination.url);
    if (!url.pathname.startsWith('/04/')) return;
    if (url.pathname === '/04/' || url.pathname === '/04') return; // let the shell load normally on first nav
    event.intercept({
      async handler() {
        setActiveTab(url.pathname);
        content.replaceChildren();
        content.innerHTML = '<div class="skeleton lg"></div><div class="skeleton"></div><div class="skeleton sm"></div>';
        const fragPath = url.pathname.replace('/04/', '/04/fragment/');
        const res = await fetch(fragPath, { signal: event.signal });
        if (!('streamHTMLUnsafe' in content)) {
          content.innerHTML = await res.text();
          return;
        }
        content.replaceChildren();
        await res.body
          .pipeThrough(new TextDecoderStream())
          .pipeTo(content.streamHTMLUnsafe());
      },
    });
  });
  setActiveTab(location.pathname);
} else {
  // older browsers: no interception, links work as normal full navigations
  console.info('Navigation API not available — falling back to full reloads.');
}`;

function shell(currentPath: string, initialBody: string): string {
  const tabs = [
    ["home", "/04/home"],
    ["posts", "/04/posts"],
    ["about", "/04/about"],
  ].map(([label, href]) => {
    const aria = currentPath === href ? ` aria-current="page"` : "";
    return `<a href="${href}"${aria}>${label}</a>`;
  }).join("");
  return `<main>
  <p class="crumbs"><a href="/">&larr; back to index</a></p>
  <h1>04. Navigation API + DPU</h1>
  <p class="lede">Links inside this demo are intercepted by <code>navigation.addEventListener('navigate')</code>, fetched as fragments, and streamed into <code>#content</code> via <code>streamHTMLUnsafe()</code>. URL and history both behave correctly. Without the API, full reloads work too because each route renders standalone.</p>
  <nav class="tabs">${tabs}</nav>
  <section class="demo-area" id="content">${initialBody}</section>
  <script src="/04/client.js"></script>

  ${SOURCE}
</main>`;
}

function pageBodyFor(path: string): { body: string[]; title: string } | null {
  const m1 = path.match(/^\/(home|about|posts)$/);
  if (m1) return PAGES[m1[1] as keyof typeof PAGES];
  const m2 = path.match(/^\/post\/([\w-]+)$/);
  if (m2) {
    const post = POSTS[m2[1]];
    if (post) return post;
  }
  return null;
}

export default function handle(_req: Request, path: string): Response | Promise<Response> {
  // Default: route to home
  if (path === "/" || path === "/index.html") {
    const home = PAGES.home;
    return htmlPage(shell("/04/home", home.body.join("")), `04 · ${home.title}`);
  }
  // SSR for direct URLs (back button, copy-paste, refresh)
  const ssrMatch = path.match(/^\/(home|about|posts|post\/[\w-]+)$/);
  if (ssrMatch) {
    const page = pageBodyFor(path);
    if (page) return htmlPage(shell(`/04${path}`, page.body.join("")), `04 · ${page.title}`);
  }
  // Fragment route consumed by the SPA shell
  const fragMatch = path.match(/^\/fragment\/(home|about|posts|post\/[\w-]+)$/);
  if (fragMatch) {
    const subPath = "/" + fragMatch[1];
    const page = pageBodyFor(subPath);
    if (!page) return fragmentResponse("<p>not found</p>");
    return streamingResponse(async (write) => {
      for (const chunk of page.body) {
        await write(chunk);
        await sleep(80);
      }
    });
  }
  if (path === "/client.js") {
    return new Response(CLIENT_JS, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
  return fragmentResponse("Not found");
}
