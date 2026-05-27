# 01. Basic marker placeholder

Single declarative `<?start name="X">...<?end>` block holds a skeleton in place. Later in the same
response stream, a `<template for="X">` arrives and the browser replaces the placeholder. No client
JS.

Run:

```
deno task dev
# open http://localhost:3000/01/
```

What to look for:

- The shell loads instantly with a shimmering skeleton.
- ~1.8s later the bio appears, no flicker, no JS.
- Network tab shows a single response that stays "pending" until both chunks have flushed.
