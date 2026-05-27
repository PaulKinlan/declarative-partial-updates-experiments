// Renders a "source" disclosure block for each example page.
// Reads files synchronously at module-load time. Restart the server to pick up edits.
// No client JS — pure <details>/<summary> for collapse behaviour.

const GITHUB_BASE =
  "https://github.com/PaulKinlan/declarative-partial-updates-experiments/blob/main/";

function escapeHTML(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function projectRelative(absPath: string): string {
  const m = absPath.match(/\/declarative-partial-updates-experiments\/(.+)$/);
  return m ? m[1] : absPath;
}

interface Entry {
  name: string;
  absPath: string;
}

export function sourceBlock(handlerUrl: string): string {
  const handlerAbs = new URL(handlerUrl).pathname;
  const dir = handlerAbs.substring(0, handlerAbs.lastIndexOf("/"));
  const projectRoot = dir.replace(/\/examples\/[^/]+$/, "");

  // Auto-discover every file in the example folder (except handler.ts and README.md,
  // which we add explicitly and skip respectively).
  const siblings: string[] = [];
  for (const entry of Deno.readDirSync(dir)) {
    if (!entry.isFile) continue;
    if (entry.name === "handler.ts" || entry.name === "README.md") continue;
    siblings.push(entry.name);
  }
  siblings.sort();

  const entries: Entry[] = [
    { name: "handler.ts", absPath: `${dir}/handler.ts` },
    ...siblings.map((name) => ({ name, absPath: `${dir}/${name}` })),
    { name: "lib/streaming.ts", absPath: `${projectRoot}/lib/streaming.ts` },
    { name: "lib/files.ts", absPath: `${projectRoot}/lib/files.ts` },
  ];

  const blocks = entries.map((entry, i) => {
    let content = "";
    try {
      content = Deno.readTextFileSync(entry.absPath);
    } catch (err) {
      content = `// could not read ${entry.absPath}: ${
        err instanceof Error ? err.message : String(err)
      }`;
    }
    const rel = projectRelative(entry.absPath);
    const ghUrl = GITHUB_BASE + rel;
    const open = i === 0 ? " open" : "";
    return `<details class="src-file"${open}>
  <summary><span class="src-name">${escapeHTML(entry.name)}</span><span class="src-path">${
      escapeHTML(rel)
    }</span></summary>
  <pre><code>${escapeHTML(content)}</code></pre>
  <p class="src-foot"><a href="${ghUrl}" target="_blank" rel="noopener">open on GitHub &rarr;</a></p>
</details>`;
  }).join("\n");

  return `<section class="source-block">
  <h3>source</h3>
  <p class="src-lede">Everything the server runs for this example. Each file links to GitHub so you can copy or fork it.</p>
  ${blocks}
</section>`;
}
