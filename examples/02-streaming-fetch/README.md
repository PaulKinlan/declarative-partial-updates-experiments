# 02. streamHTML into an element

Demonstrates `element.streamHTMLUnsafe()` as a WritableStream destination. Chunks arrive over a slow endpoint and are reflected in the DOM as they parse.

```js
const res = await fetch('/02/stream');
res.body
  .pipeThrough(new TextDecoderStream())
  .pipeTo(target.streamHTMLUnsafe());
```

What to look for:

- Tokens appear one at a time (200ms cadence on the server) without buffering.
- A `<ul>` starts empty and items get appended as their chunks arrive.
- If `streamHTMLUnsafe` is missing, the demo shows a flag-prompt fallback.
