// Capture a Declarative Partial Updates demo as an animated GIF (Deno).
// The DPU demos hold their HTTP response open (they stream updates), so a normal
// "load then screenshot" hangs. This drives Chrome over CDP and uses
// Page.startScreencast to grab frames AS the page updates, then assembles a GIF
// with ffmpeg. Needs Chrome 148+ (the --enable-experimental-web-platform-features
// flag turns the API on) and ffmpeg on PATH.
//
// Usage: deno run -A capture.mjs <url> <out.gif> [seconds]
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";

const [url, outGif, secondsArg] = Deno.args;
if (!url || !outGif) {
  console.error("usage: deno run -A capture.mjs <url> <out.gif> [seconds]");
  Deno.exit(2);
}
const seconds = Number(secondsArg || 5);
const port = 9460 + Math.floor(Math.random() * 120);
const dir = fs.mkdtempSync("/tmp/dpu-frames-");
const chrome = spawn("google-chrome-stable", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--enable-experimental-web-platform-features",
  `--remote-debugging-port=${port}`,
  "--hide-scrollbars",
  "--window-size=900,600",
  "about:blank",
]);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function finish(msg) {
  console.log(msg);
  try {
    chrome.kill("SIGKILL");
  } catch { /* ignore */ }
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch { /* ignore */ }
  Deno.exit(0);
}
setTimeout(() => finish("HARD-TIMEOUT"), (seconds + 12) * 1000);

try {
  await wait(1800);
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const tab = list.find((t) => t.type === "page");
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res) => (ws.onopen = res));

  let id = 0;
  const pending = new Map();
  let frames = 0;
  const cmd = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  ws.onmessage = (ev) => {
    const d = JSON.parse(ev.data);
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d);
      pending.delete(d.id);
    }
    if (d.method === "Page.screencastFrame") {
      fs.writeFileSync(
        `${dir}/f${String(frames++).padStart(4, "0")}.jpg`,
        Buffer.from(d.params.data, "base64"),
      );
      cmd("Page.screencastFrameAck", { sessionId: d.params.sessionId });
    }
  };

  await cmd("Page.enable");
  cmd("Page.navigate", { url }); // do NOT await; the stream never "finishes"
  await wait(1200);
  await cmd("Page.startScreencast", {
    format: "jpeg",
    quality: 80,
    everyNthFrame: 1,
  });
  await wait(seconds * 1000);
  await cmd("Page.stopScreencast");

  const r = spawnSync("ffmpeg", [
    "-y",
    "-framerate",
    "8",
    "-pattern_type",
    "glob",
    "-i",
    `${dir}/*.jpg`,
    "-vf",
    "fps=8,scale=760:-1:flags=lanczos",
    "-loop",
    "0",
    outGif,
  ], { encoding: "utf8" });
  ws.close();
  finish(
    `captured ${frames} frames -> ${
      r.status === 0 ? outGif : "ffmpeg FAILED: " + (r.stderr || "").slice(-160)
    }`,
  );
} catch (e) {
  finish("ERROR: " + (e && e.message));
}
