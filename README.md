# declarative-partial-updates-experiments

Experiments with Chrome's
[Declarative Partial Updates API](https://developer.chrome.com/blog/declarative-partial-updates) and
the [Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api). As little
JavaScript as possible.

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

## Layout

```
declarative-partial-updates-experiments/
  server.ts            single Deno HTTP entry, routes /NN/* to per-example handlers
  deno.json            tasks + fmt
  lib/streaming.ts     ReadableStream helpers
  public/styles.css    shared CSS
  examples/
    01-basic-marker/{handler.ts,README.md}
    02-streaming-fetch/{handler.ts,README.md}
    03-htmx-emulation/{handler.ts,README.md}
    04-navigation-api/{handler.ts,README.md}
    05-islands/{handler.ts,README.md}
    06-ssr/{handler.ts,README.md}
```

Each example is one file. Open the handler to read the whole thing — there is no framework.

## Reference

- [Declarative Partial Updates](https://developer.chrome.com/blog/declarative-partial-updates) — the
  API this is built on
- [Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api) — used in example
  04
- Paul's earlier demos for inspiration:
  - [patching-clock](https://github.com/PaulKinlan/3d-io-demo-26/tree/main/demos/patching-clock)
  - [patching-user-data](https://github.com/PaulKinlan/3d-io-demo-26/tree/main/demos/patching-user-data)
  - [islands-html](https://github.com/PaulKinlan/3d-io-demo-26/tree/main/demos/islands-html)
