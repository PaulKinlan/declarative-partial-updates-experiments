import { fragmentResponse, htmlPage, sleep, streamingResponse } from "../../lib/streaming.ts";
import { sourceBlock } from "../../lib/source.ts";

const SOURCE = sourceBlock(import.meta.url);

const INDEX = `<main>
  <p class="crumbs"><a href="/">&larr; back to index</a></p>
  <h1>02. streamHTML into an element</h1>
  <p class="lede">A static page loads first. A button kicks off a <code>fetch()</code> whose body is piped into a target element via <code>streamHTMLUnsafe()</code>. Tokens appear as they arrive on the wire.</p>

  <button id="go">stream into target</button>
  <button id="clear">clear</button>

  <h3>Target</h3>
  <section class="demo-area" id="target">
    <p style="color:var(--muted);margin:0;">click the button to stream content here.</p>
  </section>

  <h3>The minimal JS</h3>
  <pre><code>const res = await fetch('/02/stream');
res.body
  .pipeThrough(new TextDecoderStream())
  .pipeTo(document.getElementById('target').streamHTMLUnsafe());</code></pre>

  <script>
    const target = document.getElementById('target');
    document.getElementById('go').addEventListener('click', async () => {
      target.replaceChildren(); // wipe before streaming
      const res = await fetch('/02/stream');
      if (!('streamHTMLUnsafe' in target)) {
        target.textContent = 'streamHTMLUnsafe not supported. Enable chrome://flags/#enable-experimental-web-platform-features';
        return;
      }
      await res.body
        .pipeThrough(new TextDecoderStream())
        .pipeTo(target.streamHTMLUnsafe());
    });
    document.getElementById('clear').addEventListener('click', () => {
      target.innerHTML = '<p style="color:var(--muted);margin:0;">cleared.</p>';
    });
  </script>

  ${SOURCE}
</main>`;

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
  if (path === "/" || path === "/index.html") return htmlPage(INDEX, "02 · Streaming fetch");
  if (path === "/stream") {
    return streamingResponse(async (write) => {
      for (const chunk of TOKENS) {
        await write(chunk);
        await sleep(220);
      }
    });
  }
  return fragmentResponse("Not found");
}
