# 07 · streaming clock

A long-lived HTTP response demonstrating _repeated_ DPU patches.

- The server flushes a fresh `<template for="clock">` once per second.
- Each template re-emits the `<?start name="clock"><?end>` markers so the next tick has a target.
- A CSS rule (`section span { display: none } section span:last-of-type { display: inline }`) keeps
  only the latest tick visible.
- Zero client JS.

This is a port of
[patching-clock](https://github.com/PaulKinlan/3d-io-demo-26/tree/main/demos/patching-clock) from
`3d-io-demo-26`, adapted to the Deno runtime and the shared `streamingResponse` helper.

Inspired by [Phil Hawksworth](https://philhawksworth.dev/)'s legendary Netlify demo where the site
redeployed every second on stage to prove the build pipeline could keep up. Here it is the HTTP
response itself that stays open, not the build pipeline.

When the user closes the tab, the stream's `cancel()` flips an internal abort flag and `write()`
throws `StreamAborted`, which the wrapper catches silently. The loop exits, the response is torn
down, and no error is logged.
