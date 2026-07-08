// Capture a Declarative Partial Updates demo as a real-time MP4 video (Deno).
// DPU demos hold their HTTP response open (they stream updates), so a normal
// "load then screenshot" hangs. This drives Chrome over CDP with
// Page.startScreencast — which only emits a frame when the page visually changes —
// records the wall-clock time of each frame, and assembles a web-friendly H.264
// MP4 whose frames are held for their real durations (so a clock that ticks once a
// second plays back once a second, not fast-forwarded).
//
// Usage: deno run -A capture-video.mjs <url> <out.mp4> [seconds] [clicks]
//   clicks: comma-separated "selector@ms" pairs, ms measured from screencast start.
//   e.g. "#go@600"  or  "button[data-get='/03/x']@800,button[data-get='/03/y']@2600"
// Needs Chrome 148+ (the --enable-experimental-web-platform-features flag turns the
// API on) and ffmpeg on PATH.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";

const [url, outMp4, secondsArg, clicksArg] = Deno.args;
const clicks = (clicksArg || "").split(",").filter(Boolean).map((c) => {
  const at = c.lastIndexOf("@");
  return { sel: c.slice(0, at), ms: Number(c.slice(at + 1)) };
});
if (!url || !outMp4) {
  console.error("usage: deno run -A capture-video.mjs <url> <out.mp4> [seconds]");
  Deno.exit(2);
}
const seconds = Number(secondsArg || 8);
const port = 9460 + Math.floor(Math.random() * 120);
const dir = fs.mkdtempSync("/tmp/dpu-vid-");
const chrome = spawn("google-chrome-stable", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--enable-experimental-web-platform-features",
  `--remote-debugging-port=${port}`,
  "--hide-scrollbars",
  "--force-device-scale-factor=2", // crisper capture for retina/blog display
  "--window-size=900,650",
  "about:blank",
]);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function cleanupExit(msg) {
  console.log(msg);
  try { chrome.kill("SIGKILL"); } catch { /* ignore */ }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  Deno.exit(0);
}
setTimeout(() => cleanupExit("HARD-TIMEOUT"), (seconds + 15) * 1000);

// Collected frames: {file, t} where t is ms since first frame.
const frames = [];
let t0 = null;

try {
  await wait(1800);
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const tab = list.find((t) => t.type === "page");
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res) => (ws.onopen = res));

  let id = 0;
  const pending = new Map();
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
      const now = Date.now();
      if (t0 === null) t0 = now;
      const file = `${dir}/f${String(frames.length).padStart(4, "0")}.jpg`;
      fs.writeFileSync(file, Buffer.from(d.params.data, "base64"));
      frames.push({ file, t: now - t0 });
      cmd("Page.screencastFrameAck", { sessionId: d.params.sessionId });
    }
  };

  await cmd("Page.enable");
  await cmd("Runtime.enable");
  cmd("Page.navigate", { url }); // do NOT await; the stream never "finishes"
  await wait(1200);
  await cmd("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 });
  // Fire scheduled clicks relative to screencast start so the triggered updates
  // are recorded (for demos that need interaction, e.g. HTMX-style buttons).
  for (const { sel, ms } of clicks) {
    setTimeout(() => {
      const js = `(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(el){el.click();return 'clicked '+${JSON.stringify(sel)};}return 'MISSING '+${JSON.stringify(sel)};})()`;
      cmd("Runtime.evaluate", { expression: js, returnByValue: true }).then((r) =>
        console.log("  click@" + ms + "ms:", r.result?.result?.value)
      );
    }, ms);
  }
  await wait(seconds * 1000);
  await cmd("Page.stopScreencast");
  ws.close();

  if (frames.length === 0) cleanupExit("no frames captured");

  // Build a concat-demuxer script that holds each frame for its real duration.
  // Duration of frame i = t(i+1) - t(i); last frame gets a 1.2s tail.
  let concat = "";
  for (let i = 0; i < frames.length; i++) {
    const next = i + 1 < frames.length ? frames[i + 1].t : frames[i].t + 1200;
    const dur = Math.max(0.05, (next - frames[i].t) / 1000);
    concat += `file '${frames[i].file}'\nduration ${dur.toFixed(3)}\n`;
  }
  // concat demuxer needs the last file repeated (its duration line is ignored).
  concat += `file '${frames[frames.length - 1].file}'\n`;
  const listFile = `${dir}/frames.txt`;
  fs.writeFileSync(listFile, concat);

  const r = spawnSync("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listFile,
    "-vsync", "vfr",
    "-vf", "scale=760:-2:flags=lanczos,format=yuv420p",
    "-c:v", "libx264",
    "-preset", "veryslow",
    "-crf", "23",
    "-movflags", "+faststart",
    outMp4,
  ], { encoding: "utf8" });

  const secs = ((frames[frames.length - 1].t + 1200) / 1000).toFixed(1);
  cleanupExit(
    r.status === 0
      ? `captured ${frames.length} frames over ~${secs}s -> ${outMp4}`
      : `ffmpeg FAILED: ${(r.stderr || "").slice(-300)}`,
  );
} catch (e) {
  cleanupExit("ERROR: " + (e && e.message));
}
