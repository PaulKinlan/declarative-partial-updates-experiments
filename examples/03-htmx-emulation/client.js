// pure-DOM htmx-lite, ~40 lines
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-get]");
  if (!el) return;
  e.preventDefault();
  const target = document.querySelector(el.dataset.target);
  if (!target) return;
  const swap = el.dataset.swap || "inner";
  const sinkFor = {
    inner: (t) => t.streamHTMLUnsafe?.(),
    append: (t) => t.streamAppendHTMLUnsafe?.(),
    prepend: (t) => t.streamPrependHTMLUnsafe?.(),
    replace: (t) => t.streamReplaceWithHTMLUnsafe?.(),
  };
  const sink = sinkFor[swap]?.(target);
  if (!sink) {
    // graceful fallback for browsers without DPU
    const html = await (await fetch(el.dataset.get)).text();
    if (swap === "inner") target.innerHTML = html;
    if (swap === "append") target.insertAdjacentHTML("beforeend", html);
    if (swap === "prepend") target.insertAdjacentHTML("afterbegin", html);
    if (swap === "replace") target.outerHTML = html;
    return;
  }
  const res = await fetch(el.dataset.get);
  await res.body
    .pipeThrough(new TextDecoderStream())
    .pipeTo(sink);
});
