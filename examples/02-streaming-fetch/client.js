const target = document.getElementById("target");

document.getElementById("go").addEventListener("click", async () => {
  target.replaceChildren();
  const res = await fetch("/02/stream");
  if (!("streamHTMLUnsafe" in target)) {
    target.textContent =
      "streamHTMLUnsafe not supported. Enable chrome://flags/#enable-experimental-web-platform-features";
    return;
  }
  await res.body
    .pipeThrough(new TextDecoderStream())
    .pipeTo(target.streamHTMLUnsafe());
});

document.getElementById("clear").addEventListener("click", () => {
  target.innerHTML = '<p style="color:var(--muted);margin:0;">cleared.</p>';
});
