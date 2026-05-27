# 06. Streaming SSR with DPU

The entire page is rendered by the server in one HTTP response. The shell with skeletons is flushed
first, then four sections (`user`, `feed`, `shop`, `footer`) stream in as their simulated backends
complete (200ms, 900ms, 1600ms, 2200ms respectively).

This is what React Suspense / Solid `<Suspense>` / Astro `transition:persist` are trying to give
you, but here it's just HTML.

```
<?start name="feed">
  <skeleton/>
<?end>
...later in the same response...
<template for="feed">
  <ul>...real data...</ul>
</template>
```

No hydration. No client framework. The browser does the patch.
