export class StreamAborted extends Error {
  constructor() {
    super("stream aborted by client");
    this.name = "StreamAborted";
  }
}

export type ChunkSource = (write: (chunk: string) => Promise<void>) => Promise<void>;

const encoder = new TextEncoder();

export function streamingResponse(
  source: ChunkSource,
  contentType = "text/html; charset=utf-8",
): Response {
  let aborted = false;
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = async (chunk: string) => {
        if (aborted) throw new StreamAborted();
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          aborted = true;
          throw new StreamAborted();
        }
      };
      try {
        await source(write);
      } catch (err) {
        if (!(err instanceof StreamAborted)) console.error("stream source error", err);
      } finally {
        if (!aborted) {
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      }
    },
    cancel() {
      aborted = true;
    },
  });
  return new Response(body, {
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function htmlPage(body: string, title = "DPU experiments"): Response {
  const doc = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body>
${body}
</body>
</html>`;
  return new Response(doc, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export function fragmentResponse(html: string): Response {
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
