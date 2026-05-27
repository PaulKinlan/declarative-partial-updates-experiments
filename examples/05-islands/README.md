# 05. Islands, server-orchestrated, zero JS

Three islands, three backends, one HTTP response. The server flushes the shell with skeletons, races
the three "data sources" in parallel, and writes a `<template for="island-name">` block for each one
as it completes.

The browser slots each template into its `<?start name="island-name">` placeholder. No client JS at
all.

Different from a typical islands setup, this is a streaming-server architecture, not a client-side
fan-out: one round trip, one connection, content arrives in completion order.

```
0ms       shell written       skeletons visible
~600ms    weather written     weather island fills
~1400ms   news written        news island fills
~2400ms   builds written      builds island fills, connection closes
```
