# declarative-partial-updates-experiments

Experiments with Chrome's
[Declarative Partial Updates API](https://developer.chrome.com/blog/declarative-partial-updates) and
the [Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api). As little
JavaScript as possible.

**Live:** <https://declarative-partial-updates.paulkinlan-ea.deno.net> (each example at `/01` .. `/08`).
Best viewed in Chrome 148+ with `chrome://flags/#enable-experimental-web-platform-features`.

## Run it

```
deno task dev
# open http://localhost:3000/
```

Requires Chrome 148+ with `chrome://flags/#enable-experimental-web-platform-features` enabled. Each
example degrades to either a normal page or a non-streaming fallback if the API is missing.

## Examples

| #  | What it shows                                                                                             | Client JS |
| -- | --------------------------------------------------------------------------------------------------------- | --------- |
| 01 | Single `<?marker>` + late `<template for>` arriving in the same response.                                 | none      |
| 02 | `streamHTMLUnsafe()` as a WritableStream pipe target.                                                     | 12 lines  |
| 03 | HTMX-style attribute API rebuilt on top of DPU.                                                           | 40 lines  |
| 04 | Navigation API SPA shell, DPU for body content.                                                           | 25 lines  |
| 05 | Server-orchestrated islands, no client JS. Three async sources race; templates flush in completion order. | none      |
| 06 | Full streaming SSR. Whole document is one response, sections fill in as their backends resolve.           | none      |
| 07 | A long-lived response that flushes a fresh `<template for>` every second. Clock updates in place.         | none      |
| 08 | Placeholder skeleton boxes shaped like the real layout — no layout shift when data lands.                 | none      |

## Layout

```
declarative-partial-updates-experiments/
  server.ts            Single Deno HTTP entry. Routes /NN/* to per-example handlers.
  deno.json            Tasks + fmt config (HTML/CSS are excluded from formatting).
  lib/
    streaming.ts       streamingResponse() helper — ReadableStream<Uint8Array> with client-abort handling.
    files.ts           readSibling, loadShell (templates {{source}}), tryStatic (asset fallback).
    source.ts          sourceBlock() — renders the in-page "view source" disclosure.
  public/styles.css    Shared CSS for the framework chrome (cards, skeletons, tabs, source viewer).
  examples/
    NN-name/
      handler.ts       Tiny — just routing and any per-request streaming logic.
      index.html       The page itself. Includes <!-- source-viewer goes here --> where the
                       source-viewer block should be injected.
      shell.html       (04 only) HTML template with {{title}}, {{tabs}}, {{body}}, plus the
                       same <!-- source-viewer goes here --> marker.
      client.js        (02, 03, 04) Vanilla browser JS, served as a sibling file.
      styles.css       (07, 08) Per-example CSS.
      late.html        (01, 08) Late-arriving <template for> fragment.
      content.json     (04) Page bodies as data.
      README.md        Notes on the example.
```

Each example is split by concern: handler.ts is just routing, the HTML lives in `index.html` (or
`shell.html`), and any client JS / CSS / data sits in its own sibling file. The source viewer at the
bottom of every page automatically lists every file in the example folder so the reader sees the
whole picture.

## Reference

- [Declarative Partial Updates](https://developer.chrome.com/blog/declarative-partial-updates) — the
  API this is built on
- [Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api) — used in example
  04
- Paul's earlier demos for inspiration:
  - [patching-clock](https://github.com/PaulKinlan/3d-io-demo-26/tree/main/demos/patching-clock)
  - [patching-user-data](https://github.com/PaulKinlan/3d-io-demo-26/tree/main/demos/patching-user-data)
  - [islands-html](https://github.com/PaulKinlan/3d-io-demo-26/tree/main/demos/islands-html)

## License

Apache License 2.0 — see [LICENSE](./LICENSE).

Copyright 2026 Paul Kinlan.

## Capturing the demos

The streaming demos hold their response open, so a normal screenshot hangs. Record any demo as an animated GIF with:

```
deno task dev            # in one terminal (serves :3000)
deno run -A capture.mjs http://localhost:3000/07/ clock.gif 5
```

It drives Chrome (148+, experimental flag) over CDP `Page.startScreencast` and assembles the frames with `ffmpeg`. Frames are only emitted when the page changes, so a clock yields ~1 frame/second.
